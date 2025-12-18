import { Metadata, Viewport } from "next"
import { DriverLogForm } from "@/components/logs/DriverLogForm"

export const metadata: Metadata = {
    title: "Cập nhật Nhật ký | Driver App",
    description: "Form nhập liệu nhanh dành cho lái xe",
}

export const viewport: Viewport = {
    width: "device-width",
    initialScale: 1,
    maximumScale: 1,
}

export default function DriverUpdatePage() {
    return (
        <div className="min-h-screen bg-slate-50 py-4 px-2 flex items-start justify-center">
            <DriverLogForm />
        </div>
    )
}
