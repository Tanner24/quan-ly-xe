"use client"

import * as React from "react"
import { Check, ChevronsUpDown } from "lucide-react"
import { supabase } from "@/lib/supabaseClient"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from "@/components/ui/command"
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"

import { Machine } from "@/types"

export function DailyEntryForm() {
    const [open, setOpen] = React.useState(false)
    const [value, setValue] = React.useState("")
    const [machines, setMachines] = React.useState<Pick<Machine, "id" | "code" | "name">[]>([])
    const [hours, setHours] = React.useState("")
    const [fuel, setFuel] = React.useState("")
    const [loading, setLoading] = React.useState(false)
    const [search, setSearch] = React.useState("")

    React.useEffect(() => {
        const fetchMachines = async () => {

            const { data, error } = await supabase
                .from("machines")
                .select("id, code, name")
                .ilike("code", `%${search}%`) // Simple search by code
                .limit(20)

            if (data) setMachines(data as unknown as Pick<Machine, "id" | "code" | "name">[])
            if (error) console.error(error)
        }
        const timeout = setTimeout(fetchMachines, 300)
        return () => clearTimeout(timeout)
    }, [search])

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!value || !hours) return

        setLoading(true)
        const { error } = await supabase.from("daily_logs").insert({
            machine_id: value,
            hours_added: parseFloat(hours),
            fuel_consumed: fuel ? parseFloat(fuel) : 0,
        })

        setLoading(false)

        if (error) {
            alert("Error logging entry: " + error.message)
        } else {
            alert("Entry logged successfully!")
            setHours("")
            setFuel("")
            setValue("")
        }
    }

    return (
        <Card className="w-full max-w-md mx-auto">
            <CardHeader>
                <CardTitle>Daily Log Entry</CardTitle>
            </CardHeader>
            <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="flex flex-col space-y-2">
                        <Label>Machine Code</Label>
                        <Popover open={open} onOpenChange={setOpen}>
                            <PopoverTrigger asChild>
                                <Button
                                    variant="outline"
                                    role="combobox"
                                    aria-expanded={open}
                                    className="w-full justify-between"
                                >
                                    {value
                                        ? machines.find((m) => m.id === value)?.code || "Selected"
                                        : "Select machine..."}
                                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-[300px] p-0">
                                <Command shouldFilter={false}>
                                    <CommandInput placeholder="Search machine code..." onValueChange={setSearch} />
                                    <CommandList>
                                        <CommandEmpty>No machine found.</CommandEmpty>
                                        <CommandGroup>
                                            {machines.map((machine) => (
                                                <CommandItem
                                                    key={machine.id}
                                                    value={machine.id} // We use ID as value
                                                    onSelect={(currentValue) => {
                                                        setValue(currentValue === value ? "" : currentValue)
                                                        setOpen(false)
                                                    }}
                                                >
                                                    <Check
                                                        className={cn(
                                                            "mr-2 h-4 w-4",
                                                            value === machine.id ? "opacity-100" : "opacity-0"
                                                        )}
                                                    />
                                                    {machine.code} - {machine.name}
                                                </CommandItem>
                                            ))}
                                        </CommandGroup>
                                    </CommandList>
                                </Command>
                            </PopoverContent>
                        </Popover>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="hours">Hours Worked</Label>
                        <Input
                            id="hours"
                            type="number"
                            step="0.1"
                            placeholder="e.g. 8.5"
                            value={hours}
                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setHours(e.target.value)}
                            required
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="fuel">Fuel Consumed (L) (Optional)</Label>
                        <Input
                            id="fuel"
                            type="number"
                            step="0.1"
                            placeholder="e.g. 50"
                            value={fuel}
                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFuel(e.target.value)}
                        />
                    </div>

                    <Button type="submit" className="w-full" disabled={loading}>
                        {loading ? "Submitting..." : "Submit Log"}
                    </Button>
                </form>
            </CardContent>
        </Card>
    )
}
