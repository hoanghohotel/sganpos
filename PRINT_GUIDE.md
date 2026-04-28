# Hướng Dẫn Hệ Thống In Ấn POS - ESC/POS Protocol

## 📋 Tổng Quan

Hệ thống POS hiện tại hỗ trợ **hai cách in ấn**:

### 1. **In qua Browser (window.print())**
- Sử dụng hộp thoại print của trình duyệt
- In PDF hoặc sang máy in được cấu hình trong Windows/macOS/Linux
- ❌ **Không hoạt động trên Android Chrome** - Trình duyệt di động không hỗ trợ in thermal printer trực tiếp

### 2. **In qua API Server (ESC/POS Protocol)** ✅ **KHUYẾN KHÍCH**
- Sử dụng API `/api/print/` gửi lệnh ESC/POS đến máy in
- ✅ **Hoạt động 100% trên Android**, máy tính, tablet
- ✅ Hỗ trợ tất cả máy in thermal: Xprinter, Zywell, Gprinter, Sunmi, v.v
- ✅ Không cần driver hay plugin thêm
- ✅ Tự động in ngay khi thanh toán, không cần user click

---

## 🖨️ Cấu Hình Máy In

### Bước 1: Truy cập Settings
1. Vào trang **Cài đặt hệ thống**
2. Click tab **"Máy in"**

### Bước 2: Thêm Máy In

#### **Cách A: Thêm LAN/WIFI (Khuyến khích cho quán)**
1. Click **"Thêm thủ công"**
2. Nhập thông tin:
   - **Tên máy in**: VD: "Máy in tạp hóa"
   - **Loại**: LAN / WIFI
   - **IP Address**: VD: `192.168.1.100` (IP máy in trên router)
   - **Khổ in**: 80mm hoặc 58mm
   - **Vai trò**: MÁY IN HOÁ ĐƠN / MÁY IN BẾP

#### **Cách B: Quét Bluetooth (Máy tính + Android)**
1. Click **"Quét Bluetooth"**
2. Chọn máy in từ danh sách
3. Hệ thống sẽ tự thêm vào

#### **Cách C: Quét USB (Máy tính)**
1. Click **"Quét USB"**
2. Chọn máy in USB
3. Hệ thống sẽ tự thêm vào

### Bước 3: Test Kết Nối
1. Tìm máy in vừa thêm
2. Click icon 🖨️ (In thử)
3. **Máy in sẽ in trang test** nếu kết nối thành công

---

## 🤖 Cách Tìm IP Máy In

### Trên Windows:
```bash
# Mở Command Prompt rồi gõ:
arp -a
# Tìm dòng có "in" hoặc tên nhãn hàng (XPRINTER, ZYWELL, etc)
```

### Qua Web Interface:
1. Mở trình duyệt, gõ `192.168.1.1` (hoặc IP router của bạn)
2. Đăng nhập router
3. Xem **Thiết bị kết nối** → tìm máy in

### Qua Máy In:
1. **Giữ button Power** trên máy in 5-10 giây
2. Máy in sẽ in ra **trang cấu hình** với IP và MAC address

---

## 📱 Sử Dụng Trên Android

### Yêu Cầu:
- Chrome trình duyệt trên Android
- Máy in hỗ trợ LAN/WIFI hoặc Bluetooth
- Cùng mạng WiFi với máy in

### Quy Trình:
1. **Trên Settings**: Cấu hình máy in (IP, loại, khổ)
2. **Click "In thử"**: Kiểm tra kết nối
3. **Tạo đơn hàng**: Khi nhấn "Thanh toán", hóa đơn sẽ tự động in

---

## 🔧 Khắc Phục Sự Cố

### ❌ In thử không thành công
**Nguyên nhân & Giải pháp:**

| Vấn đề | Giải pháp |
|--------|---------|
| **Máy in không bật** | Kiểm tra nguồn điện, bóng đèn trạng thái |
| **IP sai** | Kiểm tra IP máy in, phải cùng dải mạng với thiết bị POS |
| **Firewall chặn** | Cho phép port 9100 trong Windows Firewall |
| **Máy in bị treo** | Tắt nguồn 10 giây rồi bật lại |
| **Cáp USB lỏng** | Kiểm tra kết nối USB (nếu dùng USB) |
| **Android không in được** | Bật Bluetooth (nếu Bluetooth), hoặc dùng LAN/WIFI |

### ❌ "Không thể kết nối máy in. Kiểm tra API server."
**Giải pháp:**
1. Kiểm tra server `npm run dev` có chạy không
2. Kiểm tra API endpoint `/api/print/test-print` có hoạt động
3. Mở DevTools (F12) xem error chi tiết

---

## 📝 API Endpoints

### 1. **Test In Thử**
```bash
POST /api/print/test-print
Authorization: Bearer {token}
```
**Response (Thành công):**
```json
{
  "success": true,
  "message": "In thử thành công! Kiểm tra máy in của bạn.",
  "commandLength": 156
}
```

### 2. **In Hóa Đơn/Phiếu Tạm Tính**
```bash
POST /api/print/receipt
Authorization: Bearer {token}
Content-Type: application/json

{
  "order": {
    "orderCode": "#ORD001",
    "tableName": "Bàn 01",
    "items": [
      { "name": "Cà phê muối", "quantity": 1, "price": 50000 }
    ],
    "subtotal": 50000,
    "discount": 0,
    "total": 50000,
    "paymentMethod": "CASH"
  },
  "isProvisional": false
}
```

### 3. **Lấy Cấu Hình Máy In**
```bash
GET /api/print/printers
Authorization: Bearer {token}
```

### 4. **Cập Nhật Cấu Hình Máy In**
```bash
PUT /api/print/printers
Authorization: Bearer {token}
Content-Type: application/json

{
  "printers": [
    {
      "id": "1",
      "name": "Máy in tạp hóa",
      "type": "LAN",
      "address": "192.168.1.100"
    }
  ],
  "defaultPrinter": "1"
}
```

---

## 🎯 Quy Trình In Tự Động

### Khi Thanh Toán:
1. **Nhấn "Thanh toán"** → Hóa đơn in qua browser (window.print)
2. **Đồng thời**, API server nhận lệnh → gửi ESC/POS đến máy in
3. **Máy in in ngay lập tức** (nếu kết nối OK)

### Khi In Phiếu Tạm Tính:
1. **Nhấn "Tạm tính"** → In qua cả browser + API printer
2. **Máy in in phiếu tạm tính** nếu có sẵn

---

## 📊 Format ESC/POS Hỗ Trợ

- ✅ **Khỏi động**: ESC @
- ✅ **Căn chỉnh**: ESC a (left/center/right)
- ✅ **Cỡ chữ**: GS ! (width × height)
- ✅ **Đậm**: ESC E
- ✅ **Xuống dòng**: LF
- ✅ **Cắt ngang**: GS V B

---

## 💡 Mẹo & Tricky

### Máy In WiFi Bị Ngắt Kết Nối
- Máy in WiFi có thể ngủ sau vài phút không dùng
- **Giải pháp**: Gửi lệnh "in thử" mỗi 5 phút từ trang Kitchen để giữ kết nối

### Khổ In Không Đúng
- Nếu in 80mm nhưng máy in là 58mm: Chỉnh lại "Khổ in" = 58mm
- In sẽ tự động scale text cho phù hợp

### Máy In Xprinter v58
- **Chỉnh "Loại"** = "XPRINTER V58/V80"
- **Chỉnh "Khổ in"** = 58mm
- **Chỉnh "Protocol"** = ESC/POS (Standard)

---

## 📞 Hỗ Trợ

Nếu có vấn đề:
1. Kiểm tra DevTools (F12) → **Network** tab → API `/api/print/receipt` có error không
2. Kiểm tra **Console** xem error message gì
3. Kiểm tra server logs: `tail -100 /tmp/server.log`
4. Liên hệ support với chi tiết lỗi

---

**Phiên bản:** 1.0 (Phát hành April 2026)
**Cập nhật gần nhất:** ESC/POS API + Android support
