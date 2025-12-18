
const XLSX = require('xlsx');
const fs = require('fs');

const files = [
    "D:\\Vincons\\dự án.xlsx",
    "D:\\Vincons\\vehicles.xlsx",
    "D:\\Vincons\\Báo Cáo Giờ\\Bảo dưỡng\\Cập nhật hướng dãn bảo dưỡng 05.11.2025.xlsx",
    "D:\\Vincons\\Báo Cáo Giờ\\BDMMTB Cổ Loa.xlsx",
    "D:\\Vincons\\Báo Cáo Giờ\\Nhật trình KTSC.xlsx"
];

let output = "";

files.forEach(filePath => {
    output += `\n--- Inspecting: ${filePath} ---\n`;
    if (!fs.existsSync(filePath)) {
        output += "File not found.\n";
        return;
    }

    try {
        const workbook = XLSX.readFile(filePath);
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];

        // Get headers (first row)
        const headers = [];
        const range = XLSX.utils.decode_range(worksheet['!ref']);
        const R = range.s.r;
        for (let C = range.s.c; C <= range.e.c; ++C) {
            const cell = worksheet[XLSX.utils.encode_cell({ r: R, c: C })];
            if (cell && cell.v) headers.push(cell.v);
        }

        output += `Columns: ${JSON.stringify(headers)}\n`;

        // Get a sample row 
        const sample = [];
        const R_sample = R + 1;
        if (R_sample <= range.e.r) {
            for (let C = range.s.c; C <= range.e.c; ++C) {
                const cell = worksheet[XLSX.utils.encode_cell({ r: R_sample, c: C })];
                sample.push(cell ? cell.v : null);
            }
            output += `Sample Row: ${JSON.stringify(sample)}\n`;
        } else {
            output += "No data rows found.\n";
        }

    } catch (e) {
        output += `Error reading file: ${e.message}\n`;
    }
});

fs.writeFileSync('inspection_output.txt', output, 'utf8');
console.log("Done.");
