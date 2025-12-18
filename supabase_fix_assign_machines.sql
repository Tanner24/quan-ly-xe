-- Fix: Assign 20 seed machines to projects randomly
-- Run this AFTER running supabase_seed_testing_data.sql

UPDATE machines
SET
    project_id = (
        SELECT id
        FROM projects
        WHERE
            status = 'active'
        ORDER BY random ()
        LIMIT 1
    )
WHERE
    code IN (
        'VC-001',
        'VC-002',
        'VC-003',
        'VC-004',
        'VC-005',
        'VC-006',
        'VC-007',
        'VC-008',
        'VC-009',
        'VC-010',
        'VC-011',
        'VC-012',
        'VC-013',
        'VC-014',
        'VC-015',
        'VC-016',
        'VC-017',
        'VC-018',
        'VC-019',
        'VC-020'
    );

-- Verify assignment
SELECT m.code, m.name, p.name as project_name
FROM machines m
    LEFT JOIN projects p ON m.project_id = p.id
WHERE
    m.code LIKE 'VC-%'
ORDER BY m.code;