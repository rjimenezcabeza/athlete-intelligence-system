import { openDB, type IDBPDatabase } from 'idb'
import type { SetInput } from '@/types/training.types'

export interface PendingSet {
  tempId: string; sessionExerciseId: string
  setData: SetInput; timestamp: number; synced: boolean
}

let _db: IDBPDatabase | null = null

export async function getOfflineDB() {
  if (_db) return _db
  _db = await openDB('ais-offline', 1, {
    upgrade(db) {
      db.createObjectStore('pending_sets', { keyPath: 'tempId' })
      db.createObjectStore('pending_sessions', { keyPath: 'tempId' })
      db.createObjectStore('exercises_cache', { keyPath: 'id' })
      db.createObjectStore('templates_cache', { keyPath: 'id' })
    },
  })
  return _db
}

export async function savePendingSet(set: PendingSet): Promise<void> {
  const db = await getOfflineDB()
  await db.put('pending_sets', set)
}

export async function getPendingSets(): Promise<PendingSet[]> {
  const db = await getOfflineDB()
  return db.getAll('pending_sets')
}

export async function markSetSynced(tempId: string): Promise<void> {
  const db = await getOfflineDB()
  await db.delete('pending_sets', tempId)
}

export async function cacheExercises(exercises: unknown[]): Promise<void> {
  const db = await getOfflineDB()
  const tx = db.transaction('exercises_cache', 'readwrite')
  await Promise.all([...exercises.map(ex => tx.store.put(ex)), tx.done])
}
