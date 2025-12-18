"use client"

import * as React from "react"
import { supabase } from "@/lib/supabaseClient"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"

import { Machine } from "@/types"

export function MachineList() {
    const [machines, setMachines] = React.useState<Machine[]>([])
    const [search, setSearch] = React.useState("")
    const [loading, setLoading] = React.useState(true)

    const fetchMachines = React.useCallback(async () => {
        setLoading(true)
        try {
            // CŨ: query trực tiếp từ frontend (bị giới hạn 1000)
            /*
            let query = supabase
                .from("machines")
                .select("*")
                .order("code", { ascending: true })
            if (search) {
                query = query.or(`code.ilike.%${search}%,name.ilike.%${search}%`)
            }
            const { data, error } = await query
            */

            // MỚI: Gọi qua API nội bộ (Không giới hạn 1000)
            const url = new URL('/api/assets', window.location.origin)
            url.searchParams.append('limit', '10000') // Lấy tối đa 10k rows
            if (search) url.searchParams.append('search', search)

            const response = await fetch(url.toString())
            const result = await response.json()

            if (!response.ok) throw new Error(result.error || 'Failed to fetch')

            setMachines(result.data || [])
        } catch (error) {
            console.error("Error fetching machines:", error)
        } finally {
            setLoading(false)
        }
    }, [search])

    React.useEffect(() => {
        const timeout = setTimeout(fetchMachines, 500)
        return () => clearTimeout(timeout)
    }, [fetchMachines])

    return (
        <div className="space-y-4 max-w-4xl mx-auto p-4">
            <div className="flex gap-2">
                <Input
                    placeholder="Search by code or name..."
                    value={search}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearch(e.target.value)}
                    className="max-w-sm"
                />
                <Button onClick={fetchMachines}>Search</Button>
            </div>

            {loading ? (
                <div>Loading...</div>
            ) : (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {machines.map((machine) => (
                        <Card key={machine.id}>
                            <CardHeader className="pb-2">
                                <CardTitle className="text-lg flex justify-between">
                                    <span>{machine.code}</span>
                                    <span className={machine.status === 'active' ? 'text-green-600' : 'text-red-500'}>
                                        {machine.status}
                                    </span>
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="text-sm text-gray-600 space-y-1">
                                    <p><strong>Name:</strong> {machine.name}</p>
                                    <p><strong>Model:</strong> {machine.model}</p>
                                    <p><strong>Hours:</strong> {machine.current_hours.toLocaleString()} h</p>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                    {machines.length === 0 && <div className="col-span-full text-center py-10">No machines found</div>}
                </div>
            )}
        </div>
    )
}
