import { Metadata } from "next"
import { DatabaseEditor } from "@/components/settings/database/DatabaseEditor"

export const metadata: Metadata = {
    title: "Dữ liệu Hệ thống | Settings",
    description: "Xem và chỉnh sửa dữ liệu thô của hệ thống.",
}

export default function ViewDataPage() {
    return (
        <div className="space-y-6 pb-8">
            <div className="space-y-1">
                <h1 className="text-2xl font-bold tracking-tight text-gray-900">Trình biên tập Dữ liệu</h1>
                <p className="text-gray-500 text-sm">Can thiệp trực tiếp vào cơ sở dữ liệu (Dành cho Admin).</p>
            </div>
            <DatabaseEditor />
        </div>
    )
}
