import { VehicleCard } from "./VehicleCard"
import { VehiclePagination } from "./VehiclePagination"
import { getMachines } from "@/services/machineService"
import { supabaseServer } from "@/lib/supabaseServer"

interface VehicleListProps {
    searchParams: { [key: string]: string | string[] | undefined }
}

export async function VehicleList({ searchParams }: VehicleListProps) {
    const project = searchParams?.project as string
    const search = searchParams?.search as string
    const tab = searchParams?.tab as string // 'overdue', 'upcoming'
    const sort = searchParams?.sort as string // 'code_asc', 'code_desc', 'hours_desc'
    const page = Number(searchParams?.page) || 1
    const pageSize = 24

    // ADVANCED FILTERING STRATEGY
    // Since 'overdue' logic depends on variable intervals, standard DB queries are hard.
    // Strategy: 
    // 1. If 'all' tab: Use standard efficient DB pagination.
    // 2. If 'overdue'/'upcoming' tab: Fetch lightweight ID+Hours+Interval map, filter in memory, then paginate.

    let machines: any[] = []
    let totalPages = 0
    let totalCount = 0

    if (tab === 'overdue' || tab === 'upcoming') {
        // Step 1: Fetch minimal data for calculation
        // NOTE: This fetches "all" but only small columns. 3000 rows x 50 bytes = 150KB (Acceptable)
        const { data: allLightweight } = await supabaseServer
            .from('machines')
            .select('id, code, current_hours, maintenance_standards(interval_hours)')

        // Step 2: Filter in memory
        const filteredIds = (allLightweight || []).filter((m: any) => {
            const interval = m.maintenance_standards?.[0]?.interval_hours || 500
            const current = m.current_hours || 0
            const nextDue = Math.ceil((current + 1) / interval) * interval
            const remaining = nextDue - current

            if (tab === 'overdue') return remaining < 0
            if (tab === 'upcoming') return remaining >= 0 && remaining <= 50 // Within 50h
            return true
        })

        totalCount = filteredIds.length
        totalPages = Math.ceil(totalCount / pageSize)

        // Step 3: Slice for current page
        const pagedItems = filteredIds.slice((page - 1) * pageSize, page * pageSize)

        if (pagedItems.length > 0) {
            const { data: details } = await supabaseServer
                .from('machines')
                .select('*')
                .in('id', pagedItems.map((i: any) => i.id))

            // Sort to match sliced order (optional, or rely on DB return)
            machines = details || []
        }

    } else {
        // STANDARD EFFICIENT WAY
        const { data, meta } = await getMachines({
            page,
            limit: pageSize,
            project,
            search,
            sort,
            status: 'active'
        });
        machines = data
        totalCount = meta.total
        totalPages = meta.totalPages
    }

    if (!machines || machines.length === 0) {
        return <div className="text-gray-500 p-8 text-center bg-white rounded-xl border border-dashed">Không tìm thấy thiết bị nào.</div>
    }

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {machines.map((machine: any) => (
                    <VehicleCard key={machine.id} machine={machine} />
                ))}
            </div>

            {/* Pagination Controls */}
            {totalPages > 1 && (
                <VehiclePagination totalPages={totalPages} currentPage={page} />
            )}

            <div className="text-center text-xs text-gray-400 mt-4">
                Hiển thị {machines.length} / {totalCount} kết quả
            </div>
        </div>
    )
}
