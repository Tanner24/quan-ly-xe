-- INIT DATABASE SAFELY (Không xóa dữ liệu cũ)

-- 1. Bảng DỰ ÁN
CREATE TABLE IF NOT EXISTS public.projects (
    id UUID DEFAULT gen_random_uuid () PRIMARY KEY,
    code TEXT UNIQUE, -- Cột này quan trọng để Import, nếu bảng cũ chưa có, hãy chạy lệnh ALTER bên dưới
    name TEXT NOT NULL,
    address TEXT,
    status TEXT DEFAULT 'active',
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Bổ sung cột 'code' nếu bảng projects cũ chưa có (Idempotent)
DO $$ 
    BEGIN 
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='projects' AND column_name='code') THEN
            ALTER TABLE public.projects ADD COLUMN code TEXT UNIQUE;
        END IF;
    END $$;

-- 2. Bảng XE & THIẾT BỊ
CREATE TABLE IF NOT EXISTS public.machines (
    id UUID DEFAULT gen_random_uuid () PRIMARY KEY,
    code TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    serial_number TEXT,
    model TEXT,
    project_id UUID REFERENCES public.projects (id) ON DELETE SET NULL,
    status TEXT DEFAULT 'working',
    current_hours DECIMAL(10, 2) DEFAULT 0,
    current_km DECIMAL(10, 2) DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_machines_project ON public.machines (project_id);

CREATE INDEX IF NOT EXISTS idx_machines_status ON public.machines (status);

-- 3. Bảng NHẬT TRÌNH HOẠT ĐỘNG
CREATE TABLE IF NOT EXISTS public.daily_logs (
    id UUID DEFAULT gen_random_uuid () PRIMARY KEY,
    machine_id UUID NOT NULL REFERENCES public.machines (id) ON DELETE CASCADE,
    date DATE NOT NULL,
    hours_added DECIMAL(5, 2),
    fuel_consumed DECIMAL(10, 2),
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    -- Constraint Unique này quan trọng để chống import trùng
    CONSTRAINT unique_machine_date UNIQUE (machine_id, date)
);

-- Nếu bảng đã có nhưng chưa có Constraint Unique, thêm vào:
DO $$ 
    BEGIN 
        IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'unique_machine_date') THEN
            ALTER TABLE public.daily_logs ADD CONSTRAINT unique_machine_date UNIQUE (machine_id, date);
        END IF;
    END $$;

CREATE INDEX IF NOT EXISTS idx_logs_machine_date ON public.daily_logs (machine_id, date DESC);

-- 4. Bảng CẤU HÌNH BẢO DƯỠNG
CREATE TABLE IF NOT EXISTS public.maintenance_standards (
    id UUID DEFAULT gen_random_uuid () PRIMARY KEY,
    machine_code TEXT REFERENCES public.machines (code) ON DELETE CASCADE,
    interval_hours INT NOT NULL,
    task_name TEXT NOT NULL,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 5. Bảng LỊCH SỬ BẢO DƯỠNG
CREATE TABLE IF NOT EXISTS public.maintenance_history (
    id UUID DEFAULT gen_random_uuid () PRIMARY KEY,
    machine_id UUID NOT NULL REFERENCES public.machines (id) ON DELETE CASCADE,
    date DATE NOT NULL,
    type TEXT NOT NULL,
    hours_at_maintenance DECIMAL(10, 2),
    cost BIGINT DEFAULT 0,
    description TEXT,
    performer TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_maint_machine ON public.maintenance_history (machine_id, date DESC);

-- Enable RLS (An toàn là trên hết)
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.machines ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.daily_logs ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.maintenance_history ENABLE ROW LEVEL SECURITY;

-- Tạo Policy cơ bản (Nếu chưa có)
DO $$ 
    BEGIN 
        IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'machines' AND policyname = 'Public Read') THEN
            CREATE POLICY "Public Read" ON machines FOR SELECT USING (true);
        END IF;
    END $$;