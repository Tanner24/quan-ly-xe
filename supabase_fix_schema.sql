-- =====================================================
-- FIX DATABASE SCHEMA - Vincons
-- Run sau khi audit để sửa các vấn đề
-- =====================================================

-- 1. FIX MACHINES - Thêm các cột thiếu
ALTER TABLE machines ADD COLUMN IF NOT EXISTS brand TEXT;

ALTER TABLE machines ADD COLUMN IF NOT EXISTS machine_type TEXT;

ALTER TABLE machines
ADD COLUMN IF NOT EXISTS year_manufactured INTEGER;

ALTER TABLE machines ADD COLUMN IF NOT EXISTS purchase_date DATE;

ALTER TABLE machines ADD COLUMN IF NOT EXISTS warranty_until DATE;

COMMENT ON COLUMN machines.brand IS 'Hãng sản xuất: SANY, XCMG, CAT, Komatsu...';

COMMENT ON COLUMN machines.machine_type IS 'Loại máy: excavator, bulldozer, dump_truck...';

-- 2. FIX DAILY_LOGS - Thêm các cột thiếu
ALTER TABLE daily_logs ADD COLUMN IF NOT EXISTS operator_name TEXT;

ALTER TABLE daily_logs
ADD COLUMN IF NOT EXISTS work_description TEXT;

ALTER TABLE daily_logs ADD COLUMN IF NOT EXISTS location TEXT;

ALTER TABLE daily_logs ADD COLUMN IF NOT EXISTS start_hours NUMERIC;

ALTER TABLE daily_logs ADD COLUMN IF NOT EXISTS end_hours NUMERIC;

ALTER TABLE daily_logs
ADD COLUMN IF NOT EXISTS weather_condition TEXT;

COMMENT ON COLUMN daily_logs.operator_name IS 'Tên lái xe/vận hành viên';

COMMENT ON COLUMN daily_logs.work_description IS 'Mô tả công việc thực hiện';

-- 3. FIX PROJECTS - Thêm các cột quản lý
ALTER TABLE projects ADD COLUMN IF NOT EXISTS project_manager TEXT;

ALTER TABLE projects ADD COLUMN IF NOT EXISTS client TEXT;

ALTER TABLE projects ADD COLUMN IF NOT EXISTS budget NUMERIC;

ALTER TABLE projects ADD COLUMN IF NOT EXISTS contact_phone TEXT;

ALTER TABLE projects ADD COLUMN IF NOT EXISTS contact_email TEXT;

COMMENT ON COLUMN projects.project_manager IS 'Tên người quản lý dự án';

COMMENT ON COLUMN projects.client IS 'Tên khách hàng';

-- 4. RECREATE MAINTENANCE_STANDARDS - Cấu trúc đúng
-- Backup data cũ nếu có
CREATE TABLE IF NOT EXISTS maintenance_standards_backup AS
SELECT *
FROM maintenance_standards;

-- Drop table cũ
DROP TABLE IF EXISTS maintenance_standards CASCADE;

-- Tạo lại với cấu trúc đúng
CREATE TABLE maintenance_standards (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    machine_model TEXT NOT NULL,
    maintenance_type TEXT NOT NULL,  -- '250h', '500h', '1000h', 'Daily', 'Weekly'
    interval_hours NUMERIC NOT NULL,
    description TEXT,
    tasks JSONB DEFAULT '[]'::jsonb,  -- ["Thay nhớt", "Thay lọc gió"...]
    parts_required JSONB DEFAULT '[]'::jsonb,  -- [{"part": "LF9009", "qty": 1}...]
    estimated_cost NUMERIC DEFAULT 0,
    estimated_time_hours NUMERIC DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_maintenance_model ON maintenance_standards (machine_model);

CREATE INDEX idx_maintenance_type ON maintenance_standards (maintenance_type);

COMMENT ON
TABLE maintenance_standards IS 'Định mức bảo dưỡng chi tiết theo model máy';

COMMENT ON COLUMN maintenance_standards.tasks IS 'Danh sách công việc cần làm (JSON array)';

COMMENT ON COLUMN maintenance_standards.parts_required IS 'Phụ tùng cần thiết (JSON array of objects)';

-- 5. Seed lại data mẫu cho maintenance_standards

INSERT INTO maintenance_standards (machine_model, maintenance_type, interval_hours, description, tasks, parts_required)
VALUES 
    ('SY215C', 'Bảo dưỡng 250h', 250, 'Bảo dưỡng định kỳ cấp 1',
     '["Thay nhớt động cơ", "Thay lọc nhớt", "Kiểm tra lọc gió", "Bơm mỡ các khớp"]'::jsonb,
     '[{"part": "LF9009", "name": "Lọc nhớt", "qty": 1}, {"part": "Oil-15W40", "name": "Nhớt động cơ", "qty": 20}]'::jsonb),
     
    ('SY215C', 'Bảo dưỡng 500h', 500, 'Bảo dưỡng định kỳ cấp 2',
     '["Thay nhớt động cơ", "Thay lọc nhớt", "Thay lọc nhiên liệu", "Thay lọc gió", "Kiểm tra hệ thống thủy lực"]'::jsonb,
     '[{"part": "LF9009", "name": "Lọc nhớt", "qty": 1}, {"part": "FF5052", "name": "Lọc nhiên liệu", "qty": 1}, {"part": "AF25708", "name": "Lọc gió", "qty": 1}]'::jsonb),
     
    ('SY215C', 'Bảo dưỡng 1000h', 1000, 'Bảo dưỡng định kỳ cấp 3',
     '["Thay dầu thủy lực", "Thay lọc thủy lực", "Thay nhớt hộp số", "Kiểm tra gầm và xích", "Căn chỉnh các van"]'::jsonb,
     '[{"part": "HF6553", "name": "Lọc thủy lực", "qty": 2}, {"part": "Hydraulic-Oil", "name": "Dầu thủy lực", "qty": 200}]'::jsonb);

-- 6. Thêm indexes để tăng performance
CREATE INDEX IF NOT EXISTS idx_machines_project_id ON machines (project_id);

CREATE INDEX IF NOT EXISTS idx_machines_code ON machines (code);

CREATE INDEX IF NOT EXISTS idx_machines_status ON machines (status);

CREATE INDEX IF NOT EXISTS idx_daily_logs_machine_code ON daily_logs (machine_code);

CREATE INDEX IF NOT EXISTS idx_daily_logs_date ON daily_logs (date DESC);

-- 7. Verify changes
SELECT 'MACHINES COLUMNS' as info;

SELECT column_name, data_type
FROM information_schema.columns
WHERE
    table_name = 'machines'
ORDER BY ordinal_position;

SELECT 'DAILY_LOGS COLUMNS' as info;

SELECT column_name, data_type
FROM information_schema.columns
WHERE
    table_name = 'daily_logs'
ORDER BY ordinal_position;

SELECT 'MAINTENANCE_STANDARDS COLUMNS' as info;

SELECT column_name, data_type
FROM information_schema.columns
WHERE
    table_name = 'maintenance_standards'
ORDER BY ordinal_position;

-- =====================================================
-- HOÀN THÀNH FIX SCHEMA
-- =====================================================