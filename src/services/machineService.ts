import { supabaseServer } from '../lib/supabaseServer';

/**
 * @file machineService.ts
 * @description Data Access Layer for Machines/Assets. 
 * Uses the Service Role Key via supabaseServer to bypass RLS and limits.
 */

export type MachineFilter = {
    page?: number;
    limit?: number;
    status?: string;
    search?: string;
    project?: string;
    sort?: string;
};

export async function getMachines({
    page = 1,
    limit = 50,
    status,
    search,
    project,
    sort
}: MachineFilter) {
    // Calculate range for pagination
    const from = (page - 1) * limit;
    const to = from + limit - 1;

    // Start building the query
    // NOTE: Using 'machines' table as per DB schema.
    let query = supabaseServer
        .from('machines')
        .select('*', { count: 'exact' });

    // Apply Filter: Status
    if (status && status !== 'all') {
        query = query.eq('status', status);
    }

    // Apply Filter: Project Name
    if (project && project !== 'all') {
        query = query.eq('project_name', project);
    }

    // Apply Filter: Search (check both name and code)
    if (search) {
        query = query.or(`name.ilike.%${search}%,code.ilike.%${search}%`);
    }

    // Apply Sorting
    if (sort === 'hours_desc') {
        query = query.order('current_hours', { ascending: false });
    } else if (sort === 'code_desc') {
        query = query.order('code', { ascending: false });
    } else if (sort === 'code_asc') {
        query = query.order('code', { ascending: true });
    } else {
        query = query.order('created_at', { ascending: false }); // Default new items first
    }

    // Execute query with range
    // supabaseServer uses service_role_key, so RLS policies are bypassed.
    const { data, count, error } = await query
        .range(from, to);

    if (error) {
        throw new Error(`DB Error: ${error.message}`);
    }

    return {
        data: data || [],
        meta: {
            total: count || 0,
            page,
            limit,
            totalPages: Math.ceil((count || 0) / limit)
        }
    };
}
