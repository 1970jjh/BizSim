import {
  doc,
  collection,
  getDoc,
  setDoc,
  updateDoc,
  getDocs,
  onSnapshot,
  runTransaction,
  type Unsubscribe,
} from 'firebase/firestore'
import { db } from './config'
import type {
  Role,
  RoomDocument,
  RoomStatus,
  RoundDecisions,
  RoundNumber,
  RoundResults,
  TeamAssets,
  TeamDocument,
} from '@/lib/types/game'
import {
  BASE_DEMAND_PER_TEAM,
  DEFAULT_ROUND_DECISIONS,
  INITIAL_ASSETS,
  ROUND_CONFIGS,
} from '@/lib/logic/constants'
import { generateRoomCode } from '@/lib/utils/room-code'

export async function createRoom(
  roomName: string,
  totalTeams: number
): Promise<string> {
  const roomCode = generateRoomCode()
  const marketDemand = totalTeams * BASE_DEMAND_PER_TEAM
  const marketConfig = ROUND_CONFIGS[1]

  const roomData: RoomDocument = {
    roomName,
    status: 'WAITING',
    currentRound: 1,
    totalTeams,
    marketDemand,
    marketConfig,
    createdAt: Date.now(),
  }

  await setDoc(doc(db, 'rooms', roomCode), roomData)

  for (let i = 1; i <= totalTeams; i++) {
    const teamId = `team_${i}`
    const teamData: TeamDocument = {
      teamName: `Team ${i}`,
      assets: INITIAL_ASSETS,
      roles: {},
      cumulativeNetProfit: 0,
    }
    await setDoc(doc(db, 'rooms', roomCode, 'teams', teamId), teamData)
    await setDoc(
      doc(db, 'rooms', roomCode, 'teams', teamId, 'rounds', 'round_1'),
      DEFAULT_ROUND_DECISIONS
    )
  }

  return roomCode
}

export async function joinTeam(
  roomCode: string,
  teamId: string,
  role: Role,
  userId: string,
  nickname: string
): Promise<void> {
  const teamRef = doc(db, 'rooms', roomCode, 'teams', teamId)

  await runTransaction(db, async (transaction) => {
    const teamSnap = await transaction.get(teamRef)
    if (!teamSnap.exists()) {
      throw new Error('팀을 찾을 수 없습니다.')
    }

    const teamData = teamSnap.data() as TeamDocument
    if (teamData.roles[role]) {
      throw new Error('이미 선택된 직무입니다.')
    }

    transaction.update(teamRef, {
      [`roles.${role}`]: { uid: userId, nickname },
    })
  })
}

export async function getRoomData(
  roomCode: string
): Promise<RoomDocument | null> {
  const snap = await getDoc(doc(db, 'rooms', roomCode))
  return snap.exists() ? (snap.data() as RoomDocument) : null
}

export async function getTeamData(
  roomCode: string,
  teamId: string
): Promise<TeamDocument | null> {
  const snap = await getDoc(doc(db, 'rooms', roomCode, 'teams', teamId))
  return snap.exists() ? (snap.data() as TeamDocument) : null
}

export async function getRoundData(
  roomCode: string,
  teamId: string,
  roundId: string
): Promise<RoundDecisions | null> {
  const snap = await getDoc(
    doc(db, 'rooms', roomCode, 'teams', teamId, 'rounds', roundId)
  )
  return snap.exists() ? (snap.data() as RoundDecisions) : null
}

export async function updateRoundDecision(
  roomCode: string,
  teamId: string,
  roundId: string,
  field: string,
  value: unknown
): Promise<void> {
  const roundRef = doc(
    db,
    'rooms',
    roomCode,
    'teams',
    teamId,
    'rounds',
    roundId
  )
  await updateDoc(roundRef, { [field]: value })
}

export async function submitRound(
  roomCode: string,
  teamId: string,
  roundId: string
): Promise<void> {
  const roundRef = doc(
    db,
    'rooms',
    roomCode,
    'teams',
    teamId,
    'rounds',
    roundId
  )
  await updateDoc(roundRef, { isSubmitted: true })
}

export function subscribeToRoom(
  roomCode: string,
  callback: (data: RoomDocument) => void
): Unsubscribe {
  return onSnapshot(doc(db, 'rooms', roomCode), (snap) => {
    if (snap.exists()) {
      callback(snap.data() as RoomDocument)
    }
  })
}

export function subscribeToTeam(
  roomCode: string,
  teamId: string,
  callback: (data: TeamDocument) => void
): Unsubscribe {
  return onSnapshot(
    doc(db, 'rooms', roomCode, 'teams', teamId),
    (snap) => {
      if (snap.exists()) {
        callback(snap.data() as TeamDocument)
      }
    }
  )
}

export function subscribeToRound(
  roomCode: string,
  teamId: string,
  roundId: string,
  callback: (data: RoundDecisions) => void
): Unsubscribe {
  return onSnapshot(
    doc(db, 'rooms', roomCode, 'teams', teamId, 'rounds', roundId),
    (snap) => {
      if (snap.exists()) {
        callback(snap.data() as RoundDecisions)
      }
    }
  )
}

export async function getAllTeams(
  roomCode: string
): Promise<Array<TeamDocument & { id: string }>> {
  const snap = await getDocs(collection(db, 'rooms', roomCode, 'teams'))
  return snap.docs.map((d) => ({ id: d.id, ...(d.data() as TeamDocument) }))
}

export async function updateRoomRound(
  roomCode: string,
  round: RoundNumber
): Promise<void> {
  const config = ROUND_CONFIGS[round]
  await updateDoc(doc(db, 'rooms', roomCode), {
    currentRound: round,
    marketConfig: config,
    marketDemand: 0, // will be recalculated
  })
}

export async function updateRoomStatus(
  roomCode: string,
  status: RoomStatus
): Promise<void> {
  await updateDoc(doc(db, 'rooms', roomCode), { status })
}

export async function updateTeamAssets(
  roomCode: string,
  teamId: string,
  assets: TeamAssets,
  cumulativeNetProfit: number
): Promise<void> {
  await updateDoc(doc(db, 'rooms', roomCode, 'teams', teamId), {
    assets,
    cumulativeNetProfit,
  })
}

export async function saveRoundResults(
  roomCode: string,
  teamId: string,
  roundId: string,
  results: RoundResults
): Promise<void> {
  const roundRef = doc(
    db,
    'rooms',
    roomCode,
    'teams',
    teamId,
    'rounds',
    roundId
  )
  await updateDoc(roundRef, { results })
}

export async function saveLeaderboard(
  roomCode: string,
  leaderboard: readonly { teamId: string; teamName: string; cumulativeNetProfit: number; totalAssetValue: number; score: number; rank: number }[]
): Promise<void> {
  await updateDoc(doc(db, 'rooms', roomCode), { leaderboard })
}

export async function initRoundForAllTeams(
  roomCode: string,
  round: RoundNumber
): Promise<void> {
  const teams = await getAllTeams(roomCode)
  const roundId = `round_${round}`
  for (const team of teams) {
    await setDoc(
      doc(db, 'rooms', roomCode, 'teams', team.id, 'rounds', roundId),
      DEFAULT_ROUND_DECISIONS
    )
  }
}

export async function getAllRooms(): Promise<
  Array<RoomDocument & { roomCode: string }>
> {
  const snap = await getDocs(collection(db, 'rooms'))
  return snap.docs.map((d) => ({
    roomCode: d.id,
    ...(d.data() as RoomDocument),
  }))
}

export async function deleteRoom(roomCode: string): Promise<void> {
  // Mark room as deleted (full deletion of subcollections requires Cloud Functions)
  await updateDoc(doc(db, 'rooms', roomCode), { status: 'DELETED' as RoomStatus })
}
