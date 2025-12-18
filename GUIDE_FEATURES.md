# Hướng dẫn Sử dụng Các Tính năng Kỹ thuật Mới

Hệ thống đã được cập nhật thêm 4 module hỗ trợ kỹ thuật và đào tạo. Dưới đây là hướng dẫn sử dụng và nhập liệu.

### 1. Tra cứu Mã lỗi (Technical/Error Codes)
*   **Truy cập:** Menu bên trái -> Kỹ thuật & Tra cứu -> Tra cứu Mã lỗi.
*   **Chức năng:** Tìm kiếm mã lỗi theo Code hoặc Mô tả. Có hiển thị hướng dẫn khắc phục.
*   **Nhập liệu:** Sử dụng nút "Thêm Mã lỗi mới" trên giao diện hoặc Import Excel qua [DB Editor](/settings/view-data).

### 2. Tra cứu Phụ tùng OEM (Technical/OEM Lookup)
*   **Truy cập:** Menu bên trái -> Kỹ thuật & Tra cứu -> Tra cứu Phụ tùng OEM.
*   **Chức năng:** Tìm kiếm phụ tùng theo Mã (P/N), Tên hoặc Mã quy đổi (Cross-reference).
*   **Ví dụ:** Tìm `LF9009` sẽ ra lọc Fleetguard và các mã tương đương.
*   **Nhập liệu:** Có thể thêm trực tiếp hoặc Import Excel vào bảng `parts`.

### 3. Hướng dẫn Bảo dưỡng (Technical/Maintenance Guide)
*   **Truy cập:** Menu bên trái -> Kỹ thuật & Tra cứu -> Hướng dẫn Bảo dưỡng.
*   **Chức năng:** Chọn Model máy để xem quy trình bảo dưỡng chuẩn theo giờ (250h, 500h, 1000h...).
*   **Dữ liệu:** Dữ liệu được lấy từ bảng `maintenance_standards`.
*   **Cách nhập liệu:**
    *   Hiện tại chưa có form nhập liệu trên trang này (do cấu trúc phức tạp).
    *   Hãy sử dụng **Settings -> DB Editor**, chọn bảng `maintenance_standards`.
    *   **Cấu trúc Import Excel/JSON:**
        *   `machine_model`: Tên Model (VD: PC200-8).
        *   `interval_hours`: Số (VD: 500).
        *   `maintenance_type`: Tên cấp bảo dưỡng (VD: Bảo dưỡng cấp 2).
        *   `tasks`: Danh sách công việc dạng JSON Array `["Thay nhớt", "Thay lọc dầu"]`.

### 4. Đào tạo & Khóa học (Training/Courses)
*   **Truy cập:** Menu bên trái -> Kỹ thuật & Tra cứu -> Đào tạo & Khóa học.
*   **Chức năng:** Xem danh sách các bài học an toàn và kỹ thuật.
*   **Lưu ý:** Hiện tại dữ liệu khóa học đang là mẫu (Mock Data). Trong tương lai có thể kết nối với bảng Database thật.

---
**Lưu ý chung:**
Để dữ liệu hiển thị đầy đủ, bạn vui lòng sử dụng tính năng **Import Excel** trong trang **Settings -> Database Editor** để nạp dữ liệu từ hệ thống cũ sang.
