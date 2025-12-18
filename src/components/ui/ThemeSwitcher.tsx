"use client"

import { useTheme } from '@/contexts/ThemeContext'
import { Moon, Sun, Monitor } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

export function ThemeSwitcher() {
    const { theme, setTheme, resolvedTheme } = useTheme()

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="rounded-lg">
                    {resolvedTheme === 'dark' ? (
                        <Moon className="h-5 w-5" />
                    ) : (
                        <Sun className="h-5 w-5" />
                    )}
                    <span className="sr-only">Toggle theme</span>
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-40">
                <DropdownMenuItem onClick={() => setTheme('light')} className="cursor-pointer">
                    <Sun className="mr-2 h-4 w-4" />
                    <span>Light</span>
                    {theme === 'light' && <span className="ml-auto">✓</span>}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setTheme('dark')} className="cursor-pointer">
                    <Moon className="mr-2 h-4 w-4" />
                    <span>Dark</span>
                    {theme === 'dark' && <span className="ml-auto">✓</span>}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setTheme('system')} className="cursor-pointer">
                    <Monitor className="mr-2 h-4 w-4" />
                    <span>System</span>
                    {theme === 'system' && <span className="ml-auto">✓</span>}
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    )
}
