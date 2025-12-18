-- =====================================================
-- DATABASE SCHEMA AUDIT - VINCONS
-- Chạy script này trong Supabase SQL Editor để audit
-- =====================================================

-- 1. Kiểm tra tất cả tables
SELECT table_name, (
        SELECT COUNT(*)
        FROM information_schema.columns
        WHERE
            table_name = t.table_name
    ) as column_count
FROM information_schema.tables t
WHERE
    table_schema = 'public'
ORDER BY table_name;

-- 2. Chi tiết schema của các tables chính
-- PROJECTS
SELECT
    'PROJECTS' as table_name,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns
WHERE
    table_name = 'projects'
ORDER BY ordinal_position;

-- MACHINES
SELECT
    'MACHINES' as table_name,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns
WHERE
    table_name = 'machines'
ORDER BY ordinal_position;

-- DAILY_LOGS
SELECT
    'DAILY_LOGS' as table_name,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns
WHERE
    table_name = 'daily_logs'
ORDER BY ordinal_position;

-- MAINTENANCE_STANDARDS
SELECT
    'MAINTENANCE_STANDARDS' as table_name,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns
WHERE
    table_name = 'maintenance_standards'
ORDER BY ordinal_position;

-- 3. Kiểm tra foreign keys
SELECT
    tc.table_name,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc
    JOIN information_schema.key_column_usage AS kcu ON tc.constraint_name = kcu.constraint_name
    JOIN information_schema.constraint_column_usage AS ccu ON ccu.constraint_name = tc.constraint_name
WHERE
    tc.constraint_type = 'FOREIGN KEY'
ORDER BY tc.table_name;

-- 4. Đếm số records trong mỗi table
SELECT 'projects' as table_name, COUNT(*) as record_count
FROM projects
UNION ALL
SELECT 'machines', COUNT(*)
FROM machines
UNION ALL
SELECT 'users', COUNT(*)
FROM users
UNION ALL
SELECT 'daily_logs', COUNT(*)
FROM daily_logs
UNION ALL
SELECT 'maintenance_standards', COUNT(*)
FROM maintenance_standards
UNION ALL
SELECT 'error_codes', COUNT(*)
FROM error_codes
UNION ALL
SELECT 'parts', COUNT(*)
FROM parts;

-- 5. Kiểm tra data integrity
-- Machines không có project_id
SELECT 'Machines without project' as issue, COUNT(*) as count
FROM machines
WHERE
    project_id IS NULL;

-- Logs không có machine_code
SELECT 'Logs without machine_code' as issue, COUNT(*) as count
FROM daily_logs
WHERE
    machine_code IS NULL;

-- 6. Sample data từ mỗi table
SELECT 'PROJECT SAMPLE' as info;

SELECT * FROM projects LIMIT 3;

SELECT 'MACHINE SAMPLE' as info;

SELECT
    code,
    name,
    model,
    current_hours,
    project_id
FROM machines
LIMIT 3;

SELECT 'LOG SAMPLE' as info;

SELECT * FROM daily_logs LIMIT 3;