-- =====================================================
-- FIX DATABASE SCHEMA V2 - Vincons
-- Simplified version without date column check
-- =====================================================

-- 1. FIX MACHINES - Thêm các cột thiếu
ALTER TABLE machines ADD COLUMN IF NOT EXISTS brand TEXT;

ALTER TABLE machines ADD COLUMN IF NOT EXISTS machine_type TEXT;

ALTER TABLE machines
ADD COLUMN IF NOT EXISTS year_manufactured INTEGER;

ALTER TABLE machines ADD COLUMN IF NOT EXISTS purchase_date DATE;

ALTER TABLE machines ADD COLUMN IF NOT EXISTS warranty_until DATE;

-- 2. FIX DAILY_LOGS - Thêm các cột thiếu (skip date column)
ALTER TABLE daily_logs ADD COLUMN IF NOT EXISTS operator_name TEXT;

ALTER TABLE daily_logs
ADD COLUMN IF NOT EXISTS work_description TEXT;

ALTER TABLE daily_logs ADD COLUMN IF NOT EXISTS location TEXT;

ALTER TABLE daily_logs ADD COLUMN IF NOT EXISTS start_hours NUMERIC;

ALTER TABLE daily_logs ADD COLUMN IF NOT EXISTS end_hours NUMERIC;

ALTER TABLE daily_logs
ADD COLUMN IF NOT EXISTS weather_condition TEXT;

ALTER TABLE daily_logs ADD COLUMN IF NOT EXISTS log_date DATE;

-- 3. FIX PROJECTS - Thêm các cột quản lý
ALTER TABLE projects ADD COLUMN IF NOT EXISTS project_manager TEXT;

ALTER TABLE projects ADD COLUMN IF NOT EXISTS client TEXT;

ALTER TABLE projects ADD COLUMN IF NOT EXISTS budget NUMERIC;

ALTER TABLE projects ADD COLUMN IF NOT EXISTS contact_phone TEXT;

ALTER TABLE projects ADD COLUMN IF NOT EXISTS contact_email TEXT;

-- 4. RECREATE MAINTENANCE_STANDARDS
CREATE TABLE IF NOT EXISTS maintenance_standards_backup AS
SELECT *
FROM maintenance_standards;

DROP TABLE IF EXISTS maintenance_standards CASCADE;

CREATE TABLE maintenance_standards (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    machine_model TEXT NOT NULL,
    maintenance_type TEXT NOT NULL,
    interval_hours NUMERIC NOT NULL,
    description TEXT,
    tasks JSONB DEFAULT '[]'::jsonb,
    parts_required JSONB DEFAULT '[]'::jsonb,
    estimated_cost NUMERIC DEFAULT 0,
    estimated_time_hours NUMERIC DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_maintenance_model ON maintenance_standards (machine_model);

CREATE INDEX idx_maintenance_type ON maintenance_standards (maintenance_type);

-- 5. Seed data mẫu

INSERT INTO maintenance_standards (machine_model, maintenance_type, interval_hours, description, tasks, parts_required)
VALUES 
    ('SY215C', '250h', 250, 'Bảo dưỡng cấp 1',
     '["Thay nhớt động cơ", "Thay lọc nhớt", "Kiểm tra lọc gió"]'::jsonb,
     '[{"part": "LF9009", "name": "Lọc nhớt", "qty": 1}]'::jsonb),
     
    ('SY215C', '500h', 500, 'Bảo dưỡng cấp 2',
     '["Thay nhớt", "Thay lọc nhớt", "Thay lọc nhiên liệu", "Thay lọc gió"]'::jsonb,
     '[{"part": "LF9009", "qty": 1}, {"part": "FF5052", "qty": 1}]'::jsonb),
     
    ('SY215C', '1000h', 1000, 'Bảo dưỡng cấp 3',
     '["Thay dầu thủy lực", "Thay lọc thủy lực", "Kiểm tra gầm"]'::jsonb,
     '[{"part": "HF6553", "qty": 2}]'::jsonb);

-- 6. Add indexes
CREATE INDEX IF NOT EXISTS idx_machines_project_id ON machines (project_id);

CREATE INDEX IF NOT EXISTS idx_machines_code ON machines (code);

CREATE INDEX IF NOT EXISTS idx_machines_status ON machines (status);

CREATE INDEX IF NOT EXISTS idx_daily_logs_machine_code ON daily_logs (machine_code);

-- 7. Verify
SELECT 'SCHEMA FIX COMPLETE' as status;