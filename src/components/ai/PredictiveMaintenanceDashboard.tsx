"use client"

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabaseClient'
import {
    predictNextMaintenance,
    detectAnomalies,
    calculateHealthScore,
    generateRecommendations,
    prioritizeMaintenance,
    type MaintenancePrediction,
    type AnomalyDetection
} from '@/lib/aiPredictions'
import {
    AlertCircle,
    TrendingUp,
    Activity,
    Brain,
    Zap,
    AlertTriangle,
    CheckCircle,
    XCircle
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import Link from 'next/link'

export function PredictiveMaintenanceDashboard() {
    const [loading, setLoading] = useState(true)
    const [machines, setMachines] = useState<any[]>([])
    const [maintenanceHistory, setMaintenanceHistory] = useState<any[]>([])
    const [logs, setLogs] = useState<any[]>([])
    const [predictions, setPredictions] = useState<MaintenancePrediction[]>([])
    const [allAnomalies, setAllAnomalies] = useState<AnomalyDetection[]>([])
    const [healthScores, setHealthScores] = useState<Record<string, number>>({})

    useEffect(() => {
        fetchDataAndPredict()
    }, [])

    const fetchDataAndPredict = async () => {
        try {
            const [machinesRes, maintenanceRes, logsRes] = await Promise.all([
                supabase.from('machines').select('*').range(0, 49999),
                supabase.from('maintenance_history').select('*').range(0, 49999),
                supabase.from('daily_logs').select('*').range(0, 49999)
            ])

            if (machinesRes.data) setMachines(machinesRes.data)
            if (maintenanceRes.data) setMaintenanceHistory(maintenanceRes.data)
            if (logsRes.data) setLogs(logsRes.data)

            // Run AI predictions
            if (machinesRes.data && maintenanceRes.data && logsRes.data) {
                const allPredictions: MaintenancePrediction[] = []
                const allDetectedAnomalies: AnomalyDetection[] = []
                const scores: Record<string, number> = {}

                machinesRes.data.forEach(machine => {
                    // Predict next maintenance
                    const prediction = predictNextMaintenance(machine, maintenanceRes.data)
                    allPredictions.push(prediction)

                    // Detect anomalies
                    const anomalies = detectAnomalies(machine, maintenanceRes.data, logsRes.data)
                    allDetectedAnomalies.push(...anomalies)

                    // Calculate health score
                    const health = calculateHealthScore(machine, maintenanceRes.data, prediction, anomalies)
                    scores[machine.code] = health
                })

                setPredictions(prioritizeMaintenance(allPredictions))
                setAllAnomalies(allDetectedAnomalies)
                setHealthScores(scores)
            }

            setLoading(false)
        } catch (error) {
            console.error('Error:', error)
            setLoading(false)
        }
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="flex flex-col items-center gap-3">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600" />
                    <p className="text-sm text-gray-500">AI đang phân tích dữ liệu...</p>
                </div>
            </div>
        )
    }

    const criticalPredictions = predictions.filter(p => p.riskLevel === 'critical')
    const highRiskPredictions = predictions.filter(p => p.riskLevel === 'high')
    const avgHealthScore = Object.values(healthScores).reduce((sum, score) => sum + score, 0) / Object.keys(healthScores).length

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center gap-3">
                <div className="p-3 bg-gradient-to-br from-purple-600 to-indigo-600 rounded-xl text-white">
                    <Brain className="w-6 h-6" />
                </div>
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">AI Predictive Maintenance</h1>
                    <p className="text-gray-500">Smart predictions & anomaly detection</p>
                </div>
            </div>

            {/* Alert Summary */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card className="border-none shadow-sm bg-gradient-to-br from-red-50 to-red-100">
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between mb-2">
                            <AlertCircle className="w-8 h-8 text-red-600" />
                            <span className="text-3xl font-bold text-red-600">{criticalPredictions.length}</span>
                        </div>
                        <p className="text-sm font-medium text-red-700">Critical Alerts</p>
                        <p className="text-xs text-red-600">Immediate action required</p>
                    </CardContent>
                </Card>

                <Card className="border-none shadow-sm bg-gradient-to-br from-yellow-50 to-yellow-100">
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between mb-2">
                            <AlertTriangle className="w-8 h-8 text-yellow-600" />
                            <span className="text-3xl font-bold text-yellow-600">{highRiskPredictions.length}</span>
                        </div>
                        <p className="text-sm font-medium text-yellow-700">High Risk</p>
                        <p className="text-xs text-yellow-600">Schedule soon</p>
                    </CardContent>
                </Card>

                <Card className="border-none shadow-sm bg-gradient-to-br from-blue-50 to-blue-100">
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between mb-2">
                            <Activity className="w-8 h-8 text-blue-600" />
                            <span className="text-3xl font-bold text-blue-600">{Math.round(avgHealthScore)}</span>
                        </div>
                        <p className="text-sm font-medium text-blue-700">Avg Health Score</p>
                        <p className="text-xs text-blue-600">Fleet average</p>
                    </CardContent>
                </Card>

                <Card className="border-none shadow-sm bg-gradient-to-br from-purple-50 to-purple-100">
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between mb-2">
                            <Zap className="w-8 h-8 text-purple-600" />
                            <span className="text-3xl font-bold text-purple-600">{allAnomalies.length}</span>
                        </div>
                        <p className="text-sm font-medium text-purple-700">Anomalies Detected</p>
                        <p className="text-xs text-purple-600">Unusual patterns</p>
                    </CardContent>
                </Card>
            </div>

            {/* Critical & High Risk Predictions */}
            {(criticalPredictions.length > 0 || highRiskPredictions.length > 0) && (
                <Card className="border-none shadow-sm">
                    <CardHeader>
                        <CardTitle className="text-lg flex items-center gap-2">
                            <AlertCircle className="w-5 h-5 text-red-600" />
                            Urgent Maintenance Required
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-3">
                            {[...criticalPredictions, ...highRiskPredictions].slice(0, 5).map((prediction, index) => {
                                const machine = machines.find(m => m.code === prediction.machineCode)
                                const health = healthScores[prediction.machineCode] || 0
                                const recommendations = generateRecommendations(
                                    machine,
                                    prediction,
                                    allAnomalies.filter(a => a.machineCode === prediction.machineCode),
                                    health
                                )

                                return (
                                    <Link
                                        key={index}
                                        href={`/vehicles/${machine?.id}`}
                                        className="block p-4 rounded-lg border transition-all hover:shadow-md hover:border-purple-200"
                                        style={{
                                            borderColor: prediction.riskLevel === 'critical' ? '#ef4444' : '#f59e0b'
                                        }}
                                    >
                                        <div className="flex items-start justify-between gap-4">
                                            <div className="flex-1">
                                                <div className="flex items-center gap-2 mb-2">
                                                    <h3 className="font-bold text-gray-900">{prediction.machineCode}</h3>
                                                    <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${prediction.riskLevel === 'critical' ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'
                                                        }`}>
                                                        {prediction.riskLevel === 'critical' ? 'CRITICAL' : 'HIGH RISK'}
                                                    </span>
                                                    <span className="text-xs text-gray-500">
                                                        Confidence: {(prediction.confidence * 100).toFixed(0)}%
                                                    </span>
                                                </div>

                                                <p className="text-sm text-gray-600 mb-2">{prediction.recommendedAction}</p>

                                                <div className="space-y-1">
                                                    <div className="flex items-center gap-2 text-xs text-gray-500">
                                                        <span>⏱️ {prediction.daysUntilMaintenance} days until maintenance</span>
                                                        <span>•</span>
                                                        <span>💰 Est. cost: {prediction.estimatedCost.toLocaleString()}đ</span>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-xs text-gray-500">Health:</span>
                                                        <Progress value={health} className="flex-1 max-w-xs h-2" />
                                                        <span className="text-xs font-medium">{Math.round(health)}%</span>
                                                    </div>
                                                </div>

                                                <div className="mt-2 flex flex-wrap gap-1">
                                                    {recommendations.slice(0, 2).map((rec, i) => (
                                                        <span key={i} className="text-xs bg-gray-100 px-2 py-1 rounded">
                                                            {rec}
                                                        </span>
                                                    ))}
                                                </div>
                                            </div>

                                            <div className={`text-4xl ${prediction.riskLevel === 'critical' ? 'text-red-600' : 'text-yellow-600'
                                                }`}>
                                                {prediction.riskLevel === 'critical' ? '🔴' : '🟡'}
                                            </div>
                                        </div>
                                    </Link>
                                )
                            })}
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* All Machines Health Status */}
            <Card className="border-none shadow-sm">
                <CardHeader>
                    <CardTitle className="text-lg">Fleet Health Overview</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                        {machines.slice(0, 12).map(machine => {
                            const health = healthScores[machine.code] || 0
                            const prediction = predictions.find(p => p.machineCode === machine.code)

                            let statusIcon, statusColor
                            if (health >= 80) {
                                statusIcon = <CheckCircle className="w-5 h-5" />
                                statusColor = 'text-green-600 bg-green-50'
                            } else if (health >= 60) {
                                statusIcon = <AlertTriangle className="w-5 h-5" />
                                statusColor = 'text-yellow-600 bg-yellow-50'
                            } else {
                                statusIcon = <XCircle className="w-5 h-5" />
                                statusColor = 'text-red-600 bg-red-50'
                            }

                            return (
                                <Link
                                    key={machine.code}
                                    href={`/vehicles/${machine.id}`}
                                    className="p-3 rounded-lg border hover:shadow-md transition-all"
                                >
                                    <div className="flex items-center justify-between mb-2">
                                        <span className="font-semibold text-sm">{machine.code}</span>
                                        <div className={`p-1 rounded ${statusColor}`}>
                                            {statusIcon}
                                        </div>
                                    </div>
                                    <Progress value={health} className="h-2 mb-2" />
                                    <div className="flex justify-between items-center text-xs text-gray-500">
                                        <span>Health: {Math.round(health)}%</span>
                                        {prediction && (
                                            <span className="font-mono">{prediction.daysUntilMaintenance}d</span>
                                        )}
                                    </div>
                                </Link>
                            )
                        })}
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
