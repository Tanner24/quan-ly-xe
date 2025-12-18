// Offline utilities for PWA
import { openDB, DBSchema, IDBPDatabase } from 'idb'

interface VinconsDB extends DBSchema {
    machines: {
        key: string
        value: {
            id: string
            code: string
            project_name?: string
            current_hours: number
            status: string
            model?: string
            synced: boolean
            lastUpdated: number
        }
    }
    logs: {
        key: string
        value: {
            id: string
            machine_code: string
            date: string
            hours: number
            notes?: string
            synced: boolean
            lastUpdated: number
        }
    }
    syncQueue: {
        key: number
        value: {
            table: string
            action: 'create' | 'update' | 'delete'
            data: any
            timestamp: number
        }
    }
}

let db: IDBPDatabase<VinconsDB> | null = null

export async function initOfflineDB() {
    if (db) return db

    db = await openDB<VinconsDB>('vincons-offline', 1, {
        upgrade(database) {
            // Create stores
            if (!database.objectStoreNames.contains('machines')) {
                database.createObjectStore('machines', { keyPath: 'id' })
            }
            if (!database.objectStoreNames.contains('logs')) {
                database.createObjectStore('logs', { keyPath: 'id' })
            }
            if (!database.objectStoreNames.contains('syncQueue')) {
                database.createObjectStore('syncQueue', { keyPath: 'timestamp' })
            }
        }
    })

    return db
}

// Save to offline storage
export async function saveOffline(storeName: keyof VinconsDB, data: any) {
    const database = await initOfflineDB()
    await database.put(storeName, { ...data, synced: false, lastUpdated: Date.now() })
}

// Get from offline storage
export async function getOffline(storeName: keyof VinconsDB, key?: string) {
    const database = await initOfflineDB()
    if (key) {
        return await database.get(storeName, key)
    }
    return await database.getAll(storeName)
}

// Queue action for sync when online
export async function queueForSync(table: string, action: 'create' | 'update' | 'delete', data: any) {
    const database = await initOfflineDB()
    await database.add('syncQueue', {
        table,
        action,
        data,
        timestamp: Date.now()
    })
}

// Sync offline data when online
export async function syncOfflineData(supabase: any) {
    const database = await initOfflineDB()
    const queue = await database.getAll('syncQueue')

    for (const item of queue) {
        try {
            switch (item.action) {
                case 'create':
                    await supabase.from(item.table).insert(item.data)
                    break
                case 'update':
                    await supabase.from(item.table).update(item.data).eq('id', item.data.id)
                    break
                case 'delete':
                    await supabase.from(item.table).delete().eq('id', item.data.id)
                    break
            }

            // Remove from queue after successful sync
            await database.delete('syncQueue', item.timestamp)
        } catch (error) {
            console.error('Sync error:', error)
            // Keep in queue for retry
        }
    }
}

// Check if online
export function isOnline() {
    return navigator.onLine
}

// Listen for online/offline events
export function setupOfflineSync(supabase: any) {
    window.addEventListener('online', async () => {
        console.log('Back online! Syncing...')
        await syncOfflineData(supabase)
    })

    window.addEventListener('offline', () => {
        console.log('Gone offline. Changes will be queued.')
    })
}

// Cache images for offline use
export async function cacheImage(url: string): Promise<string> {
    try {
        const cache = await caches.open('vincons-images')
        const response = await cache.match(url)

        if (response) {
            const blob = await response.blob()
            return URL.createObjectURL(blob)
        }

        // Fetch and cache
        const fetchResponse = await fetch(url)
        await cache.put(url, fetchResponse.clone())
        const blob = await fetchResponse.blob()
        return URL.createObjectURL(blob)
    } catch (error) {
        console.error('Error caching image:', error)
        return url // Fallback to original URL
    }
}
