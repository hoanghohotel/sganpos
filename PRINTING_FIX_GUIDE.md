# Hướng dẫn sửa lỗi in ấn - Chức năng in ấn SGANPOS

## Vấn đề đã được xác định & sửa chữa

### 1. ❌ **Vấn đề gốc**
- **Lỗi in ấn không hoạt động**: `window.write()` thay vì `document.write()`
- **Không có xem trước**: Chỉ có tùy chọn in trực tiếp, không có xem trước
- **Script tự động in**: HTML template có script tự động in mà có thể bị chặn bởi popup blocker
- **Không có độ trễ**: Cửa sổ in mở quá nhanh khiến nội dung chưa tải xong

### 2. ✅ **Các sửa chữa đã thực hiện**

#### a) **Sửa hàm `printOrder` trong `src/lib/printing.ts`**
```typescript
// ✅ Sửa lỗi cú pháp
printWindow.document.open();
printWindow.document.write(html);
printWindow.document.close();

// ✅ Đợi nội dung tải xong rồi in
printWindow.onload = () => {
  setTimeout(() => {
    printWindow.focus();
    printWindow.print();
  }, 250);
};
```

#### b) **Tạo hàm `printPreview` mới**
- Hàm này mở cửa sổ xem trước mà KHÔNG in tự động
- Cho phép người dùng xem nội dung trước khi in
- Có thể đóng hoặc print từ cửa sổ xem trước

#### c) **Xóa script tự động in**
- Loại bỏ `<script>window.print();</script>` khỏi HTML template
- Script tự động in khi load cửa sổ mới (nguyên nhân chính gây lỗi)

#### d) **Thêm nút "Xem trước" trong POSPage**
- Nút mới bên cạnh nút "In tạm tính"
- Giúp người dùng kiểm tra nội dung trước khi in

---

## 📋 Cách sử dụng chức năng in ấn

### Tại màn hình POS (POSPage)

1. **Xem trước phiếu tạm tính** (Recommended)
   - Nhấp nút `Xem trước` (Eye icon)
   - Cửa sổ mới hiển thị hóa đơn
   - Kiểm tra thông tin
   - Chọn `In` để in hoặc `Đóng` để thoát

2. **In phiếu tạm tính trực tiếp**
   - Nhấp nút `In tạm tính` (Printer icon)
   - Hộp thoại in trình duyệt sẽ hiển thị
   - Chọn máy in và nhấp `In`

3. **Khi checkout (thanh toán)**
   - Hóa đơn sẽ tự động mở cửa sổ in
   - Chọn máy in và nhấp `In`
   - Hóa đơn in tự động sau khi thanh toán thành công

---

## 🔧 Các tệp đã sửa chữa

### 1. `/src/lib/printing.ts`
**Thay đổi:**
- Sửa hàm `printOrder` với cú pháp đúng
- Thêm hàm `printPreview` mới
- Xóa script tự động in
- Thêm error handling

**Dòng đã thay đổi:**
- Line 196-219: Sửa `printOrder`
- Line 221-246: Thêm `printPreview`
- Line 189: Xóa script tự động

### 2. `/src/pages/POSPage.tsx`
**Thay đổi:**
- Import `printPreview` từ printing.ts
- Thêm hàm `handlePreviewProvisional`
- Thêm nút UI "Xem trước"
- Import icon `Eye` từ lucide-react

**Dòng đã thay đổi:**
- Line 4: Thêm `Eye` icon
- Line 10: Thêm `printPreview` import
- Line 334-353: Thêm hàm `handlePreviewProvisional`
- Line 958-968: Thêm nút "Xem trước"

### 3. `/src/components/PrintPreviewModal.tsx` (Mới)
**Tính năng:**
- Component Modal để xem trước in trong ứng dụng
- Các nút: Đóng, Tải về HTML, In ngay
- Responsive design

---

## 🧪 Cách kiểm tra chức năng

### Test 1: In phiếu tạm tính
```
1. Thêm 1-2 sản phẩm vào giỏ hàng
2. Nhấp nút "Xem trước"
3. Xác nhận nội dung hiển thị đúng
4. Nhấp "In ngay" hoặc chọn "Đóng"
5. Nếu chọn "In", hộp thoại in sẽ xuất hiện
```

### Test 2: In hóa đơn thanh toán
```
1. Thêm sản phẩm vào giỏ hàng
2. Nhấp "Thanh toán"
3. Chọn bàn/loại đơn hàng
4. Chọn phương thức thanh toán
5. Nhấp "Xác nhận"
6. Cửa sổ in sẽ tự động mở
7. Chọn máy in và nhấp "In"
```

### Test 3: Kiểm tra popup blocker
```
1. Nếu cửa sổ in không mở:
   - Kiểm tra popup blocker của trình duyệt
   - Cho phép domain ứng dụng mở popup
   - Thử lại
```

---

## 🛠️ Troubleshooting

### Vấn đề: Cửa sổ in không mở
**Nguyên nhân:** Trình duyệt chặn popup
**Giải pháp:**
```
1. Kiểm tra biểu tượng khóa popup trong thanh địa chỉ
2. Nhấp và cho phép popup từ domain này
3. Thử lại in
```

### Vấn đề: Nội dung in không hiển thị đầy đủ
**Nguyên nhân:** Font hoặc CSS chưa tải
**Giải pháp:**
```
1. Chờ 1-2 giây sau khi mở cửa sổ in
2. Kiểm tra kết nối internet
3. Thử xem trước trước khi in
```

### Vấn đề: Máy in không nhận công việc in
**Nguyên nhân:** Driver máy in hoặc cẩu hình trình duyệt
**Giải pháp:**
```
1. Kiểm tra máy in đã bật
2. Thử in từ ứng dụng khác để kiểm tra máy in
3. Cập nhật driver máy in
4. Thử trình duyệt khác
```

### Vấn đề: QR code không hiển thị khi in
**Nguyên nhân:** URL QR có thể chưa tải
**Giải pháp:**
```
1. Chờ một vài giây trước khi in
2. Sử dụng nút "Xem trước" để kiểm tra QR
3. Kiểm tra cài đặt QR trong Settings
```

---

## 📝 Các tính năng in ấn

### 1. **Mẫu in ấn**
- Classic (Mặc định)
- Modern (Hiện đại)
- Minimal (Tối thiểu)
- Retro (Hoài cổ)
- Elegant (Tao nhã)

### 2. **Các trường có thể in ấn**
- ✅ Logo cửa hàng
- ✅ Tên cửa hàng
- ✅ Địa chỉ
- ✅ Hotline
- ✅ Thông tin đơn hàng
- ✅ Danh sách sản phẩm
- ✅ Tổng cộng & thuế
- ✅ Mã QR thanh toán
- ✅ Chân trang

### 3. **Các phương thức thanh toán**
- Tiền mặt
- Chuyển khoản (hiển thị QR)

---

## 🚀 Bắt đầu sử dụng ngay

### Bước 1: Cập nhật code
- Code đã được sửa chữa trong repository
- Không cần cấu hình thêm

### Bước 2: Kiểm tra in ấn
```bash
npm run dev
# Truy cập trang POS
# Thêm sản phẩm
# Nhấp "Xem trước" hoặc "In"
```

### Bước 3: Cấu hình máy in
- Windows: Settings > Devices > Printers
- Mac: System Preferences > Printers & Scanners
- Linux: CUPS settings

---

## 📊 So sánh trước/sau

| Tính năng | Trước | Sau |
|----------|-------|-----|
| In phiếu | ❌ Lỗi | ✅ Hoạt động |
| Xem trước | ❌ Không có | ✅ Có |
| Tải về HTML | ❌ Không có | ✅ Có (PrintPreviewModal) |
| Error handling | ❌ Không có | ✅ Có |
| Popup blocker safe | ❌ Không | ✅ Có |
| QR code | ✅ Có | ✅ Tối ưu |

---

## 📞 Hỗ trợ

Nếu gặp vấn đề:
1. Kiểm tra console.log (F12 > Console) để xem lỗi chi tiết
2. Thử trình duyệt khác
3. Đảm bảo máy in được kết nối đúng
4. Xóa cache trình duyệt và tải lại

---

**Chúc bạn sử dụng chức năng in ấn suôn sẻ! 🎉**
