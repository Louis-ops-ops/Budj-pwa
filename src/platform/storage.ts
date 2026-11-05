import { openDB, type IDBPDatabase } from 'idb'
import type { BudjData, ThemeSetting } from '../shared/types'
import { migrate } from '../shared/migrate'

export interface BudjPlatform {
  loadData(): Promise<BudjData | null>
  saveData(data: BudjData): Promise<void>
  exportData(): Promise<{ ok: boolean; filename?: string }>
  importData(): Promise<BudjData | null>
  getTheme(): Promise<ThemeSetting>
  setTheme(theme: ThemeSetting): Promise<void>
  getStorageStatus(): Promise<{
    persisted: boolean
    installed: boolean
    usage?: number
    quota?: number
  }>
  requestPersistence(): Promise<boolean>
  /** True when the last loadData() fell back on data-bak. */
  restoredFromBackup(): boolean
  /** Calls back when another tab or window saved. Returns the unsubscribe function. */
  onExternalChange(callback: () => void): () => void
}

/** IndexedDB cannot be opened or written to. */
export class StorageUnavailableError extends Error {}
/** The base holds data, but neither data nor data-bak is valid. A copy was kept. */
export class StorageCorruptError extends Error {}
/** The chosen file is not a Budj backup. */
export class InvalidImportError extends Error {}

interface Meta {
  createdAt: string
  lastBackupAt?: string
  lastExportAt?: string
}

const DB_NAME = 'budj'
const STORE = 'kv'
const CHANNEL = 'budj'
const CORRUPT_PREFIX = 'data-corrupt-'
const BACKUP_MAX_AGE_MS = 24 * 60 * 60 * 1000

function pickJsonFile(): Promise<string | null> {
  return new Promise((resolve) => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = 'application/json'
    input.addEventListener('cancel', () => resolve(null))
    input.addEventListener('change', () => {
      const file = input.files?.[0]
      resolve(file ? file.text() : null)
    })
    input.click()
  })
}

function isInstalled(): boolean {
  if (typeof window === 'undefined') return false
  const iosStandalone = (navigator as Navigator & { standalone?: boolean }).standalone === true
  return iosStandalone || window.matchMedia('(display-mode: standalone)').matches
}

function parseBackup(text: string): BudjData {
  let value: unknown
  try {
    value = JSON.parse(text)
  } catch {
    throw new InvalidImportError('Not JSON')
  }
  const data = migrate(value)
  if (!data) throw new InvalidImportError('Not a Budj backup')
  return data
}

export function createPlatform(pickFile = pickJsonFile): BudjPlatform {
  const channel = typeof BroadcastChannel === 'undefined' ? null : new BroadcastChannel(CHANNEL)
  let connection: Promise<IDBPDatabase> | null = null
  let restored = false

  const open = async (): Promise<IDBPDatabase> => {
    try {
      connection ??= openDB(DB_NAME, 1, {
        upgrade: (db) => void db.createObjectStore(STORE),
        // The browser can close the connection at any time: reopen on the next call.
        terminated: () => {
          connection = null
        }
      })
      return await connection
    } catch (error) {
      connection = null
      throw new StorageUnavailableError(String(error))
    }
  }

  const write = async (key: string, value: unknown): Promise<void> => {
    const db = await open()
    const tx = db.transaction(STORE, 'readwrite', { durability: 'strict' })
    await Promise.all([tx.store.put(value, key), tx.done])
  }

  const load = async (): Promise<BudjData | null> => {
    const db = await open()
    const tx = db.transaction(STORE, 'readwrite', { durability: 'strict' })
    const kv = tx.store
    const [rawData, rawBackup, storedMeta] = await Promise.all([
      kv.get('data'),
      kv.get('data-bak'),
      kv.get('meta') as Promise<Meta | undefined>
    ])
    const now = new Date()
    const meta: Meta = storedMeta ?? { createdAt: now.toISOString() }
    const data = migrate(rawData)
    const backup = migrate(rawBackup)

    const keepCorruptCopy = async (value: unknown): Promise<void> => {
      const serialized = JSON.stringify(value)
      const keys = await kv.getAllKeys()
      for (const key of keys) {
        if (!String(key).startsWith(CORRUPT_PREFIX)) continue
        if (JSON.stringify(await kv.get(key)) === serialized) return
      }
      await kv.put(value, `${CORRUPT_PREFIX}${now.toISOString()}`)
    }

    let result: BudjData | null = null
    let corrupt = false
    restored = false

    if (data) {
      if (data !== rawData) await kv.put(data, 'data')
      const backupAge = meta.lastBackupAt
        ? now.getTime() - new Date(meta.lastBackupAt).getTime()
        : Infinity
      if (!backup || backupAge > BACKUP_MAX_AGE_MS) {
        await kv.put(data, 'data-bak')
        meta.lastBackupAt = now.toISOString()
      }
      result = data
    } else if (backup) {
      if (rawData !== undefined) await keepCorruptCopy(rawData)
      await kv.put(backup, 'data')
      restored = true
      result = backup
    } else if (rawData !== undefined || rawBackup !== undefined) {
      await keepCorruptCopy(rawData ?? rawBackup)
      corrupt = true
    }

    await kv.put(meta, 'meta')
    await tx.done
    if (corrupt) throw new StorageCorruptError('data and data-bak are both invalid')
    return result
  }

  return {
    async loadData() {
      try {
        return await load()
      } catch (error) {
        if (error instanceof StorageCorruptError) throw error
        throw new StorageUnavailableError(String(error))
      }
    },

    async saveData(data) {
      try {
        await write('data', data)
      } catch (error) {
        throw new StorageUnavailableError(String(error))
      }
      channel?.postMessage('changed')
    },

    // Web export comes with phase 4.
    exportData: async () => ({ ok: false }),

    async importData() {
      const text = await pickFile()
      if (text === null) return null
      const data = parseBackup(text)
      const db = await open()
      const current = migrate(await db.get(STORE, 'data'))
      if (current) await write('data-bak', current)
      return data
    },

    async getTheme() {
      const db = await open()
      const settings = await db.get(STORE, 'settings')
      return settings?.theme ?? 'system'
    },

    async setTheme(theme) {
      await write('settings', { theme })
    },

    // Eviction protection comes with phase 4.
    getStorageStatus: async () => ({ persisted: false, installed: isInstalled() }),
    requestPersistence: async () => false,

    restoredFromBackup: () => restored,

    onExternalChange(callback) {
      if (!channel) return () => undefined
      channel.addEventListener('message', callback)
      return () => channel.removeEventListener('message', callback)
    }
  }
}

export const platform = createPlatform()
