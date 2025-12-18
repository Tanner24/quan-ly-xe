import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabaseClient'

// GET /api/v1/machines/:id - Get single machine
export async function GET(
    request: Request,
    { params }: { params: { id: string } }
) {
    try {
        const apiKey = request.headers.get('x-api-key')

        if (!apiKey || apiKey !== process.env.API_KEY) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            )
        }

        const { data, error } = await supabase
            .from('machines')
            .select('*')
            .eq('id', params.id)
            .single()

        if (error) {
            if (error.code === 'PGRST116') {
                return NextResponse.json(
                    { error: 'Not Found', message: 'Machine not found' },
                    { status: 404 }
                )
            }
            throw error
        }

        return NextResponse.json({
            success: true,
            data
        })
    } catch (error: any) {
        return NextResponse.json(
            { error: 'Internal Server Error', message: error.message },
            { status: 500 }
        )
    }
}

// PUT /api/v1/machines/:id - Update machine
export async function PUT(
    request: Request,
    { params }: { params: { id: string } }
) {
    try {
        const apiKey = request.headers.get('x-api-key')

        if (!apiKey || apiKey !== process.env.API_KEY) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            )
        }

        const body = await request.json()

        const { data, error } = await supabase
            .from('machines')
            .update(body)
            .eq('id', params.id)
            .select()
            .single()

        if (error) {
            if (error.code === 'PGRST116') {
                return NextResponse.json(
                    { error: 'Not Found' },
                    { status: 404 }
                )
            }
            throw error
        }

        return NextResponse.json({
            success: true,
            data
        })
    } catch (error: any) {
        return NextResponse.json(
            { error: 'Internal Server Error', message: error.message },
            { status: 500 }
        )
    }
}

// DELETE /api/v1/machines/:id - Delete machine
export async function DELETE(
    request: Request,
    { params }: { params: { id: string } }
) {
    try {
        const apiKey = request.headers.get('x-api-key')

        if (!apiKey || apiKey !== process.env.API_KEY) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            )
        }

        const { error } = await supabase
            .from('machines')
            .delete()
            .eq('id', params.id)

        if (error) throw error

        return NextResponse.json({
            success: true,
            message: 'Machine deleted successfully'
        })
    } catch (error: any) {
        return NextResponse.json(
            { error: 'Internal Server Error', message: error.message },
            { status: 500 }
        )
    }
}
