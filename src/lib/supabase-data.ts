import { supabase } from '@/lib/supabaseClient';

/**
 * Fetches ALL rows from a Supabase table, bypassing the default 1000-row limit.
 * It uses pagination (range) to fetch data in chunks.
 * 
 * @param tableName The name of the table to fetch from.
 * @param options Optional configuration:
 *   - select: The columns to select (default: '*')
 *   - chunkSize: Number of rows to fetch per request (default: 1000)
 *   - filter: A callback to apply filters to the query builder (e.g. (query) => query.eq('status', 'active'))
 *   - onProgress: A callback to receive progress updates (loaded count)
 */
export async function fetchAllData<T = any>(
    tableName: string,
    options: {
        select?: string;
        chunkSize?: number;
        filter?: (query: any) => any;
        order?: { column: string, ascending?: boolean };
        onProgress?: (loadedCount: number) => void;
    } = {}
): Promise<{ data: T[] | null; error: any }> {
    const {
        select = '*',
        chunkSize = 1000,
        filter,
        order,
        onProgress
    } = options;

    let allData: T[] = [];
    let from = 0;
    let hasMore = true;
    let error = null;

    console.log(`[fetchAllData] Starting fetch for table: ${tableName}`);

    try {
        while (hasMore) {
            const to = from + chunkSize - 1;

            // Start building the query
            let query = supabase
                .from(tableName)
                .select(select)
                .range(from, to);

            // Apply custom filters if provided
            if (filter) {
                query = filter(query);
            }

            // Apply ordering if provided (important for consistent pagination)
            // Default to 'id' if not specified to ensure stability, but check if id exists? 
            // For now, let's rely on user provided order or Supabase default (usually insertion order).
            // Better to force an order if possible.
            if (order) {
                query = query.order(order.column, { ascending: order.ascending ?? true });
            }

            const { data: chunk, error: chunkError } = await query;

            if (chunkError) {
                console.error(`[fetchAllData] Error fetching chunk ${from}-${to}:`, chunkError);
                error = chunkError;
                break;
            }

            if (chunk && chunk.length > 0) {
                allData = [...allData, ...chunk as T[]];

                if (onProgress) {
                    onProgress(allData.length);
                }

                // If we got fewer rows than requested, we've reached the end
                if (chunk.length < chunkSize) {
                    hasMore = false;
                } else {
                    from += chunkSize;
                }
            } else {
                hasMore = false;
            }
        }
    } catch (err) {
        console.error(`[fetchAllData] Unexpected error:`, err);
        error = err;
    }

    console.log(`[fetchAllData] Completed. Total rows: ${allData.length}`);
    return { data: allData, error };
}
