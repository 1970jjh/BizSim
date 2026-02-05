import { initializeApp, getApps, type FirebaseApp } from 'firebase/app'
import { getAuth, type Auth } from 'firebase/auth'
import { getFirestore, type Firestore } from 'firebase/firestore'
import { getStorage, type FirebaseStorage } from 'firebase/storage'

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
}

function getApp(): FirebaseApp {
  return getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0]
}

let _app: FirebaseApp | undefined
let _auth: Auth | undefined
let _db: Firestore | undefined
let _storage: FirebaseStorage | undefined

function ensureApp(): FirebaseApp {
  if (!_app) {
    _app = getApp()
  }
  return _app
}

// Getter functions for lazy initialization - use these for Firestore operations
export function getAuthInstance(): Auth {
  if (!_auth) _auth = getAuth(ensureApp())
  return _auth
}

export function getDb(): Firestore {
  if (!_db) _db = getFirestore(ensureApp())
  return _db
}

export function getStorageInstance(): FirebaseStorage {
  if (!_storage) _storage = getStorage(ensureApp())
  return _storage
}

