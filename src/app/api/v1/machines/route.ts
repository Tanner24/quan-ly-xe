import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabaseClient'

// GET /api/v1/machines - List all machines
export async function GET(request: Request) {
    try {
        // Get API key from header
        const apiKey = request.headers.get('x-api-key')

        // Verify API key (in production, check against database)
        if (!apiKey || apiKey !== process.env.API_KEY) {
            return NextResponse.json(
                { error: 'Unauthorized', message: 'Invalid or missing API key' },
                { status: 401 }
            )
        }

        // Parse query parameters
        const { searchParams } = new URL(request.url)
        const limit = parseInt(searchParams.get('limit') || '100')
        const offset = parseInt(searchParams.get('offset') || '0')
        const status = searchParams.get('status')
        const project = searchParams.get('project')

        // Build query
        let query = supabase
            .from('machines')
            .select('*', { count: 'exact' })
            .range(offset, offset + limit - 1)
            .order('created_at', { ascending: false })

        // Apply filters
        if (status) query = query.eq('status', status)
        if (project) query = query.eq('project_name', project)

        const { data, error, count } = await query

        if (error) throw error

        return NextResponse.json({
            success: true,
            data,
            pagination: {
                total: count || 0,
                limit,
                offset,
                hasMore: (count || 0) > offset + limit
            }
        })
    } catch (error: any) {
        return NextResponse.json(
            { error: 'Internal Server Error', message: error.message },
            { status: 500 }
        )
    }
}

// POST /api/v1/machines - Create new machine
export async function POST(request: Request) {
    try {
        const apiKey = request.headers.get('x-api-key')

        if (!apiKey || apiKey !== process.env.API_KEY) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            )
        }

        const body = await request.json()

        // Validate required fields
        if (!body.code) {
            return NextResponse.json(
                { error: 'Bad Request', message: 'Machine code is required' },
                { status: 400 }
            )
        }

        const { data, error } = await supabase
            .from('machines')
            .insert([{
                code: body.code,
                name: body.name,
                model: body.model,
                brand: body.brand,
                status: body.status || 'active',
                project_name: body.project_name,
                current_hours: body.current_hours || 0,
                serial_number: body.serial_number
            }])
            .select()
            .single()

        if (error) {
            if (error.code === '23505') { // Unique violation
                return NextResponse.json(
                    { error: 'Conflict', message: 'Machine code already exists' },
                    { status: 409 }
                )
            }
            throw error
        }

        return NextResponse.json({
            success: true,
            data
        }, { status: 201 })
    } catch (error: any) {
        return NextResponse.json(
            { error: 'Internal Server Error', message: error.message },
            { status: 500 }
        )
    }
}
