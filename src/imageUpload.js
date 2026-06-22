import imageCompression from 'browser-image-compression'
import { ref as storageRef, uploadBytes, getDownloadURL } from 'firebase/storage'
import { doc, getDoc, runTransaction, serverTimestamp } from 'firebase/firestore'
import { storage, db } from './firebase'

export const UPLOAD_LIMITS = {
  avatar: 3,
  excretion: 10,
}

const COUNTS_DOC = doc(db, 'appData', 'dailyUploadCounts')
const ACCEPTED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg']

const buildCountKey = (catId, type, dateKey) => `${catId}::${dateKey}::${type}`

export const getUploadLimitMessage = (type) => {
  if (type === 'avatar') return `今日頭像上傳已達上限（${UPLOAD_LIMITS.avatar} 張）`
  if (type === 'excretion') return `今日排泄照片上傳已達上限（${UPLOAD_LIMITS.excretion} 張）`
  return '今日上傳已達上限'
}

export const getUploadCount = async (catId, type, dateKey) => {
  if (!catId || !type || !dateKey) return 0
  const snap = await getDoc(COUNTS_DOC)
  const counts = snap.exists() ? (snap.data().counts || {}) : {}
  return Number(counts[buildCountKey(catId, type, dateKey)] || 0)
}

/** 步驟一：限額檢查 */
export const checkUploadQuota = async (catId, type, dateKey) => {
  const limit = UPLOAD_LIMITS[type]
  if (!limit) {
    return { ok: false, count: 0, limit: 0, remaining: 0, message: '未知的上傳類型' }
  }
  const count = await getUploadCount(catId, type, dateKey)
  const remaining = Math.max(0, limit - count)
  if (count >= limit) {
    return {
      ok: false,
      count,
      limit,
      remaining: 0,
      message: getUploadLimitMessage(type),
    }
  }
  return { ok: true, count, limit, remaining, message: '' }
}

const incrementUploadCount = async (catId, type, dateKey) => {
  const key = buildCountKey(catId, type, dateKey)
  await runTransaction(db, async (tx) => {
    const snap = await tx.get(COUNTS_DOC)
    const counts = { ...(snap.exists() ? snap.data().counts : {}) }
    counts[key] = Number(counts[key] || 0) + 1
    tx.set(COUNTS_DOC, { counts, updatedAt: serverTimestamp() }, { merge: true })
  })
}

/** 步驟二：壓縮處理 */
export const compressImageFile = async (file) => {
  return imageCompression(file, {
    maxWidthOrHeight: 1200,
    initialQuality: 0.8,
    fileType: 'image/webp',
    useWebWorker: true,
  })
}

const validateImageFile = (file) => {
  if (!file) throw new Error('請選擇圖片')
  if (!ACCEPTED_IMAGE_TYPES.includes(file.type)) {
    throw new Error('只支援 JPG、PNG 或 WebP 格式')
  }
}

const uploadToStorage = async (file, catId, type) => {
  const safeName = `${Date.now()}-${Math.random().toString(36).slice(2, 10)}.webp`
  const path = `cats/${catId}/${type}/${safeName}`
  const fileRef = storageRef(storage, path)
  await uploadBytes(fileRef, file, { contentType: 'image/webp' })
  return getDownloadURL(fileRef)
}

/**
 * 完整上傳流程：限額檢查 → 壓縮 → Storage 上傳 → 計數 +1
 * @returns {Promise<{ url: string, remaining: number }>}
 */
export const handleImageUpload = async ({ file, type, catId, dateKey }) => {
  validateImageFile(file)
  if (!catId) throw new Error('請先選擇或建立貓咪檔案')
  if (!type || !UPLOAD_LIMITS[type]) throw new Error('未知的上傳類型')
  if (!dateKey) throw new Error('缺少日期')

  const quota = await checkUploadQuota(catId, type, dateKey)
  if (!quota.ok) {
    const err = new Error(quota.message)
    err.code = 'UPLOAD_LIMIT_REACHED'
    throw err
  }

  const compressed = await compressImageFile(file)
  const url = await uploadToStorage(compressed, catId, type)
  await incrementUploadCount(catId, type, dateKey)

  const nextCount = quota.count + 1
  return {
    url,
    remaining: Math.max(0, quota.limit - nextCount),
  }
}
