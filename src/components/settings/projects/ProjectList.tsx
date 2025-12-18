"use client"

import { useEffect, useState, useRef } from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { supabase } from "@/lib/supabaseClient"
import { Edit2, Trash2, Truck, ChevronDown, ChevronUp, FolderPlus, Circle, CheckCircle, Clock, Upload, User, UserPlus } from "lucide-react"
import { AddProjectDialog } from "./AddProjectDialog"
import { AssignUsersDialog } from "./AssignUsersDialog"
import * as XLSX from "xlsx"

export function ProjectList() {
    const [projects, setProjects] = useState<any[]>([])
    const [machines, setMachines] = useState<any[]>([])
    const [users, setUsers] = useState<any[]>([])
    const [loading, setLoading] = useState(true)

    const [expandedProject, setExpandedProject] = useState<number | null>(null)
    const [editingProject, setEditingProject] = useState<any>(null)
    const [assigningProject, setAssigningProject] = useState<any>(null)
    const [isAdding, setIsAdding] = useState(false)
    const fileInputRef = useRef<HTMLInputElement>(null)

    const fetchAll = async () => {
        setLoading(true)
        try {
            // Fetch Projects
            const { data: projData, error: projError } = await supabase
                .from('projects')
                .select('*')
                .order('id', { ascending: false })
                .range(0, 4999)

            if (projError) throw projError
            setProjects(projData || [])

            // Fetch Machines to count (limit raised to handle large datasets)
            // Fetch Machines - Client Side Loop to bypass 1000 limit
            let allMachines: any[] = []
            let hasMore = true
            let page = 0
            const pageSize = 1000

            while (hasMore) {
                const { data, error } = await supabase
                    .from('machines')
                    .select('id, code, project_name, status, project_id')
                    .range(page * pageSize, (page + 1) * pageSize - 1)

                if (error) {
                    console.error('Fetch error:', error)
                    break
                }

                if (data && data.length > 0) {
                    allMachines = [...allMachines, ...data]
                    if (data.length < pageSize) hasMore = false
                } else {
                    hasMore = false
                }
                page++
            }

            setMachines(allMachines)

            // Debug logging
            console.log(`Fetched ${allMachines.length} machines from database`)
            if (allMachines.length > 0) {
                console.log('Sample machine:', allMachines[0])
                // Group by project_name
                const byProject = allMachines.reduce((acc: any, m: any) => {
                    const proj = m.project_name || 'Unassigned'
                    acc[proj] = (acc[proj] || 0) + 1
                    return acc
                }, {})
                console.log('Machines grouped by project_name:', byProject)
            }


            // Fetch Users
            const { data: userData, error: userError } = await supabase
                .from('users')
                .select('*')
                .range(0, 4999)

            if (!userError) setUsers(userData || [])

        } catch (error) {
            console.error("Error fetching project data:", error)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchAll()
    }, [])

    const handleDelete = async (id: number) => {
        const count = getVehicleCount(id, projects.find(p => p.id === id)?.name)
        if (count > 0) {
            alert(`Không thể xóa! Có ${count} thiết bị đang gán cho dự án này.`)
            return
        }

        if (confirm("Bạn có chắc muốn xóa dự án này?")) {
            const { error } = await supabase.from('projects').delete().eq('id', id)
            if (error) {
                alert("Lỗi xóa: " + error.message)
            } else {
                fetchAll()
            }
        }
    }

    const getVehicleList = (projectId: number, projectName: string) => {
        return machines.filter(m => {
            // Match by project_id if available
            if (m.project_id && m.project_id === projectId) return true

            // Match by project_name (case-insensitive, trimmed)
            if (m.project_name && projectName) {
                const machineProject = m.project_name.toLowerCase().trim()
                const targetProject = projectName.toLowerCase().trim()

                // Exact match
                if (machineProject === targetProject) return true

                // Partial match (contains)
                if (machineProject.includes(targetProject) || targetProject.includes(machineProject)) return true
            }

            return false
        })
    }

    const getVehicleCount = (projectId: number, projectName: string) => {
        const count = getVehicleList(projectId, projectName).length
        console.log(`Project "${projectName}" (ID: ${projectId}): ${count} machines`)
        return count
    }

    const getProjectUsers = (projectId: number) => {
        return users.filter(u => {
            if (Array.isArray(u.assigned_projects)) {
                return u.assigned_projects.includes(projectId) || u.assigned_projects.includes(String(projectId)) || u.assigned_projects.includes(Number(projectId))
            }
            return false
        })
    }

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'completed':
                return <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-200 border-none"><CheckCircle className="w-3 h-3 mr-1" /> Hoàn thành</Badge>
            case 'paused':
                return <Badge className="bg-yellow-100 text-yellow-700 hover:bg-yellow-200 border-none"><Circle className="w-3 h-3 mr-1" /> Tạm dừng</Badge>
            default:
                return <Badge className="bg-green-100 text-green-700 hover:bg-green-200 border-none"><Circle className="w-3 h-3 mr-1" /> Đang thực hiện</Badge>
        }
    }

    const handleImportClick = () => {
        fileInputRef.current?.click()
    }

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return

        const reader = new FileReader()
        reader.onload = async (evt) => {
            try {
                setLoading(true) // Indicate loading
                const bstr = evt.target?.result
                const wb = XLSX.read(bstr, { type: 'binary' })
                const wsname = wb.SheetNames[0]
                const ws = wb.Sheets[wsname]
                const data = XLSX.utils.sheet_to_json(ws)

                if (!data || data.length === 0) {
                    alert("File không có dữ liệu!")
                    setLoading(false)
                    return
                }

                // 1. EXTRACT & IMPORT PROJECTS
                const uniqueProjects = new Map()
                data.forEach((row: any) => {
                    const projName = row['Dự Án'] || row['Project'] || row['Tên dự án'] // Flexible column names
                    if (projName) {
                        const trimmedName = String(projName).trim()
                        if (!uniqueProjects.has(trimmedName)) {
                            uniqueProjects.set(trimmedName, {
                                name: trimmedName,
                                description: row['Bộ Phận Sử dụng'] || row['Mô tả'] || '',
                                status: 'active',
                                // Basic code generation if missing
                                code: row['Mã dự án'] || `P-${trimmedName.substring(0, 3).toUpperCase()}-${Math.floor(Math.random() * 1000)}`
                            })
                        }
                    }
                })

                // A. Fetch existing projects to map Names -> IDs
                const { data: existingProjs } = await supabase.from('projects').select('id, name')
                const projectMap = new Map(existingProjs?.map(p => [p.name.trim().toLowerCase(), p.id]))

                // B. Filter and Insert NEW projects
                const newProjects = Array.from(uniqueProjects.values()).filter(p => !projectMap.has(p.name.trim().toLowerCase()))

                if (newProjects.length > 0) {
                    const { data: inserted, error: insertError } = await supabase.from('projects').insert(newProjects).select()
                    if (insertError) throw insertError

                    // Add newly inserted projects to our map
                    inserted.forEach(p => projectMap.set(p.name.trim().toLowerCase(), p.id))
                }

                // 2. IMPORT MACHINES (Mã Tài sản) & LINK TO PROJECTS
                const machineUpdates: any[] = []
                data.forEach((row: any) => {
                    const machineCode = row['Mã Tài sản'] || row['Machine Code'] || row['code']
                    const projName = row['Dự Án'] || row['Project'] || row['Tên dự án']

                    if (machineCode) {
                        const pid = projName ? projectMap.get(String(projName).trim().toLowerCase()) : null

                        machineUpdates.push({
                            code: String(machineCode).trim(),
                            name: row['Tên Tài sản'] || row['Name'] || String(machineCode).trim(),
                            project_id: pid || null, // Link to the project ID
                            description: row['Mô tả'] || row['Bộ Phận Sử dụng'] || '',
                            status: 'active' // Default active if imported
                        })
                    }
                })

                if (machineUpdates.length > 0) {
                    // Upsert machines: If code exists, update it (especially the project_id); if not, insert it.
                    const { error: machError } = await supabase.from('machines').upsert(machineUpdates, { onConflict: 'code' })
                    if (machError) throw machError
                }

                alert(`Thành công! Đã cập nhật ${uniqueProjects.size} dự án và ${machineUpdates.length} thiết bị.`)
                fetchAll()

            } catch (err: any) {
                console.error(err)
                alert("Lỗi nhập liệu: " + err.message)
                setLoading(false)
            } finally {
                // Reset input
                if (fileInputRef.current) fileInputRef.current.value = ''
            }
        }
        reader.readAsBinaryString(file)
    }

    // ... render return ...

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-white p-4 rounded-xl border border-slate-100 shadow-sm gap-4 sm:gap-0">
                <div className="flex items-center gap-3">
                    <div className="text-sm text-slate-500">
                        Dự án: <span className="font-bold text-slate-700">{projects.length}</span>
                    </div>
                    <div className="h-4 w-px bg-slate-300" />
                    <div className="text-sm text-slate-500">
                        Thiết bị: <span className="font-bold text-slate-700">{machines.length}</span>
                    </div>
                </div>

                <div className="flex gap-2 w-full sm:w-auto">
                    <input
                        type="file"
                        ref={fileInputRef}
                        className="hidden"
                        accept=".xlsx, .xls"
                        onChange={handleFileUpload}
                    />
                    <Button variant="outline" onClick={handleImportClick} className="w-full sm:w-auto">
                        <Upload className="w-4 h-4 mr-2" /> Import Excel
                    </Button>
                    <Button onClick={() => setIsAdding(true)} className="bg-blue-600 hover:bg-blue-700 w-full sm:w-auto">
                        <FolderPlus className="w-4 h-4 mr-2" /> Thêm dự án
                    </Button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {projects.map(project => {
                    const vehicleCount = getVehicleCount(project.id, project.name)
                    const machineList = getVehicleList(project.id, project.name)
                    const projectUsers = getProjectUsers(project.id)

                    return (
                        <div key={project.id} className="bg-white rounded-xl border border-slate-200 p-5 hover:shadow-lg transition-all duration-200 group">
                            <div className="flex justify-between items-start mb-3">
                                <div className="flex-1 min-w-0">
                                    <h3 className="text-lg font-bold text-slate-900 truncate" title={project.name}>{project.name}</h3>
                                    <p className="text-sm text-slate-500 font-mono mt-0.5">{project.code}</p>
                                </div>
                                <div className="flex gap-1 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                                    <Button size="icon" variant="ghost" className="h-8 w-8 text-blue-600 hover:bg-blue-50" onClick={() => setEditingProject(project)}>
                                        <Edit2 className="w-4 h-4" />
                                    </Button>
                                    <Button size="icon" variant="ghost" className="h-8 w-8 text-indigo-600 hover:bg-indigo-50" onClick={() => setAssigningProject(project)} title="Phân bổ nhân sự">
                                        <UserPlus className="w-4 h-4" />
                                    </Button>
                                    <Button size="icon" variant="ghost" className="h-8 w-8 text-red-600 hover:bg-red-50" onClick={() => handleDelete(project.id)}>
                                        <Trash2 className="w-4 h-4" />
                                    </Button>
                                </div>
                            </div>

                            <div className="space-y-3 text-sm">
                                <div className="flex justify-between items-center text-slate-600 bg-slate-50 p-2 rounded-lg">
                                    <span className="flex items-center gap-1.5 text-xs"><Clock className="w-3.5 h-3.5" /> Thời gian:</span>
                                    <div className="font-medium text-xs text-right">
                                        <div>{project.start_date ? new Date(project.start_date).toLocaleDateString('vi-VN') : 'N/A'}</div>
                                        {project.end_date && <div className="text-slate-400">{'->'} {new Date(project.end_date).toLocaleDateString('vi-VN')}</div>}
                                    </div>
                                </div>

                                <div className="flex justify-between items-center pt-1">
                                    <span className="text-slate-500 text-xs uppercase font-semibold tracking-wider">Trạng thái</span>
                                    {getStatusBadge(project.status)}
                                </div>

                                {/* USERS LIST */}
                                <div className="flex justify-between items-center pt-2 mt-2 border-t border-slate-50">
                                    <span className="text-slate-500 text-xs font-semibold flex items-center gap-1.5"><User className="w-3.5 h-3.5" /> NHÂN SỰ</span>
                                    <div className="flex -space-x-1.5 hover:space-x-1 transition-all">
                                        {projectUsers.length > 0 ? projectUsers.slice(0, 5).map(u => (
                                            <div key={u.id} className="w-6 h-6 rounded-full bg-slate-200 border-[1.5px] border-white flex items-center justify-center text-[9px] font-bold text-slate-600 uppercase shadow-sm cursor-pointer hover:scale-110 transition-transform hover:z-10" title={u.name}>
                                                {u.name.charAt(0)}
                                            </div>
                                        )) : <span className="text-xs text-slate-400 italic">--</span>}
                                        {projectUsers.length > 5 && <div className="w-6 h-6 rounded-full bg-slate-100 border-[1.5px] border-white flex items-center justify-center text-[9px] text-slate-500 shadow-sm">+{projectUsers.length - 5}</div>}
                                    </div>
                                </div>

                                <div
                                    className={`flex justify-between items-center pt-3 border-t border-slate-100 cursor-pointer hover:bg-slate-50 -mx-2 px-2 py-1.5 rounded transition-colors ${expandedProject === project.id ? 'bg-slate-50' : ''}`}
                                    onClick={() => setExpandedProject(expandedProject === project.id ? null : project.id)}
                                >
                                    <span className="text-slate-500 flex items-center gap-1.5 text-xs font-semibold">
                                        {expandedProject === project.id ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                                        DANH SÁCH THIẾT BỊ
                                    </span>
                                    <span className="font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded text-xs">{vehicleCount} xe</span>
                                </div>

                                {/* Vehicle List - Expandable */}
                                {expandedProject === project.id && (
                                    <div className="pt-0 mt-0 max-h-48 overflow-y-auto animate-in slide-in-from-top-2">
                                        {machineList.length > 0 ? (
                                            <div className="flex flex-wrap gap-1.5 p-1">
                                                {machineList.map(vehicle => (
                                                    <span key={vehicle.id} className="inline-flex items-center px-2 py-1 bg-white border border-slate-200 text-slate-700 text-xs rounded hover:border-blue-300 transition-colors">
                                                        <Truck className="w-3 h-3 mr-1.5 text-slate-400" />
                                                        <span className="font-mono">{vehicle.code || vehicle.plateNumber}</span>
                                                    </span>
                                                ))}
                                            </div>
                                        ) : (
                                            <p className="text-xs text-slate-400 italic text-center py-2">Chưa có thiết bị nào</p>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>
                    )
                })}

                {projects.length === 0 && (
                    <div className="col-span-full text-center py-16 bg-white rounded-xl border border-dashed border-slate-300">
                        <FolderPlus className="w-12 h-12 mx-auto mb-3 text-slate-300" />
                        <h3 className="text-lg font-medium text-slate-900">Chưa có dự án nào</h3>
                        <p className="text-slate-500 mb-4 max-w-sm mx-auto">Tạo dự án mới để bắt đầu quản lý thiết bị và nhân sự theo công trường.</p>
                    </div>
                )}
            </div>

            {/* Edit Dialog */}
            <AddProjectDialog
                open={!!editingProject}
                onOpenChange={(open) => !open && setEditingProject(null)}
                project={editingProject}
                onSuccess={() => {
                    setEditingProject(null)
                    fetchAll()
                }}
            />

            {/* Add Dialog */}
            <AddProjectDialog
                open={isAdding}
                onOpenChange={setIsAdding}
                onSuccess={() => {
                    setIsAdding(false)
                    fetchAll()
                }}
            />

            {/* Assign Users Dialog */}
            <AssignUsersDialog
                open={!!assigningProject}
                onOpenChange={(open) => !open && setAssigningProject(null)}
                project={assigningProject}
                onSuccess={() => {
                    setAssigningProject(null)
                    fetchAll()
                }}
            />
        </div>
    )
}
