"use client"

import { MessageCircle } from "lucide-react"

export function ChatWidget() {
    return (
        <div className="fixed bottom-6 right-6 z-50">
            <button className="h-14 w-14 rounded-full bg-blue-600 text-white shadow-lg flex items-center justify-center hover:bg-blue-700 transition-colors animate-bounce-in">
                <MessageCircle className="h-7 w-7" />
            </button>
        </div>
    )
}
