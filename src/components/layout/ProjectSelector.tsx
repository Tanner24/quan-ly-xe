"use client"

import { useEffect, useState } from "react"
import { Check, ChevronsUpDown, Folder, Loader2 } from "lucide-react"
import { supabase } from "@/lib/supabaseClient"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"

interface Project {
    id: number | string
    name: string
}

export function ProjectSelector() {
    const [projects, setProjects] = useState<Project[]>([])
    const [selectedProject, setSelectedProject] = useState<string>("all")
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        let isMounted = true

        const fetchProjects = async () => {
            try {
                setLoading(true)
                setError(null)

                const { data, error: fetchError } = await supabase
                    .from('projects')
                    .select('id, name')
                    .order('name', { ascending: true })

                if (fetchError) {
                    throw fetchError
                }

                if (isMounted && data) {
                    setProjects(data)
                    console.log('ProjectSelector: Loaded', data.length, 'projects')
                }
            } catch (err: any) {
                console.error('ProjectSelector: Error fetching projects:', err)
                if (isMounted) {
                    setError(err.message || 'Failed to load projects')
                }
            } finally {
                if (isMounted) {
                    setLoading(false)
                }
            }
        }

        // Load saved selection from localStorage
        const saved = localStorage.getItem('vincons_current_project')
        if (saved) {
            setSelectedProject(saved)
        }

        // Fetch projects
        fetchProjects()

        // Cleanup
        return () => {
            isMounted = false
        }
    }, [])

    const handleSelect = (value: string) => {
        setSelectedProject(value)
        localStorage.setItem('vincons_current_project', value)

        // Dispatch event for other components to listen
        window.dispatchEvent(new CustomEvent('project-changed', { detail: value }))

        console.log('ProjectSelector: Selected project changed to', value)
    }

    const getSelectedLabel = () => {
        if (loading) return "Đang tải..."
        if (selectedProject === "all") return "Tất cả dự án"

        const project = projects.find(p => String(p.id) === selectedProject)
        return project?.name || "Chọn dự án"
    }

    if (error) {
        return (
            <div className="flex items-center gap-2 px-3 py-1 bg-red-50 text-red-600 rounded-md text-sm">
                <span>Lỗi tải dự án</span>
            </div>
        )
    }

    return (
        <div className="flex items-center gap-2">
            <Select value={selectedProject} onValueChange={handleSelect} disabled={loading}>
                <SelectTrigger className="w-[200px] h-9 bg-blue-600 text-white border-blue-500 hover:bg-blue-700/90 focus:ring-blue-500 transition-colors disabled:opacity-70">
                    <div className="flex items-center gap-2 truncate">
                        {loading ? (
                            <Loader2 className="w-4 h-4 text-blue-200 animate-spin" />
                        ) : (
                            <Folder className="w-4 h-4 text-blue-200" />
                        )}
                        <span className="font-medium truncate">
                            {getSelectedLabel()}
                        </span>
                    </div>
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="all" className="font-semibold text-blue-600">
                        <div className="flex items-center gap-2">
                            <Folder className="w-4 h-4" />
                            Tất cả dự án
                        </div>
                    </SelectItem>
                    {projects.map((p) => (
                        <SelectItem key={p.id} value={String(p.id)}>
                            {p.name}
                        </SelectItem>
                    ))}
                </SelectContent>
            </Select>
        </div>
    )
}
