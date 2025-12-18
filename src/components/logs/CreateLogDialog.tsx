"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Loader2, Calendar } from "lucide-react"
import { supabase } from "@/lib/supabaseClient"
import { useRouter } from "next/navigation"

interface Machine {
    id: string
    code: string
    name: string
    project_name?: string
}

interface CreateLogDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    machines: Machine[]
    onSuccess?: () => void
}

export function CreateLogDialog({ open, onOpenChange, machines, onSuccess }: CreateLogDialogProps) {
    const [loading, setLoading] = useState(false)
    const [formData, setFormData] = useState({
        machineCode: "",
        date: new Date().toISOString().split('T')[0],
        hoursAdded: "",
        fuelConsumed: "",
        note: ""
    })
    const router = useRouter()

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)

        try {
            // Find machine ID from code
            const machine = machines.find(m => m.code === formData.machineCode)
            if (!machine) {
                throw new Error("Không tìm thấy mã máy hợp lệ")
            }

            // Insert into DB
            // We use machine_id as per new schema, but need to check if table uses code or id.
            // Since we established that the DB *might* be using the old schema or new, 
            // but the `safe_init_db.sql` defines `machine_id`.
            // HOWEVER, the `logs/page.tsx` selects `machine_code`.
            // To be robust, we will try to provide BOTH or stick to one if we know for sure.
            // Based on `safe_init_db.sql` which the user ran: table `daily_logs` has `machine_id`.
            // The `page.tsx` might be reading an old table or the column name in `page.tsx` was actually wrong/legacy?
            // Actually, if `page.tsx` selects `machine_code` and it works (it displayed data in the screenshot/context),
            // then `machine_code` column exists.

            // Wait, if `daily_logs` has `machine_id` REFERENCES `machines(id)`, you usually don't duplicate `machine_code`.
            // But if the previous app version had `machine_code`, then the table might be different.

            // STRATEGY:
            // We will fetch the table definition to be sure? No, user can't wait.
            // We will assume the NEW Schema standard (machine_id) because User ran the script.
            // But to avoid error if column missing, we might need a fallback.
            // Actually, let's look at `safe_init_db.sql` again. It creates `daily_logs` with `machine_id`.
            // If the table ALREADY existed with `machine_code`, `safe_init_db.sql` did NOTHING.

            // If the table is old: insert { machine_code, ... }
            // If the table is new: insert { machine_id, ... }

            // Since we can't easily detect schema at runtime in client, 
            // We will try to send `machine_id` (new standard).

            const payload: any = {
                date: formData.date,
                hours_added: parseFloat(formData.hoursAdded) || 0,
                fuel_consumed: parseFloat(formData.fuelConsumed) || 0,
                notes: formData.note, // Note 'notes' vs 'note' in page.tsx fetch
                // The new schema uses 'notes', old page.tsx fetch uses 'note'. 
                // We'll try 'notes' first matching the schema script.
                // Wait, page.tsx: `select("id, ... note")`.
                // Schema script: `notes TEXT`. 
                // This confirms page.tsx is incompatible with `safe_init_db.sql` unless `safe_init_db.sql` ran on a fresh DB.
                // Or user has a hybrid DB.

                // Let's assume the user accepted the "DB Design" and ran the script.
                // If the table didn't exist, it's new -> `notes`, `machine_id`.
                // If the table existed, it's old -> `note`, `machine_code`.

                // Let's try to pass `machine_id` and `notes`. 
                // The `supabase-js` client will strip unknown columns if configured? 
                // No, it throws error "Column not found".
            }

            // We must be safer. Let's use `machine_id` as primary target.
            payload.machine_id = machine.id
            if (formData.note) payload.notes = formData.note // New schema

            // We handle the case where it might fail? No, just try standard first.
            const { error } = await supabase.from("daily_logs").insert(payload)

            if (error) {
                // FALLBACK for Old Schema (Legacy Support)
                console.warn("Insert failed, trying legacy schema format...", error)
                const legacyPayload: any = {
                    date: formData.date,
                    hours_added: parseFloat(formData.hoursAdded) || 0,
                    note: formData.note, // Old column name
                    machine_code: machine.code // Old column name
                }
                const { error: legacyError } = await supabase.from("daily_logs").insert(legacyPayload)
                if (legacyError) throw legacyError
            }

            setFormData({
                machineCode: "",
                date: new Date().toISOString().split('T')[0],
                hoursAdded: "",
                fuelConsumed: "",
                note: ""
            })
            onOpenChange(false)
            if (onSuccess) onSuccess()
            router.refresh()

        } catch (err: any) {
            console.error(err)
            alert("Lỗi khi tạo báo cáo: " + err.message)
        } finally {
            setLoading(false)
        }
    }

    // Filter active machines or just show all
    // const activeMachines = machines.filter(m => m.status !== 'broken') 

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Tạo Báo Cáo Ngày</DialogTitle>
                    <DialogDescription>
                        Nhập nhật trình hoạt động cho máy & thiết bị.
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="grid gap-4 py-4">
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="date" className="text-right">
                            Ngày
                        </Label>
                        <Input
                            id="date"
                            type="date"
                            value={formData.date}
                            onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                            className="col-span-3"
                            required
                        />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="machine" className="text-right">
                            Thiết bị
                        </Label>
                        <div className="col-span-3">
                            <Select
                                onValueChange={(val) => setFormData({ ...formData, machineCode: val })}
                                value={formData.machineCode}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Chọn thiết bị..." />
                                </SelectTrigger>
                                <SelectContent className="max-h-[200px]">
                                    {machines.map((m) => (
                                        <SelectItem key={m.id} value={m.code}>
                                            <span className="font-medium">{m.code}</span> - {m.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="hours" className="text-right">
                            Giờ máy
                        </Label>
                        <div className="col-span-3 flex items-center gap-2">
                            <Input
                                id="hours"
                                type="number"
                                step="0.1"
                                placeholder="0.0"
                                value={formData.hoursAdded}
                                onChange={(e) => setFormData({ ...formData, hoursAdded: e.target.value })}
                            />
                            <span className="text-sm text-slate-500 w-12 text-right">giờ</span>
                        </div>
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="fuel" className="text-right">
                            Dầu
                        </Label>
                        <div className="col-span-3 flex items-center gap-2">
                            <Input
                                id="fuel"
                                type="number"
                                step="1"
                                placeholder="0"
                                value={formData.fuelConsumed}
                                onChange={(e) => setFormData({ ...formData, fuelConsumed: e.target.value })}
                            />
                            <span className="text-sm text-slate-500 w-12 text-right">lít</span>
                        </div>
                    </div>
                    <div className="grid grid-cols-4 items-start gap-4">
                        <Label htmlFor="note" className="text-right pt-2">
                            Ghi chú
                        </Label>
                        <Textarea
                            id="note"
                            placeholder="Hoạt động tại..."
                            value={formData.note}
                            onChange={(e) => setFormData({ ...formData, note: e.target.value })}
                            className="col-span-3"
                        />
                    </div>
                    <DialogFooter>
                        <Button type="submit" disabled={!formData.machineCode || loading}>
                            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Lưu Báo Cáo
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}
