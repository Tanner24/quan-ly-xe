"use client"

import { useEffect, useState } from 'react'
import { Bell, X, Check } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useRealtimeTable } from '@/hooks/useRealtime'

interface Notification {
    id: string
    title: string
    message: string
    type: 'info' | 'warning' | 'error' | 'success'
    timestamp: string
    read: boolean
    action?: {
        label: string
        url: string
    }
}

export function RealtimeNotifications() {
    const [notifications, setNotifications] = useState<Notification[]>([])
    const [showPanel, setShowPanel] = useState(false)
    const [unreadCount, setUnreadCount] = useState(0)

    // Listen to machines for changes
    const { data: machines } = useRealtimeTable('machines')

    useEffect(() => {
        // Create notifications from machine changes
        if (!machines) return

        // Check for overdue maintenance
        const now = new Date()
        machines.forEach(machine => {
            // Simple check - you can customize this logic
            if (machine.status === 'maintenance') {
                const notification: Notification = {
                    id: `maintenance-${machine.id}`,
                    title: 'Thiết bị đang bảo dưỡng',
                    message: `${machine.code} đang trong quá trình bảo dưỡng`,
                    type: 'warning',
                    timestamp: new Date().toISOString(),
                    read: false,
                    action: {
                        label: 'Xem chi tiết',
                        url: `/vehicles/${machine.id}`
                    }
                }

                setNotifications(prev => {
                    // Don't duplicate
                    if (prev.some(n => n.id === notification.id)) return prev
                    return [notification, ...prev]
                })
            }
        })
    }, [machines])

    useEffect(() => {
        setUnreadCount(notifications.filter(n => !n.read).length)
    }, [notifications])

    const markAsRead = (id: string) => {
        setNotifications(prev =>
            prev.map(n => n.id === id ? { ...n, read: true } : n)
        )
    }

    const markAllAsRead = () => {
        setNotifications(prev => prev.map(n => ({ ...n, read: true })))
    }

    const clearNotification = (id: string) => {
        setNotifications(prev => prev.filter(n => n.id !== id))
    }

    const getNotificationColor = (type: Notification['type']) => {
        switch (type) {
            case 'error':
                return 'border-red-200 bg-red-50'
            case 'warning':
                return 'border-yellow-200 bg-yellow-50'
            case 'success':
                return 'border-green-200 bg-green-50'
            default:
                return 'border-blue-200 bg-blue-50'
        }
    }

    return (
        <div className="relative">
            {/* Bell Icon */}
            <button
                onClick={() => setShowPanel(!showPanel)}
                className="relative p-2 rounded-lg hover:bg-gray-100 transition-colors"
            >
                <Bell className="w-5 h-5 text-gray-600" />
                {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center animate-pulse">
                        {unreadCount}
                    </span>
                )}
            </button>

            {/* Notification Panel */}
            {showPanel && (
                <div className="absolute right-0 top-12 w-96 bg-white rounded-xl shadow-2xl border border-gray-200 z-50 animate-in slide-in-from-top-2 duration-200">
                    {/* Header */}
                    <div className="flex items-center justify-between p-4 border-b border-gray-200">
                        <div>
                            <h3 className="font-bold text-gray-900">Thông báo</h3>
                            <p className="text-xs text-gray-500">{unreadCount} chưa đọc</p>
                        </div>
                        <div className="flex items-center gap-2">
                            {unreadCount > 0 && (
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={markAllAsRead}
                                    className="text-xs"
                                >
                                    <Check className="w-3 h-3 mr-1" />
                                    Đánh dấu tất cả
                                </Button>
                            )}
                            <button
                                onClick={() => setShowPanel(false)}
                                className="p-1 rounded-lg hover:bg-gray-100"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </div>
                    </div>

                    {/* Notifications List */}
                    <div className="max-h-96 overflow-y-auto">
                        {notifications.length === 0 ? (
                            <div className="p-8 text-center text-gray-400">
                                <Bell className="w-12 h-12 mx-auto mb-3 opacity-50" />
                                <p>Không có thông báo mới</p>
                            </div>
                        ) : (
                            notifications.map(notification => (
                                <div
                                    key={notification.id}
                                    className={`p-4 border-b border-gray-100 hover:bg-gray-50 transition-colors ${!notification.read ? 'bg-blue-50/30' : ''}`}
                                    onClick={() => markAsRead(notification.id)}
                                >
                                    <div className="flex items-start gap-3">
                                        <div className={`p-2 rounded-lg ${getNotificationColor(notification.type)}`}>
                                            <Bell className="w-4 h-4" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-start justify-between gap-2">
                                                <h4 className="font-semibold text-sm text-gray-900">
                                                    {notification.title}
                                                </h4>
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation()
                                                        clearNotification(notification.id)
                                                    }}
                                                    className="p-1 rounded hover:bg-gray-200"
                                                >
                                                    <X className="w-3 h-3" />
                                                </button>
                                            </div>
                                            <p className="text-xs text-gray-600 mt-1">{notification.message}</p>
                                            <p className="text-xs text-gray-400 mt-2">
                                                {new Date(notification.timestamp).toLocaleString('vi-VN')}
                                            </p>
                                            {notification.action && (
                                                <a
                                                    href={notification.action.url}
                                                    className="inline-block mt-2 text-xs text-blue-600 hover:text-blue-700 font-medium"
                                                    onClick={(e) => e.stopPropagation()}
                                                >
                                                    {notification.action.label} →
                                                </a>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            )}
        </div>
    )
}
