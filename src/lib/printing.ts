import { useAuthStore } from '../store/authStore';

export interface PrintOrderData {
  orderCode?: string;
  tableId?: string;
  tableName?: string;
  orderType?: string;
  items: Array<{
    productId: string;
    name: string;
    price: number;
    quantity: number;
  }>;
  subtotal: number;
  taxRate?: number;
  taxAmount?: number;
  discountAmount?: number;
  total: number;
  paymentMethod?: string;
  createdAt?: string;
}

export interface PrintSettings {
  storeName?: string;
  address?: string;
  hotline?: string;
  logoUrl?: string;
  bankCode?: string;
  bankAccount?: string;
  bankAccountHolder?: string;
  defaultPrintTemplate?: string;
  printWidth?: string;
  templateFields?: Array<{
    id: string;
    type: string;
    label: string;
    value: string;
    enabled: boolean;
    isCustom?: boolean;
  }>;
}

export const generatePrintHTML = (order: PrintOrderData, settings: PrintSettings, isProvisional: boolean = false) => {
  const templateId = settings.defaultPrintTemplate || 'classic';
  const isModern = templateId === 'modern';
  const isMinimal = templateId === 'minimal';
  const isRetro = templateId === 'retro';
  const isElegant = templateId === 'elegant';

  const qrUrl = (order.paymentMethod === 'TRANSFER' || isProvisional) && settings.bankCode
    ? `https://img.vietqr.io/image/${settings.bankCode}-${settings.bankAccount}-compact2.png?amount=${order.total}&addInfo=${encodeURIComponent(`TT ${order.orderCode || ''} ${order.tableName || ''}`)}&accountName=${encodeURIComponent(settings.bankAccountHolder || '')}`
    : null;

  const staffName = useAuthStore.getState().user?.name || '';
  const dateStr = order.createdAt ? new Date(order.createdAt).toLocaleString('vi-VN') : new Date().toLocaleString('vi-VN');

  const fields = settings.templateFields || [
    { id: 'logo', type: 'image', label: 'Logo cửa hàng', value: '', enabled: true },
    { id: 'store-name', type: 'text', label: 'Tên cửa hàng', value: '', enabled: true },
    { id: 'address', type: 'text', label: 'Địa chỉ', value: '', enabled: true },
    { id: 'hotline', type: 'text', label: 'Hotline', value: '', enabled: true },
    { id: 'sep-1', type: 'separator', label: 'Dải phân cách 1', value: '', enabled: true },
    { id: 'order-info', type: 'text', label: 'Thông tin đơn hàng', value: '', enabled: true },
    { id: 'items-list', type: 'text', label: 'Danh sách món', value: '', enabled: true },
    { id: 'totals', type: 'text', label: 'Tổng cộng', value: '', enabled: true },
    { id: 'qr', type: 'image', label: 'Mã QR thanh toán', value: '', enabled: true },
    { id: 'sep-2', type: 'separator', label: 'Dải phân cách 2', value: '', enabled: true },
    { id: 'footer', type: 'text', label: 'Chân trang', value: 'Cảm ơn và hẹn gặp lại!', enabled: true }
  ];
  
  return `
    <html>
      <head>
        <title>${isProvisional ? 'Phiếu Tạm Tính' : 'Hóa Đơn Thanh Toán'}</title>
        <style>
          @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;700;900&family=JetBrains+Mono&display=swap');
          body { 
            font-family: ${isRetro ? "'JetBrains Mono', monospace" : "'Inter', sans-serif"}; 
            padding: 20px; 
            line-height: 1.4; 
            font-size: 13px; 
            width: 80mm;
            margin: 0 auto;
            color: #000;
            background: white;
          }
          .text-center { text-align: center; }
          .font-black { font-weight: 900; }
          .font-bold { font-weight: 700; }
          .uppercase { text-transform: uppercase; }
          .italic { font-style: italic; }
          .text-xs { font-size: 10px; }
          .text-sm { font-size: 12px; }
          .text-lg { font-size: 18px; }
          .text-xl { font-size: 24px; }
          .border-t { border-top: 1px solid #000; }
          .border-double { border-top: 3px double #000; }
          .my-2 { margin-top: 8px; margin-bottom: 8px; }
          .flex { display: flex; }
          .justify-between { justify-content: space-between; }
          .flex-col { display: flex; flex-direction: column; }
          .items-center { align-items: center; }
          .gap-2 { gap: 8px; }
          .qr-img { width: 140px; height: auto; margin: 10px auto; display: block; }
          .item-row { display: flex; justify-content: space-between; margin: 4px 0; }
          
          ${isModern ? `
            body { padding: 30px; border-radius: 20px; font-family: 'Inter', sans-serif; }
            .item-row { border-bottom: 1px solid #f1f5f9; padding: 6px 0; }
            .store-name { color: #059669; }
            .total-row { color: #059669; }
          ` : ''}
          
          ${isRetro ? `
            body { font-family: 'JetBrains Mono', monospace; font-size: 12px; }
            .border-t { border-top: 1px dashed #000; }
            .uppercase { letter-spacing: 2px; }
          ` : ''}
          
          ${isElegant ? `
            body { border: 4px double #000; padding: 25px; font-family: 'Inter', sans-serif; }
            .store-name { border-bottom: 2px solid #000; padding-bottom: 10px; margin-bottom: 15px; }
            .uppercase { letter-spacing: 1px; }
          ` : ''}

          ${isMinimal ? `
            body { font-family: 'Inter', sans-serif; font-size: 11px; }
            .font-black { font-weight: 700; }
            .border-t { border-top: 1px solid #eee; }
          ` : ''}

          @media print {
            body { width: ${settings.printWidth === '58mm' ? '58mm' : '80mm'}; padding: 0; margin: 0; }
            .no-print { display: none; }
            @page {
              margin: 0;
              size: ${settings.printWidth === '58mm' ? '58mm' : '80mm'} auto;
            }
          }
        </style>
      </head>
      <body>
        <div class="print-container" style="width: ${settings.printWidth === '58mm' ? '58mm' : '80mm'}; overflow: hidden;">
        ${fields.filter(f => f.enabled).map(field => {
          switch (field.id) {
            case 'logo':
              return settings.logoUrl ? `<div class="text-center"><img src="${settings.logoUrl}" style="width: 80px; height: 80px; object-fit: contain; margin-bottom: 15px;" /></div>` : '';
            case 'store-name':
              return `<div class="text-center font-black uppercase store-name ${isModern ? 'text-xl' : 'text-lg'}">${settings.storeName || 'SAIGON AN COFFEE'}</div>`;
            case 'address':
              return `<div class="text-center text-xs" style="margin-top: 4px; color: #444;">${settings.address || ''}</div>`;
            case 'hotline':
              return `<div class="text-center text-xs font-bold" style="margin-top: 2px;">Hotline: ${settings.hotline || ''}</div>`;
            case 'sep-1':
            case 'sep-2':
              return `<div class="border-t my-4 ${isRetro ? 'style="border-top-style: dashed;"' : ''}"></div>`;
            case 'order-info':
              return `
                <div class="order-info text-xs" style="margin: 15px 0;">
                  <div class="text-center font-black mb-3 text-sm italic" style="border-bottom: 1px solid #eee; padding-bottom: 5px;">${isProvisional ? 'PHIẾU TẠM TÍNH' : 'HÓA ĐƠN THANH TOÁN'}</div>
                  ${order.orderCode ? `<div class="flex justify-between" style="margin-bottom: 2px;"><span>Mã Đơn:</span><b class="font-black">#${order.orderCode}</b></div>` : ''}
                  <div class="flex justify-between" style="margin-bottom: 2px;"><span>Bàn:</span><b class="font-black">${order.tableName || 'Mang về'}</b></div>
                  <div class="flex justify-between" style="margin-bottom: 2px;"><span>Ngày:</span><span>${dateStr}</span></div>
                  <div class="flex justify-between" style="margin-bottom: 2px;"><span>Nhân viên:</span><span>${staffName}</span></div>
                  ${order.paymentMethod ? `<div class="flex justify-between" style="margin-top: 4px; padding-top: 4px; border-top: 1px dotted #ccc;"><span>PTTT:</span><b>${order.paymentMethod === 'CASH' ? 'Tiền mặt' : 'Chuyển khoản'}</b></div>` : ''}
                </div>
              `;
            case 'items-list':
              return `
                <div class="items" style="margin: 15px 0;">
                  <div class="item-row font-bold text-xs" style="border-bottom: 1px solid #000; padding-bottom: 4px; margin-bottom: 8px;">
                    <div style="flex: 1;">Tên món</div>
                    <div style="width: 35px; text-align: center;">SL</div>
                    <div style="width: 80px; text-align: right;">Thành tiền</div>
                  </div>
                  ${order.items.map(item => `
                    <div class="item-row" style="margin-bottom: 6px;">
                      <div style="flex: 1; font-weight: 700;">${item.name}</div>
                      <div style="width: 35px; text-align: center;">${item.quantity}</div>
                      <div style="width: 80px; text-align: right; font-weight: 700;">${(item.price * item.quantity).toLocaleString('vi-VN')}</div>
                    </div>
                  `).join('')}
                </div>
              `;
            case 'totals':
              return `
                <div class="totals" style="margin: 15px 0; padding-top: 5px; border-top: 1px solid #000;">
                  <div class="flex justify-between text-xs" style="margin-bottom: 2px;"><span>Tạm tính:</span><span>${order.subtotal.toLocaleString('vi-VN')}đ</span></div>
                  ${(order.discountAmount || 0) > 0 ? `<div class="flex justify-between text-xs" style="margin-bottom: 2px;"><span>Giảm giá:</span><span>-${(order.discountAmount || 0).toLocaleString('vi-VN')}đ</span></div>` : ''}
                  ${(order.taxAmount || 0) > 0 ? `<div class="flex justify-between text-xs" style="margin-bottom: 2px;"><span>Thuế (${order.taxRate}%):</span><span>${(order.taxAmount || 0).toLocaleString('vi-VN')}đ</span></div>` : ''}
                  <div class="flex justify-between font-black text-xl border-t mt-3 pt-3 total-row"><span>TỔNG CỘNG:</span><span>${order.total.toLocaleString('vi-VN')}đ</span></div>
                </div>
              `;
            case 'qr':
              return qrUrl ? `
                <div class="text-center" style="margin: 15px 0;">
                  <div class="text-xs font-black uppercase mb-1">${isProvisional ? 'QUÉT MÃ THANH TOÁN' : 'MÃ QR GIAO DỊCH'}</div>
                  <img src="${qrUrl}" class="qr-img" />
                </div>
              ` : '';
            case 'footer':
              return `<div class="text-center text-xs italic" style="margin-top: 15px; border-top: 1px dashed #eee; padding-top: 10px;">${field.value || 'Cảm ơn và hẹn gặp lại!'}</div>`;
            default:
              if (field.isCustom) {
                return `<div class="text-center text-xs py-1">${field.value}</div>`;
              }
              return '';
          }
        }).join('')}
      </body>
    </html>
  `;
};

export const printOrder = (order: PrintOrderData, settings: PrintSettings, isProvisional: boolean = false) => {
  try {
    const printWindow = window.open('', '_blank', 'width=800,height=600,scrollbars=yes');
    if (!printWindow) {
      alert('Vui lòng cho phép trình duyệt mở tab mới để in.');
      return;
    }

    const html = generatePrintHTML(order, settings, isProvisional);
    
    // Write HTML to new window
    printWindow.document.open();
    printWindow.document.write(html);
    printWindow.document.close();
    
    // Wait for content to load before printing
    printWindow.onload = () => {
      setTimeout(() => {
        printWindow.focus();
        printWindow.print();
      }, 250);
    };
  } catch (error) {
    console.error('Lỗi in ấn:', error);
    alert('Có lỗi xảy ra khi in. Vui lòng kiểm tra cài đặt trình duyệt.');
  }
};

export const printPreview = (order: PrintOrderData, settings: PrintSettings, isProvisional: boolean = false) => {
  try {
    const previewWindow = window.open('', '_blank', 'width=900,height=700,scrollbars=yes');
    if (!previewWindow) {
      alert('Vui lòng cho phép trình duyệt mở tab mới để xem trước.');
      return;
    }

    const html = generatePrintHTML(order, settings, isProvisional);
    
    // Write HTML to preview window
    previewWindow.document.open();
    previewWindow.document.write(html);
    previewWindow.document.close();
    
    // Remove auto-print script for preview
    previewWindow.onload = () => {
      previewWindow.focus();
      // Just display, don't print automatically
    };
  } catch (error) {
    console.error('Lỗi xem trước:', error);
    alert('Có lỗi xảy ra khi xem trước. Vui lòng kiểm tra cài đặt trình duyệt.');
  }
};
