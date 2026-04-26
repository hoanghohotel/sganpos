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
  const isCustom = templateId === 'custom' || !['classic', 'modern', 'minimal', 'retro', 'elegant'].includes(templateId);

  const qrUrl = (order.paymentMethod === 'TRANSFER' || isProvisional) && settings.bankCode
    ? `https://img.vietqr.io/image/${settings.bankCode}-${settings.bankAccount}-compact2.png?amount=${order.total}&addInfo=${encodeURIComponent(`TT ${order.orderCode || ''} ${order.tableName || ''}`)}&accountName=${encodeURIComponent(settings.bankAccountHolder || '')}`
    : null;

  const staffName = useAuthStore.getState().user?.name || '';
  const dateStr = order.createdAt ? new Date(order.createdAt).toLocaleString('vi-VN') : new Date().toLocaleString('vi-VN');

  // If using a preset template (not custom), use the old hardcoded logic or a variation of it
  if (!isCustom) {
    return `
      <html>
        <head>
          <title>${isProvisional ? 'Phiếu Tạm Tính' : 'Hóa Đơn Thanh Toán'}</title>
          <style>
            body { 
              font-family: ${isRetro ? 'monospace' : 'sans-serif'}; 
              padding: 20px; 
              line-height: 1.4; 
              font-size: 14px; 
              width: 300px;
              margin: 0 auto;
              color: #000;
            }
            .header { text-align: center; margin-bottom: 20px; ${isElegant ? 'border-bottom: 2px solid #000; padding-bottom: 10px;' : ''} }
            .store-name { font-size: 20px; font-weight: bold; text-transform: uppercase; }
            .order-info { margin: 10px 0; border-bottom: 1px dashed #ccc; padding-bottom: 10px; font-size: 12px; }
            .item-row { display: flex; justify-content: space-between; margin: 3px 0; }
            .totals { margin-top: 15px; border-top: 1px solid #eee; padding-top: 10px; }
            .total-row { display: flex; justify-content: space-between; font-weight: bold; margin: 2px 0; }
            .grand-total { font-size: 18px; border-top: 1px double #333; margin-top: 10px; padding-top: 10px; }
            .qr-container { text-align: center; margin-top: 20px; }
            .qr-container img { width: 150px; height: auto; }
            .footer { text-align: center; margin-top: 30px; font-size: 10px; color: #666; }
          </style>
        </head>
        <body>
          <div class="header">
            ${settings.logoUrl && !isMinimal ? `<img src="${settings.logoUrl}" style="width: 60px; height: 60px; object-fit: contain; margin-bottom: 10px;" />` : ''}
            <div class="store-name">${settings.storeName || 'SAIGON AN COFFEE'}</div>
            <div style="font-size: 10px;">${settings.address || ''}</div>
            <div style="font-size: 10px;">Hotline: ${settings.hotline || ''}</div>
            <h3 style="margin-top: 10px; text-transform: uppercase;">${isProvisional ? 'Phiếu Tạm Tính' : 'Hóa Đơn Thanh Toán'}</h3>
          </div>

          <div class="order-info">
            ${order.orderCode ? `<div>Mã Đơn: <b>${order.orderCode}</b></div>` : ''}
            <div>Bàn: <b>${order.tableName || 'Mang về'}</b></div>
            <div>Ngày: ${dateStr}</div>
            <div>Nhân viên: ${staffName}</div>
            ${order.paymentMethod ? `<div>PTTT: <b>${order.paymentMethod === 'CASH' ? 'Tiền mặt' : 'Chuyển khoản'}</b></div>` : ''}
          </div>

          <div class="items">
            ${order.items.map(item => `
              <div class="item-row">
                <span>${item.name} x${item.quantity}</span>
                <span>${(item.price * item.quantity).toLocaleString('vi-VN')}đ</span>
              </div>
            `).join('')}
          </div>

          <div class="totals">
            <div class="total-row"><span>Tạm tính:</span><span>${order.subtotal.toLocaleString('vi-VN')}đ</span></div>
            ${(order.discountAmount || 0) > 0 ? `<div class="total-row"><span>Giảm giá:</span><span>-${(order.discountAmount || 0).toLocaleString('vi-VN')}đ</span></div>` : ''}
            ${(order.taxAmount || 0) > 0 ? `<div class="total-row"><span>Thuế (${order.taxRate}%):</span><span>${(order.taxAmount || 0).toLocaleString('vi-VN')}đ</span></div>` : ''}
            <div class="total-row grand-total"><span>TỔNG CỘNG:</span><span>${order.total.toLocaleString('vi-VN')}đ</span></div>
          </div>

          ${qrUrl ? `
            <div class="qr-container">
              <p style="font-size: 9px; font-weight: bold; margin-bottom: 5px;">${isProvisional ? 'QUÉT MÃ ĐỂ THANH TOÁN' : 'MÃ QR THANH TOÁN (ĐÃ GIAO DỊCH)'}</p>
              <img src="${qrUrl}" alt="QR" />
            </div>
          ` : ''}

          <div class="footer">
            <p>${isProvisional ? 'Đây là phiếu tạm tính, chưa phải hóa đơn.' : 'Cảm ơn quý khách! Hẹn gặp lại.'}</p>
            <p>Bản in từ hệ thống PosApp</p>
          </div>
          <script>window.print(); setTimeout(() => window.close(), 1000);</script>
        </body>
      </html>
    `;
  }

  // CUSTOM TEMPLATE LOGIC
  const fields = settings.templateFields || [];
  
  return `
    <html>
      <head>
        <title>${isProvisional ? 'Phiếu Tạm Tính' : 'Hóa Đơn Thanh Toán'}</title>
        <style>
          body { 
            font-family: ${isRetro ? 'monospace' : 'sans-serif'}; 
            padding: 20px; 
            line-height: 1.4; 
            font-size: 14px; 
            width: 300px;
            margin: 0 auto;
            color: #000;
          }
          .text-center { text-align: center; }
          .font-black { font-weight: 900; }
          .uppercase { text-transform: uppercase; }
          .italic { font-style: italic; }
          .text-xs { font-size: 10px; }
          .text-lg { font-size: 18px; }
          .text-xl { font-size: 24px; }
          .border-t { border-top: 1px solid #eee; }
          .border-double { border-top: 3px double #333; }
          .my-2 { margin-top: 10px; margin-bottom: 10px; }
          .flex { display: flex; }
          .justify-between { justify-content: space-between; }
          .flex-col { display: flex; flex-direction: column; }
          .items-center { align-items: center; }
          .gap-2 { gap: 8px; }
          .qr-img { width: 150px; height: auto; }
          ${isRetro ? '.item-row { border-bottom: 1px dotted #ccc; }' : ''}
          ${isElegant ? 'body { border: 4px double #000; padding: 25px; }' : ''}
        </style>
      </head>
      <body>
        ${fields.filter(f => f.enabled).map(field => {
          switch (field.id) {
            case 'logo':
              return settings.logoUrl ? `<div class="text-center"><img src="${settings.logoUrl}" style="width: 60px; height: 60px; object-fit: contain; margin-bottom: 10px;" /></div>` : '';
            case 'store-name':
              return `<div class="text-center font-black uppercase text-lg">${settings.storeName || 'SAIGON AN COFFEE'}</div>`;
            case 'address':
              return `<div class="text-center text-xs">${settings.address || ''}</div>`;
            case 'hotline':
              return `<div class="text-center text-xs font-bold">Hotline: ${settings.hotline || ''}</div>`;
            case 'sep-1':
            case 'sep-2':
              return `<div class="border-t my-2 ${isRetro ? 'style="border-top-style: dotted;"' : ''}"></div>`;
            case 'order-info':
              return `
                <div class="order-info text-xs">
                  ${order.orderCode ? `<div class="flex justify-between"><span>Mã Đơn:</span><b>${order.orderCode}</b></div>` : ''}
                  <div class="flex justify-between"><span>Bàn:</span><b>${order.tableName || 'Mang về'}</b></div>
                  <div class="flex justify-between"><span>Ngày:</span><span>${dateStr}</span></div>
                  <div class="flex justify-between"><span>Nhân viên:</span><span>${staffName}</span></div>
                  ${order.paymentMethod ? `<div class="flex justify-between"><span>PTTT:</span><b>${order.paymentMethod === 'CASH' ? 'Tiền mặt' : 'Chuyển khoản'}</b></div>` : ''}
                </div>
              `;
            case 'items-list':
              return `
                <div class="items">
                  ${order.items.map(item => `
                    <div class="flex justify-between my-1">
                      <span>${item.name} x${item.quantity}</span>
                      <span>${(item.price * item.quantity).toLocaleString('vi-VN')}đ</span>
                    </div>
                  `).join('')}
                </div>
              `;
            case 'totals':
              return `
                <div class="totals pt-2">
                  <div class="flex justify-between"><span>Tạm tính:</span><span>${order.subtotal.toLocaleString('vi-VN')}đ</span></div>
                  ${(order.discountAmount || 0) > 0 ? `<div class="flex justify-between"><span>Giảm giá:</span><span>-${(order.discountAmount || 0).toLocaleString('vi-VN')}đ</span></div>` : ''}
                  ${(order.taxAmount || 0) > 0 ? `<div class="flex justify-between"><span>Thuế (${order.taxRate}%):</span><span>${(order.taxAmount || 0).toLocaleString('vi-VN')}đ</span></div>` : ''}
                  <div class="flex justify-between font-black text-lg border-double mt-2 pt-2"><span>TỔNG CỘNG:</span><span>${order.total.toLocaleString('vi-VN')}đ</span></div>
                </div>
              `;
            case 'qr':
              return qrUrl ? `
                <div class="text-center mt-4">
                  <p class="text-xs font-black uppercase mb-1">${isProvisional ? 'QUÉT MÃ ĐỂ THANH TOÁN' : 'MÃ QR THANH TOÁN'}</p>
                  <img src="${qrUrl}" class="qr-img" />
                </div>
              ` : '';
            case 'footer':
              return `<div class="text-center text-xs italic mt-4">${field.value || 'Cảm ơn và hẹn gặp lại!'}</div>`;
            default:
              if (field.isCustom) {
                return `<div class="text-center text-xs py-1">${field.value}</div>`;
              }
              return '';
          }
        }).join('')}
        <script>window.print(); setTimeout(() => window.close(), 1000);</script>
      </body>
    </html>
  `;
};

export const printOrder = (order: PrintOrderData, settings: PrintSettings, isProvisional: boolean = false) => {
  const printWindow = window.open('', '_blank');
  if (!printWindow) {
    alert('Vui lòng cho phép trình duyệt mở tab mới để in.');
    return;
  }

  const html = generatePrintHTML(order, settings, isProvisional);
  printWindow.document.write(html);
  printWindow.document.close();
};
