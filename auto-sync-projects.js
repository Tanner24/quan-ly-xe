const XLSX = require('xlsx');
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

// Initialize Supabase
// Initialize Supabase (Service Role for Unlimited Access)
const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY, {
    auth: {
        autoRefreshToken: false,
        persistSession: false
    }
}
);

const EXCEL_FILE = 'D:\\\\Vincons\\\\dự án.xlsx';

// Normalization functions
function normalizeProjectName(name) {
    if (!name) return name;

    let normalized = name;

    // Remove prefixes
    normalized = normalized.replace(/\(P\.QLTB\)\s*/gi, '');
    normalized = normalized.replace(/\(QLTB\)\s*/gi, '');
    normalized = normalized.replace(/\(PQLTB\)\s*/gi, '');

    // Consolidate storage names
    if (normalized.match(/TB\s*Lưu\s*Kho|Kho\s*Tổng|PQLTB\/Lưu\s*kho/i)) {
        return 'Lưu Kho';
    }

    // Trim whitespace and tabs
    normalized = normalized.trim();

    return normalized;
}

function generateProjectCode(name) {
    // Extract key parts
    const parts = name.split(/[-\s]+/);
    let code = parts
        .filter(p => p.length > 0)
        .slice(0, 3)
        .map(p => p.substring(0, 3).toUpperCase())
        .join('-');

    // Add random suffix to ensure uniqueness
    code += `-${Math.floor(Math.random() * 100).toString().padStart(2, '0')}`;

    return code;
}

async function syncProjects() {
    console.log('🚀 Starting Auto-Sync Tool...\n');

    try {
        // Step 1: Read Excel
        console.log('📖 Reading Excel file:', EXCEL_FILE);
        const workbook = XLSX.readFile(EXCEL_FILE);
        const worksheet = workbook.Sheets[workbook.SheetNames[0]];
        const data = XLSX.utils.sheet_to_json(worksheet);

        console.log(`✅ Found ${data.length} machines in Excel\n`);

        // Step 2: Extract unique projects
        const projectColumn = Object.keys(data[0]).find(k =>
            k.includes('Dự') || k.includes('án') || k.includes('Phận')
        );

        if (!projectColumn) {
            throw new Error('Could not find project column in Excel');
        }

        console.log(`📊 Project column: "${projectColumn}"`);

        const projectCounts = {};
        data.forEach(row => {
            const originalName = row[projectColumn];
            if (originalName && originalName !== 'Unassigned') {
                const normalized = normalizeProjectName(originalName);
                if (!projectCounts[normalized]) {
                    projectCounts[normalized] = {
                        originalNames: new Set(),
                        count: 0
                    };
                }
                projectCounts[normalized].originalNames.add(originalName);
                projectCounts[normalized].count++;
            }
        });

        console.log(`\n✅ Found ${Object.keys(projectCounts).length} unique projects\n`);

        // Step 3: Fetch existing projects from Supabase
        console.log('📡 Fetching existing projects from Supabase...');
        const { data: existingProjects, error: fetchError } = await supabase
            .from('projects')
            .select('*');

        if (fetchError) throw fetchError;

        const existingProjectMap = new Map();
        (existingProjects || []).forEach(p => {
            existingProjectMap.set(p.name.toLowerCase().trim(), p);
        });

        console.log(`✅ Found ${existingProjects?.length || 0} existing projects in DB\n`);

        // Step 4: Create/Update projects
        console.log('🔄 Syncing projects...\n');

        const projectsToCreate = [];
        const projectMapping = new Map(); // normalized name -> project id

        for (const [normalizedName, info] of Object.entries(projectCounts)) {
            const existingProject = existingProjectMap.get(normalizedName.toLowerCase().trim());

            if (existingProject) {
                console.log(`✓ Exists: ${normalizedName} (${info.count} machines)`);
                projectMapping.set(normalizedName, existingProject.id);
            } else {
                const newProject = {
                    name: normalizedName,
                    code: generateProjectCode(normalizedName),
                    status: 'active',
                    description: `Auto-synced. Original names: ${Array.from(info.originalNames).join(', ')}`
                };
                projectsToCreate.push(newProject);
                console.log(`+ Create: ${normalizedName} (${info.count} machines)`);
            }
        }

        // Insert new projects
        if (projectsToCreate.length > 0) {
            console.log(`\n📝 Creating ${projectsToCreate.length} new projects...`);

            const { data: createdProjects, error: insertError } = await supabase
                .from('projects')
                .insert(projectsToCreate)
                .select();

            if (insertError) throw insertError;

            // Map created projects
            (createdProjects || []).forEach(p => {
                projectMapping.set(p.name, p.id);
            });

            console.log(`✅ Created ${createdProjects?.length || 0} projects`);
        }

        // Step 5: Update machines with normalized project_name and project_id
        console.log('\n🔧 Updating machines...');

        const machineUpdates = [];
        data.forEach(row => {
            const machineCode = row['Mã Tài sản'] || row['Mã tài sản'];
            const originalProjectName = row[projectColumn];

            if (machineCode && originalProjectName && originalProjectName !== 'Unassigned') {
                const normalizedName = normalizeProjectName(originalProjectName);
                const projectId = projectMapping.get(normalizedName);

                machineUpdates.push({
                    code: machineCode,
                    project_name: normalizedName,
                    project_id: projectId
                });
            }
        });

        // Batch update machines (in chunks of 100)
        const CHUNK_SIZE = 100;
        let updated = 0;

        for (let i = 0; i < machineUpdates.length; i += CHUNK_SIZE) {
            const chunk = machineUpdates.slice(i, i + CHUNK_SIZE);

            for (const update of chunk) {
                const { error: updateError } = await supabase
                    .from('machines')
                    .update({
                        project_name: update.project_name,
                        project_id: update.project_id
                    })
                    .eq('code', update.code);

                if (!updateError) updated++;
            }

            console.log(`  Updated ${Math.min(i + CHUNK_SIZE, machineUpdates.length)}/${machineUpdates.length} machines...`);
        }

        console.log(`✅ Updated ${updated} machines\n`);

        // Step 6: Verification
        console.log('📊 Verification Report:\n');

        const { data: finalProjects } = await supabase
            .from('projects')
            .select('id, name, code');

        const { data: machines } = await supabase
            .from('machines')
            .select('id, code, project_name, project_id')
            .range(0, 9999);

        const projectMachineCounts = {};
        (machines || []).forEach(m => {
            if (m.project_name) {
                projectMachineCounts[m.project_name] = (projectMachineCounts[m.project_name] || 0) + 1;
            }
        });

        console.log('Top 10 Projects by Machine Count:');
        Object.entries(projectMachineCounts)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 10)
            .forEach(([name, count], i) => {
                console.log(`  ${i + 1}. ${name}: ${count} machines`);
            });

        const unmapped = (machines || []).filter(m => m.project_name && !m.project_id).length;
        console.log(`\n❌ Unmapped machines: ${unmapped}`);
        console.log(`✅ Total machines: ${machines?.length || 0}`);
        console.log(`✅ Total projects: ${finalProjects?.length || 0}`);

        console.log('\n🎉 Auto-Sync Complete!');

    } catch (error) {
        console.error('\n❌ Error:', error.message);
        console.error(error);
        process.exit(1);
    }
}

// Run
syncProjects();
