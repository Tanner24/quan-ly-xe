# 📋 HƯỚNG DẪN FIX IMPORT BẢO DƯỠNG

## ✅ **ĐÃ FIX!**

### **Vấn đề:**
Upload file Excel bảo dưỡng → Lỗi "Không tìm thấy dữ liệu hợp lệ"

### **Nguyên nhân:**
Tên cột trong Excel không khớp với mapping

### **Giải pháp:**
Đã thêm **nhiều variants** cho column names:

---

## 📊 **CÁC CỘT HỖ TRỢ:**

### **1. Mã tài sản:**
- "mã tài sản"
- "mã xe"
- "machine_code"
- "code"

### **2. Ngày:**
- "ngày thực hiện"
- "ngày bd"
- "ngày bảo dưỡng"
- "ngày"
- "date"

### **3. Nội dung:**
- "nội dung"
- "nội dung bd"
- "công việc"
- "task_name"

### **4. Mức BD:**
- "mức bd"
- "level"
- "loại bd"
- "maintenance_level"

### **5. Giờ thực hiện:**
- "odo giờ thực hiện bd"
- "odo bd"
- "giờ bd"
- "hours"
- "hours_at_maintenance"

### **6. Chi phí:**
- "chi phí"
- "cost"

### **7. Ghi chú:**
- "ghi chú"
- "notes"

---

## 📝 **FILE MẪU CHUẨN:**

### **Excel Header (Dòng đầu):**
| Mã tài sản | Ngày | Nội dung | Mức BD | Giờ BD | Chi phí | Ghi chú |
|------------|------|----------|--------|--------|---------|---------|
| 4C0001 | 2024-01-15 | Thay dầu | Minor | 500 | 500000 | OK |
| 4C0002 | 2024-01-20 | BD định kỳ | Major | 1000 | 1500000 | Hoàn thành |

**Hoặc tiếng Anh:**
| machine_code | date | task_name | level | hours | cost | notes |
|--------------|------|-----------|-------|-------|------|-------|
| 4C0001 | 2024-01-15 | Oil change | Minor | 500 | 500000 | OK |

---

## 🔍 **SMART DETECTION:**

Hệ thống tự động nhận diện:
1. **Tìm header** (trong 20 dòng đầu)
2. **Detect table type** (machines/maintenance/standards)
3. **Map columns** thông minh
4. **Validate data**
5. **Import vào đúng bảng**

---

## ✅ **TEST NGAY:**

1. **Tạo file Excel mới** với header ở trên
2. **Upload** vào card "Nhập liệu Bảo dưỡng"
3. Xem **results** với preview table
4. Success → Thấy green card với stats!

---

## 🎯 **LƯU Ý:**

### **Bắt buộc:**
- ✅ Có cột "Mã tài sản" (hoặc variants)
- ✅ Mã tài sản phải tồn tại trong bảng machines
- ✅ Định dạng ngày: YYYY-MM-DD hoặc DD/MM/YYYY

### **Optional:**
- Các cột khác không bắt buộc
- Hệ thống tự động bỏ qua dòng thiếu mã

---

## 🐛 **NẾU VẪN LỖI:**

### **Check:**
1. File có phải .xlsx hoặc .xls không?
2. Dòng đầu có chứa tên cột không?
3. Cột "Mã tài sản" có data không?
4. Xem Console (F12) để debug

### **Xem kết quả:**
- Success → Green card + preview table
- Error → Red card + chi tiết lỗi

---

**Đã fix! Test lại đi!** 🚀
