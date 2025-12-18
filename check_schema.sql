-- Query này để kiểm tra cấu trúc bảng thực tế trong database
-- Chạy trong Supabase SQL Editor

SELECT
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns
WHERE
    table_name = 'maintenance_standards'
ORDER BY ordinal_position;

-- Sau đó kiểm tra các bảng khác
SELECT table_name
FROM information_schema.tables
WHERE
    table_schema = 'public'
ORDER BY table_name;