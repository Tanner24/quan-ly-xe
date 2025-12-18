"use client"

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabaseClient'
import type { RealtimeChannel } from '@supabase/supabase-js'

interface UseRealtimeOptions {
    table: string
    onInsert?: (payload: any) => void
    onUpdate?: (payload: any) => void
    onDelete?: (payload: any) => void
    filter?: string
}

export function useRealtime({ table, onInsert, onUpdate, onDelete, filter }: UseRealtimeOptions) {
    const [channel, setChannel] = useState<RealtimeChannel | null>(null)
    const [isConnected, setIsConnected] = useState(false)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        // Create unique channel name
        const channelName = `${table}-changes-${Date.now()}`

        // Subscribe to changes
        const realtimeChannel = supabase
            .channel(channelName)
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: table,
                    filter: filter
                },
                (payload) => {
                    console.log('Realtime event:', payload)

                    switch (payload.eventType) {
                        case 'INSERT':
                            onInsert?.(payload.new)
                            break
                        case 'UPDATE':
                            onUpdate?.(payload.new)
                            break
                        case 'DELETE':
                            onDelete?.(payload.old)
                            break
                    }
                }
            )
            .subscribe((status) => {
                if (status === 'SUBSCRIBED') {
                    setIsConnected(true)
                    console.log(`✅ Subscribed to ${table}`)
                } else if (status === 'CHANNEL_ERROR') {
                    setError('Connection error')
                    setIsConnected(false)
                } else if (status === 'TIMED_OUT') {
                    setError('Connection timeout')
                    setIsConnected(false)
                }
            })

        setChannel(realtimeChannel)

        // Cleanup
        return () => {
            realtimeChannel.unsubscribe()
            setIsConnected(false)
        }
    }, [table, filter, onInsert, onUpdate, onDelete])

    return { channel, isConnected, error }
}

// Hook for listening to specific record changes
export function useRealtimeRecord(table: string, id: string, onUpdate: (data: any) => void) {
    return useRealtime({
        table,
        filter: `id=eq.${id}`,
        onUpdate
    })
}

// Hook for listening to all table changes
export function useRealtimeTable(table: string) {
    const [data, setData] = useState<any[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        // Initial fetch using fetchAllData to see ALL rows
        const fetchData = async () => {
            // Dynamic import to avoid circular dependency issues if any
            const { fetchAllData } = await import('@/lib/supabase-data');

            // Should probably use 'created_at' if it exists, but some tables might not have it.
            // fetchAllData defaults to order by 'id' if 'order' is not provided? 
            // Original code used created_at, let's stick to it but maybe handle error if column missing?
            // For now, let's assume core tables (logs, machines) have created_at.
            const { data: initialData, error } = await fetchAllData(table, {
                order: { column: 'created_at', ascending: false }
            });

            if (error) {
                console.error('Fetch error:', error)
            } else {
                setData(initialData || [])
            }
            setLoading(false)
        }

        fetchData()
    }, [table])

    // Subscribe to changes
    useRealtime({
        table,
        onInsert: (newRecord) => {
            setData(prev => [newRecord, ...prev])
        },
        onUpdate: (updatedRecord) => {
            setData(prev => prev.map(item =>
                item.id === updatedRecord.id ? updatedRecord : item
            ))
        },
        onDelete: (deletedRecord) => {
            setData(prev => prev.filter(item => item.id !== deletedRecord.id))
        }
    })

    return { data, loading, setData }
}

// Hook for presence (who's online)
export function usePresence(channelName: string) {
    const [users, setUsers] = useState<any[]>([])
    const [channel, setChannel] = useState<RealtimeChannel | null>(null)

    useEffect(() => {
        const presenceChannel = supabase.channel(channelName, {
            config: {
                presence: {
                    key: '',
                },
            },
        })

        presenceChannel
            .on('presence', { event: 'sync' }, () => {
                const state = presenceChannel.presenceState()
                const presenceUsers = Object.values(state).flat()
                setUsers(presenceUsers)
            })
            .subscribe(async (status) => {
                if (status === 'SUBSCRIBED') {
                    // Track current user
                    await presenceChannel.track({
                        user: typeof window !== 'undefined' ? localStorage.getItem('user') : 'anonymous',
                        online_at: new Date().toISOString()
                    })
                }
            })

        setChannel(presenceChannel)

        return () => {
            presenceChannel.unsubscribe()
        }
    }, [channelName])

    return { users, channel }
}

// Broadcast hook for real-time messaging
export function useBroadcast(channelName: string, onMessage: (payload: any) => void) {
    const [channel, setChannel] = useState<RealtimeChannel | null>(null)

    useEffect(() => {
        const broadcastChannel = supabase.channel(channelName)

        broadcastChannel
            .on('broadcast', { event: 'message' }, (payload) => {
                onMessage(payload.payload)
            })
            .subscribe()

        setChannel(broadcastChannel)

        return () => {
            broadcastChannel.unsubscribe()
        }
    }, [channelName, onMessage])

    const sendMessage = (message: any) => {
        channel?.send({
            type: 'broadcast',
            event: 'message',
            payload: message
        })
    }

    return { sendMessage, channel }
}
