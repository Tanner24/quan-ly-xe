import { Metadata } from "next"
import { supabaseServer } from "@/lib/supabaseServer"
import { DashboardContent } from "@/components/dashboard/DashboardContent"

export const metadata: Metadata = {
  title: "Dashboard | Asset Management",
  description: "Asset Management Dashboard",
}

export const revalidate = 0;

export default async function Dashboard() {
  const t0 = performance.now()

  // OPTIMIZATION: Fetch in Parallel using Promise.all

  // 1. Fetch Machines (Loop workaround for 1000 limit)
  const machinesPromise = (async () => {
    let allMachines: any[] = []
    let hasMore = true
    let page = 0
    const pageSize = 1000

    while (hasMore) {
      const { data, error } = await supabaseServer
        .from('machines')
        .select('id, code, status, current_hours, project_id') // Minimal fields
        .range(page * pageSize, (page + 1) * pageSize - 1)

      if (error || !data || data.length === 0) {
        hasMore = false
      } else {
        allMachines = [...allMachines, ...data]
        if (data.length < pageSize) hasMore = false
        page++
      }
    }
    return allMachines
  })()

  // 2. Fetch maintenance standards
  const standardsPromise = supabaseServer
    .from('maintenance_standards')
    .select('machine_code, interval_hours')

  // 3. Fetch recent logs (Optimized)
  const logsPromise = supabaseServer
    .from('daily_logs')
    .select('id, machine_code, hours, created_at, notes')
    .order('created_at', { ascending: false })
    .limit(500) // Safe limit

  // 4. Fetch Projects
  const projectsPromise = supabaseServer
    .from('projects')
    .select('id, name')

  // Await all concurrently
  const [machinesData, standardsData, logsData, projectsData] = await Promise.all([
    machinesPromise,
    standardsPromise,
    logsPromise,
    projectsPromise
  ])

  const machines = machinesData || []
  const standards = standardsData.data || []
  const recentLogs = logsData.data || []

  // Process Projects
  let projects: { id: string, name: string }[] = []
  if (projectsData.data && projectsData.data.length > 0) {
    projects = projectsData.data.map(p => ({
      id: p.id.toString(),
      name: p.name
    }))
  } else {
    // Fallback extraction
    const uniqueProjectIds = Array.from(new Set(machines.map((m: any) => m.project_id).filter(Boolean)))
    projects = uniqueProjectIds.map((id: any) => ({
      id: String(id),
      name: `Dự án ${id}` // Placeholder name if not found
    }))
  }

  const t1 = performance.now()
  console.log(`🚀 Dashboard Data Loaded in ${Math.round(t1 - t0)}ms. Machines: ${machines.length}`)

  // Create Map for Standards
  const maintenanceMap = new Map()
  if (standards) {
    for (const std of standards) {
      if (std.machine_code && std.interval_hours) {
        maintenanceMap.set(std.machine_code, std.interval_hours)
      }
    }
  }

  return (
    <DashboardContent
      machines={machines}
      recentLogs={recentLogs}
      projects={projects}
      maintenanceMap={maintenanceMap}
    />
  )
}
