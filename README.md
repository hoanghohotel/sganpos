# ☕ Cà Phê POS - Hệ Thống Quản Lý Giải Pháp Bán Cà Phê

Hệ thống quản lý bán hàng (POS) chuyên nghiệp dành cho các quán cà phê Việt Nam, hỗ trợ đa chi nhánh (multi-tenant) và đồng bộ nhà bếp thời gian thực.

## 🚀 Tính năng chính

- **Bán hàng (POS):** Giao diện order nhanh chóng, trực quan.
- **Nhà bếp (Kitchen):** Theo dõi và cập nhật trạng thái đơn hàng thời gian thực qua Socket.IO.
- **Đa chi nhánh (Multi-tenant):** Tự động nhận diện chi nhánh qua tên miền phụ (subdomain).
- **Công nghệ:** Node.js, Express, React, Vite, MongoDB, Socket.IO.

---

## 🛠️ Hướng dẫn cài đặt (Installation)

### 1. Tải project về máy (Clone)
Mở terminal và chạy lệnh:
```bash
# Ví dụ nếu bạn tải qua git (nếu có) hoặc tải file ZIP về và giải nén
cd coffee-pos-system
```

### 2. Cài đặt thư viện (Install Dependencies)
Chạy lệnh sau để tải các thư viện cần thiết:
```bash
npm install
```

### 3. Cấu hình Môi trường (Setup ENV)
Tạo một file tên là `.env` ở thư mục gốc của dự án và dán nội dung sau vào:

```env
MONGODB_URI="mongodb+srv://user:password@cluster0.mongodb.net/coffee_pos"
GEMINI_API_KEY="your_api_key_here"
```

> **Lưu ý:** Bạn cần thay `your_connection_string` bằng đường dẫn kết nối database MongoDB của bạn.

---

## 🏃 Chạy dự án (Run Local)

### 1. Tạo dữ liệu mẫu (Seed Data)
Để có sẵn menu và bàn ghế để dùng thử, hãy chạy lệnh:
```bash
npm run seed
```

### 2. Chạy chế độ phát triển
Chạy lệnh sau để khởi động cả Server và Frontend:
```bash
npm run dev
```
Ứng dụng sẽ chạy tại địa chỉ: `http://localhost:3000`

---

## ☁️ Triển khai lên Vercel (Deployment)

Mặc dù dự án sử dụng Express, bạn có thể triển khai lên Vercel bằng cách sử dụng Serverless Functions hoặc cấu hình Proxy.

### Các bước thực hiện:
1. **Kết nối GitHub:** Đẩy code của bạn lên một repository trên GitHub.
2. **Import vào Vercel:** Truy cập [Vercel Dashboard](https://vercel.com/dashboard) và chọn "Add New Project".
3. **Thêm Biến Môi Trường (Environment Variables):**
   - Trong quá trình Setup, tìm mục **Environment Variables**.
   - Thêm `MONGODB_URI` với giá trị là đường dẫn database thật của bạn.
4. **Deploy:** Nhấn nút Deploy.

---

## 📂 Cấu trúc thư mục

- `/server.ts`: File khởi tạo server Express & Socket.IO.
- `/src/models`: Định dạng dữ liệu (database schemas).
- `/src/pages`: Giao diện người dùng (POS, Nhà bếp).
- `/src/lib`: Các công cụ hỗ trợ (Kết nối MongoDB, Tenant helper).
- `/src/middleware`: Bộ lọc xử lý (Nhận diện chi nhánh).

---

## 🛡️ Quan trọng về Bảo mật

- **Không bao giờ** chia sẻ hoặc commit file `.env` lên GitHub.
- Luôn sử dụng Biến môi trường (Environment Variables) để lưu trữ thông tin nhạy cảm.
- Tất cả dữ liệu đã được cô lập theo `tenantId` để đảm bảo quán này không nhìn thấy dữ liệu của quán khác.
