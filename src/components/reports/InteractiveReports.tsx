"use client"

import { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { X } from "lucide-react"

interface Vehicle {
    id: string
    code: string
    model?: string
    project_id?: string
    current_hours?: number
    status?: string
}

interface VehicleListModalProps {
    title: string
    vehicles: Vehicle[]
    onClose: () => void
}

export function VehicleListModal({ title, vehicles, onClose }: VehicleListModalProps) {
    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[85vh] flex flex-col overflow-hidden">
                <div className="flex justify-between items-center p-6 border-b border-gray-100 bg-gray-50">
                    <div>
                        <h3 className="text-lg font-bold text-gray-900">{title}</h3>
                        <div className="flex items-center gap-2 mt-1">
                            <span className="text-sm text-gray-500">Tổng số lượng:</span>
                            <span className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded text-xs font-bold">
                                {vehicles.length} xe
                            </span>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-gray-200 rounded-full transition-colors"
                    >
                        <X className="w-6 h-6 text-gray-500" />
                    </button>
                </div>

                <div className="overflow-y-auto flex-1">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-gray-50 text-gray-500 font-semibold sticky top-0 z-10 shadow-sm">
                            <tr>
                                <th className="px-6 py-4">Mã xe / Biển số</th>
                                <th className="px-6 py-4">Model</th>
                                <th className="px-6 py-4">Dự án</th>
                                <th className="px-6 py-4 text-center">Giờ hoạt động</th>
                                <th className="px-6 py-4">Trạng thái</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {vehicles.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="px-6 py-12 text-center text-gray-400 italic">
                                        Không có xe nào trong danh sách này.
                                    </td>
                                </tr>
                            ) : (
                                vehicles.map(v => (
                                    <tr key={v.id} className="hover:bg-blue-50/50 transition-colors">
                                        <td className="px-6 py-4 font-semibold text-gray-900">{v.code}</td>
                                        <td className="px-6 py-4 text-gray-600">{v.model}</td>
                                        <td className="px-6 py-4 text-gray-600">{v.project_id || '-'}</td>
                                        <td className="px-6 py-4 text-center font-mono text-gray-700">
                                            {v.current_hours ? Number(v.current_hours).toLocaleString() : '0'} h
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${v.status === 'active' ? 'bg-green-100 text-green-800 border-green-200' :
                                                v.status === 'maintenance' ? 'bg-orange-100 text-orange-800 border-orange-200' :
                                                    'bg-gray-100 text-gray-600 border-gray-200'
                                                }`}>
                                                {v.status === 'active' ? 'Hoạt động' :
                                                    v.status === 'maintenance' ? 'Bảo dưỡng' : 'Khác'}
                                            </span>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                <div className="p-4 border-t border-gray-100 bg-gray-50 flex justify-end">
                    <button
                        onClick={onClose}
                        className="px-5 py-2 bg-white border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-colors"
                    >
                        Đóng danh sách
                    </button>
                </div>
            </div>
        </div>
    )
}

interface InteractiveStat {
    label: string
    value: number
    color: string
    vehicles: Vehicle[]
}

export function InteractiveStatusCards({ stats }: { stats: InteractiveStat[] }) {
    const [modalData, setModalData] = useState<{ title: string; vehicles: Vehicle[] } | null>(null)

    const openModal = (title: string, vehicles: Vehicle[]) => {
        if (vehicles && vehicles.length > 0) {
            setModalData({ title, vehicles })
        }
    }

    return (
        <>
            <div className="grid grid-cols-4 gap-3">
                {stats.map((stat, idx) => (
                    <div
                        key={idx}
                        onClick={() => openModal(stat.label, stat.vehicles)}
                        className={`${stat.color} rounded-xl p-4 text-center border cursor-pointer hover:shadow-md transition-all group active:scale-95`}
                    >
                        <div className="text-3xl font-bold">{stat.value}</div>
                        <div className="text-[10px] font-semibold uppercase mt-1 opacity-80 group-hover:opacity-100">
                            {stat.label}
                        </div>
                    </div>
                ))}
            </div>

            {modalData && (
                <VehicleListModal
                    title={modalData.title}
                    vehicles={modalData.vehicles}
                    onClose={() => setModalData(null)}
                />
            )}
        </>
    )
}

export function InteractiveDailyCards({
    reportedVehicles,
    unreportedVehicles
}: {
    reportedVehicles: Vehicle[]
    unreportedVehicles: Vehicle[]
}) {
    const [modalData, setModalData] = useState<{ title: string; vehicles: Vehicle[] } | null>(null)

    return (
        <>
            <div className="grid md:grid-cols-2 gap-6">
                {/* Green - Completed */}
                <div
                    onClick={() => setModalData({ title: "Danh sách Xe Đã báo cáo", vehicles: reportedVehicles })}
                    className="bg-green-50 rounded-2xl p-6 border-2 border-green-200 shadow-sm hover:shadow-md transition-all cursor-pointer group active:scale-[0.99]"
                >
                    <div className="flex items-start justify-between mb-4">
                        <div className="flex-1">
                            <div className="text-sm font-semibold text-green-700 mb-3">ĐÃ GỬI BÁO CÁO</div>
                            <div className="text-6xl font-black text-green-600">{reportedVehicles.length}</div>
                        </div>
                        <div className="h-14 w-14 rounded-2xl bg-green-600 flex items-center justify-center shadow-lg">
                            <svg className="h-7 w-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                            </svg>
                        </div>
                    </div>
                    <button className="text-sm text-green-700 font-semibold hover:text-green-800 group-hover:underline pointer-events-none">
                        Xem danh sách xe đã xong »
                    </button>
                </div>

                {/* Red - Pending */}
                <div
                    onClick={() => setModalData({ title: "Danh sách Xe CHƯA báo cáo (Cần đôn đốc)", vehicles: unreportedVehicles })}
                    className="bg-red-50 rounded-2xl p-6 border-2 border-red-200 shadow-sm hover:shadow-md transition-all cursor-pointer group active:scale-[0.99]"
                >
                    <div className="flex items-start justify-between mb-4">
                        <div className="flex-1">
                            <div className="text-sm font-semibold text-red-700 mb-3">CHƯA GỬI BÁO CÁO</div>
                            <div className="text-6xl font-black text-red-600">{unreportedVehicles.length}</div>
                        </div>
                        <div className="h-14 w-14 rounded-2xl bg-red-600 flex items-center justify-center shadow-lg">
                            <svg className="h-7 w-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </div>
                    </div>
                    <button className="text-sm text-red-700 font-semibold hover:text-red-800 group-hover:underline pointer-events-none">
                        Xem danh sách cần đôn đốc »
                    </button>
                </div>
            </div>

            {modalData && (
                <VehicleListModal
                    title={modalData.title}
                    vehicles={modalData.vehicles}
                    onClose={() => setModalData(null)}
                />
            )}
        </>
    )
}

export function InteractiveProgressBars({ stats }: { stats: InteractiveStat[] }) {
    const [modalData, setModalData] = useState<{ title: string; vehicles: Vehicle[] } | null>(null)
    const total = stats.reduce((sum, s) => sum + s.value, 0)

    return (
        <>
            <div className="space-y-3 mb-6">
                {stats.map((item, idx) => {
                    const percent = total > 0 ? Math.round((item.value / total) * 100) : 0
                    return (
                        <div key={idx} className="space-y-1.5 cursor-pointer group" onClick={() => setModalData({ title: item.label, vehicles: item.vehicles })}>
                            <div className="flex items-center justify-between text-sm">
                                <span className="font-medium text-gray-700 group-hover:text-blue-600 transition-colors">
                                    {item.label}
                                </span>
                                <span className="font-bold text-gray-800">{item.value} ({percent}%)</span>
                            </div>
                            <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                                <div
                                    className={`h-full ${item.color} rounded-full transition-all group-hover:opacity-90`}
                                    style={{ width: `${percent}%` }}
                                ></div>
                            </div>
                        </div>
                    )
                })}
            </div>

            {modalData && (
                <VehicleListModal
                    title={modalData.title}
                    vehicles={modalData.vehicles}
                    onClose={() => setModalData(null)}
                />
            )}
        </>
    )
}
