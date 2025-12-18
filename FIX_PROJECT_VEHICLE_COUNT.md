# ✅ FIX HIỂN THỊ SỐ THIẾT BỊ THEO DỰ ÁN

## 🐛 **VẤN ĐỀ:**
Mỗi dự án hiển thị **"0 xe"** mặc dù đã import 3385 thiết bị

## 🔧 **NGUYÊN NHÂN:**

### **1. Logic matching không tối ưu:**
```tsx
// Before:
if (m.project_id === projectId) return true
if (m.project_name === projectName) return true
```

**Problem:**
- Chỉ check exact match
- Không handle case-sensitive
- Không check partial match
- Không verify `project_id` exists

### **2. Data có thể thiếu project_id:**
Import từ Excel thường chỉ có `project_name`, không có `project_id`

---

## ✅ **GIẢI PHÁP ĐÃ APPLY:**

### **1. Improved Matching Logic:**

```tsx
const getVehicleList = (projectId: number, projectName: string) => {
    return machines.filter(m => {
        // Match by project_id if available
        if (m.project_id && m.project_id === projectId) return true
        
        // Match by project_name (case-insensitive, trimmed)
        if (m.project_name && projectName) {
            const machineProject = m.project_name.toLowerCase().trim()
            const targetProject = projectName.toLowerCase().trim()
            
            // Exact match
            if (machineProject === targetProject) return true
            
            // Partial match (contains)
            if (machineProject.includes(targetProject)) return true
            if (targetProject.includes(machineProject)) return true
        }
        
        return false
    })
}
```

**Improvements:**
- ✅ Check if `project_id` exists before comparing
- ✅ Case-insensitive matching
- ✅ Trim whitespace
- ✅ Exact match first
- ✅ Partial match as fallback

### **2. Debug Logging:**

Added console logs to help diagnose:
```tsx
console.log(`Fetched ${machines.length} machines`)
console.log('Sample machine:', machines[0])
console.log('Machines grouped by project:', groupedByProject)
console.log(`Project "${name}": ${count} machines`)
```

---

## 🔍 **DEBUG STEPS:**

### **1. Refresh trang Settings → Projects**

### **2. Mở Console (F12)**

### **3. Xem output:**

```
Fetched 3385 machines from database
Sample machine: {
  code: "4C0001",
  project_name: "Dự án Metro ...",
  project_id: null,  ← CÓ THỂ NULL!
  status: "active"
}

Machines grouped by project_name: {
  "Dự án Metro HN3": 450,
  "Dự án Khu Đô thị": 320,
  ...
}

Project "Dự án Metro HN3" (ID: 2): 450 machines ✅
```

---

## 🎯 **EXPECTED RESULTS:**

**Sau khi refresh:**
- ✅ Mỗi dự án hiển thị **đúng số thiết bị**
- ✅ Console log ra số lượng cho từng dự án
- ✅ "0 xe" chỉ hiện nếu thật sự không có máy

---

## ⚠️ **NẾU VẪN HIỆN 0:**

### **Check 1: Machines có data?**
```javascript
// In console:
console.log(machines.length)  // Should be > 0
```

### **Check 2: project_name match?**
```javascript
// Xem tên dự án trong machines có khớp với tên trong projects không?
console.log(machines[0].project_name)  // e.g. "Dự án Metro HN3"
console.log(projects[0].name)          // e.g. "Dự án Metro ..." ← CÓ THỂ KHÁC!
```

### **Check 3: Fetch limit?**
Đã set `.range(0, 19999)` - OK cho 20k machines ✅

---

## 🔧 **MANUAL FIX NẾU CẦN:**

### **Option 1: Sync project_id**
Nếu machines chỉ có `project_name` mà không có `project_id`:

```sql
-- Run in Supabase SQL Editor
UPDATE machines m
SET project_id = p.id
FROM projects p
WHERE m.project_name = p.name
AND m.project_id IS NULL;
```

### **Option 2: Normalize names**
Đảm bảo tên dự án khớp exactly:

```sql
-- Trim whitespace
UPDATE machines
SET project_name = TRIM(project_name)
WHERE project_name IS NOT NULL;

UPDATE projects
SET name = TRIM(name)
WHERE name IS NOT NULL;
```

---

## ✅ **TEST:**

1. **Refresh** Settings → Projects
2. **Check console** logs
3. **Should see** numbers instead of "0 xe"
4. **Click** "DANH SÁCH THIẾT BỊ" để expand và xem list

---

**Refresh và báo kết quả!** 🚀

**Nếu vẫn 0, share console logs để tôi debug tiếp!**
