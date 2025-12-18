import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

if (!supabaseUrl || !supabaseServiceRoleKey) {
    throw new Error("Missing Supabase server-side environment variables.")
}

/**
 * Supabase client for server-side operations.
 * USES SERVICE_ROLE_KEY: Bypasses Row Level Security (RLS).
 * Only use this in API routes or Server Actions.
 */
export const supabaseServer = createClient(supabaseUrl, supabaseServiceRoleKey, {
    auth: {
        autoRefreshToken: false,
        persistSession: false
    }
})
