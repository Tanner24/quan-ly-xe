
import { NextRequest, NextResponse } from "next/server";
import * as XLSX from "xlsx";

// --- HELPERS (Copied logic for consistency) ---
const normalizeKey = (key: any) => key ? key.toString().toLowerCase().replace(/[^a-z0-9]/g, '') : '';

const parseExcelDate = (value: any) => {
    if (!value) return null;
    if (value instanceof Date) return value;
    if (typeof value === 'number') {
        if (value < 1000) return null;
        return new Date(Math.round((value - 25569) * 86400 * 1000));
    }
    if (typeof value === 'string') {
        const parts = value.split(/[\/\-\.]/);
        // Simple heuristic for DD/MM/YYYY
        if (parts.length === 3) {
            const d = parseInt(parts[0]);
            const m = parseInt(parts[1]);
            const y = parseInt(parts[2]);
            if (y > 100 && y < 2000) return new Date(y + 2000, m - 1, d);
            if (y > 1900) return new Date(y, m - 1, d);
        }
        const d = new Date(value);
        if (!isNaN(d.getTime())) return d;
    }
    return null;
};

// Mapping definitions
const MAP_HEADERS: Record<string, string> = {
    'biensomat': 'code', 'mataisan': 'code', 'mats': 'code', 'maxe': 'code',
    'bophan': 'department',
    'duan': 'project_name',
    'giomay': 'current_hours', 'socan': 'current_hours',
    'km': 'current_km',
    'dinhmucbaoduong': 'maintenance_interval', 'chukybd': 'maintenance_interval',
    'ngay': 'date', 'ngaythang': 'date',
    'loai': 'type',
    'chiphi': 'cost',
    'noidung': 'note',
    'congviec': 'task_name',
    'capbaoduong': 'maintenance_level',
    'bienphap': 'fix_steps',
    'tenvattu': 'name',
    'nhom': 'group',
    'madanhdiem': 'code',
    'madonaldson': 'donaldson_code',
    'soluong': 'quantity',
    'dvt': 'unit',
    'maloi': 'code',
    'mota': 'description',
    'cachkhacphuc': 'fix_steps',
    'hours_added': 'hours_added', 'hoatdong': 'hours_added'
};

export async function POST(req: NextRequest) {
    try {
        const formData = await req.formData();
        const file = formData.get("file") as File;

        if (!file) {
            return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
        }

        // Validate File Type
        const validTypes = [
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", // .xlsx
            "application/vnd.ms-excel", // .xls
            "text/csv"
        ];
        // Note: Some browsers send empty type or generic type, so checking extension is safer backup
        if (!validTypes.includes(file.type) && !file.name.match(/\.(xlsx|xls|csv)$/i)) {
            return NextResponse.json({ error: "Invalid file type. Only Excel/CSV allowed." }, { status: 400 });
        }

        // Read Buffer
        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        // Parse Excel
        const workbook = XLSX.read(buffer, { type: "buffer" });

        if (workbook.SheetNames.length === 0) {
            return NextResponse.json({ error: "Excel file is empty (no sheets)" }, { status: 400 });
        }

        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];

        // Convert to JSON (Array of Arrays) to preserve headers
        const rawData = XLSX.utils.sheet_to_json(sheet, { header: 1 }) as any[][];

        if (!rawData || rawData.length < 2) {
            return NextResponse.json({ error: "Sheet is empty or missing headers" }, { status: 400 });
        }

        // --- PROCESSING LOGIC (Server-Side) ---
        // 1. Map Headers
        const headers = rawData[0] as string[];
        const mappedIndices: Record<number, string> = {};
        headers.forEach((h, index) => {
            const norm = normalizeKey(h);
            for (const [k, v] of Object.entries(MAP_HEADERS)) {
                if (norm.includes(k)) {
                    mappedIndices[index] = v;
                    break;
                }
            }
        });

        // 2. Identify Type
        const typeScore: Record<string, number> = { machines: 0, daily_logs: 0, maintenance_history: 0, parts: 0, error_codes: 0 };
        Object.values(mappedIndices).forEach(key => {
            if (['code', 'model', 'serial_number', 'current_hours', 'next_maintenance_hours'].includes(key)) typeScore.machines++;
            if (['hours_added', 'odo_km', 'fuel_consumed'].includes(key)) typeScore.daily_logs++;
            if (['task_name', 'performer', 'cost', 'maintenance_level'].includes(key)) typeScore.maintenance_history++;
            if (['part_number', 'equivalents'].includes(key)) typeScore.parts++;
            if (['fix_steps'].includes(key)) typeScore.error_codes++;
        });

        let targetType = 'machines';
        let maxScore = 0;
        for (const [t, s] of Object.entries(typeScore)) {
            if (s > maxScore) {
                maxScore = s;
                targetType = t;
            }
        }

        // 3. Process Rows
        const rows: any[] = [];
        for (let i = 1; i < rawData.length; i++) {
            const row = rawData[i];
            if (!row || row.length === 0) continue;

            const rowObj: any = {};
            let hasData = false;

            Object.entries(mappedIndices).forEach(([idxStr, key]) => {
                const idx = parseInt(idxStr);
                if (row[idx] !== undefined) {
                    let val = row[idx];
                    if (key === 'date') {
                        const d = parseExcelDate(val);
                        if (d) val = d.toISOString();
                        else val = null;
                    }
                    if (key === 'code' || key === 'part_number') val = String(val).trim();

                    if (val !== null && val !== '') {
                        rowObj[key] = val;
                        hasData = true;
                    }
                }
            });

            // Specific Validation
            if (targetType === 'machines' && !rowObj['code']) continue;

            if (hasData) rows.push(rowObj);
        }

        // 4. BATCH IMPORT TO SUPABASE (Server-side)
        const BATCH_SIZE = 500;
        let successCount = 0;
        let errorCount = 0;

        // Import supabaseServer with Service Role Key
        const { supabaseServer } = await import("@/lib/supabaseServer");

        // Determine Table and Conflict Key
        let tableName = 'machines';
        let conflictKey = 'code';

        switch (targetType) {
            case 'machines': tableName = 'machines'; conflictKey = 'code'; break;
            case 'daily_logs': tableName = 'daily_logs'; conflictKey = 'id'; break; // logs usually insert only
            case 'maintenance_history': tableName = 'maintenance_history'; conflictKey = 'id'; break;
            case 'parts': tableName = 'parts'; conflictKey = 'part_number'; break;
            case 'error_codes': tableName = 'error_codes'; conflictKey = 'code'; break;
        }

        for (let i = 0; i < rows.length; i += BATCH_SIZE) {
            const chunk = rows.slice(i, i + BATCH_SIZE);

            try {
                let error;
                if (targetType === 'machines' || targetType === 'parts' || targetType === 'error_codes') {
                    // Upsert for master data
                    const res = await supabaseServer
                        .from(tableName)
                        .upsert(chunk, { onConflict: conflictKey, ignoreDuplicates: false });
                    error = res.error;
                } else {
                    // Insert for logs/history
                    const res = await supabaseServer
                        .from(tableName)
                        .insert(chunk);
                    error = res.error;
                }

                if (error) {
                    console.error(`Batch ${i} Error:`, error);
                    errorCount += chunk.length;
                } else {
                    successCount += chunk.length;
                }
            } catch (err) {
                console.error(`Batch ${i} Exception:`, err);
                errorCount += chunk.length;
            }
        }

        return NextResponse.json({
            success: true,
            type: targetType,
            total: rows.length,
            imported: successCount,
            failed: errorCount,
            firstRow: rows[0]
        });

    } catch (error: any) {
        console.error("Excel Parsing Error:", error);
        return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
    }
}
