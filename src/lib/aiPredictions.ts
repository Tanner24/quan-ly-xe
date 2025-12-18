// AI & Predictive Maintenance utilities

export interface MaintenancePrediction {
    machineCode: string
    daysUntilMaintenance: number
    confidence: number
    riskLevel: 'low' | 'medium' | 'high' | 'critical'
    recommendedAction: string
    estimatedCost: number
    factors: string[]
}

export interface AnomalyDetection {
    machineCode: string
    anomalyType: 'hours' | 'cost' | 'frequency'
    severity: 'low' | 'medium' | 'high'
    message: string
    timestamp: string
}

// Predict next maintenance based on historical patterns
export function predictNextMaintenance(
    machine: any,
    maintenanceHistory: any[]
): MaintenancePrediction {
    const machineMaintenance = maintenanceHistory
        .filter(m => m.machine_code === machine.code)
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())

    if (machineMaintenance.length < 2) {
        // Not enough data
        return {
            machineCode: machine.code,
            daysUntilMaintenance: 30,
            confidence: 0.3,
            riskLevel: 'medium',
            recommendedAction: 'Schedule inspection',
            estimatedCost: 1000000,
            factors: ['Insufficient data']
        }
    }

    // Calculate average maintenance interval
    const intervals: number[] = []
    for (let i = 1; i < machineMaintenance.length; i++) {
        const prevDate = new Date(machineMaintenance[i - 1].date)
        const currDate = new Date(machineMaintenance[i].date)
        const daysDiff = (currDate.getTime() - prevDate.getTime()) / (1000 * 60 * 60 * 24)
        intervals.push(daysDiff)
    }

    const avgInterval = intervals.reduce((sum, val) => sum + val, 0) / intervals.length
    const lastMaintenance = new Date(machineMaintenance[machineMaintenance.length - 1].date)
    const today = new Date()
    const daysSinceLastMaintenance = (today.getTime() - lastMaintenance.getTime()) / (1000 * 60 * 60 * 24)
    const daysUntilNext = Math.max(0, avgInterval - daysSinceLastMaintenance)

    // Calculate confidence based on data consistency
    const variance = intervals.reduce((sum, val) => sum + Math.pow(val - avgInterval, 2), 0) / intervals.length
    const stdDev = Math.sqrt(variance)
    const confidence = Math.max(0.5, 1 - (stdDev / avgInterval))

    // Determine risk level
    let riskLevel: 'low' | 'medium' | 'high' | 'critical'
    if (daysUntilNext <= 0) riskLevel = 'critical'
    else if (daysUntilNext <= 7) riskLevel = 'high'
    else if (daysUntilNext <= 14) riskLevel = 'medium'
    else riskLevel = 'low'

    // Calculate estimated cost based on history
    const avgCost = machineMaintenance.reduce((sum, m) => sum + (m.cost || 0), 0) / machineMaintenance.length

    // Factors
    const factors = [
        `Average interval: ${Math.round(avgInterval)} days`,
        `Last maintenance: ${Math.round(daysSinceLastMaintenance)} days ago`,
        `Data points: ${machineMaintenance.length}`,
        machine.current_hours > 500 ? 'High usage hours' : 'Normal usage'
    ]

    return {
        machineCode: machine.code,
        daysUntilMaintenance: Math.round(daysUntilNext),
        confidence,
        riskLevel,
        recommendedAction: riskLevel === 'critical' ? 'Immediate maintenance required!' :
            riskLevel === 'high' ? 'Schedule maintenance this week' :
                riskLevel === 'medium' ? 'Plan maintenance soon' :
                    'Continue monitoring',
        estimatedCost: avgCost * (riskLevel === 'critical' ? 1.5 : 1),
        factors
    }
}

// Detect anomalies in machine behavior
export function detectAnomalies(
    machine: any,
    maintenanceHistory: any[],
    logs: any[]
): AnomalyDetection[] {
    const anomalies: AnomalyDetection[] = []
    const machineMaintenance = maintenanceHistory.filter(m => m.machine_code === machine.code)
    const machineLogs = logs.filter(l => l.machine_code === machine.code)

    // 1. Detect unusual maintenance frequency
    if (machineMaintenance.length >= 3) {
        const recent3Months = machineMaintenance
            .filter(m => {
                const date = new Date(m.date)
                const threeMonthsAgo = new Date()
                threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3)
                return date >= threeMonthsAgo
            })

        if (recent3Months.length >= 3) {
            anomalies.push({
                machineCode: machine.code,
                anomalyType: 'frequency',
                severity: 'high',
                message: `${recent3Months.length} lần bảo dưỡng trong 3 tháng - Bất thường cao!`,
                timestamp: new Date().toISOString()
            })
        }
    }

    // 2. Detect cost spike
    if (machineMaintenance.length >= 2) {
        const avgCost = machineMaintenance.reduce((sum, m) => sum + (m.cost || 0), 0) / machineMaintenance.length
        const lastCost = machineMaintenance[machineMaintenance.length - 1].cost || 0

        if (lastCost > avgCost * 2) {
            anomalies.push({
                machineCode: machine.code,
                anomalyType: 'cost',
                severity: 'medium',
                message: `Chi phí BD gần nhất cao gấp đôi! (${lastCost.toLocaleString()}đ vs ${avgCost.toLocaleString()}đ)`,
                timestamp: new Date().toISOString()
            })
        }
    }

    // 3. Detect rapid hour increase
    if (machineLogs.length >= 2) {
        const sortedLogs = machineLogs.sort((a, b) =>
            new Date(a.date).getTime() - new Date(b.date).getTime()
        )
        const recentLogs = sortedLogs.slice(-5) // Last 5 logs

        if (recentLogs.length >= 2) {
            const avgDailyHours = (recentLogs[recentLogs.length - 1].odo_hours - recentLogs[0].odo_hours) / recentLogs.length

            if (avgDailyHours > 10) { // More than 10 hours/day average
                anomalies.push({
                    machineCode: machine.code,
                    anomalyType: 'hours',
                    severity: 'medium',
                    message: `Sử dụng quá mức: ${avgDailyHours.toFixed(1)} giờ/ngày (bình thường: 8h/ngày)`,
                    timestamp: new Date().toISOString()
                })
            }
        }
    }

    return anomalies
}

// Calculate health score (0-100)
export function calculateHealthScore(
    machine: any,
    maintenanceHistory: any[],
    prediction: MaintenancePrediction,
    anomalies: AnomalyDetection[]
): number {
    let score = 100

    // Deduct based on days until maintenance
    if (prediction.daysUntilMaintenance <= 0) score -= 40
    else if (prediction.daysUntilMaintenance <= 7) score -= 30
    else if (prediction.daysUntilMaintenance <= 14) score -= 20
    else if (prediction.daysUntilMaintenance <= 30) score -= 10

    // Deduct based on anomalies
    anomalies.forEach(anomaly => {
        if (anomaly.severity === 'high') score -= 20
        else if (anomaly.severity === 'medium') score -= 10
        else score -= 5
    })

    // Deduct based on maintenance frequency
    const recentMaintenance = maintenanceHistory.filter(m => {
        const sixMonthsAgo = new Date()
        sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6)
        return m.machine_code === machine.code && new Date(m.date) >= sixMonthsAgo
    })

    if (recentMaintenance.length > 4) score -= 15 // Too many maintenances
    if (recentMaintenance.length === 0) score -= 10 // No maintenance

    return Math.max(0, Math.min(100, score))
}

// Smart recommendations based on AI analysis
export function generateRecommendations(
    machine: any,
    prediction: MaintenancePrediction,
    anomalies: AnomalyDetection[],
    healthScore: number
): string[] {
    const recommendations: string[] = []

    // Based on health score
    if (healthScore < 50) {
        recommendations.push('🚨 Kiểm tra toàn diện ngay lập tức')
    } else if (healthScore < 70) {
        recommendations.push('⚠️ Lên kế hoạch bảo dưỡng sớm')
    }

    // Based on risk level
    if (prediction.riskLevel === 'critical') {
        recommendations.push('🔴 KHẨN CẤP: Dừng máy và bảo dưỡng ngay')
        recommendations.push('📞 Liên hệ kỹ thuật viên')
    } else if (prediction.riskLevel === 'high') {
        recommendations.push('🟡 Ưu tiên bảo dưỡng trong tuần này')
        recommendations.push('📋 Chuẩn bị phụ tùng')
    }

    // Based on anomalies
    if (anomalies.some(a => a.anomalyType === 'frequency')) {
        recommendations.push('🔍 Kiểm tra nguyên nhân hư hỏng thường xuyên')
        recommendations.push('💡 Xem xét thay thế thiết bị')
    }

    if (anomalies.some(a => a.anomalyType === 'cost')) {
        recommendations.push('💰 Phân tích chi phí bất thường')
        recommendations.push('📊 So sánh với các máy khác')
    }

    if (anomalies.some(a => a.anomalyType === 'hours')) {
        recommendations.push('⏱️ Giảm thời gian sử dụng hoặc thêm ca bảo dưỡng')
        recommendations.push('👥 Cân nhắc phân bổ công việc')
    }

    // Generic recommendations
    if (recommendations.length === 0) {
        recommendations.push('✅ Thiết bị hoạt động tốt')
        recommendations.push('📅 Tiếp tục theo dõi định kỳ')
    }

    return recommendations
}

// Priority scoring for maintenance queue
export function prioritizeMaintenance(predictions: MaintenancePrediction[]): MaintenancePrediction[] {
    return predictions.sort((a, b) => {
        // Priority: critical > high > medium > low
        const riskOrder = { critical: 4, high: 3, medium: 2, low: 1 }
        const riskDiff = riskOrder[b.riskLevel] - riskOrder[a.riskLevel]

        if (riskDiff !== 0) return riskDiff

        // If same risk, sort by days (fewer days = higher priority)
        return a.daysUntilMaintenance - b.daysUntilMaintenance
    })
}
