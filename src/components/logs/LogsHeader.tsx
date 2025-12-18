"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Share2, ArrowLeft, Edit, Check } from "lucide-react"
import { useState } from "react"

export function LogsHeader() {
    const [copied, setCopied] = useState(false)

    const handleShare = () => {
        const url = `${window.location.origin}/logs/update`
        navigator.clipboard.writeText(url)
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
    }

    return (
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
                <Link href="/" className="flex items-center gap-2 text-sm text-gray-500 mb-2 hover:text-gray-900 transition-colors cursor-pointer w-fit">
                    <ArrowLeft className="h-4 w-4" />
                    <span>Trở về</span>
                </Link>
                <h1 className="text-2xl font-bold tracking-tight text-gray-900">Nhật ký Hoạt động</h1>
                <p className="text-gray-500 text-sm">Quản lý ODO và lịch trình hoạt động của phương tiện.</p>
            </div>
            <div className="flex gap-2">
                <Button
                    variant="outline"
                    className="bg-white hover:bg-slate-50 border-slate-200 text-slate-700"
                    onClick={() => alert("Tính năng chỉnh sửa cấu trúc biểu mẫu đang được phát triển.")}
                >
                    <Edit className="mr-2 h-4 w-4" /> Chỉnh sửa biểu mẫu
                </Button>

                <Button
                    className={`${copied ? 'bg-green-600 hover:bg-green-700' : 'bg-indigo-600 hover:bg-indigo-700'} transition-all`}
                    onClick={handleShare}
                >
                    {copied ? <Check className="mr-2 h-4 w-4" /> : <Share2 className="mr-2 h-4 w-4" />}
                    {copied ? "Đã copy link!" : "Chia sẻ biểu mẫu"}
                </Button>
            </div>
        </div>
    )
}
