"use client"

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabaseClient'
import {
    calculateMaintenanceCosts,
    calculateUtilization,
    calculateDowntime,
    formatCurrency,
    formatPercent,
    exportToCSV,
    generateTrendData
} from '@/lib/analytics'
import {
    DollarSign,
    TrendingUp,
    TrendingDown,
    Activity,
    Download,
    Calendar,
    AlertCircle
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
    AreaChart,
    Area,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    BarChart,
    Bar,
    PieChart,
    Pie,
    Cell
} from 'recharts'

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6']

export function CostAnalysisDashboard() {
    const [loading, setLoading] = useState(true)
    const [machines, setMachines] = useState<any[]>([])
    const [maintenanceHistory, setMaintenanceHistory] = useState<any[]>([])
    const [logs, setLogs] = useState<any[]>([])
    const [costData, setCostData] = useState<any>(null)
    const [utilizationData, setUtilizationData] = useState<any[]>([])
    const [downtimeData, setDowntimeData] = useState<any>(null)

    useEffect(() => {
        fetchData()
    }, [])

    const fetchData = async () => {
        try {
            const [machinesRes, maintenanceRes, logsRes] = await Promise.all([
                supabase.from('machines').select('*').range(0, 49999),
                supabase.from('maintenance_history').select('*').range(0, 49999),
                supabase.from('daily_logs').select('*').range(0, 49999)
            ])

            if (machinesRes.data) setMachines(machinesRes.data)
            if (maintenanceRes.data) {
                setMaintenanceHistory(maintenanceRes.data)
                setCostData(calculateMaintenanceCosts(maintenanceRes.data))
            }
            if (logsRes.data) setLogs(logsRes.data)

            if (machinesRes.data && logsRes.data) {
                setUtilizationData(calculateUtilization(machinesRes.data, logsRes.data))
            }

            if (machinesRes.data && maintenanceRes.data) {
                setDowntimeData(calculateDowntime(machinesRes.data, maintenanceRes.data))
            }

            setLoading(false)
        } catch (error) {
            console.error('Error fetching data:', error)
            setLoading(false)
        }
    }

    const handleExport = () => {
        const exportData = maintenanceHistory.map(record => ({
            'Mã máy': record.machine_code,
            'Ngày': record.date,
            'Loại BD': record.maintenance_level,
            'Chi phí': record.cost,
            'Ghi chú': record.notes
        }))
        exportToCSV(exportData, 'cost-analysis')
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
            </div>
        )
    }

    const trendData = costData ? generateTrendData(costData) : []
    const costByProject = costData ? Object.entries(costData.byProject).map(([name, value]) => ({
        name,
        value
    })) : []

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex justify-between items-start">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Phân tích Chi phí</h1>
                    <p className="text-gray-500">Thống kê chi phí bảo dưỡng và hiệu suất</p>
                </div>
                <Button onClick={handleExport} variant="outline">
                    <Download className="w-4 h-4 mr-2" />
                    Xuất Excel
                </Button>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card className="border-none shadow-sm">
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between mb-2">
                            <div className="p-2 bg-blue-100 rounded-lg">
                                <DollarSign className="w-5 h-5 text-blue-600" />
                            </div>
                            {costData && (
                                <div className={`flex items-center gap-1 text-xs font-medium ${costData.trend === 'up' ? 'text-red-600' : 'text-green-600'
                                    }`}>
                                    {costData.trend === 'up' ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                                    {Math.abs(costData.changePercent).toFixed(1)}%
                                </div>
                            )}
                        </div>
                        <h3 className="text-2xl font-bold text-gray-900">
                            {costData ? formatCurrency(costData.total) : '0đ'}
                        </h3>
                        <p className="text-sm text-gray-500">Tổng chi phí BD</p>
                    </CardContent>
                </Card>

                <Card className="border-none shadow-sm">
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between mb-2">
                            <div className="p-2 bg-green-100 rounded-lg">
                                <Activity className="w-5 h-5 text-green-600" />
                            </div>
                        </div>
                        <h3 className="text-2xl font-bold text-gray-900">
                            {utilizationData.length > 0
                                ? formatPercent(utilizationData.reduce((sum, d) => sum + d.utilizationRate, 0) / utilizationData.length)
                                : '0%'}
                        </h3>
                        <p className="text-sm text-gray-500">Tỷ lệ sử dụng TB</p>
                    </CardContent>
                </Card>

                <Card className="border-none shadow-sm">
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between mb-2">
                            <div className="p-2 bg-yellow-100 rounded-lg">
                                <AlertCircle className="w-5 h-5 text-yellow-600" />
                            </div>
                        </div>
                        <h3 className="text-2xl font-bold text-gray-900">
                            {downtimeData ? downtimeData.average.toFixed(1) : '0'} ngày
                        </h3>
                        <p className="text-sm text-gray-500">Downtime TB/máy</p>
                    </CardContent>
                </Card>

                <Card className="border-none shadow-sm">
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between mb-2">
                            <div className="p-2 bg-purple-100 rounded-lg">
                                <Calendar className="w-5 h-5 text-purple-600" />
                            </div>
                        </div>
                        <h3 className="text-2xl font-bold text-gray-900">
                            {maintenanceHistory.length}
                        </h3>
                        <p className="text-sm text-gray-500">Lần bảo dưỡng</p>
                    </CardContent>
                </Card>
            </div>

            {/* Charts Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Cost Trend Chart */}
                <Card className="border-none shadow-sm">
                    <CardHeader>
                        <CardTitle className="text-lg">Chi phí theo tháng</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <ResponsiveContainer width="100%" height={250}>
                            <AreaChart data={trendData}>
                                <defs>
                                    <linearGradient id="colorCost" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8} />
                                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                                <XAxis dataKey="month" fontSize={12} />
                                <YAxis fontSize={12} />
                                <Tooltip formatter={(value: any) => formatCurrency(value)} />
                                <Area type="monotone" dataKey="cost" stroke="#3b82f6" fillOpacity={1} fill="url(#colorCost)" />
                            </AreaChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>

                {/* Cost by Project Pie */}
                <Card className="border-none shadow-sm">
                    <CardHeader>
                        <CardTitle className="text-lg">Chi phí theo dự án</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <ResponsiveContainer width="100%" height={250}>
                            <PieChart>
                                <Pie
                                    data={costByProject}
                                    cx="50%"
                                    cy="50%"
                                    labelLine={false}
                                    label={(entry) => `${entry.name}: ${formatPercent((entry.value / costData.total) * 100)}`}
                                    outerRadius={80}
                                    fill="#8884d8"
                                    dataKey="value"
                                >
                                    {costByProject.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip formatter={(value: any) => formatCurrency(value)} />
                            </PieChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>
            </div>

            {/* Utilization Table */}
            <Card className="border-none shadow-sm">
                <CardHeader>
                    <CardTitle className="text-lg">Tỷ lệ sử dụng thiết bị</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-4 py-3 text-left font-medium text-gray-600">Mã máy</th>
                                    <th className="px-4 py-3 text-right font-medium text-gray-600">Giờ sử dụng</th>
                                    <th className="px-4 py-3 text-right font-medium text-gray-600">Tỷ lệ</th>
                                    <th className="px-4 py-3 text-center font-medium text-gray-600">Trạng thái</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {utilizationData.slice(0, 10).map((data, index) => (
                                    <tr key={index} className="hover:bg-gray-50">
                                        <td className="px-4 py-3 font-medium">{data.machineCode}</td>
                                        <td className="px-4 py-3 text-right font-mono">{data.hoursUsed}h</td>
                                        <td className="px-4 py-3 text-right font-mono font-semibold">
                                            {formatPercent(data.utilizationRate)}
                                        </td>
                                        <td className="px-4 py-3 text-center">
                                            <span className={`px-2 py-1 rounded-full text-xs font-bold ${data.status === 'high' ? 'bg-green-100 text-green-700' :
                                                data.status === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                                                    'bg-red-100 text-red-700'
                                                }`}>
                                                {data.status === 'high' ? 'Cao' : data.status === 'medium' ? 'Trung bình' : 'Thấp'}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
