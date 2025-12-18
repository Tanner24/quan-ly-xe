# 🔗 HƯỚNG DẪN KẾT NỐI VÀO TRANG CHI TIẾT XE

## 📋 FLOW HOẠT ĐỘNG

### 1️⃣ **Từ Danh Sách Xe → Chi Tiết Xe**

```
/vehicles (Danh sách) 
    ↓ Click vào xe
/vehicles/[id] (Chi tiết)
```

---

## 🎯 CÁCH HOẠT ĐỘNG

### **File: VehicleManager.tsx** (Danh sách xe)

```tsx
// Line 269 - Grid View
<Link href={`/vehicles/${m.id}`} key={m.id}>
    <div className="vehicle-card">
        <h3>{m.code}</h3>
        <p>{m.model}</p>
    </div>
</Link>

// Line 336 - Table View
<Link href={`/vehicles/${m.id}`}>
    {m.code}
</Link>
```

**Giải thích:**
- `m.id` = UUID của máy (vd: `a1b2c3d4-e5f6-...`)
- Khi click → Navigate to `/vehicles/a1b2c3d4-e5f6-...`

---

### **File: [id]/page.tsx** (Trang chi tiết)

```tsx
// Line 13-41: Fetch machine by ID or Code
export default async function VehicleDetailPage({ params }) {
    const { id } = params  // Lấy ID từ URL
    
    // Try by UUID first
    let machine = await supabase
        .from('machines')
        .select('*')
        .eq('id', id)
        .single()
    
    // If not found, try by code
    if (!machine) {
        machine = await supabase
            .from('machines')
            .select('*')
            .eq('code', id)
            .single()
    }
    
    // Render detail page
    return <VehicleDetailManager machine={machine} />
}
```

**Giải thích:**
- Nhận `id` từ URL
- Tìm máy bằng UUID hoặc code
- Hiển thị trang chi tiết

---

## 🔄 CÁCH SỬ DỤNG

### **Cách 1: Click từ Grid View**
1. Vào `/vehicles`
2. Nhìn thấy các card xe
3. **Click vào bất kỳ card nào**
4. → Chuyển đến trang chi tiết

### **Cách 2: Click từ Table View**
1. Vào `/vehicles`
2. Nhìn thấy bảng danh sách
3. **Click vào MÃ XE (cột đầu tiên)**
4. → Chuyển đến trang chi tiết

### **Cách 3: URL trực tiếp**
Gõ URL:
- `/vehicles/4C0001` (bằng code)
- `/vehicles/uuid-here` (bằng UUID)

---

## 💻 CODE MẪU - Thêm Link Mới

Nếu muốn thêm link ở chỗ khác:

```tsx
import Link from "next/link"

// Link bằng ID (UUID)
<Link href={`/vehicles/${machine.id}`}>
    Xem chi tiết {machine.code}
</Link>

// Link bằng Code
<Link href={`/vehicles/${machine.code}`}>
    Xem {machine.code}
</Link>
```

---

## 📊 DEMO WORKFLOW

```
1. USER vào /vehicles
   ↓
2. Thấy danh sách 20 máy (VC-001 ... VC-020)
   ↓
3. Click vào "VC-005"
   ↓
4. URL changes to: /vehicles/VC-005
   ↓
5. Server fetch machine where code = 'VC-005'
   ↓
6. Render VehicleDetailManager với:
   - Thông tin chi tiết
   - Lịch sử bảo dưỡng
   - Form cập nhật giờ
```

---

## ✅ CHECKLIST - Đã Hoạt Động

- [x] Link trong Grid View (Line 269)
- [x] Link trong Table View (Line 336)  
- [x] Route handler `/vehicles/[id]/page.tsx`
- [x] Support cả UUID và Code
- [x] Fetch machine data
- [x] Render detail component

---

## 🐛 TROUBLESHOOTING

### Vấn đề: Click không chuyển trang
**Nguyên nhân:** Next.js Link không hoạt động
**Fix:** Check console errors

### Vấn đề: 404 Not Found
**Nguyên nhân:** Machine không tồn tại
**Fix:** Check machine code/ID trong database

### Vấn đề: Trang trắng
**Nguyên nhân:** Component error
**Fix:** Check console, xem error message

---

## 🎯 SUMMARY

**Để vào chi tiết xe:**
1. ✅ Vào `/vehicles`
2. ✅ Click vào MÃ XE hoặc CARD
3. ✅ Tự động chuyển đến `/vehicles/[id]`
4. ✅ Xem đầy đủ thông tin + lịch sử

**Đơn giản vậy thôi!** 🚀
