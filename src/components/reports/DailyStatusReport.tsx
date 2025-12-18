"use client"

import { useState, useEffect } from "react"
import { supabase } from "@/lib/supabaseClient"
import { format } from "date-fns"
import { Download, RefreshCw, Printer } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import * as XLSX from 'xlsx'

export function DailyStatusReport() {
    const [date, setDate] = useState<Date>(new Date())
    const [summaryData, setSummaryData] = useState<any[]>([])
    const [brokenMachines, setBrokenMachines] = useState<any[]>([])
    const [loading, setLoading] = useState(true)

    const fetchData = async () => {
        setLoading(true)
        try {
            const dateStr = format(date, 'yyyy-MM-dd')

            // 1. Fetch Machines
            const { data: machines, error: machineError } = await supabase
                .from('machines')
                .select('id, code, name, project_name, status, department')
                .range(0, 49999)

            if (machineError) throw machineError

            // 2. Fetch Repair History for Today (Issues reported today)
            const { data: repairsToday, error: histError } = await supabase
                .from('repair_history')
                .select('*')
                .eq('date', dateStr)
                .range(0, 49999)

            if (histError) throw histError

            // Get IDs of machines with repairs today
            const repairVehicleIds = new Set(repairsToday?.map(r => r.machine_id) || [])

            // --- LOGIC: Summary Data ---
            // Key: Project|Dept
            const stats: Record<string, any> = {}

            // Pre-process to find unique projects/depts
            machines?.forEach(m => {
                const pName = m.project_name || 'Khác'
                const dept = m.department || '(Không xác định)'
                const key = `${pName}|${dept}`

                if (!stats[key]) {
                    stats[key] = {
                        projectName: pName,
                        department: dept,
                        totalQty: 0,
                        backlogBroken: 0,   // Hỏng tồn đọng
                        newBroken: 0,       // Hỏng phát sinh
                        repairedWait: 0,    // Đã hoàn thành (tạm tính)
                        continueRepair: 0,  // Cần tiếp tục sửa
                        requests: 0         // Tổng phiếu
                    }
                }

                stats[key].totalQty += 1

                // Logic phân loại
                const isBrokenStatus = m.status === 'broken' || m.status === 'maintenance'
                const hasReportToday = repairVehicleIds.has(m.id)

                if (isBrokenStatus) {
                    if (hasReportToday) {
                        stats[key].newBroken += 1 // Phát sinh hôm nay
                        stats[key].requests += 1
                        stats[key].continueRepair += 1 // Vẫn đang sửa
                    } else {
                        stats[key].backlogBroken += 1 // Tồn đọng (hư từ trước)
                        stats[key].continueRepair += 1
                    }
                } else {
                    // Active but has report -> Repaired today?
                    if (hasReportToday) {
                        stats[key].repairedToday = (stats[key].repairedToday || 0) + 1
                        stats[key].requests += 1
                    }
                }
            })

            // Data for rendering
            // Convert to array and sort by Project
            const sorted = Object.values(stats).sort((a, b) => a.projectName.localeCompare(b.projectName))
            setSummaryData(sorted)

            // --- LOGIC: Broken/Repair Details ---
            const brokenList = machines?.filter(m => m.status === 'broken' || m.status === 'maintenance' || repairVehicleIds.has(m.id)).map(m => {
                const rep = repairsToday?.find(r => r.machine_id === m.id)
                return {
                    project: m.project_name || 'N/A',
                    department: m.department || '-',
                    code: m.code,
                    name: m.name,
                    date: dateStr,
                    status: m.status === 'broken' ? 'Hỏng' : (m.status === 'maintenance' ? 'Đang sửa' : 'Hoạt động'),
                    issue: rep?.description || 'Hỏng tồn đọng (chưa cập nhật nd)',
                    cause: rep?.source === 'vincons_bot' ? 'Báo cáo tự động' : 'Kiểm tra kỹ thuật',
                    partsOrdered: '-',
                    partsArrived: '-'
                }
            }) || []
            setBrokenMachines(brokenList)

        } catch (error) {
            console.error("Error fetching report data:", error)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchData()
    }, [date])

    const handleExport = () => {
        const wb = XLSX.utils.book_new()

        // Headers matching Image 1
        const headers = [
            "Dự Án sử dụng TB",
            "Bộ phận sử dụng",
            "Số lượng máy móc thiết bị tại dự án",
            "Số lượng TB hỏng tồn đọng",
            "Số lượng MMTB hỏng phát sinh trong ngày",
            "Số lượng MMTB đã hoàn thành sửa chữa",
            "Số lượng TB cần tiếp cục sửa chữa",
            "Tổng số phiếu đề nghị sửa chữa",
            "(Tỷ lệ % hỏng)",
            "Ghi chú"
        ]

        const data = summaryData.map(d => [
            d.projectName,
            d.department,
            d.totalQty,
            d.backlogBroken,
            d.newBroken,
            d.repairedWait || 0,
            d.continueRepair,
            d.requests,
            d.totalQty > 0 ? ((d.continueRepair) / d.totalQty * 100).toFixed(2) + '%' : '0%',
            '' // Ghi chú
        ])

        const ws = XLSX.utils.aoa_to_sheet([
            ["TÌNH TRẠNG MMTB CÁC DỰ ÁN", `Ngày: ${format(date, 'dd/MM/yyyy')}`],
            headers,
            ...data
        ])

        // Simple styling if possible (SheetJS basic doesn't support styles in free version easily, but structure helps)
        XLSX.utils.book_append_sheet(wb, ws, "Báo cáo Tình trạng")
        XLSX.writeFile(wb, `Bao_cao_Tinh_trang_${format(date, 'dd-MM-yyyy')}.xlsx`)
    }

    // Helper for RowSpan logic
    // We want to group by Project Name. 
    // We already sorted by ProjectName.
    // We can pre-calculate rowspans.
    const renderTableBody = () => {
        if (loading) return <tr><td colSpan={10} className="p-8 text-center text-slate-400">Đang tải dữ liệu...</td></tr>
        if (summaryData.length === 0) return <tr><td colSpan={10} className="p-8 text-center text-slate-400">Không có dữ liệu thiết bị.</td></tr>

        const rows = []
        let i = 0
        while (i < summaryData.length) {
            const current = summaryData[i]
            const pName = current.projectName
            let count = 1
            // Count subsequent rows with same project name
            while (i + count < summaryData.length && summaryData[i + count].projectName === pName) {
                count++
            }

            // Render the group
            for (let j = 0; j < count; j++) {
                const row = summaryData[i + j]
                const percentBroken = row.totalQty > 0 ? ((row.continueRepair / row.totalQty) * 100).toFixed(2) : "0.00"

                rows.push(
                    <tr key={`${i}-${j}`} className="hover:bg-slate-50 border-b border-slate-200 text-sm">
                        {j === 0 && (
                            <td
                                className="p-2 border border-slate-300 font-bold bg-white align-middle text-left"
                                rowSpan={count}
                            >
                                {pName}
                            </td>
                        )}
                        <td className="p-2 border border-slate-300 text-left">{row.department}</td>
                        <td className="p-2 border border-slate-300 text-center font-medium">{row.totalQty}</td>
                        <td className="p-2 border border-slate-300 text-center text-red-600 font-bold">{row.backlogBroken}</td>
                        <td className="p-2 border border-slate-300 text-center">{row.newBroken}</td>
                        <td className="p-2 border border-slate-300 text-center">{row.repairedWait || 0}</td>
                        <td className="p-2 border border-slate-300 text-center text-orange-600 font-bold">{row.continueRepair}</td>
                        <td className="p-2 border border-slate-300 text-center">{row.requests}</td>
                        <td className="p-2 border border-slate-300 text-center font-bold text-slate-700 bg-slate-50">{percentBroken}%</td>
                        <td className="p-2 border border-slate-300"></td>
                    </tr>
                )
            }

            // --- Subtotal Row for Project ---
            // Calculate project totals
            let pTotal = 0, pBacklog = 0, pNew = 0, pRepaired = 0, pContinue = 0, pRequests = 0
            for (let k = 0; k < count; k++) {
                const r = summaryData[i + k]
                pTotal += r.totalQty
                pBacklog += r.backlogBroken
                pNew += r.newBroken
                pRepaired += (r.repairedWait || 0)
                pContinue += r.continueRepair
                pRequests += r.requests
            }
            const pPercent = pTotal > 0 ? ((pContinue / pTotal) * 100).toFixed(2) : "0.00"

            rows.push(
                <tr key={`total-${pName}`} className="bg-[#FFF2CC] font-bold text-sm border-b border-slate-300 text-slate-900">
                    <td className="p-2 border border-slate-300 text-left" colSpan={2}>Tổng số lượng {pName}</td>
                    <td className="p-2 border border-slate-300 text-center text-red-600">{pTotal}</td>
                    <td className="p-2 border border-slate-300 text-center text-red-600">{pBacklog}</td>
                    <td className="p-2 border border-slate-300 text-center text-red-600">{pNew}</td>
                    <td className="p-2 border border-slate-300 text-center text-red-600">{pRepaired}</td>
                    <td className="p-2 border border-slate-300 text-center text-red-600">{pContinue}</td>
                    <td className="p-2 border border-slate-300 text-center text-red-600">{pRequests}</td>
                    <td className="p-2 border border-slate-300 text-center text-red-600">{pPercent}%</td>
                    <td className="p-2 border border-slate-300"></td>
                </tr>
            )

            i += count
        }
        return rows
    }

    return (
        <div className="space-y-6">
            {/* Toolbar */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-4 rounded-xl shadow-sm border border-slate-200">
                <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-slate-700">Ngày báo cáo:</span>
                    <input
                        type="date"
                        value={format(date, 'yyyy-MM-dd')}
                        onChange={(e) => {
                            if (e.target.valueAsDate) setDate(e.target.valueAsDate)
                        }}
                        className="h-10 px-3 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <Button variant="ghost" size="icon" onClick={fetchData} title="Làm mới">
                        <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                    </Button>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline">
                        <Printer className="w-4 h-4 mr-2" /> In báo cáo
                    </Button>
                    <Button onClick={handleExport} className="bg-green-600 hover:bg-green-700">
                        <Download className="w-4 h-4 mr-2" /> Xuất Excel
                    </Button>
                </div>
            </div>

            {/* Table: Summary */}
            <div className="bg-white rounded-none shadow-sm border border-slate-300 overflow-x-auto">
                <table className="min-w-full border-collapse">
                    <thead>
                        {/* Title Row */}
                        <tr className="bg-[#FFF2CC]">
                            <th colSpan={10} className="p-4 border border-slate-300 text-center">
                                <h2 className="text-lg font-bold text-slate-900 uppercase">
                                    TÌNH TRẠNG MMTB CÁC DỰ ÁN : CỔ LOA - VŨ YÊN - ĐẠI AN...
                                </h2>
                            </th>
                        </tr>
                        {/* Header Row */}
                        <tr className="bg-[#9BC2E6] text-slate-900 text-xs font-bold text-center">
                            <th className="p-2 border border-slate-400 min-w-[150px]">Dự Án sử dụng TB</th>
                            <th className="p-2 border border-slate-400 min-w-[200px]">Bộ phận sử dụng</th>
                            <th className="p-2 border border-slate-400 w-24">Số lượng máy móc thiết bị tại dự án</th>
                            <th className="p-2 border border-slate-400 w-24">Số lượng TB hỏng tồn đọng</th>
                            <th className="p-2 border border-slate-400 w-24">Số lượng MMTB hỏng phát sinh trong ngày</th>
                            <th className="p-2 border border-slate-400 w-24">Số lượng MMTB đã hoàn thành sửa chữa</th>
                            <th className="p-2 border border-slate-400 w-24">Số lượng TB cần tiếp cục sửa chữa</th>
                            <th className="p-2 border border-slate-400 w-24">Tổng số phiếu đề nghị sửa chữa</th>
                            <th className="p-2 border border-slate-400 w-20">(Tỷ lệ % hỏng)</th>
                            <th className="p-2 border border-slate-400 min-w-[100px]">Ghi chú</th>
                        </tr>
                    </thead>
                    <tbody>
                        {renderTableBody()}
                    </tbody>
                </table>
            </div>

            {/* Table 2: Details List (Lower part of Image 1 is actually details, let's keep it separate or below) */}
            <div className="bg-white p-4 border border-slate-200 mt-8">
                <h3 className="font-bold text-base mb-4 uppercase bg-yellow-300 p-2 border border-slate-300 w-fit">
                    Danh sách chi tiết hỏng & sửa chữa
                </h3>
                <div className="overflow-x-auto">
                    <table className="w-full text-xs text-left border-collapse border border-slate-300">
                        <thead className="bg-[#FFC000] font-bold text-black text-center">
                            <tr>
                                <th className="p-2 border border-slate-400">Dự án sử dụng TB</th>
                                <th className="p-2 border border-slate-400">BP Sử dụng</th>
                                <th className="p-2 border border-slate-400">Mã tài sản</th>
                                <th className="p-2 border border-slate-400">Tên TB</th>
                                <th className="p-2 border border-slate-400">Ngày hỏng</th>
                                <th className="p-2 border border-slate-400">Tình trạng hỏng</th>
                                <th className="p-2 border border-slate-400">Nguyên nhân</th>
                                <th className="p-2 border border-slate-400">Ngày đặt hàng v/tư</th>
                                <th className="p-2 border border-slate-400">Ngày về v/tư</th>
                                <th className="p-2 border border-slate-400">Ngày v/tư nhập về</th>
                            </tr>
                        </thead>
                        <tbody>
                            {brokenMachines.length > 0 ? brokenMachines.map((m, idx) => (
                                <tr key={idx} className="hover:bg-slate-50">
                                    <td className="p-2 border border-slate-300">{m.project}</td>
                                    <td className="p-2 border border-slate-300">{m.department}</td>
                                    <td className="p-2 border border-slate-300 font-bold">{m.code}</td>
                                    <td className="p-2 border border-slate-300">{m.name}</td>
                                    <td className="p-2 border border-slate-300">{m.date}</td>
                                    <td className="p-2 border border-slate-300 text-red-600">{m.issue}</td>
                                    <td className="p-2 border border-slate-300">{m.cause}</td>
                                    <td className="p-2 border border-slate-300">{m.partsOrdered}</td>
                                    <td className="p-2 border border-slate-300">{m.partsArrived}</td>
                                    <td className="p-2 border border-slate-300">-</td>
                                </tr>
                            )) : (
                                <tr><td colSpan={10} className="p-4 text-center text-slate-500">Khống có dữ liệu chi tiết.</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    )
}
