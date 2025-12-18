import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Trash2, Truck } from "lucide-react"
import { Button } from "@/components/ui/button"
import { supabase } from "@/lib/supabaseClient"

export async function LogTable() {
    // Fetch logs joined with machines
    // Note: Supabase Query for joining referenced tables
    const { data: logs, error } = await supabase
        .from("daily_logs")
        .select(`
            *,
            machines (
                code,
                name
            )
        `)
        .order('created_at', { ascending: false })


    if (error) {
        return <div className="text-red-500">Error loading logs: {error.message}</div>
    }

    return (
        <div className="rounded-md border bg-white shadow-sm">
            <Table>
                <TableHeader>
                    <TableRow className="bg-gray-50">
                        <TableHead className="w-[150px]">NGÀY</TableHead>
                        <TableHead>MÃ TÀI SẢN</TableHead>
                        <TableHead>ODO GIỜ (ADDED)</TableHead>
                        <TableHead>GHI CHÚ</TableHead>
                        <TableHead className="text-right">HÀNH ĐỘNG</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {logs?.map((log: any) => (
                        <TableRow key={log.id}>
                            <TableCell className="font-medium">
                                {log.created_at ? new Date(log.created_at).toLocaleDateString('vi-VN') : '-'}
                            </TableCell>
                            <TableCell>
                                <div className="flex items-center gap-2">
                                    <div className="h-8 w-8 rounded bg-blue-50 flex items-center justify-center text-blue-600">
                                        <Truck className="h-4 w-4" />
                                    </div>
                                    <span className="font-bold text-gray-700">{log.machines?.code || "Unknown"}</span>
                                </div>
                            </TableCell>
                            <TableCell>
                                <span className="font-semibold">{log.hours_added}h</span>
                            </TableCell>
                            <TableCell className="text-gray-500 max-w-[200px] truncate">
                                {log.note || "-"}
                            </TableCell>
                            <TableCell className="text-right">
                                <Button variant="ghost" size="icon" className="h-8 w-8 text-gray-400 hover:text-red-600">
                                    <Trash2 className="h-4 w-4" />
                                </Button>
                            </TableCell>
                        </TableRow>
                    ))}
                    {!logs || logs.length === 0 && (
                        <TableRow>
                            <TableCell colSpan={5} className="h-24 text-center">
                                Chưa có dữ liệu nhật trình.
                            </TableCell>
                        </TableRow>
                    )}
                </TableBody>
            </Table>
        </div>
    )
}
