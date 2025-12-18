const XLSX = require('xlsx');
const fs = require('fs');

const filePath = 'D:\\\\Vincons\\\\dự án.xlsx';

try {
    const workbook = XLSX.readFile(filePath);
    const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
    const data = XLSX.utils.sheet_to_json(firstSheet);

    const summary = {
        totalRows: data.length,
        columns: data.length > 0 ? Object.keys(data[0]) : [],
        projectDistribution: {}
    };

    // Find project column
    const projectCol = summary.columns.find(c =>
        c.includes('án') ||
        c.includes('project') ||
        c.includes('Phận') ||
        c.includes('phận')
    );

    if (projectCol && data.length > 0) {
        data.forEach(row => {
            const proj = row[projectCol] || 'Unassigned';
            summary.projectDistribution[proj] = (summary.projectDistribution[proj] || 0) + 1;
        });
    }

    // Write as JSON
    fs.writeFileSync('excel-summary.json', JSON.stringify(summary, null, 2), 'utf8');

    // Also write first 3 rows as sample
    const sample = data.slice(0, 3);
    fs.writeFileSync('excel-sample.json', JSON.stringify(sample, null, 2), 'utf8');

    console.log('Analysis complete! Check excel-summary.json and excel-sample.json');

} catch (error) {
    console.error('Error:', error.message);
}
