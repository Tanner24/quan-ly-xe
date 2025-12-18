    # Hướng dẫn Cập nhật Database cho Tính năng Mới

Để các tính năng **Quản lý Nhân sự**, **Import Excel** và **Sửa lỗi nhập liệu** hoạt động chính xác, bạn cần chạy 2 file SQL sau trong **Supabase SQL Editor**:

### 1. Sửa lỗi `Numeric Overflow` và `Log Date`
File: `supabase_fix_numeric_overflow.sql`
*   **Mục đích:** Sửa lỗi không lưu được số ODO lớn và đảm bảo cột ngày tháng hợp lệ.
*   **Cách chạy:**
    1.  Mở Supabase Dashboard -> SQL Editor.
    2.  Tạo query mới.
    3.  Copy nội dung file `supabase_fix_numeric_overflow.sql` trong dự án.
    4.  Nhấn **RUN**.

### 2. Tạo bảng Quản lý Nhân sự (Users)
File: `supabase_migration_users.sql`
*   **Mục đích:** Tạo bảng `users` để lưu danh sách nhân viên, mật khẩu (quản lý nội bộ) và phân quyền dự án.
*   **Cách chạy:**
    1.  Mở Supabase Dashboard -> SQL Editor.
    2.  Tạo query mới.
    3.  Copy nội dung file `supabase_migration_users.sql`.
    4.  Nhấn **RUN**.
*   **Tài khoản Admin mặc định:**
    *   Username: `admin`
    *   Password: `admin123`

---

### Các tính năng đã cập nhật:
1.  **Settings Dashboard:** Truy cập `/settings` để thấy giao diện tổng quan.
2.  **Quản lý Nhân sự:** Thêm/Sửa/Xóa nhân viên, phân quyền dự án (Xem `/settings/users`).
3.  **Database Editor:** Xem và chỉnh sửa dữ liệu thô, **Import Excel** vào bất kỳ bảng nào (Xem `/settings/view-data`).
4.  **Data Controls:** Các nút "Vùng nguy hiểm" (Xóa trắng DB, Tạo dữ liệu mẫu) và "Dọn dẹp Log rác" đã được thêm vào cuối trang Settings.
5.  **Driver Log Form:** Đã sửa lỗi nhập liệu (Ngày tháng, ODO).
