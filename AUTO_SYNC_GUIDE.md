# 🤖 AUTO-SYNC PROJECTS TOOL

## 📋 **TOOL INFO:**

**File:** `auto-sync-projects.js`  
**Purpose:** Tự động sync projects từ Excel vào Supabase  
**Language:** Node.js + Supabase SDK

---

## 🎯 **TOOL LÀM GÌ:**

### **Step 1: Read Excel** 📖
- Đọc file `D:\Vincons\dự án.xlsx`
- Extract tất cả machines và project names

### **Step 2: Normalize Names** 🧹
- Remove prefixes: `(P.QLTB)`, `(QLTB)`, etc.
- Consolidate storage: `TB Lưu Kho` → `Lưu Kho`
- Trim whitespace

### **Step 3: Fetch Existing** 📡
- Get tất cả projects từ Supabase
- Map existing projects by name

### **Step 4: Create/Update Projects** 🔄
- Tạo projects mới nếu chưa có
- Skip nếu đã tồn tại
- Generate unique codes

### **Step 5: Update Machines** 🔧
- Update `project_name` (normalized)
- Update `project_id` (mapped)
- Batch update cho performance

### **Step 6: Verify** ✅
- Show top 10 projects
- Count machines per project
- Report unmapped machines

---

## 🚀 **CÁCH CHẠY:**

### **Prerequisites:**
```bash
# Đã có .env.local với:
NEXT_PUBLIC_SUPABASE_URL=your-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-key
```

### **Run Tool:**
```bash
node auto-sync-projects.js
```

### **Expected Output:**
```
🚀 Starting Auto-Sync Tool...

📖 Reading Excel file: D:\Vincons\dự án.xlsx
✅ Found 3385 machines in Excel

📊 Project column: "Dự Án"
✅ Found 107 unique projects

📡 Fetching existing projects from Supabase...
✅ Found 33 existing projects in DB

🔄 Syncing projects...

✓ Exists: Lưu Kho (738 machines)
✓ Exists: Vũ Yên (321 machines)
+ Create: HTSL-Cần Giờ (378 machines)
+ Create: XD-Cổ Loa (107 machines)
...

📝 Creating 74 new projects...
✅ Created 74 projects

🔧 Updating machines...
  Updated 100/3385 machines...
  Updated 200/3385 machines...
  ...
✅ Updated 3385 machines

📊 Verification Report:

Top 10 Projects by Machine Count:
  1. Lưu Kho: 738 machines
  2. HTSL-Cần Giờ: 378 machines
  3. HTSL-Vũ Yên: 321 machines
  4. SGC-Cần Giờ: 167 machines
  5. XD-Cổ Loa: 107 machines
  ...

❌ Unmapped machines: 0
✅ Total machines: 3385
✅ Total projects: 107

🎉 Auto-Sync Complete!
```

---

## ✅ **FEATURES:**

### **1. Smart Normalization** 🧠
```javascript
"(P.QLTB) Thi công hạ tầng san lấp-Vũ Yên"
→ "HTSL-Vũ Yên"

"TB Lưu Kho"
→ "Lưu Kho"
```

### **2. Duplicate Prevention** 🚫
- Check existing projects before creating
- Skip if name already exists
- No duplicates!

### **3. Auto Code Generation** 🏷️
```javascript
"HTSL-Vũ Yên" → "HTS-VŨ-YÊ-47"
"XD-Cổ Loa"   → "XD-CỔ-LOA-23"
```

### **4. Batch Updates** ⚡
- Process 100 machines at a time
- Progress logging
- Efficient & fast

### **5. Verification** ✅
- Show results immediately
- Count machines per project
- Identify unmapped items

---

## 🎨 **CUSTOMIZATION:**

### **Change Excel Path:**
```javascript
const EXCEL_FILE = 'D:\\\\Your\\\\Path\\\\file.xlsx';
```

### **Adjust Normalization:**
```javascript
function normalizeProjectName(name) {
    // Add your custom logic
    if (name.includes('Special')) {
        return 'Custom Name';
    }
    // ... rest of logic
}
```

### **Custom Project Codes:**
```javascript
function generateProjectCode(name) {
    // Your custom format
    return `PROJ-${Date.now()}`;
}
```

---

## ⚠️ **SAFETY:**

### **What it DOES:**
- ✅ Create new projects
- ✅ Update machines.project_name
- ✅ Update machines.project_id

### **What it DOESN'T:**
- ❌ Delete existing data
- ❌ Modify existing projects
- ❌ Change machine codes

### **Rollback:**
No automatic rollback - use Supabase backup if needed

---

## 🐛 **TROUBLESHOOTING:**

### **Error: "Cannot find module"**
```bash
npm install @supabase/supabase-js xlsx dotenv
```

### **Error: "ENOENT: no such file"**
Check Excel file path is correct:
```javascript
const EXCEL_FILE = 'D:\\\\Vincons\\\\dự án.xlsx';
```

### **Error: "Invalid Supabase credentials"**
Check `.env.local`:
```
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJxxx...
```

### **Counts still 0 in UI:**
1. Refresh browser (Ctrl+F5)
2. Check console logs
3. Verify project names match

---

## 📊 **AFTER RUNNING:**

### **1. Refresh UI** 🔄
```
Settings → Projects
→ Should see correct counts!
```

### **2. Verify Counts** ✅
```
Each project card should show:
"DANH SÁCH THIẾT BỊ: X xe"
```

### **3. Check Database** 🗄️
```sql
SELECT 
    p.name,
    COUNT(m.id) as machine_count
FROM projects p
LEFT JOIN machines m ON m.project_id = p.id
GROUP BY p.name
ORDER BY machine_count DESC;
```

---

## 📝 **LOGS:**

Tool creates detailed logs showing:
- ✅ Projects created
- ✅ Machines updated
- ✅ Final counts
- ❌ Any errors

Save output for reference!

---

## 🔁 **RE-RUN:**

Safe to run multiple times:
- Won't create duplicates
- Only updates missing data
- Idempotent operation

---

## 🎯 **USE CASES:**

### **1. Initial Setup**
First time importing from Excel

### **2. Regular Sync**
After adding new machines to Excel

### **3. Data Cleanup**
Normalize messy project names

### **4. Migration**
Moving from old system

---

## ✅ **CHECKLIST:**

Before running:
- [ ] Excel file exists at path
- [ ] .env.local configured
- [ ] Node.js installed
- [ ] npm packages installed

After running:
- [ ] Check output logs
- [ ] Verify in Supabase
- [ ] Refresh UI
- [ ] Test project pages

---

## 🆘 **SUPPORT:**

**File:** `auto-sync-projects.js`  
**Guide:** `AUTO_SYNC_GUIDE.md`  
**Excel:** `D:\Vincons\dự án.xlsx`

---

**READY? RUN IT!** 🚀

```bash
node auto-sync-projects.js
```

**Xem magic xảy ra!** ✨
