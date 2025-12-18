import vi from './locales/vi.json'
import en from './locales/en.json'

export type Locale = 'vi' | 'en'

export const translations = {
    vi,
    en
}

export function getTranslations(locale: Locale = 'vi') {
    return translations[locale] || translations.vi
}

// Helper function to get nested translation
export function t(key: string, locale: Locale = 'vi'): string {
    const trans = getTranslations(locale)
    const keys = key.split('.')

    let value: any = trans
    for (const k of keys) {
        value = value?.[k]
    }

    return value || key
}

// Hook for client components
export function useTranslation(locale: Locale = 'vi') {
    const trans = getTranslations(locale)

    return {
        t: (key: string) => t(key, locale),
        translations: trans,
        locale
    }
}
