-- =====================================================
-- VINCONS - SEED DỮ LIỆU MẪU CHO TESTING (SIMPLIFIED)
-- Run this script in Supabase SQL Editor
-- =====================================================

-- 1. USERS (Người dùng mẫu)
-- =====================================================
INSERT INTO
    users (
        username,
        password,
        name,
        role,
        department
    )
VALUES (
        'admin',
        'admin123',
        'Đỗ Thái Sơn',
        'super_admin',
        'Phòng KTSC'
    ),
    (
        'technician',
        'tech123',
        'Nguyễn Văn Kỹ Thuật',
        'technician',
        'Phòng Kỹ thuật'
    ),
    (
        'operator',
        'operator123',
        'Trần Thị Vận Hành',
        'technician',
        'Phòng Vận hành'
    ),
    (
        'manager',
        'manager123',
        'Lê Văn Quản Lý',
        'project_admin',
        'Ban Quản lý Dự án'
    ) ON CONFLICT (username) DO NOTHING;

-- 2. PROJECTS (Dự án mẫu)
-- =====================================================
INSERT INTO
    projects (
        name,
        code,
        address,
        description,
        status
    )
VALUES (
        'Dự án Cao Tốc Bắc Nam - Gói thầu 1',
        'CTBN-01',
        'Km 50+200, Ninh Bình',
        'Xây dựng đường cao tốc đoạn Ninh Bình - Thanh Hóa',
        'active'
    ),
    (
        'Dự án Cảng Hải Phòng Mở Rộng',
        'CHP-MR',
        'Cảng Hải Phòng, Hải Phòng',
        'Mở rộng bến cảng container số 5-6',
        'active'
    ),
    (
        'Dự án Nhà Máy Xi Măng Hà Nam',
        'XMHN-02',
        'KCN Đồng Văn, Hà Nam',
        'Xây dựng dây chuyền sản xuất số 2',
        'active'
    ),
    (
        'Dự án Metro Line 3 Hà Nội',
        'MTR-HN3',
        'Nhổn - Ga Hà Nội',
        'Xây dựng tuyến metro số 3 Nhổn - Ga Hà Nội',
        'active'
    ),
    (
        'Dự án Khu Đô Thị Ecopark',
        'ECP-P2',
        'Văn Giang, Hưng Yên',
        'Phát triển khu đô thị giai đoạn 2',
        'pending'
    ) ON CONFLICT DO NOTHING;

-- 3. MACHINES - Directly insert without project assignment first
-- =====================================================
INSERT INTO
    machines (
        code,
        name,
        model,
        current_hours,
        status
    )
VALUES (
        'VC-001',
        'SANY SY215C #1',
        'SY215C',
        1250,
        'active'
    ),
    (
        'VC-002',
        'XCMG XE215D #2',
        'XE215D',
        2340,
        'active'
    ),
    (
        'VC-003',
        'CAT 320D #3',
        'CAT320',
        890,
        'active'
    ),
    (
        'VC-004',
        'Komatsu PC200-8 #4',
        'PC200-8',
        3200,
        'maintenance'
    ),
    (
        'VC-005',
        'HOWO A7 Dump Truck #5',
        'A7',
        45000,
        'active'
    ),
    (
        'VC-006',
        'Shantui SD16 #6',
        'SD16',
        1800,
        'active'
    ),
    (
        'VC-007',
        'Longking CDM855N #7',
        'CDM855N',
        920,
        'active'
    ),
    (
        'VC-008',
        'Toyota FD25 Forklift #8',
        'FD25',
        4500,
        'active'
    ),
    (
        'VC-009',
        'SANY SY365C #9',
        'SY365C',
        560,
        'active'
    ),
    (
        'VC-010',
        'XCMG XE370D #10',
        'XE370D',
        1100,
        'maintenance'
    ),
    (
        'VC-011',
        'CAT 330D #11',
        'CAT330',
        2800,
        'active'
    ),
    (
        'VC-012',
        'Komatsu PC300-8 #12',
        'PC300-8',
        1950,
        'active'
    ),
    (
        'VC-013',
        'HOWO T7H #13',
        'T7H',
        38000,
        'active'
    ),
    (
        'VC-014',
        'Shantui SD22 #14',
        'SD22',
        2100,
        'inactive'
    ),
    (
        'VC-015',
        'SANY SY135C #15',
        'SY135C',
        780,
        'active'
    ),
    (
        'VC-016',
        'XCMG XE150D #16',
        'XE150D',
        650,
        'active'
    ),
    (
        'VC-017',
        'CAT 924K Loader #17',
        'CAT924K',
        1400,
        'active'
    ),
    (
        'VC-018',
        'Komatsu WA380-6 #18',
        'WA380-6',
        3100,
        'active'
    ),
    (
        'VC-019',
        'SANY SRC550 Crane #19',
        'SRC550',
        420,
        'active'
    ),
    (
        'VC-020',
        'XCMG QY50K Crane #20',
        'QY50K',
        890,
        'maintenance'
    ) ON CONFLICT (code) DO NOTHING;

-- 4. ERROR_CODES (Mã lỗi mẫu)
-- =====================================================
INSERT INTO
    error_codes (code, description, fix_steps)
VALUES (
        'E001',
        'Áp suất dầu thủy lực thấp',
        'Kiểm tra mức dầu thủy lực. Kiểm tra bơm thủy lực. Kiểm tra van an toàn.'
    ),
    (
        'E002',
        'Nhiệt độ động cơ cao',
        'Kiểm tra nước làm mát. Vệ sinh két nước. Kiểm tra quạt làm mát. Kiểm tra thermostat.'
    ),
    (
        'E003',
        'Áp suất nhớt động cơ thấp',
        'Kiểm tra mức nhớt. Thay lọc nhớt. Kiểm tra bơm nhớt.'
    ),
    (
        'E004',
        'Lỗi cảm biến nhiệt độ',
        'Kiểm tra đầu nối cảm biến. Thay cảm biến mới nếu cần.'
    ),
    (
        'E005',
        'Lỗi hệ thống nạp',
        'Kiểm tra ắc quy. Kiểm tra máy phát. Kiểm tra dây đai.'
    ),
    (
        'E006',
        'Áp suất nhiên liệu thấp',
        'Kiểm tra bầu lọc sơ cấp. Xả khí hệ thống nhiên liệu. Kiểm tra bơm tiếp vận.'
    ),
    (
        'E007',
        'Lỗi van điều khiển',
        'Reset ECU. Kiểm tra điện áp van. Thay van điều khiển.'
    ),
    (
        'E008',
        'Cảnh báo bảo dưỡng',
        'Thực hiện bảo dưỡng theo định mức. Reset đồng hồ bảo dưỡng.'
    ),
    (
        'E009',
        'Lỗi hệ thống phanh',
        'Kiểm tra dầu phanh. Kiểm tra má phanh. Kiểm tra cảm biến phanh.'
    ),
    (
        'E010',
        'Lỗi hệ thống lái',
        'Kiểm tra dầu trợ lực. Kiểm tra bơm trợ lực. Kiểm tra các khớp lái.'
    ) ON CONFLICT DO NOTHING;

-- 5. PARTS (Phụ tùng OEM mẫu)
-- =====================================================
INSERT INTO
    parts (
        part_number,
        name,
        equivalents
    )
VALUES (
        'LF9009',
        'Lọc nhớt Fleetguard',
        'B7085, P553000, WL10010, 600-211-1231'
    ),
    (
        'LF3000',
        'Lọc nhớt Fleetguard HD',
        'P551000, B7299, 600-211-1340'
    ),
    (
        'FF5052',
        'Lọc nhiên liệu Fleetguard',
        'P550440, BF7632, 600-311-8220'
    ),
    (
        'FS1280',
        'Lọc tách nước Fleetguard',
        'R60P, BF1280, P551422'
    ),
    (
        'AF25708',
        'Lọc gió Fleetguard',
        'P532966, RS3870, 600-185-4100'
    ),
    (
        'HF6553',
        'Lọc thủy lực Fleetguard',
        'P164378, BT8851, 07063-01142'
    ),
    (
        'WF2073',
        'Lọc nước làm mát Fleetguard',
        'P552073, BW5073'
    ),
    (
        'LF3349',
        'Lọc nhớt CAT Engine',
        'P551808, B7030, 1R-0739'
    ),
    (
        '1R-0762',
        'Lọc nhiên liệu CAT',
        'FF5776, P551712, BF7990'
    ),
    (
        '208-01-51150',
        'Lọc thủy lực Komatsu',
        'HF6555, P173048'
    ),
    (
        '600-185-4100',
        'Lọc gió ngoài Komatsu',
        'P532966, AF25708'
    ),
    (
        '600-311-8293',
        'Lọc nhiên liệu Komatsu',
        'FF5485, P502480'
    ),
    (
        'A222100000569',
        'Lọc nhớt SANY',
        'LF9009, B7085'
    ),
    (
        'B222100000451',
        'Lọc nhiên liệu SANY',
        'FF5052, P550440'
    ) ON CONFLICT DO NOTHING;

-- 6. MAINTENANCE_STANDARDS (Định mức bảo dưỡng chung)
-- =====================================================
INSERT INTO
    maintenance_standards (
        interval_hours,
        task_name,
        note
    )
VALUES (
        250,
        'Thay nhớt động cơ + Lọc nhớt',
        'Bảo dưỡng định kỳ cấp 1'
    ),
    (
        250,
        'Kiểm tra và vệ sinh lọc gió',
        'Bảo dưỡng định kỳ cấp 1'
    ),
    (
        500,
        'Thay nhớt động cơ + Lọc nhớt',
        'Bảo dưỡng định kỳ cấp 2'
    ),
    (
        500,
        'Thay lọc nhiên liệu',
        'Bảo dưỡng định kỳ cấp 2'
    ),
    (
        500,
        'Thay lọc gió',
        'Bảo dưỡng định kỳ cấp 2'
    ),
    (
        500,
        'Bơm mỡ các khớp',
        'Bảo dưỡng định kỳ cấp 2'
    ),
    (
        1000,
        'Thay dầu thủy lực + Lọc',
        'Bảo dưỡng định kỳ cấp 3'
    ),
    (
        1000,
        'Thay nhớt hộp số',
        'Bảo dưỡng định kỳ cấp 3'
    ),
    (
        1000,
        'Kiểm tra gầm và xích',
        'Bảo dưỡng định kỳ cấp 3'
    ),
    (
        2000,
        'Thay toàn bộ dầu mỡ',
        'Đại tu nhỏ'
    ),
    (
        2000,
        'Kiểm tra động cơ',
        'Đại tu nhỏ'
    ),
    (
        2000,
        'Kiểm tra bơm thủy lực',
        'Đại tu nhỏ'
    ),
    (
        5000,
        'Đại tu tổng thể',
        'Đại tu lớn'
    ) ON CONFLICT DO NOTHING;

-- =====================================================
-- HOÀN THÀNH SEED DATA
-- =====================================================
SELECT
    'Users: ' || (
        SELECT COUNT(*)
        FROM users
    ) AS users_count,
    'Projects: ' || (
        SELECT COUNT(*)
        FROM projects
    ) AS projects_count,
    'Machines: ' || (
        SELECT COUNT(*)
        FROM machines
    ) AS machines_count,
    'Error Codes: ' || (
        SELECT COUNT(*)
        FROM error_codes
    ) AS errors_count,
    'Parts: ' || (
        SELECT COUNT(*)
        FROM parts
    ) AS parts_count,
    'Maintenance Standards: ' || (
        SELECT COUNT(*)
        FROM maintenance_standards
    ) AS standards_count;