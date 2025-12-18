
const XLSX = require('xlsx');
const fs = require('fs');
const path = require('path');

const OUTPUT_FILE = 'import_data.sql';

// Helper to sanitize string for SQL
const escapeSql = (str) => {
    if (str === null || str === undefined) return 'NULL';
    if (typeof str === 'number') return str;
    return `'${String(str).replace(/'/g, "''")}'`;
};

// Helper to parse date
const parseDate = (excelDate) => {
    if (!excelDate) return 'NULL';
    if (typeof excelDate === 'number') {
        // Excel date to JS Date
        const date = new Date(Math.round((excelDate - 25569) * 86400 * 1000));
        return `'${date.toISOString().split('T')[0]}'`;
    }
    // String date handling (assuming DD/MM/YYYY or similar)
    return `'${excelDate}'`; // Hope for the best or allow database to parse
};

let sqlOutput = "-- Generated Import SQL\n\n";

// Function to process Machines (vehicles.xlsx)
const processVehicles = (filePath) => {
    console.log(`Processing Machines: ${filePath}`);
    if (!fs.existsSync(filePath)) return;

    const workbook = XLSX.readFile(filePath);
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const data = XLSX.utils.sheet_to_json(sheet, { header: 1 }); // Array of arrays

    // Find header row (look for "Mã quản lý" or "Tên máy móc")
    let headerRowIdx = -1;
    for (let i = 0; i < Math.min(20, data.length); i++) {
        const row = data[i];
        if (row.some(cell => String(cell).includes("Mã quản lý") || String(cell).includes("Tên máy móc"))) {
            headerRowIdx = i;
            break;
        }
    }

    if (headerRowIdx === -1) {
        console.log("Could not find headers in vehicles.xlsx");
        return;
    }

    const headers = data[headerRowIdx];
    const rows = data.slice(headerRowIdx + 1);

    // Map columns
    const colMap = {
        code: headers.findIndex(h => h && h.includes("Mã quản lý")), // Fallback or distinct
        name: headers.findIndex(h => h && h.includes("Tên máy móc")),
        project: headers.findIndex(h => h && h.includes("Dự án")),
        status: headers.findIndex(h => h && h.includes("Tình trạng")),
        hours: headers.findIndex(h => h && h.includes("ODO Giờ")),
        km: headers.findIndex(h => h && h.includes("ODO Km")),
        updated: headers.findIndex(h => h && h.includes("Ngày cập nhật"))
    };

    // Correction for "Shifted" data if detected (based on previous inspection)
    // If "QN0002" (Code) is in col 2, but "Mã quản lý" is header 1.
    // Inspection showed: Header 1 "Mã quản lý", Data 2 "QN0002". Shift = 1?
    // Let's rely on finding indices by name first. If data looks weird, manual fix.
    // Actually, let's try to be smart. If colMap.code is 1, check a few rows. 
    // If row[1] looks like "Vincons BD" (Owner) and row[2] looks like "QN...", shift +1.

    let shift = 0;
    if (rows.length > 0) {
        const sample = rows[0];
        if (sample[colMap.code] && String(sample[colMap.code]).includes("Vincons") && sample[colMap.code + 1] && String(sample[colMap.code + 1]).match(/[A-Z0-9]{4,}/)) {
            console.log("Detected data shift in vehicles.xlsx. Adjusting indices +1.");
            shift = 1;
        }
    }

    rows.forEach(row => {
        const code = row[colMap.code + shift];
        if (!code || code === 'NULL') return;

        const name = row[colMap.name + shift];
        const project = row[colMap.project + shift];
        const statusRaw = row[colMap.status + shift];
        const hours = parseFloat(row[colMap.hours + shift]) || 0;
        const km = parseFloat(row[colMap.km + shift]) || 0;

        let status = 'active';
        if (statusRaw && statusRaw.toLowerCase().includes('hỏng')) status = 'broken';
        if (statusRaw && statusRaw.toLowerCase().includes('bảo dưỡng')) status = 'maintenance';
        if (statusRaw && statusRaw.toLowerCase().includes('thanh lý')) status = 'disposed';

        sqlOutput += `INSERT INTO machines (code, name, project_name, status, current_hours, current_km) VALUES (${escapeSql(code)}, ${escapeSql(name)}, ${escapeSql(project)}, '${status}', ${hours}, ${km}) ON CONFLICT (code) DO UPDATE SET name = EXCLUDED.name, project_name = EXCLUDED.project_name, current_hours = EXCLUDED.current_hours, current_km = EXCLUDED.current_km;\n`;
    });
};

// Process Project-Machine Mapping (du an.xlsx)
const processProjectMapping = (filePath) => {
    console.log(`Processing Project Mapping: ${filePath}`);
    if (!fs.existsSync(filePath)) return;

    const workbook = XLSX.readFile(filePath);
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const data = XLSX.utils.sheet_to_json(sheet); // Uses first row as header automatically

    data.forEach(row => {
        const code = row['Mã Tài sản'];
        const project = row['Dự Án'];

        if (code && project) {
            sqlOutput += `UPDATE machines SET project_name = ${escapeSql(project)} WHERE code = ${escapeSql(code)};\n`;
        }
    });
};

// Process Maintenance Logs (Nhat trinh KTSC.xlsx)
const processMaintenanceLogs = (filePath) => {
    console.log(`Processing Maintenance Logs: ${filePath}`);
    if (!fs.existsSync(filePath)) return;

    const workbook = XLSX.readFile(filePath);
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const data = XLSX.utils.sheet_to_json(sheet);

    // Heuristic mapping
    data.forEach(row => {
        const code = row['xe'] || row['XE'] || row['MÃ XE'];
        const date = row['Ngày /tháng .năm'] || row['Ngày'];
        const content = row['Nội Dung công Việc'] || row['Nội dung'];
        const notes = row['Ghi chú'] || row['PHUONG ÁN SỬA CHỮA'];
        const performer = row['Thợ Sửa Chữa'];
        const hours = row['số giờ'];
        const km = row['số km'];

        if (code) {
            // Insert into maintenance_history
            sqlOutput += `INSERT INTO maintenance_history (machine_code, date, task_name, notes, performer, hours_at_maintenance, km_at_maintenance) VALUES (${escapeSql(code)}, ${parseDate(date)}, ${escapeSql(content)}, ${escapeSql(notes)}, ${escapeSql(performer)}, ${hours || 'NULL'}, ${km || 'NULL'});\n`;
        }
    });
};

// Process BDMMTB (Complex header likely)
const processBDMMTB = (filePath) => {
    console.log(`Processing BDMMTB: ${filePath}`);
    if (!fs.existsSync(filePath)) return;

    // Fallback: Try to find header row 
    const workbook = XLSX.readFile(filePath);
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const data = XLSX.utils.sheet_to_json(sheet, { header: 1 });

    let headerRowIdx = -1;
    for (let i = 0; i < Math.min(50, data.length); i++) {
        const row = data[i];
        if (row.some(cell => String(cell).includes("Mã tài sản") || String(cell).includes("Tên thiết bị"))) {
            headerRowIdx = i;
            break;
        }
    }

    if (headerRowIdx !== -1) {
        const headers = data[headerRowIdx];
        const rows = data.slice(headerRowIdx + 1);
        const colMap = {
            code: headers.findIndex(h => h && h.includes("Mã tài sản")),
            date: headers.findIndex(h => h && h.includes("Ngày")),
            hours: headers.findIndex(h => h && h.includes("Giờ")),
            content: headers.findIndex(h => h && h.includes("Nội dung"))
        };

        rows.forEach(row => {
            const code = row[colMap.code];
            if (code) {
                // Try to guess if Log or Maintenance
                const content = row[colMap.content];
                sqlOutput += `INSERT INTO maintenance_history (machine_code, date, task_name) VALUES (${escapeSql(code)}, ${parseDate(row[colMap.date])}, ${escapeSql(content)});\n`;
            }
        });
    }
};

// --- Execution ---
processVehicles("D:\\Vincons\\vehicles.xlsx");
processProjectMapping("D:\\Vincons\\dự án.xlsx");
processMaintenanceLogs("D:\\Vincons\\Báo Cáo Giờ\\Nhật trình KTSC.xlsx");
processBDMMTB("D:\\Vincons\\Báo Cáo Giờ\\BDMMTB Cổ Loa.xlsx");

fs.writeFileSync(OUTPUT_FILE, sqlOutput);
console.log(`Generated SQL to ${OUTPUT_FILE}`);
