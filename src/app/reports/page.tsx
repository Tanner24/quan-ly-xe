import { supabase } from "@/lib/supabaseClient"
import { ReportsContent } from "@/components/reports/ReportsContent"

export const metadata = {
    title: "Báo cáo | Asset Management",
    description: "Báo cáo hoạt động và phân tích trạng thái thiết bị",
}

export const revalidate = 0;

export default async function ReportsPage() {
    // 1. Fetch all data
    // Fetch machines with project info
    const { data: allMachines } = await supabase
        .from('machines')
        .select('id, code, status, current_hours, project_name')
        .range(0, 49999)

    const machines = allMachines || []

    // 2. Fetch today's logs
    const today = new Date().toISOString().split('T')[0]
    const { data: logsToday } = await supabase
        .from('daily_logs')
        .select('machine_code, created_at')
        .gte('created_at', `${today}T00:00:00`)
        .lt('created_at', `${today}T23:59:59`)
        .range(0, 49999)

    // 3. Fetch maintenance standards
    const { data: maintenanceStandards } = await supabase
        .from('maintenance_standards')
        .select('*')
        .range(0, 9999)

    return (
        <ReportsContent
            machines={machines}
            totalMachines={machines.length}
            logsToday={logsToday || []}
            maintenanceStandards={maintenanceStandards || []}
        />
    )
}
