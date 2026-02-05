import {
  signInAnonymously,
  signInWithEmailAndPassword,
  signOut,
  updateProfile,
  type User,
  type UserCredential,
} from 'firebase/auth'
import { getAuthInstance } from './config'

export async function signInAnonymouslyWithNickname(
  nickname: string
): Promise<User> {
  const credential = await signInAnonymously(getAuthInstance())
  await updateProfile(credential.user, { displayName: nickname })
  return credential.user
}

export async function signInAdmin(
  email: string,
  password: string
): Promise<UserCredential> {
  return signInWithEmailAndPassword(getAuthInstance(), email, password)
}

export async function signOutUser(): Promise<void> {
  return signOut(getAuthInstance())
}

export function getCurrentUser(): User | null {
  return getAuthInstance().currentUser
}
