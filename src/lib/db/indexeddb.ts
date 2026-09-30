/**
 * IndexedDB abstraction for Nexora local-first persistence.
 * Stores all productivity data locally. Only tiny preferences go to localStorage.
 */

const DB_NAME = 'nexora-local'
const DB_VERSION = 1

export interface NexoraDB {
  tasks: IDBObjectStore
  projects: IDBObjectStore
  goals: IDBObjectStore
  habits: IDBObjectStore
  habitCompletions: IDBObjectStore
  timeline: IDBObjectStore
  focusSessions: IDBObjectStore
  agentConfig: IDBObjectStore
  characterConfig: IDBObjectStore
  settings: IDBObjectStore
}

const STORES = [
  'tasks',
  'projects',
  'goals',
  'habits',
  'habitCompletions',
  'timeline',
  'focusSessions',
  'agentConfig',
  'characterConfig',
  'settings',
] as const

export type StoreName = (typeof STORES)[number]

let dbPromise: Promise<IDBDatabase> | null = null

function openDB(): Promise<IDBDatabase> {
  if (dbPromise) return dbPromise

  dbPromise = new Promise<IDBDatabase>((resolve, reject) => {
    if (typeof indexedDB === 'undefined') {
      reject(new Error('IndexedDB is not available'))
      return
    }

    const request = indexedDB.open(DB_NAME, DB_VERSION)

    request.onerror = () => {
      dbPromise = null
      reject(request.error)
    }

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result

      for (const storeName of STORES) {
        if (!db.objectStoreNames.contains(storeName)) {
          const store = db.createObjectStore(storeName, { keyPath: 'id' })

          // Add indexes based on store type
          if (storeName === 'tasks') {
            store.createIndex('status', 'status', { unique: false })
            store.createIndex('projectId', 'projectId', { unique: false })
            store.createIndex('priority', 'priority', { unique: false })
            store.createIndex('dueDate', 'dueDate', { unique: false })
          } else if (storeName === 'projects') {
            store.createIndex('status', 'status', { unique: false })
          } else if (storeName === 'goals') {
            store.createIndex('status', 'status', { unique: false })
            store.createIndex('type', 'type', { unique: false })
          } else if (storeName === 'habits') {
            store.createIndex('frequency', 'frequency', { unique: false })
          } else if (storeName === 'habitCompletions') {
            store.createIndex('habitId', 'habitId', { unique: false })
            store.createIndex('completedDate', 'completedDate', { unique: false })
          } else if (storeName === 'timeline') {
            store.createIndex('startTime', 'startTime', { unique: false })
          } else if (storeName === 'focusSessions') {
            store.createIndex('completedAt', 'completedAt', { unique: false })
          }
        }
      }
    }

    request.onsuccess = () => {
      resolve(request.result)
    }
  })

  return dbPromise
}

// ─── Generic CRUD Operations ───

export async function dbGetAll<T>(storeName: StoreName): Promise<T[]> {
  try {
    const db = await openDB()
    return new Promise((resolve, reject) => {
      const tx = db.transaction(storeName, 'readonly')
      const store = tx.objectStore(storeName)
      const request = store.getAll()
      request.onsuccess = () => resolve(request.result as T[])
      request.onerror = () => reject(request.error)
    })
  } catch {
    console.warn(`[NexoraDB] Failed to read ${storeName}, returning empty array`)
    return []
  }
}

export async function dbGet<T>(storeName: StoreName, id: string): Promise<T | undefined> {
  try {
    const db = await openDB()
    return new Promise((resolve, reject) => {
      const tx = db.transaction(storeName, 'readonly')
      const store = tx.objectStore(storeName)
      const request = store.get(id)
      request.onsuccess = () => resolve(request.result as T | undefined)
      request.onerror = () => reject(request.error)
    })
  } catch {
    return undefined
  }
}

export async function dbPut<T extends { id: string }>(storeName: StoreName, item: T): Promise<void> {
  try {
    const db = await openDB()
    return new Promise((resolve, reject) => {
      const tx = db.transaction(storeName, 'readwrite')
      const store = tx.objectStore(storeName)
      const request = store.put(item)
      request.onsuccess = () => resolve()
      request.onerror = () => reject(request.error)
    })
  } catch (err) {
    console.error(`[NexoraDB] Failed to put to ${storeName}:`, err)
  }
}

export async function dbPutMany<T extends { id: string }>(storeName: StoreName, items: T[]): Promise<void> {
  try {
    const db = await openDB()
    return new Promise((resolve, reject) => {
      const tx = db.transaction(storeName, 'readwrite')
      const store = tx.objectStore(storeName)
      for (const item of items) {
        store.put(item)
      }
      tx.oncomplete = () => resolve()
      tx.onerror = () => reject(tx.error)
    })
  } catch (err) {
    console.error(`[NexoraDB] Failed to put many to ${storeName}:`, err)
  }
}

export async function dbDelete(storeName: StoreName, id: string): Promise<void> {
  try {
    const db = await openDB()
    return new Promise((resolve, reject) => {
      const tx = db.transaction(storeName, 'readwrite')
      const store = tx.objectStore(storeName)
      const request = store.delete(id)
      request.onsuccess = () => resolve()
      request.onerror = () => reject(request.error)
    })
  } catch (err) {
    console.error(`[NexoraDB] Failed to delete from ${storeName}:`, err)
  }
}

export async function dbClear(storeName: StoreName): Promise<void> {
  try {
    const db = await openDB()
    return new Promise((resolve, reject) => {
      const tx = db.transaction(storeName, 'readwrite')
      const store = tx.objectStore(storeName)
      const request = store.clear()
      request.onsuccess = () => resolve()
      request.onerror = () => reject(request.error)
    })
  } catch (err) {
    console.error(`[NexoraDB] Failed to clear ${storeName}:`, err)
  }
}

export async function dbClearAll(): Promise<void> {
  for (const storeName of STORES) {
    await dbClear(storeName)
  }
}

export async function dbCount(storeName: StoreName): Promise<number> {
  try {
    const db = await openDB()
    return new Promise((resolve, reject) => {
      const tx = db.transaction(storeName, 'readonly')
      const store = tx.objectStore(storeName)
      const request = store.count()
      request.onsuccess = () => resolve(request.result)
      request.onerror = () => reject(request.error)
    })
  } catch {
    return 0
  }
}

// ─── Export / Import ───

export async function exportAllData(): Promise<Record<string, unknown[]>> {
  const data: Record<string, unknown[]> = {}
  for (const storeName of STORES) {
    data[storeName] = await dbGetAll(storeName)
  }
  return data
}

export async function importAllData(data: Record<string, unknown[]>): Promise<void> {
  for (const storeName of STORES) {
    if (data[storeName] && Array.isArray(data[storeName])) {
      await dbClear(storeName)
      const db = await openDB()
      await new Promise<void>((resolve, reject) => {
        const tx = db.transaction(storeName, 'readwrite')
        const store = tx.objectStore(storeName)
        for (const item of data[storeName]) {
          store.put(item)
        }
        tx.oncomplete = () => resolve()
        tx.onerror = () => reject(tx.error)
      })
    }
  }
}

// ─── Migration from localStorage ───

export async function migrateFromLocalStorage(): Promise<boolean> {
  let migrated = false

  const localStoreKeys: Record<string, StoreName> = {
    'nexora_guest_tasks': 'tasks',
    'nexora_guest_projects': 'projects',
    'nexora_guest_goals': 'goals',
    'nexora_guest_habits': 'habits',
    'nexora_guest_timeline': 'timeline',
    'nexora-focus-storage': 'focusSessions',
  }

  for (const [lsKey, storeName] of Object.entries(localStoreKeys)) {
    try {
      const raw = localStorage.getItem(lsKey)
      if (!raw) continue

      const parsed = JSON.parse(raw)
      const stateKey = Object.keys(parsed.state || {})[0]
      const items = parsed?.state?.[stateKey]

      if (Array.isArray(items) && items.length > 0) {
        const existing = await dbCount(storeName)
        if (existing === 0) {
          await dbPutMany(storeName, items)
          migrated = true
        }
      }
    } catch {
      // Skip corrupted localStorage entries
    }
  }

  if (migrated) {
    localStorage.setItem('nexora_idb_migrated', 'true')
  }

  return migrated
}

export function isIndexedDBAvailable(): boolean {
  return typeof indexedDB !== 'undefined'
}
