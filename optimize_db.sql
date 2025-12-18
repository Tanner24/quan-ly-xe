-- OPTIMIZE DATABASE PERFORMANCE
-- Run this in Supabase SQL Editor

-- 1. Index cho bảng machines (Quan trọng nhất)
CREATE INDEX IF NOT EXISTS idx_machines_code ON machines (code);

CREATE INDEX IF NOT EXISTS idx_machines_project_id ON machines (project_id);

CREATE INDEX IF NOT EXISTS idx_machines_status ON machines (status);

CREATE INDEX IF NOT EXISTS idx_machines_project_name ON machines (project_name);

-- 2. Index cho bảng projects
CREATE INDEX IF NOT EXISTS idx_projects_name ON projects (name);

-- 3. Index cho bảng maintenance_standards
CREATE INDEX IF NOT EXISTS idx_maintenance_standards_machine_code ON maintenance_standards (machine_code);

-- 4. Index cho bảng daily_logs (Dữ liệu lớn nhanh)
CREATE INDEX IF NOT EXISTS idx_daily_logs_machine_code ON daily_logs (machine_code);

CREATE INDEX IF NOT EXISTS idx_daily_logs_created_at ON daily_logs (created_at DESC);

-- 5. RPC Function để lấy thống kê Dashboard cực nhanh (Thay vì load 3000 dòng về Client)
CREATE OR REPLACE FUNCTION get_dashboard_stats()
RETURNS TABLE (
  total_machines bigint,
  active_machines bigint,
  maintenance_machines bigint,
  overdue_count bigint
) LANGUAGE plpgsql AS $$
BEGIN
  RETURN QUERY SELECT
    (SELECT count(*) FROM machines) as total,
    (SELECT count(*) FROM machines WHERE status = 'active') as active,
    (SELECT count(*) FROM machines WHERE status = 'maintenance') as maintenance,
    -- Giả sử check quá hạn đơn giản (có thể phức tạp hơn tùy logic)
    (SELECT count(*) FROM machines m 
     JOIN maintenance_standards s ON m.code = s.machine_code 
     WHERE m.current_hours >= (FLOOR(m.current_hours / s.interval_hours) + 1) * s.interval_hours
    ) as overdue;
END;
$$;