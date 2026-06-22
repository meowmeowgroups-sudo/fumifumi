import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
} from 'firebase/auth'
import { auth } from './firebase'

const AUTH_ERRORS = {
  'auth/email-already-in-use': '此電郵已註冊，請直接登入',
  'auth/invalid-email': '電郵格式不正確',
  'auth/weak-password': '密碼至少要 6 個字元',
  'auth/user-not-found': '找不到此帳戶',
  'auth/wrong-password': '密碼不正確',
  'auth/invalid-credential': '電郵或密碼不正確',
  'auth/too-many-requests': '嘗試次數過多，請稍後再試',
  'auth/network-request-failed': '網絡連線失敗，請檢查網絡',
}

export const mapAuthError = (err) => {
  const code = err?.code || ''
  return AUTH_ERRORS[code] || err?.message || '操作失敗，請稍後再試'
}

export const registerWithEmail = async (email, password) => {
  const trimmed = String(email || '').trim()
  if (!trimmed) throw new Error('請輸入電郵')
  if (!password || password.length < 6) throw new Error('密碼至少要 6 個字元')
  try {
    const cred = await createUserWithEmailAndPassword(auth, trimmed, password)
    return cred.user
  } catch (err) {
    throw new Error(mapAuthError(err))
  }
}

export const loginWithEmail = async (email, password) => {
  const trimmed = String(email || '').trim()
  if (!trimmed) throw new Error('請輸入電郵')
  if (!password) throw new Error('請輸入密碼')
  try {
    const cred = await signInWithEmailAndPassword(auth, trimmed, password)
    return cred.user
  } catch (err) {
    throw new Error(mapAuthError(err))
  }
}

export const signOutUser = async () => {
  try {
    await signOut(auth)
  } catch (err) {
    throw new Error(mapAuthError(err))
  }
}

export const watchAuthState = (callback) => onAuthStateChanged(auth, callback)
