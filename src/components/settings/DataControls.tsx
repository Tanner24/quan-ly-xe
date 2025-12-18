"use client"

import { useState } from 'react'
import { Trash2, Database, AlertTriangle, RefreshCw, RefreshCcw } from 'lucide-react'
import { Button } from "@/components/ui/button"
import { supabase } from "@/lib/supabaseClient"

export function DataControls() {
    const [loading, setLoading] = useState(false)

    // SEED DATA
    const handleSeedData = async () => {
        if (!confirm("Bạn có muốn tạo lại dữ liệu mẫu (Users, Projects, Error Codes)?\nDữ liệu trùng sẽ bị bỏ qua.")) return

        setLoading(true)
        try {
            // Seed Projects
            const projects = [
                { name: 'Dự án Cổ Loa', code: 'DA-CL-001', start_date: '2024-01-01', end_date: '2024-12-31', status: 'active' },
                { name: 'Dự án Hà Đông', code: 'DA-HD-002', start_date: '2024-06-01', end_date: '2025-05-31', status: 'active' },
                { name: 'HP - Vũ Yên', code: 'HP-VY-004', start_date: '2024-02-15', status: 'active' }
            ]
            await supabase.from('projects').upsert(projects, { onConflict: 'code', ignoreDuplicates: true })

            // Seed Error Codes
            const errorCodes = [
                { code: 'E001', description: 'Cảm biến nhiệt độ nước làm mát quá cao.', fix_steps: 'Check coolant level & fan.' },
                { code: 'P0300', description: 'Phát hiện bỏ máy ngẫu nhiên.', fix_steps: 'Check spark plugs.' }
            ]
            await supabase.from('error_codes').upsert(errorCodes, { onConflict: 'code', ignoreDuplicates: true })

            alert("Đã tạo dữ liệu mẫu thành công!")
        } catch (error: any) {
            alert("Lỗi: " + error.message)
        } finally {
            setLoading(false)
        }
    }

    // CLEAR DATA
    const handleClearData = async () => {
        const confirmMsg = "CẢNH BÁO CỰC KỲ NGUY HIỂM!\n\nBạn đang chuẩn bị XÓA TOÀN BỘ dữ liệu (Logs, History, Machines...).\nHành động này KHÔNG THỂ khôi phục.\n\nNhấn OK để xóa sạch Database."
        if (!confirm(confirmMsg)) return
        if (!confirm("Xác nhận lại lần 2: Bạn chắc chắn muốn XÓA SẠCH?")) return

        setLoading(true)
        try {
            // Order matters due to FK constraints
            await supabase.from('daily_logs').delete().neq('id', '00000000-0000-0000-0000-000000000000') // Delete all UUIDs
            await supabase.from('maintenance_history').delete().neq('id', '00000000-0000-0000-0000-000000000000')
            // Don't delete metadata tables like error_codes or parts unless requested
            // await supabase.from('machines').delete().neq('id', '00000000-0000-0000-0000-000000000000') 
            // Often we want to keep machines but clear logs. 
            // If full reset:
            await supabase.from('machines').delete().neq('code', 'KEEP_THIS_IF_NEEDED')

            alert("Đã xóa dữ liệu vận hành (Logs, History, Machines)!")
        } catch (error: any) {
            alert("Lỗi: " + error.message)
        } finally {
            setLoading(false)
        }
    }

    const handleCleanup = async () => {
        if (!confirm("Xóa các nhật ký và lịch sử cũ hơn 90 ngày?")) return
        setLoading(true)
        try {
            const ninetyDaysAgo = new Date()
            ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90)
            const isoDate = ninetyDaysAgo.toISOString()

            const { count: c1 } = await supabase.from('daily_logs').delete({ count: 'exact' }).lt('log_date', isoDate)
            const { count: c2 } = await supabase.from('maintenance_history').delete({ count: 'exact' }).lt('date', isoDate)

            alert(`Đã dọn dẹp ${c1} nhật ký và ${c2} lịch sử cũ.`)
        } catch (e: any) {
            alert(e.message)
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Optimization */}
                <div className="p-5 bg-white rounded-xl shadow-sm border border-slate-200">
                    <div className="flex items-center gap-2 mb-3">
                        <div className="p-2 bg-blue-50 text-blue-600 rounded-lg"><RefreshCw className="w-5 h-5" /></div>
                        <h3 className="font-bold text-slate-800">Tối ưu & Dọn dẹp</h3>
                    </div>
                    <p className="text-sm text-slate-500 mb-4 h-10">Giải phóng dung lượng bằng cách xóa dữ liệu cũ không cần thiết.</p>
                    <div className="flex gap-3">
                        <Button variant="outline" onClick={handleCleanup} disabled={loading} className="w-full">
                            Dọn dẹp Log cũ
                        </Button>
                        <Button variant="outline" onClick={handleSeedData} disabled={loading} className="w-full text-blue-600 border-blue-200 hover:bg-blue-50">
                            <RefreshCcw className="w-4 h-4 mr-2" /> Tạo mẫu
                        </Button>
                    </div>
                </div>

                {/* Dangerous Zone */}
                <div className="p-5 bg-red-50 rounded-xl shadow-sm border border-red-100">
                    <div className="flex items-center gap-2 mb-3">
                        <div className="p-2 bg-red-100 text-red-600 rounded-lg"><AlertTriangle className="w-5 h-5" /></div>
                        <h3 className="font-bold text-red-700">Vùng Nguy hiểm</h3>
                    </div>
                    <p className="text-sm text-red-600/70 mb-4 h-10">Các chức năng này có thể làm mất dữ liệu vĩnh viễn.</p>
                    <Button
                        variant="destructive"
                        onClick={handleClearData}
                        disabled={loading}
                        className="w-full bg-red-600 hover:bg-red-700 font-bold"
                    >
                        <Trash2 className="w-4 h-4 mr-2" /> XÓA SẠCH DATABASE
                    </Button>
                </div>
            </div>
        </div>
    )
}
