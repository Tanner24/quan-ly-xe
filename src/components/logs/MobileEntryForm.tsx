"use client"

import * as React from "react"
import { supabase } from "@/lib/supabaseClient"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Clock, Save, Truck, Calendar as CalendarIcon, Activity } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { useToast } from "@/hooks/use-toast" // Assuming shadcn toast exists or we'll use alert for now if not

export function MobileEntryForm() {
    const [loading, setLoading] = React.useState(false)
    const [machineCode, setMachineCode] = React.useState("")
    const [date, setDate] = React.useState(new Date().toISOString().split('T')[0]) // Default today YYYY-MM-DD
    const [hours, setHours] = React.useState("")
    const [km, setKm] = React.useState("")
    const [note, setNote] = React.useState("")

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)

        try {
            // 1. Find machine by code (Case insensitive)
            const { data: machines, error: searchError } = await supabase
                .from("machines")
                .select("id, current_hours")
                .ilike("code", machineCode.trim())
                .single()

            if (searchError || !machines) {
                alert("Lỗi: Không tìm thấy mã xe '" + machineCode + "'")
                setLoading(false)
                return
            }

            const machineId = machines.id

            // 2. Insert log
            const { error: insertError } = await supabase.from("daily_logs").insert({
                machine_id: machineId,
                created_at: new Date(date).toISOString(), // Map selected date to created_at
                hours_added: parseFloat(hours),
                fuel_consumed: 0,
                note: note
            })

            if (insertError) throw insertError

            // 3. Update machine current hours (Simple increment)
            // If they entered "Hours Worked", we add.
            const newTotal = (machines.current_hours || 0) + parseFloat(hours)

            const { error: updateError } = await supabase
                .from("machines")
                .update({ current_hours: newTotal })
                .eq("id", machineId)

            if (updateError) throw updateError

            alert("Cập nhật thành công!")
            setMachineCode("")
            setHours("")
            setKm("")
            setNote("")

        } catch (error: any) {
            alert("Đã có lỗi xảy ra: " + error.message)
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
            <Card className="w-full max-w-md border-0 shadow-lg overflow-hidden">
                <div className="bg-blue-600 p-8 text-center text-white">
                    <div className="mx-auto bg-white/20 w-16 h-16 rounded-full flex items-center justify-center mb-4 backdrop-blur-sm">
                        <Clock className="h-8 w-8 text-white" />
                    </div>
                    <h1 className="text-2xl font-bold">Cập nhật Giờ Lái xe</h1>
                    <p className="text-blue-100 text-sm mt-1">Vui lòng nhập chính xác thông tin hoạt động</p>
                </div>

                <CardContent className="p-6">
                    <form onSubmit={handleSubmit} className="space-y-5">
                        <div className="space-y-2">
                            <Label className="text-gray-700 font-medium">Mã Tài Sản <span className="text-red-500">*</span></Label>
                            <div className="relative">
                                <Truck className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                                <Input
                                    placeholder="VD: XE01"
                                    className="pl-9 h-11 bg-gray-50/50"
                                    value={machineCode}
                                    onChange={(e) => setMachineCode(e.target.value.toUpperCase())}
                                    required
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label className="text-gray-700 font-medium">Ngày làm việc</Label>
                            <div className="relative">
                                <CalendarIcon className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                                <Input
                                    type="date"
                                    className="pl-9 h-11 bg-gray-50/50"
                                    value={date}
                                    onChange={(e) => setDate(e.target.value)}
                                    required
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label className="text-gray-700 font-medium">Giờ hoạt động <span className="text-red-500">*</span></Label>
                                <div className="relative">
                                    <Clock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                                    <Input
                                        type="number"
                                        step="0.1"
                                        placeholder="0"
                                        className="pl-9 h-11 bg-gray-50/50"
                                        value={hours}
                                        onChange={(e) => setHours(e.target.value)}
                                        required
                                    />
                                </div>
                                <p className="text-xs text-gray-400">Nhập số giờ</p>
                            </div>
                            <div className="space-y-2">
                                <Label className="text-gray-700 font-medium">ODO KM <span className="text-red-500">*</span></Label>
                                <div className="relative">
                                    <Activity className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                                    <Input
                                        type="number"
                                        placeholder="0"
                                        className="pl-9 h-11 bg-gray-50/50"
                                        value={km}
                                        onChange={(e) => setKm(e.target.value)}
                                        required
                                    />
                                </div>
                                <p className="text-xs text-gray-400">Nhập số nguyên</p>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label className="text-gray-700 font-medium">Ghi chú (Tùy chọn)</Label>
                            <Textarea
                                placeholder="Ghi chú về lộ trình, xe cộ..."
                                className="bg-gray-50/50 min-h-[100px]"
                                value={note}
                                onChange={(e) => setNote(e.target.value)}
                            />
                        </div>

                        <Button type="submit" className="w-full h-12 bg-blue-600 hover:bg-blue-700 text-lg font-medium shadow-lg hover:shadow-xl transition-all" disabled={loading}>
                            {loading ? (
                                "Đang gửi..."
                            ) : (
                                <>
                                    <Save className="mr-2 h-5 w-5" /> Gửi Báo Cáo
                                </>
                            )}
                        </Button>
                    </form>
                </CardContent>
            </Card>
        </div>
    )
}
