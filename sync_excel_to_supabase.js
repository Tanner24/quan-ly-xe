
const { createClient } = require('@supabase/supabase-js');
const XLSX = require('xlsx');
const fs = require('fs');
const path = require('path');

// --- 1. CONFIGURATION & SETUP ---

// Function to load env variables from .env.local manually
function loadEnv() {
    try {
        const envPath = path.resolve(process.cwd(), '.env.local');
        if (!fs.existsSync(envPath)) return {};
        const envContent = fs.readFileSync(envPath, 'utf8');
        const env = {};
        envContent.split('\n').forEach(line => {
            const parts = line.split('=');
            if (parts.length >= 2) {
                const key = parts[0].trim();
                const value = parts.slice(1).join('=').trim().replace(/"/g, '');
                if (key && !key.startsWith('#')) env[key] = value;
            }
        });
        return env;
    } catch (e) {
        console.error("Error loading .env.local:", e);
        return {};
    }
}

const env = loadEnv();
const SUPABASE_URL = env.NEXT_PUBLIC_SUPABASE_URL;
// Try to find a Service Role Key for full access, otherwise fall back to Anon Key
const SUPABASE_KEY = env.SUPABASE_SERVICE_ROLE_KEY || env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
    console.error("❌ Missing Supabase Credentials in .env.local");
    console.error("Make sure NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY (or NEXT_PUBLIC_SUPABASE_ANON_KEY) are set.");
    process.exit(1);
}

console.log(`🔌 Connecting to Supabase: ${SUPABASE_URL}`);
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
    auth: { persistSession: false }
});

// Helper: Excel Date Parser
const parseDate = (excelDate) => {
    if (!excelDate) return null;
    if (typeof excelDate === 'number') {
        return new Date(Math.round((excelDate - 25569) * 86400 * 1000)).toISOString().split('T')[0];
    }
    return excelDate; // String assumption
};

// Helper: Clean Number
const cleanNumber = (val) => {
    if (val === null || val === undefined) return null;
    if (typeof val === 'number') return val;
    // Remove non-numeric chars except dot
    const cleaned = String(val).replace(/[^0-9.]/g, '');
    return parseFloat(cleaned) || 0;
};

// Helper: Sleep
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// --- 2. DATA PROCESSING FUNCTIONS ---

const machinesBatch = [];
const maintenanceBatch = [];
const BATCH_SIZE = 100;

// Process Vehicles
const processVehicles = (filePath) => {
    console.log(`📂 Processing Machines: ${filePath}`);
    if (!fs.existsSync(filePath)) return;

    const workbook = XLSX.readFile(filePath);
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const data = XLSX.utils.sheet_to_json(sheet, { header: 1 });

    let headerRowIdx = -1;
    for (let i = 0; i < Math.min(20, data.length); i++) {
        const row = data[i];
        if (row.some(cell => String(cell).includes("Mã quản lý") || String(cell).includes("Tên máy móc"))) {
            headerRowIdx = i;
            break;
        }
    }

    if (headerRowIdx === -1) return;

    const headers = data[headerRowIdx];
    const rows = data.slice(headerRowIdx + 1);

    const colMap = {
        code: headers.findIndex(h => h && h.includes("Mã quản lý")),
        name: headers.findIndex(h => h && h.includes("Tên máy móc")),
        project: headers.findIndex(h => h && h.includes("Dự án")),
        status: headers.findIndex(h => h && h.includes("Tình trạng")),
        hours: headers.findIndex(h => h && h.includes("ODO Giờ")),
        km: headers.findIndex(h => h && h.includes("ODO Km"))
    };

    // Data shift detection logic
    let shift = 0;
    if (rows.length > 0) {
        const sample = rows[0];
        if (sample[colMap.code] && String(sample[colMap.code]).includes("Vincons")) {
            shift = 1;
        }
    }

    rows.forEach(row => {
        const code = row[colMap.code + shift];
        if (!code || code === 'NULL') return;

        const name = row[colMap.name + shift] || 'Unnamed Machine';
        let status = 'active';
        const statusRaw = row[colMap.status + shift];
        if (statusRaw && String(statusRaw).toLowerCase().includes('hỏng')) status = 'broken';

        machinesBatch.push({
            code: String(code).trim(),
            name: String(name).trim(),
            project_name: row[colMap.project + shift],
            status: status,
            current_hours: cleanNumber(row[colMap.hours + shift]),
            current_km: cleanNumber(row[colMap.km + shift]),
        });
    });
};

// Process Projects Mapping
const processProjectMapping = (filePath) => {
    console.log(`📂 Processing Project Mappings: ${filePath}`);
    if (!fs.existsSync(filePath)) return;
    const workbook = XLSX.readFile(filePath);
    const data = XLSX.utils.sheet_to_json(workbook.Sheets[workbook.SheetNames[0]]);

    data.forEach(row => {
        const code = row['Mã Tài sản'];
        const project = row['Dự Án'];
        if (code && project) {
            // Find in batch and update, or add partial update
            const existing = machinesBatch.find(m => m.code === code);
            if (existing) {
                existing.project_name = project;
            }
        }
    });
};

// Process Maintenance Logs
const processMaintenanceLogs = (filePath) => {
    console.log(`📂 Processing Logs: ${filePath}`);
    if (!fs.existsSync(filePath)) return;
    const workbook = XLSX.readFile(filePath);
    const data = XLSX.utils.sheet_to_json(workbook.Sheets[workbook.SheetNames[0]]);

    data.forEach(row => {
        const code = row['xe'] || row['XE'] || row['MÃ XE'];
        if (!code) return;

        maintenanceBatch.push({
            machine_code: String(code).trim(),
            date: parseDate(row['Ngày /tháng .năm'] || row['Ngày']),
            task_name: row['Nội Dung công Việc'] || row['Nội dung'],
            notes: row['Ghi chú'] || row['PHUONG ÁN SỬA CHỮA'],
            performer: row['Thợ Sửa Chữa'],
            hours_at_maintenance: cleanNumber(row['số giờ']),
            km_at_maintenance: cleanNumber(row['số km'])
        });
    });
};

// --- 3. SYNC EXECUTOR ---

const syncData = async () => {
    console.log(`\n🚀 STARTING SYNC PROCESS...`);

    // 1. Gather Data
    processVehicles("D:\\Vincons\\vehicles.xlsx");
    processProjectMapping("D:\\Vincons\\dự án.xlsx");
    processMaintenanceLogs("D:\\Vincons\\Báo Cáo Giờ\\Nhật trình KTSC.xlsx");
    processMaintenanceLogs("D:\\Vincons\\Báo Cáo Giờ\\BDMMTB Cổ Loa.xlsx");

    console.log(`\n📊 Data Summary:`);
    console.log(`   - Machines Found: ${machinesBatch.length}`);
    console.log(`   - Raw Maintenance Logs: ${maintenanceBatch.length}`);

    // Create a Set of valid machine codes for faster lookup
    const validMachineCodes = new Set(machinesBatch.map(m => m.code));

    // Filter Logs: Remove logs for machines that don't exist
    const validLogs = maintenanceBatch.filter(l => {
        if (!validMachineCodes.has(l.machine_code)) {
            return false;
        }
        return l.date && l.task_name;
    });

    console.log(`   - Valid Maintenance Logs to Insert: ${validLogs.length}`);

    // 2. Upsert Machines (Batched)
    console.log(`\n🔄 Syncing Machines...`);
    for (let i = 0; i < machinesBatch.length; i += BATCH_SIZE) {
        const chunk = machinesBatch.slice(i, i + BATCH_SIZE);
        const { error } = await supabase.from('machines').upsert(chunk, { onConflict: 'code' });

        if (error) console.error(`   ❌ Batch ${i} Error:`, error.message);
        else process.stdout.write(`.`);
    }
    console.log("\n   ✨ Machines Sync Complete.");

    // 3. Insert Maintenance History (Batched)
    console.log(`\n🔄 Syncing Maintenance Logs...`);

    for (let i = 0; i < validLogs.length; i += BATCH_SIZE) {
        const chunk = validLogs.slice(i, i + BATCH_SIZE);
        // Supabase Insert response doesn't always error on FK if using 'ignoreDuplicates' but here we want insertion
        const { error } = await supabase.from('maintenance_history').insert(chunk);

        if (error) {
            console.error(`   ❌ Batch ${i} Error:`, error.message);
        }
        else process.stdout.write(`.`);
    }

    console.log(`\n\n🎉 ALL DONE!`);
};

syncData();
