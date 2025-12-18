import { Metadata } from "next"
import { supabase } from "@/lib/supabaseClient"
import { LogManager } from "@/components/logs/LogManager"
import { LogsHeader } from "@/components/logs/LogsHeader"

export const metadata: Metadata = {
    title: "Nhật ký Hoạt động | Asset Management",
    description: "Quản lý ODO và lịch trình phương tiện",
}

export const revalidate = 0;

export default async function LogsPage() {
    // 1. Fetch logs (Safe fetch without join first to avoid FK errors)
    const { data: logs, error: logError } = await supabase
        .from("daily_logs")
        .select("id, created_at, hours_added, note, machine_code")
        .order('created_at', { ascending: false })


    if (logError) {
        console.error("Error fetching logs:", logError)
        return (
            <div className="p-8 text-red-500">
                <h3 className="font-bold">Error loading logs:</h3>
                <pre className="mt-2 bg-red-50 p-4 rounded text-sm overflow-auto">
                    {JSON.stringify(logError, null, 2)}
                </pre>
            </div>
        )
    }

    // 2. Fetch machines info manually to map projects
    const { data: machines } = await supabase
        .from("machines")
        .select("id, code, name, project_name")

    // Create a Map for quick lookup: code -> project_name
    const machineMap = new Map<string, string>()
    machines?.forEach(m => {
        if (m.code && m.project_name) {
            machineMap.set(m.code, m.project_name)
        }
    })

    // 3. Map project info into logs
    const formattedLogs = logs?.map((log: any) => ({
        ...log,
        machines: {
            code: log.machine_code,
            project_name: machineMap.get(log.machine_code) || null
        }
    })) || []

    // 4. Extract unique projects for filter
    const distinctProjects = Array.from(new Set(machines?.map(m => m.project_name).filter(Boolean))) as string[]

    return (
        <div className="space-y-6">
            <LogsHeader />
            <LogManager
                initialLogs={formattedLogs}
                projects={distinctProjects}
                machinesList={machines || []}
            />
        </div>
    )
}
