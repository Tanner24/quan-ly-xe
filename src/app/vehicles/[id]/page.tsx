import { supabase } from "@/lib/supabaseClient"
import { notFound } from "next/navigation"
import { VehicleDetailManager } from "@/components/vehicles/VehicleDetailManager"

export const revalidate = 0;

interface VehicleDetailPageProps {
    params: {
        id: string
    }
}

export default async function VehicleDetailPage({ params }: VehicleDetailPageProps) {
    // Next.js 15: params is now a Promise, must await
    const { id } = await params

    // 1. Fetch Machine Details - Try by ID (UUID) first, then by code
    let machine = null
    let machineError = null

    // Try fetching by ID (UUID)
    const { data: machineById, error: errorById } = await supabase
        .from("machines")
        .select("*")
        .eq("id", id)
        .single()

    if (machineById) {
        machine = machineById
    } else {
        // If not found by ID, try by code
        const { data: machineByCode, error: errorByCode } = await supabase
            .from("machines")
            .select("*")
            .eq("code", id)
            .single()

        machine = machineByCode
        machineError = errorByCode
    }

    if (!machine) {
        console.error("Machine not found:", id, "Tried ID and code")
        notFound()
    }

    // 2. Fetch Maintenance History (use machine_id or machine_code)
    const { data: maintenanceHistory } = await supabase
        .from("maintenance_history")
        .select("*")
        .eq("machine_id", id)
        .order("created_at", { ascending: false })


    // If no history by machine_id, try machine_code
    let history = maintenanceHistory || []
    if (history.length === 0 && machine.code) {
        const { data: historyByCode } = await supabase
            .from("maintenance_history")
            .select("*")
            .eq("machine_code", machine.code)
            .order("created_at", { ascending: false })

        history = historyByCode || []
    }

    // 3. Fetch Maintenance Standards by model (new schema uses machine_model)
    const { data: standards } = await supabase
        .from("maintenance_standards")
        .select("*")
        .eq("machine_model", machine.model || machine.code)
        .order("interval_hours", { ascending: true })

    // Calculate Next Maintenance
    let nextMaintenanceHours = 500 // Default fallback
    if (standards && standards.length > 0) {
        const upcoming = standards.find(s => s.interval_hours > (machine.current_hours || 0))
        if (upcoming) {
            nextMaintenanceHours = upcoming.interval_hours
        } else {
            // Take highest standard or calculate next 500h interval
            const maxStandard = Math.max(...standards.map(s => s.interval_hours))
            nextMaintenanceHours = Math.max(
                maxStandard,
                Math.ceil(((machine.current_hours || 0) + 1) / 500) * 500
            )
        }
    } else {
        nextMaintenanceHours = Math.ceil(((machine.current_hours || 0) + 1) / 500) * 500
    }

    // 4. Fetch daily logs for this machine
    const { data: dailyLogs } = await supabase
        .from("daily_logs")
        .select("*")
        .eq("machine_code", machine.code)
        .order("created_at", { ascending: false })


    return (
        <VehicleDetailManager
            machine={machine}
            history={history}
            nextMaintenanceHours={nextMaintenanceHours}
        />
    )
}
