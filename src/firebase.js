import { initializeApp } from 'firebase/app'
import { getAnalytics, isSupported } from 'firebase/analytics'
import { getAuth } from 'firebase/auth'
import { getFirestore } from 'firebase/firestore'
import { getStorage } from 'firebase/storage'

const firebaseConfig = {
  apiKey: 'AIzaSyAMpXZGzwTynoULQf4v78aAO7pw-eK6Ylw',
  authDomain: 'fumifumi-8988.firebaseapp.com',
  projectId: 'fumifumi-8988',
  storageBucket: 'fumifumi-8988.firebasestorage.app',
  messagingSenderId: '812402320763',
  appId: '1:812402320763:web:823321f08d8510c5fd09de',
  measurementId: 'G-LG1BY44K2C',
}

const app = initializeApp(firebaseConfig)
export const auth = getAuth(app)
export const db = getFirestore(app)
export const storage = getStorage(app)

export const analytics = typeof window !== 'undefined'
  ? isSupported().then(supported => (supported ? getAnalytics(app) : null))
  : Promise.resolve(null)
