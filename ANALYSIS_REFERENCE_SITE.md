# 🎯 PHÂN TÍCH & HỌC HỎI TỪ REFERENCE SITE

## 📊 TỔNG QUAN

**Reference:** `https://qlxvincons.netlify.app/vehicles`  
**Source:** `clone_app/src/pages/Vehicles.jsx`

---

## ✨ TÍNH NĂNG NỔI BẬT CẦN ÁP DỤNG

### 1. **TOOLBAR FILTERS & CONTROLS** (Lines 343-406)

#### a) Status Filter với 3 buttons
```jsx
<div className="flex bg-slate-100 p-1 rounded-lg">
  <button>Tất cả</button>
  <button>Quá hạn</button> {/* Red */}
  <button>Chưa đến giờ</button> {/* Green */}
</div>
```

**Logic:**
- `filterType`: all | overdue | safe
- Calculate: `remaining = nextMaintenanceHours - currentHours`
- Overdue if `remaining <= 0`

#### b) Sort Dropdown
```jsx
<select value={sortType} onChange={(e) => setSortType(e.target.value)}>
  <option value="plateNumber">Sắp xếp: Mã (A-Z)</option>
  <option value="hours_desc">Giờ máy: Cao - Thấp</option>
  <option value="hours_asc">Giờ máy: Thấp - Cao</option>
</select>
```

#### c) View Mode Toggle (Grid/List)
```jsx
<button onClick={() => setViewMode('grid')}>
  <LayoutGrid />
</button>
<button onClick={() => setViewMode('list')}>
  <List />
</button>
```

#### d) Search Bar
```jsx
<input 
  value={searchTerm}
  onChange={(e) => setSearchTerm(e.target.value)}
  placeholder="Tìm kiếm xe..."
/>
```

#### e) Action Buttons
- **Sync** (RefreshCw icon) - Line 392
- **Fix Data** (AlertTriangle icon) - Line 395
- **Download Template** (Download icon) - Line 398
- **Upload Excel** (Upload icon) - Line 402

---

### 2. **GRID VIEW CARDS** (Lines 461-526)

```jsx
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
  {vehicles.map(vehicle => (
    <div className={`bg-white p-6 rounded-2xl shadow-sm border ${
      isOverdue ? 'border-red-200 ring-1 ring-red-100' : 'border-slate-100'
    }`}>
      {/* Truck Icon + Status Badge */}
      <div className="flex justify-between items-start">
        <div className="p-3 bg-gradient-to-br from-blue-50 to-indigo-50">
          <Truck className="w-6 h-6 text-blue-600" />
        </div>
        <span className={`px-2 py-1 text-xs font-bold rounded-full ${statusColor}`}>
          {statusText}
        </span>
      </div>

      {/* Code + Department + Remaining Hours */}
      <div className="flex justify-between items-start">
        <div>
          <h3 className="text-xl font-bold">{plateNumber}</h3>
          <p className="text-slate-500 text-sm">{department}</p>
        </div>
        <div className="text-right">
          <p className="text-xs text-slate-400 uppercase">Còn lại</p>
          <p className={`font-mono font-bold ${remaining <= 0 ? 'text-red-600' : 'text-emerald-600'}`}>
            {remaining}h
          </p>
        </div>
      </div>

      {/* Current Hours + Next Maintenance */}
      <div className="flex justify-between pt-4 border-t">
        <div>
          <p className="text-xs text-slate-400">Giờ máy</p>
          <p className="font-mono font-semibold">{currentHours}h</p>
        </div>
        <div>
          <p className="text-xs text-slate-400">Bảo dưỡng</p>
          <p className="font-mono font-semibold">{nextMaintenanceHours}h</p>
        </div>
      </div>
    </div>
  ))}
</div>
```

**Key Features:**
- Gradient background for icon
- Status badge (green/red/yellow)
- **Remaining hours** prominently displayed
- Border color changes when overdue (red-200)
- Hover effects (border-blue-200)

---

### 3. **TABLE VIEW** (Lines 585-637)

```jsx
<table className="w-full text-sm">
  <thead className="bg-slate-50">
    <tr>
      <th>Mã tài sản</th>
      <th>Bộ phận sử dụng</th>
      <th className="text-right">Giờ máy hiện tại</th>
      <th className="text-right">Định mức BD</th>
      <th className="text-center">Trạng thái</th>
      <th className="text-right">Còn lại</th>
    </tr>
  </thead>
  <tbody>
    {vehicles.map(v => (
      <tr className="hover:bg-slate-50">
        <td>
          <Link to={`/vehicles/${v.id}`}>
            <Truck className="w-4 h-4" />
            {v.plateNumber}
          </Link>
        </td>
        <td>{v.department}</td>
        <td className="text-right font-mono">{v.currentHours}h</td>
        <td className="text-right font-mono">{v.nextMaintenanceHours}h</td>
        <td className="text-center">
          <span className={`px-2 py-1 rounded-full ${statusColor}`}>
            {statusText}
          </span>
        </td>
        <td className="text-right">
          <span className={`font-mono font-bold ${remaining <= 0 ? 'text-red-600' : 'text-emerald-600'}`}>
            {remaining}h
          </span>
        </td>
      </tr>
    ))}
  </tbody>
</table>
```

---

### 4. **PAGINATION** (Lines 427-456)

```jsx
const pageSize = 12; // Grid alignment
const totalPages = Math.ceil(vehicles.length / pageSize);
const paginatedVehicles = vehicles.slice(page * pageSize, (page + 1) * pageSize);

<div className="flex justify-center items-center gap-2 mt-8">
  <button onClick={() => setPage(p => Math.max(0, p - 1))}>Trước</button>
  <span>Trang {page + 1} / {totalPages}</span>
  <button onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}>Sau</button>
</div>
```

---

### 5. **STATUS HELPERS** (Lines 312-321)

```jsx
const getStatusColor = (v) => {
  if (v.status === 'Maintenance') return 'bg-yellow-100 text-yellow-700';
  if (v.nextMaintenanceHours && v.currentHours >= v.nextMaintenanceHours) 
    return 'bg-red-100 text-red-700';
  return 'bg-green-100 text-green-700';
};

const getStatusText = (v) => {
  if (v.nextMaintenanceHours && v.currentHours >= v.nextMaintenanceHours) 
    return 'Quá hạn bảo dưỡng';
  return v.status === 'Active' ? 'Hoạt động' : v.status;
};
```

---

### 6. **IMPORT/EXPORT** (Lines 195-309)

#### Download Template:
```jsx
const ws = XLSX.utils.json_to_sheet([
  { "Mã tài sản": "4C0001", "Dự Án": "HP - Vũ Yên", "Bộ phận": "...", "Giờ máy": 500 },
]);
XLSX.writeFile(wb, "mau_nhap_xe_du_an.xlsx");
```

#### Upload Excel:
```jsx
const jsonData = XLSX.utils.sheet_to_json(sheet);
await db.vehicles.bulkPut(batchData); // Bulk upsert
```

---

## 🎨 UI/UX PATTERNS

### Colors:
- **Overdue:** Red (bg-red-100, text-red-600, border-red-200)
- **Safe:** Green (bg-green-100, text-green-700, text-emerald-600)
- **Maintenance:** Yellow (bg-yellow-100, text-yellow-700)
- **Primary:** Blue (bg-blue-600, text-blue-600, border-blue-200)
- **Background:** Slate (bg-slate-50, text-slate-500)

### Typography:
- **Headings:** text-3xl font-bold (h1)
- **Vehicle Code:** text-xl font-bold
- **Labels:** text-xs text-slate-400 uppercase
- **Numbers:** font-mono font-semibold

### Spacing:
- **Card padding:** p-6
- **Gap:** gap-6
- **Border radius:** rounded-2xl

---

## 🚀 CẢI THIỆN CHO APP HIỆN TẠI

### Checklist Apply vào `/vehicles`:

1. ✅ Add Filter Buttons (All, Overdue, Safe)
2. ✅ Add Sort Dropdown (Code, Hours desc/asc)
3. ✅ Add View Mode Toggle (Grid/List)
4. ✅ Add Search Bar with icon
5. ✅ Add Action Buttons Row (Sync, FixData, Download, Upload)
6. ✅ Update Card Design:
   - Gradient icon background
   - Remaining hours display
   - Red border when overdue
   - Better status badges
7. ✅ Add Table View with all columns
8. ✅ Add Pagination (12 items/page)
9. ✅ Implement Status Helpers
10. ✅ Add Mobile Responsive adaptations

---

## 📝 CODE TO IMPLEMENT

Tôi sẽ tạo file mới với tất cả improvements này!

**File mới:** `VehicleManager_UPGRADED.tsx`
