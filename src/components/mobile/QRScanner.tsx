"use client"

import { useState, useEffect } from 'react'
import { QrCode, X, Camera } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { useRouter } from 'next/navigation'

export function QRScanner() {
    const router = useRouter()
    const [isOpen, setIsOpen] = useState(false)
    const [scanning, setScanning] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [hasCamera, setHasCamera] = useState(false)

    useEffect(() => {
        // Check if device has camera
        if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
            navigator.mediaDevices.enumerateDevices()
                .then(devices => {
                    const hasVideoInput = devices.some(device => device.kind === 'videoinput')
                    setHasCamera(hasVideoInput)
                })
        }
    }, [])

    const handleScan = async () => {
        setScanning(true)
        setError(null)

        try {
            // Check if BarcodeDetector is available
            if (!('BarcodeDetector' in window)) {
                // Fallback: Use a library like html5-qrcode
                setError('QR Scanner không được hỗ trợ trên thiết bị này. Vui lòng nhập mã thủ công.')
                setScanning(false)
                return
            }

            // Request camera permission
            const stream = await navigator.mediaDevices.getUserMedia({
                video: { facingMode: 'environment' }
            })

            // Create video element
            const video = document.createElement('video')
            video.srcObject = stream
            video.play()

            // @ts-ignore - BarcodeDetector is experimental
            const barcodeDetector = new BarcodeDetector({ formats: ['qr_code'] })

            // Scan for QR code
            const detectQR = async () => {
                try {
                    const barcodes = await barcodeDetector.detect(video)

                    if (barcodes.length > 0) {
                        const machineCode = barcodes[0].rawValue

                        // Stop camera
                        stream.getTracks().forEach(track => track.stop())

                        // Navigate to vehicle detail
                        router.push(`/vehicles/${machineCode}`)
                        setIsOpen(false)
                        setScanning(false)
                    } else {
                        // Keep scanning
                        requestAnimationFrame(detectQR)
                    }
                } catch (err) {
                    console.error('Detection error:', err)
                }
            }

            // Wait for video to be ready
            video.onloadedmetadata = () => {
                detectQR()
            }

        } catch (err: any) {
            setError(err.message || 'Không thể truy cập camera')
            setScanning(false)
        }
    }

    const handleManualInput = () => {
        const code = prompt('Nhập mã máy:')
        if (code) {
            router.push(`/vehicles/${code}`)
            setIsOpen(false)
        }
    }

    if (!hasCamera) {
        // Fallback button for manual input
        return (
            <Button
                onClick={handleManualInput}
                variant="outline"
                className="gap-2"
            >
                <QrCode className="w-5 h-5" />
                Nhập mã máy
            </Button>
        )
    }

    return (
        <>
            <Button
                onClick={() => setIsOpen(true)}
                variant="outline"
                className="gap-2"
            >
                <QrCode className="w-5 h-5" />
                Quét QR
            </Button>

            <Dialog open={isOpen} onOpenChange={setIsOpen}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <Camera className="w-5 h-5" />
                            Quét mã QR máy móc
                        </DialogTitle>
                    </DialogHeader>

                    <div className="space-y-4">
                        {error ? (
                            <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                                <p className="text-sm text-red-600">{error}</p>
                            </div>
                        ) : scanning ? (
                            <div className="flex flex-col items-center gap-4 py-8">
                                <div className="relative">
                                    <div className="w-48 h-48 border-4 border-blue-500 rounded-lg animate-pulse" />
                                    <div className="absolute inset-0 flex items-center justify-center">
                                        <Camera className="w-12 h-12 text-blue-500 animate-bounce" />
                                    </div>
                                </div>
                                <p className="text-sm text-gray-600">Đang quét... Hãy đưa camera vào mã QR</p>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                <div className="p-8 border-2 border-dashed border-gray-300 rounded-lg text-center">
                                    <QrCode className="w-16 h-16 mx-auto text-gray-400 mb-3" />
                                    <p className="text-sm text-gray-600">
                                        Quét mã QR trên thiết bị để xem chi tiết nhanh chóng
                                    </p>
                                </div>

                                <div className="flex gap-2">
                                    <Button onClick={handleScan} className="flex-1">
                                        <Camera className="w-4 h-4 mr-2" />
                                        Bắt đầu quét
                                    </Button>
                                    <Button onClick={handleManualInput} variant="outline">
                                        Nhập tay
                                    </Button>
                                </div>
                            </div>
                        )}
                    </div>
                </DialogContent>
            </Dialog>
        </>
    )
}
