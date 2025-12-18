"use client"

import { createContext, useContext, useEffect, useState } from 'react'

type Theme = 'light' | 'dark' | 'system'

interface ThemeContextType {
    theme: Theme
    setTheme: (theme: Theme) => void
    resolvedTheme: 'light' | 'dark'
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined)

export function ThemeProvider({ children }: { children: React.ReactNode }) {
    const [theme, setThemeState] = useState<Theme>('system')
    const [resolvedTheme, setResolvedTheme] = useState<'light' | 'dark'>('light')

    useEffect(() => {
        // Load theme from localStorage
        const savedTheme = localStorage.getItem('theme') as Theme | null
        if (savedTheme) {
            setThemeState(savedTheme)
        }
    }, [])

    useEffect(() => {
        const root = window.document.documentElement

        // Determine the actual theme to apply
        let applied: 'light' | 'dark'

        if (theme === 'system') {
            const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
            applied = systemTheme
        } else {
            applied = theme
        }

        setResolvedTheme(applied)
        root.classList.remove('light', 'dark')
        root.classList.add(applied)
    }, [theme])

    const setTheme = (newTheme: Theme) => {
        setThemeState(newTheme)
        localStorage.setItem('theme', newTheme)
    }

    return (
        <ThemeContext.Provider value={{ theme, setTheme, resolvedTheme }}>
            {children}
        </ThemeContext.Provider>
    )
}

export function useTheme() {
    const context = useContext(ThemeContext)
    if (!context) {
        throw new Error('useTheme must be used within ThemeProvider')
    }
    return context
}
