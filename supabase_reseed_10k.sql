-- ====================================================================
-- VINCONS APP - MASS SEED DATA SCRIPT
-- ====================================================================
-- This script will ERASE existing machine data and generate 10,000
-- fresh machine records randomly assigned to your existing projects.
-- Use with caution!
-- ====================================================================

TRUNCATE TABLE daily_logs CASCADE;

TRUNCATE TABLE repair_history CASCADE;

TRUNCATE TABLE maintenance_history CASCADE;

TRUNCATE TABLE machines CASCADE;

-- GENERATE 10,000 MACHINES
DO $$
DECLARE
    i integer;
    proj_id_list int[];
    rand_proj_id int;
    rand_proj_name text;
BEGIN
    -- Get available project IDs
    SELECT array_agg(id) INTO proj_id_list FROM projects;

    FOR i IN 1..10000 LOOP
        -- Pick a random project
        IF proj_id_list IS NOT NULL THEN
            rand_proj_id := proj_id_list[1 + floor(random() * array_length(proj_id_list, 1))::int];
            SELECT name INTO rand_proj_name FROM projects WHERE id = rand_proj_id;
        ELSE
            rand_proj_id := NULL;
            rand_proj_name := NULL;
        END IF;

        -- Insert Machine
        INSERT INTO machines (code, name, status, project_id, project_name, current_hours)
        VALUES (
            'M-' || LPAD(i::text, 5, '0'),
            'Thiết bị ' || LPAD(i::text, 5, '0'),
            CASE floor(random() * 3)::int 
                WHEN 0 THEN 'active' 
                WHEN 1 THEN 'maintenance' 
                ELSE 'idle' 
            END,
            rand_proj_id,
            rand_proj_name,
            floor(random() * 10000)::numeric
        );
    END LOOP;
END $$;