import { db } from './firebase'
import { doc, setDoc, getDocFromServer, onSnapshot, serverTimestamp } from 'firebase/firestore'

let currentUserId = null
let syncDocRef = null

let getPayload = null
let onRemoteHandler = null
let onErrorHandler = null
let unsubscribe = null
let pushTimer = null
let pushPaused = false
let remoteApplyPaused = false
let localAuthoritativeUntil = 0
let lastPushedFingerprint = ''
let lastAppliedUpdatedAtMs = 0
let migrationAttempted = false
let hasAppliedServerSnapshot = false

const getSyncDoc = () => {
  if (!syncDocRef) throw new Error('App sync not initialized for user')
  return syncDocRef
}

const fingerprint = (payload) => {
  try {
    return JSON.stringify(payload ?? null)
  } catch {
    return String(Date.now())
  }
}

const clonePayload = (payload) => JSON.parse(JSON.stringify(payload ?? null))

const extractRemotePayload = (data) => ({
  version: data.version,
  cats: data.cats,
  currentCatIndex: data.currentCatIndex,
  behaviorSocialLogs: data.behaviorSocialLogs,
  behaviorSocialCustomTags: data.behaviorSocialCustomTags,
  behaviorSocialHiddenTags: data.behaviorSocialHiddenTags,
  handoverSheet: data.handoverSheet,
})

const markFingerprintAfterApply = () => {
  if (!getPayload) return
  lastPushedFingerprint = fingerprint(clonePayload(getPayload()))
}

const shouldApplyRemotePayload = (remotePayload, updatedAtMs) => {
  if (remoteApplyPaused) return false
  if (Date.now() < localAuthoritativeUntil) return false
  const remoteFp = fingerprint(remotePayload)
  const localFp = getPayload ? fingerprint(clonePayload(getPayload())) : ''
  if (localFp && localFp === remoteFp) {
    if (updatedAtMs > 0) {
      lastAppliedUpdatedAtMs = Math.max(lastAppliedUpdatedAtMs, updatedAtMs)
    }
    lastPushedFingerprint = localFp
    return false
  }
  return true
}

const applyRemotePayload = (remotePayload, updatedAtMs) => {
  if (remoteApplyPaused) return
  if (updatedAtMs > 0) lastAppliedUpdatedAtMs = updatedAtMs
  pushPaused = true
  try {
    onRemoteHandler?.(clonePayload(remotePayload))
    markFingerprintAfterApply()
  } finally {
    pushPaused = false
  }
}

export const initAppSyncForUser = (userId) => {
  if (!userId) throw new Error('userId required')
  if (currentUserId === userId && syncDocRef) return
  destroyAppSync()
  currentUserId = userId
  syncDocRef = doc(db, 'users', userId, 'app', 'sync')
}

export const registerAppSyncPayload = (getter) => {
  getPayload = getter
}

export const registerAppSyncHandlers = ({ onRemote, onError } = {}) => {
  onRemoteHandler = onRemote
  onErrorHandler = onError
}

export const pauseAppSyncPush = (paused) => {
  pushPaused = !!paused
}

export const pauseRemoteApply = (paused) => {
  remoteApplyPaused = !!paused
}

export const scheduleAppSyncPush = () => {
  if (pushPaused || !getPayload || !syncDocRef) return
  clearTimeout(pushTimer)
  pushTimer = setTimeout(() => {
    flushAppSyncPush()
  }, 300)
}

export const flushAppSyncPush = async ({ force = false } = {}) => {
  if ((!force && pushPaused) || !getPayload || !syncDocRef) return false
  const payload = clonePayload(getPayload())
  if (!payload) return false
  const fp = fingerprint(payload)
  if (!force && fp === lastPushedFingerprint) return false
  try {
    await setDoc(getSyncDoc(), {
      ...payload,
      updatedAt: serverTimestamp(),
    })
    lastPushedFingerprint = fp
    localAuthoritativeUntil = Date.now() + 4000
    return true
  } catch (err) {
    console.error('App sync push failed:', err)
    onErrorHandler?.(err)
    return false
  }
}

export const resetAppSyncPushFingerprint = () => {
  lastPushedFingerprint = ''
}

export const markAppSyncLocalAuthoritative = (ms = 4000) => {
  localAuthoritativeUntil = Date.now() + ms
}

export const pullAppSyncFromServer = async () => {
  if (!onRemoteHandler || !syncDocRef) return { ok: false, reason: 'not-registered', applied: false }
  try {
    const snapshot = await getDocFromServer(getSyncDoc())
    if (!snapshot.exists()) {
      return { ok: true, reason: 'empty-doc', applied: false }
    }
    hasAppliedServerSnapshot = true
    const data = snapshot.data()
    const updatedAtMs = data.updatedAt?.toMillis?.() ?? 0
    const remotePayload = extractRemotePayload(data)
    if (!shouldApplyRemotePayload(remotePayload, updatedAtMs)) {
      return { ok: true, reason: 'unchanged', applied: false }
    }
    applyRemotePayload(remotePayload, updatedAtMs)
    return { ok: true, reason: 'applied', applied: true }
  } catch (err) {
    console.error('App sync pull failed:', err)
    onErrorHandler?.(err)
    return { ok: false, reason: err?.message || String(err), applied: false }
  }
}

const migrateLocalPayloadToCloud = async (payload) => {
  if (migrationAttempted || !payload || !syncDocRef) return
  try {
    const existing = await getDocFromServer(getSyncDoc())
    if (existing.exists()) return
  } catch (err) {
    console.error('App sync migration check failed:', err)
    return
  }
  migrationAttempted = true
  try {
    const cloned = clonePayload(payload)
    lastPushedFingerprint = fingerprint(cloned)
    await setDoc(getSyncDoc(), {
      ...cloned,
      updatedAt: serverTimestamp(),
    })
  } catch (err) {
    migrationAttempted = false
    console.error('App sync migration failed:', err)
    onErrorHandler?.(err)
  }
}

export const subscribeToAppSync = () => {
  if (unsubscribe || !syncDocRef) return
  unsubscribe = onSnapshot(
    getSyncDoc(),
    (snapshot) => {
      if (snapshot.metadata.fromCache && hasAppliedServerSnapshot) return

      if (!snapshot.exists()) {
        if (!snapshot.metadata.fromCache && getPayload) {
          migrateLocalPayloadToCloud(getPayload())
        }
        return
      }

      if (!snapshot.metadata.fromCache) hasAppliedServerSnapshot = true

      const data = snapshot.data()
      const updatedAtMs = data.updatedAt?.toMillis?.() ?? 0
      const remotePayload = extractRemotePayload(data)
      if (!shouldApplyRemotePayload(remotePayload, updatedAtMs)) return

      applyRemotePayload(remotePayload, updatedAtMs)
    },
    (err) => {
      console.error('App sync listener error:', err)
      onErrorHandler?.(err)
    }
  )
}

export const destroyAppSync = () => {
  if (unsubscribe) {
    unsubscribe()
    unsubscribe = null
  }
  clearTimeout(pushTimer)
  pushTimer = null
  hasAppliedServerSnapshot = false
  lastAppliedUpdatedAtMs = 0
  lastPushedFingerprint = ''
  migrationAttempted = false
  currentUserId = null
  syncDocRef = null
}
