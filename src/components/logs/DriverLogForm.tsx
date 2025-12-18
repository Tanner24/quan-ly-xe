"use client"

import React, { useState, useEffect } from 'react'
import { supabase } from "@/lib/supabaseClient"
import { Save, CheckCircle, Clock, Truck, Calendar, Activity, AlertTriangle, Info } from 'lucide-react'
import { Button } from "@/components/ui/button"
import { useRouter } from 'next/navigation'

interface VehicleData {
    id: string
    code: string
    model?: string
    project_name?: string
    current_hours: number
    current_km?: number
    status: string // active, maintenance
    maintenance_interval?: number // New column from DB
    next_maintenance_hours?: number // New column from DB
}

interface MaintenanceStatus {
    remaining: number
    status: 'safe' | 'warning' | 'overdue'
    nextMaintenance: number
}

export function DriverLogForm() {
    const router = useRouter()
    const [formData, setFormData] = useState({
        assetCode: '',
        date: new Date().toISOString().split('T')[0],
        odoHours: '',
        odoKm: '',
        note: '',
        maintenanceDone: false,
        maintenanceDescription: ''
    })

    const [vehicleData, setVehicleData] = useState<VehicleData | null>(null)
    const [isSearching, setIsSearching] = useState(false)
    const [searchError, setSearchError] = useState('')
    const [submitted, setSubmitted] = useState(false)
    const [maintenanceStatus, setMaintenanceStatus] = useState<MaintenanceStatus | null>(null)
    const [maintenanceInterval, setMaintenanceInterval] = useState(500) // Default

    // Debounce search
    useEffect(() => {
        const timer = setTimeout(() => {
            if (formData.assetCode.length >= 2) {
                findVehicle(formData.assetCode)
            } else {
                setVehicleData(null)
                setSearchError('')
                setMaintenanceStatus(null)
            }
        }, 500)
        return () => clearTimeout(timer)
    }, [formData.assetCode])

    // Calculate Maintenance Status
    useEffect(() => {
        if (vehicleData && formData.odoHours) {
            const currentInputHours = parseInt(formData.odoHours) || 0

            // Prefer DB configured interval, else default
            const interval = vehicleData.maintenance_interval || maintenanceInterval

            let nextMaintenanceTarget = vehicleData.next_maintenance_hours

            // If checking manually or no next target set, calculate standard:
            if (!nextMaintenanceTarget) {
                nextMaintenanceTarget = Math.ceil((currentInputHours + 1) / interval) * interval
            }

            const remaining = (nextMaintenanceTarget || ((Math.ceil((currentInputHours + 1) / interval) * interval))) - currentInputHours

            let status: 'safe' | 'warning' | 'overdue' = 'safe'
            if (remaining <= 0) status = 'overdue'
            else if (remaining <= 50) status = 'warning'

            setMaintenanceStatus({
                remaining,
                status,
                nextMaintenance: nextMaintenanceTarget || 0
            })
        } else {
            setMaintenanceStatus(null)
        }
    }, [vehicleData, formData.odoHours, maintenanceInterval])

    const findVehicle = async (code: string) => {
        setIsSearching(true)
        setSearchError('')
        try {
            const { data, error } = await supabase
                .from('machines')
                .select('*')
                .ilike('code', code)
                .maybeSingle()

            if (error) throw error
            if (data) {
                // Use DB interval if available
                const interval = data.maintenance_interval || 500
                setMaintenanceInterval(interval)

                setVehicleData({
                    id: data.id,
                    code: data.code,
                    model: data.model,
                    project_name: data.project_name,
                    current_hours: data.current_hours || 0,
                    current_km: data.current_km || 0,
                    status: data.status || 'active',
                    maintenance_interval: data.maintenance_interval,
                    next_maintenance_hours: data.next_maintenance_hours
                })

            } else {
                setVehicleData(null)
                setSearchError('Không tìm thấy mã tài sản này.')
            }
        } catch (err) {
            console.error(err)
            setSearchError('Lỗi khi tìm kiếm.')
        } finally {
            setIsSearching(false)
        }
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!formData.assetCode || !formData.odoHours || !vehicleData) return

        const inputHours = parseInt(formData.odoHours) || 0
        const inputKm = parseInt(formData.odoKm) || 0

        const hoursAdded = inputHours - vehicleData.current_hours
        if (hoursAdded < 0) {
            if (!confirm("Giờ máy mới nhỏ hơn giờ hiện tại (" + vehicleData.current_hours + "h). Bạn có chắc lái xe đã reset đồng hồ hoặc nhập đúng không?")) {
                return
            }
        }

        try {
            // 1. Insert daily_log
            // Fix: Mapped 'hours_worked' instead of 'hours_added' based on DB schema
            const { error: logError } = await supabase
                .from('daily_logs')
                .insert({
                    machine_code: vehicleData.code,
                    log_date: formData.date,
                    hours_worked: hoursAdded > 0 ? hoursAdded : 0,
                    odo_km: inputKm,
                    note: formData.note
                        + (formData.maintenanceDone ? ` [Đã bảo dưỡng: ${formData.maintenanceDescription}]` : '')
                        + ` [ODO: ${inputHours}h, ${inputKm}km]`
                })

            if (logError) throw logError

            // Prepare update data for machines
            const updateMachineData: any = {
                current_hours: inputHours,
                current_km: inputKm
            }

            // 2. If Maintenance Done -> Update Next Due Date
            if (formData.maintenanceDone) {
                const interval = maintenanceInterval
                updateMachineData.last_maintenance_date = formData.date
                updateMachineData.last_maintenance_hours = inputHours
                // Set next maintenance to Current + Interval
                updateMachineData.next_maintenance_hours = inputHours + interval
                updateMachineData.status = 'active'
            }

            const { error: updateError } = await supabase
                .from('machines')
                .update(updateMachineData)
                .eq('id', vehicleData.id)

            if (updateError) throw updateError

            // 3. Maintenance history if done
            if (formData.maintenanceDone) {
                await supabase.from('maintenance_history').insert({
                    machine_code: vehicleData.code,
                    vehicle_id: vehicleData.id,
                    vehicle_code: vehicleData.code, // Redundant but good for tracking if column exists
                    date: formData.date,
                    hours_at_maintenance: inputHours,
                    km_at_maintenance: inputKm,
                    maintenance_level: 'Bảo dưỡng định kỳ',
                    task_name: formData.maintenanceDescription || 'Bảo dưỡng định kỳ',
                    performer: 'Lái xe (Mobile App)',
                    notes: 'Cập nhật từ Driver App'
                })
            }

            setSubmitted(true)
            setFormData(prev => ({
                ...prev,
                assetCode: '',
                odoHours: '',
                odoKm: '',
                note: '',
                maintenanceDone: false,
                maintenanceDescription: ''
            }))
            setVehicleData(null)

            setTimeout(() => setSubmitted(false), 5000)

        } catch (err: any) {
            console.error("Submit Error Detailed:", err)
            // Show detailed error in alert
            alert("Lỗi: " + (err.message || JSON.stringify(err)))
        }
    }

    // Colors
    const getStatusColor = (status: MaintenanceStatus['status']) => {
        if (status === 'overdue') return 'text-red-600 bg-red-50 border-red-200'
        if (status === 'warning') return 'text-amber-600 bg-amber-50 border-amber-200'
        return 'text-emerald-600 bg-emerald-50 border-emerald-200'
    }

    return (
        <div className="max-w-md w-full bg-white rounded-2xl shadow-xl overflow-hidden border border-slate-100 mx-auto my-6">
            <div className="bg-gradient-to-r from-blue-600 to-indigo-700 p-6 text-white text-center relative overflow-hidden">
                <div className="relative z-10">
                    <Clock className="w-10 h-10 mx-auto mb-2 opacity-90" />
                    <h1 className="text-xl font-bold">Cập nhật Giờ Lái xe</h1>
                    <p className="text-blue-100 text-xs">Vui lòng nhập chính xác thông tin ODO</p>
                </div>
                {/* Decoration circles */}
                <div className="absolute top-0 right-0 -mr-8 -mt-8 w-32 h-32 bg-white/10 rounded-full blur-2xl"></div>
                <div className="absolute bottom-0 left-0 -ml-8 -mb-8 w-24 h-24 bg-white/10 rounded-full blur-xl"></div>
            </div>

            <div className="p-6">
                {submitted ? (
                    <div className="text-center py-8 animate-in fade-in zoom-in duration-300">
                        <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm">
                            <CheckCircle className="w-8 h-8" />
                        </div>
                        <h3 className="text-xl font-bold text-slate-900 mb-2">Thành công!</h3>
                        <p className="text-slate-500 text-sm">Dữ liệu đã được lưu vào hệ thống.</p>
                        <Button
                            onClick={() => setSubmitted(false)}
                            className="mt-6 w-full"
                            variant="outline"
                        >
                            Nhập tiếp
                        </Button>
                    </div>
                ) : (
                    <form onSubmit={handleSubmit} className="space-y-5">
                        {/* Asset Code Input */}
                        <div>
                            <label className="block text-sm font-semibold text-slate-700 mb-1.5">Mã Tài Sản <span className="text-red-500">*</span></label>
                            <div className="relative group">
                                <Truck className={`absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 transition-colors ${vehicleData ? 'text-green-600' : 'text-slate-400 group-focus-within:text-blue-500'}`} />
                                <input
                                    type="text"
                                    required
                                    value={formData.assetCode}
                                    onChange={e => {
                                        const val = e.target.value.toUpperCase().replace(/[^A-Z0-9-]/g, "")
                                        setFormData(prev => ({ ...prev, assetCode: val }))
                                    }}
                                    className={`w-full pl-10 pr-4 py-3 rounded-xl border-2 outline-none transition-all font-mono font-bold tracking-wider text-lg
                                        ${searchError ? 'border-red-100 focus:border-red-500 focus:ring-4 focus:ring-red-500/10' :
                                            vehicleData ? 'border-green-100 focus:border-green-500 focus:ring-4 focus:ring-green-500/10 bg-green-50/30' :
                                                'border-slate-100 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10'}`}
                                    placeholder="VD: 4C0001"
                                />
                                {isSearching && (
                                    <div className="absolute right-3 top-1/2 -translate-y-1/2 animate-spin rounded-full h-4 w-4 border-2 border-blue-600 border-t-transparent"></div>
                                )}
                            </div>

                            {searchError && <p className="mt-2 text-xs text-red-500 font-medium flex items-center"><AlertTriangle className="w-3 h-3 mr-1" /> {searchError}</p>}

                            {vehicleData && (
                                <div className="mt-3 p-3 bg-slate-50 rounded-xl border border-slate-100 text-xs shadow-sm animate-in slide-in-from-top-1">
                                    <div className="flex justify-between mb-1.5 border-b border-slate-100 pb-1.5">
                                        <span className="text-slate-500">Dự án:</span>
                                        <span className="font-bold text-slate-700">{vehicleData.project_name || 'Chưa gán'}</span>
                                    </div>
                                    <div className="flex justify-between items-center text-sm">
                                        <span className="text-slate-500">Hiện tại:</span>
                                        <div className="flex items-baseline gap-3">
                                            <span><span className="font-mono font-bold text-slate-900">{vehicleData.current_hours}</span> <span className="text-xs text-slate-400">h</span></span>
                                            {vehicleData.current_km !== undefined && (
                                                <span><span className="font-mono font-bold text-slate-900">{vehicleData.current_km}</span> <span className="text-xs text-slate-400">km</span></span>
                                            )}
                                        </div>
                                    </div>
                                    {/* Show maintenance info if available */}
                                    {(vehicleData.next_maintenance_hours || vehicleData.maintenance_interval) && (
                                        <div className="border-t border-slate-100 pt-1.5 mt-1.5 flex justify-between items-center text-slate-500">
                                            <span>Chu kỳ BD:</span>
                                            <span className="font-mono">{vehicleData.maintenance_interval}h</span>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>

                        {/* Date Input */}
                        <div>
                            <label className="block text-sm font-semibold text-slate-700 mb-1.5">Ngày làm việc</label>
                            <div className="relative">
                                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5 pointer-events-none" />
                                <input
                                    type="date"
                                    required
                                    value={formData.date}
                                    onChange={e => setFormData({ ...formData, date: e.target.value })}
                                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none transition-all font-medium text-slate-700"
                                />
                            </div>
                        </div>

                        {/* ODO & KM */}
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-1.5">ODO Giờ <span className="text-red-500">*</span></label>
                                <div className="relative group">
                                    <Clock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5 group-focus-within:text-blue-500 transition-colors" />
                                    <input
                                        type="number"
                                        required
                                        step="0.1"
                                        min="0"
                                        value={formData.odoHours}
                                        onChange={e => setFormData({ ...formData, odoHours: e.target.value })}
                                        className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none transition-all text-lg font-mono font-bold text-slate-900 placeholder:font-sans placeholder:font-normal"
                                        placeholder="0"
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-1.5">ODO KM <span className="text-red-500">*</span></label>
                                <div className="relative group">
                                    <Activity className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5 group-focus-within:text-blue-500 transition-colors" />
                                    <input
                                        type="number"
                                        required
                                        step="1"
                                        min="0"
                                        value={formData.odoKm}
                                        onChange={e => setFormData({ ...formData, odoKm: e.target.value })}
                                        className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none transition-all text-lg font-mono font-bold text-slate-900 placeholder:font-sans placeholder:font-normal"
                                        placeholder="0"
                                    />
                                </div>
                            </div>
                        </div>
                        <p className="text-xs text-slate-400 -mt-3 italic">Nhập số nguyên hiển thị trên đồng hồ</p>

                        {/* Maintenance Alert */}
                        {maintenanceStatus && (
                            <div className={`p-4 rounded-xl border ${getStatusColor(maintenanceStatus.status)} animate-in zoom-in-95 duration-200`}>
                                <div className="flex items-start gap-3">
                                    {maintenanceStatus.status === 'overdue' ? <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" /> :
                                        maintenanceStatus.status === 'warning' ? <Info className="w-5 h-5 shrink-0 mt-0.5" /> :
                                            <CheckCircle className="w-5 h-5 shrink-0 mt-0.5" />}

                                    <div>
                                        <p className="font-bold text-sm uppercase mb-1">
                                            {maintenanceStatus.status === 'overdue' ? 'Đã quá hạn bảo dưỡng!' :
                                                maintenanceStatus.status === 'warning' ? 'Sắp đến hạn bảo dưỡng' :
                                                    'Trạng thái tốt'}
                                        </p>
                                        <div className="text-xs opacity-90 space-y-1">
                                            <p>Chu kỳ BD: <span className="font-mono">{maintenanceInterval}h</span></p>
                                            <p>Còn lại: <span className="font-mono font-bold text-base">{maintenanceStatus.remaining}h</span></p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Maintenance Checkbox */}
                        {maintenanceStatus && (maintenanceStatus.status === 'overdue' || maintenanceStatus.status === 'warning') && (
                            <div className="bg-blue-50 p-4 rounded-xl border border-blue-100 space-y-3 animate-in fade-in">
                                <label className="flex items-start gap-3 cursor-pointer select-none">
                                    <div className="flex items-center h-6">
                                        <input
                                            type="checkbox"
                                            checked={formData.maintenanceDone}
                                            onChange={e => setFormData({
                                                ...formData,
                                                maintenanceDone: e.target.checked,
                                                maintenanceDescription: e.target.checked ? 'Bảo dưỡng định kỳ' : ''
                                            })}
                                            className="w-5 h-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                                        />
                                    </div>
                                    <div className="text-sm">
                                        <span className="font-bold text-blue-900 block">Đã thực hiện bảo dưỡng?</span>
                                        <span className="text-blue-700 text-xs leading-relaxed">Tích vào đây nếu bạn vừa bảo dưỡng xong để reset chu kỳ.</span>
                                    </div>
                                </label>

                                {formData.maintenanceDone && (
                                    <textarea
                                        value={formData.maintenanceDescription}
                                        onChange={e => setFormData({ ...formData, maintenanceDescription: e.target.value })}
                                        className="w-full px-3 py-2 rounded-lg border border-blue-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                                        placeholder="Công việc đã làm (Thay nhớt, lọc...)"
                                        rows={2}
                                    />
                                )}
                            </div>
                        )}

                        {/* Note */}
                        <div>
                            <label className="block text-sm font-semibold text-slate-700 mb-1.5">Ghi chú (Tùy chọn)</label>
                            <textarea
                                value={formData.note}
                                onChange={e => setFormData({ ...formData, note: e.target.value })}
                                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none transition-all h-20 resize-none text-sm"
                                placeholder="Ghi chú về lộ trình, xe cộ..."
                            />
                        </div>

                        <Button
                            type="submit"
                            className={`w-full h-12 text-base font-semibold shadow-lg shadow-blue-500/20 rounded-xl ${(!vehicleData || isSearching) ? 'opacity-50 cursor-not-allowed' : ''}`}
                            disabled={!vehicleData || isSearching}
                        >
                            <Save className="w-5 h-5 mr-2" />
                            Gửi Báo Cáo
                        </Button>
                    </form>
                )}
            </div>
        </div>
    )
}
