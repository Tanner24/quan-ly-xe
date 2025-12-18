import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { cn } from "@/lib/utils"
import { Truck, Wrench } from "lucide-react"

interface VehicleCardProps {
    machine: {
        id: string
        code: string
        name: string
        current_hours: number
        project_name?: string
        status?: string
        next_maintenance?: number
    }
}

export function VehicleCard({ machine }: VehicleCardProps) {
    // Mock logic for next_maintenance if not provided (every 500 hours)
    const maintenanceInterval = 500
    const nextDue = machine.next_maintenance || Math.ceil((machine.current_hours + 1) / maintenanceInterval) * maintenanceInterval
    const remaining = nextDue - machine.current_hours
    const isOverdue = remaining < 0

    return (
        <Card className={cn(
            "border shadow-sm transition-all hover:shadow-md",
            isOverdue ? "border-red-100 bg-red-50/10" : "border-gray-100 bg-white"
        )}>
            <CardContent className="p-4">
                <div className="flex justify-between items-start mb-4">
                    <div className="h-10 w-10 rounded-lg bg-blue-100 flex items-center justify-center text-blue-600">
                        <Truck className="h-5 w-5" />
                    </div>
                    {isOverdue ? (
                        <Badge variant="destructive" className="bg-red-100 text-red-600 hover:bg-red-100 font-medium border-0">
                            Quá hạn bảo dưỡng
                        </Badge>
                    ) : (
                        <div className="h-2 w-2 rounded-full bg-green-400 mt-2"></div>
                    )}
                </div>

                <div className="mb-4">
                    <h3 className="text-lg font-bold text-gray-900">{machine.code}</h3>
                    <p className="text-sm text-gray-500 truncate" title={machine.name}>
                        {machine.project_name || machine.name}
                    </p>
                </div>

                <div className="flex items-end justify-between text-sm">
                    <div className="space-y-1">
                        <p className="text-xs text-gray-400 font-medium uppercase tracking-wide">GIỜ MÁY</p>
                        <p className="font-semibold text-gray-700">{machine.current_hours}h</p>
                    </div>

                    <div className="text-right space-y-1">
                        <p className="text-xs text-gray-400 font-medium uppercase tracking-wide flex items-center justify-end gap-1">
                            {isOverdue ? "CÒN LẠI" : "CÒN LẠI"}
                        </p>
                        <p className={cn(
                            "font-bold text-lg",
                            isOverdue ? "text-red-500" : "text-green-500"
                        )}>
                            {remaining > 0 ? `${remaining}h` : `${remaining}h`}
                        </p>
                    </div>
                </div>
                <div className="mt-3 pt-3 border-t border-gray-100 flex justify-between items-center text-xs text-gray-400">
                    <span>Chu kỳ: {maintenanceInterval}h</span>
                    <span className="flex items-center gap-1">
                        <Wrench className="h-3 w-3" /> Bảo dưỡng {nextDue}h
                    </span>
                </div>
            </CardContent>
        </Card>
    )
}
