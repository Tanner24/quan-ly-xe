import { NextResponse } from 'next/server';
import { getMachines } from '../../../services/machineService';

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);

        // Parse query params
        const page = parseInt(searchParams.get('page') || '1');
        const limit = parseInt(searchParams.get('limit') || '50'); // Can be increased to 1000+
        const status = searchParams.get('status') || undefined;
        const search = searchParams.get('search') || undefined;

        // Fetch data using the Service Layer
        const result = await getMachines({ page, limit, status, search });

        return NextResponse.json(result);

    } catch (error: any) {
        console.error("API Error:", error);
        return NextResponse.json(
            { error: error.message || 'Internal Server Error' },
            { status: 500 }
        );
    }
}
