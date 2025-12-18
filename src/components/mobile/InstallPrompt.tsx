"use client"

import { useEffect, useState } from 'react'
import { X, Download, Smartphone } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface BeforeInstallPromptEvent extends Event {
    prompt: () => Promise<void>
    userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

export function InstallPrompt() {
    const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null)
    const [showPrompt, setShowPrompt] = useState(false)
    const [isInstalled, setIsInstalled] = useState(false)

    useEffect(() => {
        // Check if already installed
        if (window.matchMedia('(display-mode: standalone)').matches) {
            setIsInstalled(true)
            return
        }

        // Listen for install prompt
        const handler = (e: Event) => {
            e.preventDefault()
            const promptEvent = e as BeforeInstallPromptEvent
            setDeferredPrompt(promptEvent)

            // Don't show immediately - wait for user interaction
            setTimeout(() => {
                setShowPrompt(true)
            }, 3000) // Show after 3 seconds
        }

        window.addEventListener('beforeinstallprompt', handler)

        // Listen for successful install
        window.addEventListener('appinstalled', () => {
            setIsInstalled(true)
            setShowPrompt(false)
        })

        return () => {
            window.removeEventListener('beforeinstallprompt', handler)
        }
    }, [])

    const handleInstall = async () => {
        if (!deferredPrompt) return

        // Show install prompt
        deferredPrompt.prompt()

        // Wait for user choice
        const { outcome } = await deferredPrompt.userChoice

        if (outcome === 'accepted') {
            console.log('User accepted install')
        } else {
            console.log('User dismissed install')
        }

        setDeferredPrompt(null)
        setShowPrompt(false)
    }

    const handleDismiss = () => {
        setShowPrompt(false)
        // Don't show again for 7 days
        localStorage.setItem('installPromptDismissed', Date.now().toString())
    }

    // Don't show if already installed or dismissed recently
    if (isInstalled || !showPrompt) return null

    const dismissedTime = localStorage.getItem('installPromptDismissed')
    if (dismissedTime) {
        const daysSinceDismissed = (Date.now() - parseInt(dismissedTime)) / (1000 * 60 * 60 * 24)
        if (daysSinceDismissed < 7) return null
    }

    return (
        <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:max-w-md z-50 animate-in slide-in-from-bottom-4 duration-300">
            <div className="bg-gradient-to-br from-blue-600 to-indigo-600 text-white rounded-2xl shadow-2xl p-6 relative overflow-hidden">
                {/* Background pattern */}
                <div className="absolute inset-0 opacity-10">
                    <div className="absolute inset-0" style={{
                        backgroundImage: 'radial-gradient(circle at 1px 1px, white 1px, transparent 0)',
                        backgroundSize: '24px 24px'
                    }} />
                </div>

                {/* Close button */}
                <button
                    onClick={handleDismiss}
                    className="absolute top-3 right-3 p-1 rounded-full hover:bg-white/20 transition-colors"
                    aria-label="Đóng"
                >
                    <X className="w-5 h-5" />
                </button>

                {/* Content */}
                <div className="relative">
                    <div className="flex items-center gap-3 mb-3">
                        <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm">
                            <Smartphone className="w-6 h-6" />
                        </div>
                        <div>
                            <h3 className="font-bold text-lg">Cài đặt App Vincons</h3>
                            <p className="text-sm text-blue-100">Truy cập nhanh hơn, tiện lợi hơn!</p>
                        </div>
                    </div>

                    <div className="space-y-2 mb-4 text-sm text-blue-50">
                        <div className="flex items-center gap-2">
                            <div className="w-1.5 h-1.5 rounded-full bg-white" />
                            <span>Hoạt động offline</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="w-1.5 h-1.5 rounded-full bg-white" />
                            <span>Thông báo tức thời</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="w-1.5 h-1.5 rounded-full bg-white" />
                            <span>Trải nghiệm như app native</span>
                        </div>
                    </div>

                    <div className="flex gap-2">
                        <Button
                            onClick={handleInstall}
                            className="flex-1 bg-white text-blue-600 hover:bg-blue-50 font-semibold"
                        >
                            <Download className="w-4 h-4 mr-2" />
                            Cài đặt ngay
                        </Button>
                        <Button
                            onClick={handleDismiss}
                            variant="ghost"
                            className="text-white hover:bg-white/20"
                        >
                            Để sau
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    )
}
