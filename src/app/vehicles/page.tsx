import { Metadata } from "next"
import { supabaseServer } from "@/lib/supabaseServer"
import { VehicleManager } from "@/components/vehicles/VehicleManager"

export const metadata: Metadata = {
    title: "Quản lý Xe | Asset Management",
    description: "Danh sách và trạng thái hoạt động của xe máy thiết bị",
}

export const revalidate = 0;

export default async function VehiclesPage() {
    // REFACTOR: Use loop to ensure we fetch EVERYTHING (>1000 limit workaround guaranteed)

    let allMachines: any[] = []
    let hasMore = true
    let page = 0
    const pageSize = 1000 // Must match Supabase limit

    while (hasMore) {
        const { data, error: fetchError } = await supabaseServer
            .from("machines")
            .select("id, code, project_name, current_hours, status, model")
            .range(page * pageSize, (page + 1) * pageSize - 1)
            .order('code', { ascending: true })

        if (fetchError) {
            console.error('Vehicles Fetch Error:', fetchError)
            break
        }

        if (data) {
            allMachines = [...allMachines, ...data]
            if (data.length < pageSize) hasMore = false
        } else {
            hasMore = false
        }
        page++
    }

    // Assign to 'machines' validation checked below
    const machines = allMachines
    const error = null // No single error object in loop mode

    if (error) {
        console.error("Error fetching machines:", error)
        return (
            <div className="p-8 text-red-500">
                <h3 className="font-bold">Error loading data:</h3>
                <pre className="mt-2 bg-red-50 p-4 rounded text-sm overflow-auto">
                    {JSON.stringify(error, null, 2)}
                </pre>
            </div>
        )
    }

    // 2. Fetch Maintenance Standards
    const { data: maintenanceStandards } = await supabaseServer
        .from("maintenance_standards")
        .select("machine_code, interval_hours")

    // 3. Extract Projects
    const { data: distinctProjects } = await supabaseServer
        .from("machines")
        .select("project_name")
        .not("project_name", "is", null)

    // Extract unique names in JS
    const projects = Array.from(new Set(distinctProjects?.map(p => p.project_name) || [])).sort() as string[]

    return (
        <div className="space-y-6">
            <VehicleManager
                initialMachines={machines || []}
                maintenanceStandards={maintenanceStandards || []}
                projects={projects}
            />
        </div>
    )
}
