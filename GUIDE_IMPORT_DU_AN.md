# 📥 HƯỚNG DẪN IMPORT "DỰ ÁN.XLSX" VÀO DATABASE

## 🎯 PHƯƠNG PHÁP 1: SỬ DỤNG UI (ĐƠN GIẢN NHẤT)

### Bước 1: Vào trang Import
1. Mở browser: `http://localhost:3000/settings/data`
2. Sẽ thấy trang "Trung tâm Dữ liệu"

### Bước 2: Chọn Universal Import
1. Tìm section "Universal Import" 
2. Click vào khu vực upload
3. Chọn file `D:\Vincons\dự án.xlsx`
4. Click "Upload & Import"

### Bước 3: Hoặc Import Projects riêng
1. Vào `http://localhost:3000/settings/projects`
2. Click nút "Import Excel"
3. Chọn file `D:\Vincons\dự án.xlsx`
4. Data sẽ được import tự động

---

## 🎯 PHƯƠNG PHÁP 2: TẠO SQL SCRIPT

Nếu file Excel có cấu trúc:

| Mã Dự Án | Tên Dự Án | Địa chỉ | Ngày bắt đầu | Ngày kết thúc | Trạng thái |
|----------|-----------|---------|--------------|---------------|------------|
| DA-CL | Dự án Cổ Loa | Đông Anh, HN | 01/01/2024 | 31/12/2024 | active |

Tạo SQL:

```sql
-- Import từ file "dự án.xlsx"
INSERT INTO projects (code, name, address, start_date, end_date, status, description)
VALUES 
    ('DA-CL', 'Dự án Cổ Loa', 'Đông Anh, Hà Nội', '2024-01-01', '2024-12-31', 'active', 'Dự án xây dựng Cổ Loa'),
    ('DA-HN', 'Dự án Hà Nội', 'Ba Đình, Hà Nội', '2024-01-01', '2024-12-31', 'active', 'Dự án trọng điểm Hà Nội'),
    ('DA-HCM', 'Dự án TP.HCM', 'Quận 1, TP.HCM', '2024-01-01', '2025-06-30', 'active', 'Dự án tại TP.HCM');

-- Kiểm tra kết quả
SELECT * FROM projects WHERE code LIKE 'DA-%';
```

---

## 🎯 PHƯƠNG PHÁP 3: PYTHON SCRIPT (TỰ ĐỘNG)

Tạo file `import_projects.py`:

```python
import pandas as pd
from supabase import create_client, Client

# Config
SUPABASE_URL = "your_supabase_url"
SUPABASE_KEY = "your_supabase_key"
supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

# Đọc Excel
df = pd.read_excel(r"D:\Vincons\dự án.xlsx")

# Map columns (adjust theo file Excel thực tế)
column_mapping = {
    'Mã': 'code',
    'Tên dự án': 'name',
    'Địa chỉ': 'address',
    'Ngày bắt đầu': 'start_date',
    'Ngày kết thúc': 'end_date',
    'Trạng thái': 'status'
}

df_renamed = df.rename(columns=column_mapping)

# Convert to dict
projects = df_renamed.to_dict('records')

# Insert vào Supabase
for project in projects:
    result = supabase.table('projects').insert(project).execute()
    print(f"Inserted: {project['code']}")

print(f"Imported {len(projects)} projects!")
```

Chạy:
```bash
python import_projects.py
```

---

## ✅ SAU KHI IMPORT

### Kiểm tra dữ liệu:
```sql
-- Xem tất cả projects
SELECT code, name, status FROM projects;

-- Đếm số projects
SELECT COUNT(*) FROM projects;

-- Xem projects active
SELECT * FROM projects WHERE status = 'active';
```

### Assign machines vào projects:
```sql
-- Gán máy vào dự án
UPDATE machines 
SET project_id = (SELECT id FROM projects WHERE code = 'DA-CL')
WHERE code IN ('4C0001', '4C0002', '4C0003');
```

---

## 🎨 ĐỊNH DẠNG FILE EXCEL

File "dự án.xlsx" nên có format:

```
Sheet: "Projects" hoặc "Dự án"

| Mã     | Tên dự án        | Địa chỉ          | Trạng thái |
|--------|------------------|------------------|------------|
| DA-001 | Dự án A         | Hà Nội          | active     |
| DA-002 | Dự án B         | TP.HCM          | active     |
```

Hoặc:

```
| code   | name            | address         | status     |
|--------|-----------------|-----------------|------------|
| DA-001 | Project Alpha   | Hanoi          | active     |
```

---

## 🐛 TROUBLESHOOTING

### Lỗi: Column không khớp
**Fix:** Rename columns trong Excel để match:
- `code`, `name`, `address`, `start_date`, `end_date`, `status`

### Lỗi: Date format sai
**Fix:** Format ngày trong Excel: `YYYY-MM-DD` (vd: `2024-01-15`)

### Lỗi: Duplicate code
**Fix:** Check trùng lặp:
```sql
SELECT code, COUNT(*) 
FROM projects 
GROUP BY code 
HAVING COUNT(*) > 1;
```

---

## 🚀 KHUYẾN NGHỊ

**Cách tốt nhất:**
1. ✅ Dùng UI Import ở `/settings/data` (Đơn giản nhất)
2. ✅ Download template từ "Tải bộ mẫu Excel chuẩn"
3. ✅ Copy data từ "dự án.xlsx" vào template
4. ✅ Upload lại

**Lợi ích:**
- Tự động map columns
- Validate data
- Error handling
- UI feedback

---

Bạn muốn tôi làm cách nào?
1. Hướng dẫn import qua UI
2. Tạo SQL script mẫu
3. Viết Python script

Cho tôi biết! 🎯
