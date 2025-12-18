// Analytics utility functions

export interface CostData {
    total: number
    byMachine: Record<string, number>
    byProject: Record<string, number>
    byMonth: Record<string, number>
    trend: 'up' | 'down' | 'stable'
    changePercent: number
}

export interface UtilizationData {
    machineCode: string
    hoursUsed: number
    totalHours: number
    utilizationRate: number
    status: 'high' | 'medium' | 'low'
}

export interface ROIMetrics {
    totalCost: number
    totalValue: number
    roi: number
    paybackPeriod: number
    breakEvenDate: string
}

// Calculate total maintenance costs
export function calculateMaintenanceCosts(maintenanceHistory: any[]): CostData {
    const total = maintenanceHistory.reduce((sum, record) => sum + (record.cost || 0), 0)

    // By machine
    const byMachine: Record<string, number> = {}
    maintenanceHistory.forEach(record => {
        const code = record.machine_code
        byMachine[code] = (byMachine[code] || 0) + (record.cost || 0)
    })

    // By project
    const byProject: Record<string, number> = {}
    maintenanceHistory.forEach(record => {
        const project = record.project_name || 'Unknown'
        byProject[project] = (byProject[project] || 0) + (record.cost || 0)
    })

    // By month
    const byMonth: Record<string, number> = {}
    maintenanceHistory.forEach(record => {
        const month = new Date(record.date).toISOString().slice(0, 7) // YYYY-MM
        byMonth[month] = (byMonth[month] || 0) + (record.cost || 0)
    })

    // Calculate trend
    const months = Object.keys(byMonth).sort()
    const lastMonth = byMonth[months[months.length - 1]] || 0
    const prevMonth = byMonth[months[months.length - 2]] || 0
    const changePercent = prevMonth > 0 ? ((lastMonth - prevMonth) / prevMonth) * 100 : 0
    const trend = changePercent > 5 ? 'up' : changePercent < -5 ? 'down' : 'stable'

    return {
        total,
        byMachine,
        byProject,
        byMonth,
        trend,
        changePercent
    }
}

// Calculate machine utilization
export function calculateUtilization(machines: any[], logs: any[]): UtilizationData[] {
    const utilizationData: UtilizationData[] = []

    // Assuming 8 hours/day, 20 days/month
    const expectedHoursPerMonth = 8 * 20 // 160 hours

    machines.forEach(machine => {
        // Get logs for this machine in last 30 days
        const thirtyDaysAgo = new Date()
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

        const machineLogs = logs.filter(log =>
            log.machine_code === machine.code &&
            new Date(log.date) >= thirtyDaysAgo
        )

        // Calculate hours used (sum of odo_hours differences)
        const hoursUsed = machineLogs.reduce((sum, log) => sum + (log.odo_hours || 0), 0)

        const utilizationRate = (hoursUsed / expectedHoursPerMonth) * 100

        let status: 'high' | 'medium' | 'low'
        if (utilizationRate >= 80) status = 'high'
        else if (utilizationRate >= 50) status = 'medium'
        else status = 'low'

        utilizationData.push({
            machineCode: machine.code,
            hoursUsed,
            totalHours: expectedHoursPerMonth,
            utilizationRate,
            status
        })
    })

    return utilizationData
}

// Calculate ROI
export function calculateROI(
    purchasePrice: number,
    maintenanceCosts: number,
    revenue: number,
    operatingYears: number
): ROIMetrics {
    const totalCost = purchasePrice + maintenanceCosts
    const totalValue = revenue
    const roi = ((totalValue - totalCost) / totalCost) * 100
    const paybackPeriod = purchasePrice / (revenue / operatingYears)

    const breakEvenDate = new Date()
    breakEvenDate.setFullYear(breakEvenDate.getFullYear() + Math.ceil(paybackPeriod))

    return {
        totalCost,
        totalValue,
        roi,
        paybackPeriod,
        breakEvenDate: breakEvenDate.toISOString().split('T')[0]
    }
}

// Generate chart data for trends
export function generateTrendData(costData: CostData) {
    const months = Object.keys(costData.byMonth).sort()

    return months.map(month => ({
        month: new Date(month).toLocaleDateString('vi-VN', { month: 'short', year: 'numeric' }),
        cost: costData.byMonth[month]
    }))
}

// Calculate average downtime
export function calculateDowntime(machines: any[], maintenanceHistory: any[]) {
    const downtimeByMachine: Record<string, number> = {}

    maintenanceHistory.forEach(record => {
        // Assume each maintenance takes 1-2 days based on type
        const downtimeDays = record.maintenance_level === 'major' ? 2 : 1
        const code = record.machine_code
        downtimeByMachine[code] = (downtimeByMachine[code] || 0) + downtimeDays
    })

    const totalDowntime = Object.values(downtimeByMachine).reduce((sum, days) => sum + days, 0)
    const avgDowntime = totalDowntime / machines.length

    return {
        total: totalDowntime,
        average: avgDowntime,
        byMachine: downtimeByMachine
    }
}

// Export data to CSV
export function exportToCSV(data: any[], filename: string) {
    if (data.length === 0) return

    const headers = Object.keys(data[0])
    const csv = [
        headers.join(','),
        ...data.map(row => headers.map(header => row[header]).join(','))
    ].join('\n')

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = `${filename}.csv`
    link.click()
}

// Format currency
export function formatCurrency(amount: number): string {
    return new Intl.NumberFormat('vi-VN', {
        style: 'currency',
        currency: 'VND'
    }).format(amount)
}

// Format percentage
export function formatPercent(value: number): string {
    return `${value.toFixed(1)}%`
}
