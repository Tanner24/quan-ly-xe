# 🔍 DEBUG: 404 Error on Vehicle Detail Page

## ❌ **Vấn đề:**
Khi click vào xe trong danh sách → 404 Not Found

## ✅ **Nguyên nhân có thể:**

### 1. **Không có dữ liệu trong database**
Check database có machines không:
```sql
SELECT id, code, name FROM machines LIMIT 5;
```

**Fix:** Chạy seed data:
```bash
# Tại Supabase SQL Editor, chạy:
supabase_seed_testing_data.sql
```

---

### 2. **Supabase Client Error**
Check console log khi load `/vehicles`

**Fix:** Verify `.env.local`:
```bash
NEXT_PUBLIC_SUPABASE_URL=your_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_key
```

---

### 3. **File structure issue** ✅ (CHECKED - OK)
```
✅ src/app/vehicles/page.tsx
✅ src/app/vehicles/[id]/page.tsx
✅ src/components/vehicles/VehicleManager.tsx
```

---

### 4. **Link sai format** ✅ (CHECKED - OK)
```tsx
// Line 343 VehicleManager.tsx
<Link href={`/vehicles/${m.id}`}>  ✅ Correct!
```

---

## 🔧 **QUICK FIX:**

### **Step 1: Check data exists**
Open browser console trên `/vehicles`:
```javascript
// Should see machines array
console.log(machines)
```

### **Step 2: Manual test URL**
Try accessing directly:
```
http://localhost:3000/vehicles/some-uuid-here
```

### **Step 3: Add debug logging**
Thêm vào `VehicleManager.tsx` line 342:
```tsx
return (
  <Link 
    href={`/vehicles/${m.id}`} 
    key={m.id} 
    onClick={() => console.log('Navigating to:', m.id)}  // ADD THIS
    className="block group"
  >
```

### **Step 4: Check detail page loads**
Thêm vào `vehicles/[id]/page.tsx` line 14:
```tsx
export default async function VehicleDetailPage({ params }: VehicleDetailPageProps) {
    console.log('Detail page params:', params)  // ADD THIS
    const { id } = params
```

---

## 🎯 **MOST LIKELY CAUSE:**

**Database empty or Supabase connection issue**

### **Quick Test:**
1. Go to `/vehicles`
2. Open browser DevTools (F12)
3. Check Console for errors
4. Check Network tab for Supabase requests

### **Expected:**
- Should see: `GET` to Supabase with 200 status
- Should see machines data logged
- Click should navigate to `/vehicles/[uuid]`

### **If still 404:**
Check server terminal for errors when accessing detail page.

---

## 💡 **Temporary Workaround:**

If có data nhưng vẫn 404, thử link bằng `code` instead of `id`:

Update `VehicleManager.tsx` line 343:
```tsx
<Link href={`/vehicles/${m.code}`}>  // Use code instead of id
```

Then detail page sẽ catch bằng code (đã có logic sẵn ở line 30-38).

---

## 📝 **Debug Checklist:**

- [ ] Check database has data (Supabase → Table Editor → machines)
- [ ] Check `.env.local` variables
- [ ] Check browser console for errors
- [ ] Check server terminal for errors
- [ ] Test direct URL navigation
- [ ] Verify Supabase connection

---

**Báo cho tôi kết quả của các check trên!** 🔍
