import {
  signInAnonymously,
  signInWithEmailAndPassword,
  signOut,
  updateProfile,
  type User,
  type UserCredential,
} from 'firebase/auth'
import { getFirebaseAuth } from './config'

export async function signInAnonymouslyWithNickname(
  nickname: string
): Promise<User> {
  const auth = getFirebaseAuth()
  const credential = await signInAnonymously(auth)
  await updateProfile(credential.user, { displayName: nickname })
  return credential.user
}

export async function signInAdmin(
  email: string,
  password: string
): Promise<UserCredential> {
  const auth = getFirebaseAuth()
  return signInWithEmailAndPassword(auth, email, password)
}

export async function signOutUser(): Promise<void> {
  const auth = getFirebaseAuth()
  return signOut(auth)
}

export function getCurrentUser(): User | null {
  const auth = getFirebaseAuth()
  return auth.currentUser
}
