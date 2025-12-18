"use client"

import { Button } from "@/components/ui/button"
import { Download, Upload, AlertTriangle, CheckCircle, Database } from "lucide-react"
import { useState } from "react"
import { supabase } from "@/lib/supabaseClient"
import * as XLSX from "xlsx"

export default function BackupPage() {
    const [loading, setLoading] = useState(false)

    const handleBackup = async (table: string) => {
        setLoading(true)
        try {
            const { data, error } = await supabase.from(table).select('*')
            if (error) throw error

            const ws = XLSX.utils.json_to_sheet(data)
            const wb = XLSX.utils.book_new()
            XLSX.utils.book_append_sheet(wb, ws, table)

            const date = new Date().toISOString().split('T')[0]
            XLSX.writeFile(wb, `VINCONS_BACKUP_${table.toUpperCase()}_${date}.xlsx`)

        } catch (error: any) {
            alert("Lỗi backup: " + error.message)
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="space-y-6">
            <div className="space-y-2">
                <h1 className="text-2xl font-bold tracking-tight text-gray-900">Sao lưu & Khôi phục</h1>
                <p className="text-gray-500 text-sm">An toàn dữ liệu là ưu tiên hàng đầu.</p>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
                {/* Backup Card */}
                <div className="p-6 bg-white rounded-xl border border-slate-200">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="p-2 bg-blue-50 rounded-lg">
                            <Download className="w-6 h-6 text-blue-600" />
                        </div>
                        <div>
                            <h3 className="font-bold text-gray-900">Xuất Dữ liệu (Backup)</h3>
                            <p className="text-xs text-gray-500">Tải về file Excel chứa toàn bộ dữ liệu hiện tại.</p>
                        </div>
                    </div>

                    <div className="space-y-3">
                        <Button
                            variant="outline"
                            className="w-full justify-start hover:bg-slate-50"
                            onClick={() => handleBackup('machines')}
                            disabled={loading}
                        >
                            <Database className="w-4 h-4 mr-2 text-slate-400" />
                            Backup Danh sách Xe máy
                        </Button>
                        <Button
                            variant="outline"
                            className="w-full justify-start hover:bg-slate-50"
                            onClick={() => handleBackup('daily_logs')}
                            disabled={loading}
                        >
                            <Database className="w-4 h-4 mr-2 text-slate-400" />
                            Backup Nhật trình Hoạt động
                        </Button>
                        <Button
                            variant="outline"
                            className="w-full justify-start hover:bg-slate-50"
                            onClick={() => handleBackup('repair_history')}
                            disabled={loading}
                        >
                            <Database className="w-4 h-4 mr-2 text-slate-400" />
                            Backup Lịch sử Sửa chữa
                        </Button>
                        <Button
                            variant="outline"
                            className="w-full justify-start hover:bg-slate-50"
                            onClick={() => handleBackup('projects')}
                            disabled={loading}
                        >
                            <Database className="w-4 h-4 mr-2 text-slate-400" />
                            Backup Danh sách Dự án
                        </Button>
                    </div>
                </div>

                {/* Restore Information */}
                <div className="p-6 bg-white rounded-xl border border-slate-200">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="p-2 bg-orange-50 rounded-lg">
                            <AlertTriangle className="w-6 h-6 text-orange-600" />
                        </div>
                        <div>
                            <h3 className="font-bold text-gray-900">Khôi phục Dữ liệu</h3>
                            <p className="text-xs text-gray-500">Cảnh báo: Hành động này sẽ thay đổi database.</p>
                        </div>
                    </div>

                    <div className="text-sm text-slate-600 space-y-4">
                        <p>
                            Để khôi phục dữ liệu, vui lòng sử dụng tính năng <span className="font-bold text-blue-600">Universal Import</span> tại
                            trang <b>Trung tâm Dữ liệu</b>.
                        </p>
                        <p>
                            Hệ thống sẽ tự động cập nhật (Update) các bản ghi nếu trùng mã (Code), hoặc thêm mới (Insert) nếu chưa tồn tại.
                        </p>

                        <div className="p-4 bg-orange-50 text-orange-800 rounded-lg text-xs leading-relaxed border border-orange-100">
                            <strong>Lưu ý quan trọng:</strong><br />
                            Nếu bạn cần khôi phục lại trạng thái cũ (Rollback) do lỗi thao tác, vui lòng liên hệ Admin hệ thống để truy xuất bản backup cấp Server (Supabase Point-in-Time Recovery).
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
