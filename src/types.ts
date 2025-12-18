export interface Machine {
    id: string
    code: string
    name: string
    model: string
    current_hours: number
    status: 'active' | 'maintenance' | 'broken' | 'disposed'
    description?: string
    group?: string
    project_name?: string
    created_at?: string
    updated_at?: string
}

export interface DailyLog {
    id: string
    machine_id: string
    date: string
    hours_added: number
    fuel_consumed: number
    created_at: string
}

export interface MaintenanceStandard {
    id: string
    machine_code: string
    name: string
    hours_interval: number
    description?: string
    notes?: string
    created_at?: string
}

export interface MaintenanceHistory {
    id: string
    machine_code: string
    date: string
    task_name: string
    maintenance_level?: string
    hours_at_maintenance?: number
    notes?: string
    created_at?: string
}
