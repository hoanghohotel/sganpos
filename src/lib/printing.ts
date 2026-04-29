import { useAuthStore } from '../store/authStore';
import { PrintOrderData, PrintSettings, PRINT_EVENT, PrintEventDetail } from '../types/printing';

export type { PrintOrderData, PrintSettings };

export const generatePrintHTML = (order: PrintOrderData, settings: PrintSettings, isProvisional: boolean = false) => {
  const templateId = settings.defaultPrintTemplate || 'classic';
  const isModern = templateId === 'modern';
  const isMinimal = templateId === 'minimal';
  const isRetro = templateId === 'retro';
  const isElegant = templateId === 'elegant';
  const isEco = templateId === 'eco';
  const isTech = templateId === 'tech';
  const isVoucher = templateId === 'voucher';
  const isBakery = templateId === 'bakery';
  const isBento = templateId === 'bento';

  const qrUrl = (order.paymentMethod === 'TRANSFER' || isProvisional) && settings.bankCode
    ? `https://img.vietqr.io/image/${settings.bankCode}-${settings.bankAccount}-compact2.png?amount=${order.total}&addInfo=${encodeURIComponent(`TT ${order.orderCode || ''} ${order.tableName || ''}`)}&accountName=${encodeURIComponent(settings.bankAccountHolder || '')}`
    : null;

  const isXprinter = settings.brand === 'xprinter';
  const isZywell = settings.brand === 'zywell' || settings.brand === 'xpos';
  const isGprinter = settings.brand === 'gprinter';
  
  // High contrast for thermal printers
  const thermalStyles = (isXprinter || isZywell || isGprinter) ? `
    * { -webkit-print-color-adjust: exact !important; color-adjust: exact !important; }
    body { padding: 0 !important; width: 100% !important; margin: 0 !important; }
    .print-container { width: 100% !important; padding: 2mm !important; }
    img { filter: grayscale(1) contrast(2); } /* Better for thermal */
    .border-t { border-top-width: 2px !important; } /* Thicker lines for visibility */
  ` : '';

  // Get staff name safely from auth store
  let staffName = '';
  try {
    const state = useAuthStore.getState();
    staffName = state?.user?.name || '';
  } catch (e) {
    staffName = '';
  }
  
  const dateStr = order.createdAt ? new Date(order.createdAt).toLocaleString('vi-VN') : new Date().toLocaleString('vi-VN');

  const fields = settings.templateFields && settings.templateFields.length > 0 ? settings.templateFields : [
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
  
  return `<!DOCTYPE html>
<html lang="vi">
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${isProvisional ? 'Phiếu Tạm Tính' : 'Hóa Đơn Thanh Toán'}</title>
    <style>
      @font-face {
        font-family: 'Poppins';
        src: url('https://cdn.jsdelivr.net/gh/taxvui/Poppins@main/Poppins-Regular.otf') format('opentype');
        font-weight: 400;
      }
      @font-face {
        font-family: 'Poppins';
        src: url('https://cdn.jsdelivr.net/gh/taxvui/Poppins@main/Poppins-Bold.otf') format('opentype');
        font-weight: 700;
      }
      
      * {
        margin: 0;
        padding: 0;
        box-sizing: border-box;
      }
      
      body { 
        font-family: ${isRetro || isTech ? "monospace" : (isBakery ? "cursive" : (isModern ? "'Poppins', sans-serif" : (isElegant ? "serif" : "'Poppins', sans-serif")))}; 
        padding: ${isModern ? '30px' : (isMinimal ? '10px' : (isElegant ? '25px' : '20px'))}; 
        line-height: ${isMinimal ? '1.2' : '1.4'}; 
        font-size: ${isMinimal ? '11px' : '13px'}; 
        width: ${settings.printWidth === '58mm' ? '58mm' : '80mm'};
        margin: 0 auto;
        color: #000;
        background: white;
        ${isElegant ? 'border: 4px double #000;' : ''}
        ${isModern ? 'border-radius: 25px;' : ''}
        ${isEco ? 'border-left: 10px solid #059669;' : ''}
        ${isTech ? 'border: 2px solid #000;' : ''}
        ${isVoucher ? 'border: 2px dashed #000; border-radius: 15px;' : ''}
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
      .border-t { border-top: 1px solid #eee; }
      .my-2 { margin-top: 8px; margin-bottom: 8px; }
      .my-4 { margin-top: 16px; margin-bottom: 16px; }
      .flex { display: flex; }
      .justify-between { justify-content: space-between; }
      .flex-col { display: flex; flex-direction: column; }
      .items-center { align-items: center; }
      .gap-2 { gap: 8px; }
      .qr-img { width: 140px; height: auto; margin: 10px auto; display: block; max-width: 100%; }
      .item-row { display: flex; justify-content: space-between; margin: 4px 0; }
      
      ${isModern ? `
        .store-name { color: #059669; font-size: 26px; }
        .order-title { background: #ecfdf5; color: #059669; padding: 8px; border-radius: 12px; }
        .item-row { border-bottom: 1px solid #f1f5f9; padding-bottom: 8px; }
        .total-row { color: #059669; }
      ` : ''}
      
      ${isRetro || isTech ? `
        .border-t { border-top: 2px dashed #000; }
        ${isTech ? `
          .store-name { border: 2px solid #000; padding: 10px; font-size: 22px; margin-bottom: 15px; }
          .order-title { background: #000; color: #fff; padding: 8px; }
          .border-t { border-top: 4px solid #000; }
          .total-row { border-top: 4px double #000; }
        ` : ''}
      ` : ''}
      
      ${isBento ? `
        .item-row { border-bottom: 1px solid #eee; padding-bottom: 8px; font-size: 14px; }
      ` : ''}

      @media print {
        body { width: ${settings.printWidth === '58mm' ? '58mm' : '80mm'}; padding: 0; margin: 0; }
        .no-print { display: none; }
        @page {
          margin: 0;
          size: ${settings.printWidth === '58mm' ? '58mm' : '80mm'} auto;
        }
      }
      ${thermalStyles}
    </style>
  </head>
  <body>
    <div class="print-container">
      ${fields.filter(f => f.enabled).map(field => {
        switch (field.id) {
          case 'logo':
            return settings.logoUrl ? `<div class="text-center"><img src="${settings.logoUrl}" style="width: 80px; height: 80px; object-fit: contain; margin-bottom: 15px; ${isModern ? 'border-radius: 20px;' : ''}" alt="Logo" /></div>` : '';
          case 'store-name':
            return `<div class="text-center font-black uppercase store-name ${isModern ? 'text-xl' : 'text-lg'}">${settings.storeName || 'POSAPP STORE'}</div>`;
          case 'address':
            return `<div class="text-center text-xs" style="margin-top: 4px; color: #444; opacity: 0.8;">${settings.address || ''}</div>`;
          case 'hotline':
            return `<div class="text-center text-xs font-bold" style="margin-top: 2px;">${isTech ? '> ' : ''}Hotline: ${settings.hotline || ''}</div>`;
          case 'sep-1':
          case 'sep-2':
            return `<div class="border-t my-4" style="${isRetro ? 'border-top-style: dashed;' : ''}${isTech ? 'border-top-width: 4px; border-top-style: solid;' : ''}"></div>`;
          case 'order-info':
            return `
              <div class="order-info text-xs" style="margin: 15px 0;">
                <div class="text-center font-black mb-3 text-sm italic order-title" style="border-bottom: 1px solid #eee; padding-bottom: 5px;">${isProvisional ? 'PHIẾU TẠM TÍNH' : 'HÓA ĐƠN THANH TOÁN'}</div>
                <div class="flex-col gap-2">
                  ${order.orderCode ? `<div class="flex justify-between"><span>Mã Đơn:</span><b class="font-black">#${order.orderCode}</b></div>` : ''}
                  <div class="flex justify-between"><span>Bàn:</span><b class="font-black">${order.tableName || 'Mang về'}</b></div>
                  <div class="flex justify-between"><span>Ngày:</span><span>${dateStr}</span></div>
                  <div class="flex justify-between"><span>Nhân viên:</span><span>${staffName}</span></div>
                  ${order.paymentMethod ? `<div class="flex justify-between" style="margin-top: 4px; padding-top: 4px; border-top: 1px dotted #ccc;"><span>PTTT:</span><b>${order.paymentMethod === 'CASH' ? 'Tiền mặt' : 'Chuyển khoản'}</b></div>` : ''}
                </div>
              </div>
            `;
          case 'items-list':
            return `
              <div class="items" style="margin: 15px 0;">
                <div class="item-row font-black text-xs" style="border-bottom: 2px solid #000; padding-bottom: 6px; margin-bottom: 10px; text-transform: uppercase;">
                  <div style="flex: 1;">Tên món</div>
                  <div style="width: 35px; text-align: center;">SL</div>
                  <div style="width: 80px; text-align: right;">Thành tiền</div>
                </div>
                ${order.items.map(item => `
                  <div class="item-row" style="margin-bottom: 8px;">
                    <div style="flex: 1; font-weight: 700;">${isTech ? '[ ] ' : ''}${item.name}</div>
                    <div style="width: 35px; text-align: center;">${item.quantity}</div>
                    <div style="width: 80px; text-align: right; font-weight: 700;">${(item.price * item.quantity).toLocaleString('vi-VN')}</div>
                  </div>
                `).join('')}
              </div>
            `;
            case 'totals':
              return `
                <div class="totals" style="margin: 15px 0; padding-top: 10px; border-top: 1px solid #eee;">
                  <div class="flex justify-between text-xs" style="margin-bottom: 4px;"><span>Tạm tính:</span><span>${order.subtotal.toLocaleString('vi-VN')}</span></div>
                  ${(order.discountAmount || 0) > 0 ? `<div class="flex justify-between text-xs" style="margin-bottom: 4px; color: #dc2626;"><span>Giảm giá:</span><span>-${(order.discountAmount || 0).toLocaleString('vi-VN')}</span></div>` : ''}
                  ${(order.taxAmount || 0) > 0 ? `<div class="flex justify-between text-xs" style="margin-bottom: 4px;"><span>Thuế (${order.taxRate}%):</span><span>${(order.taxAmount || 0).toLocaleString('vi-VN')}</span></div>` : ''}
                  <div class="flex justify-between font-black text-xl border-t mt-3 pt-3 total-row"><span>TỔNG CỘNG:</span><span>${order.total.toLocaleString('vi-VN')}</span></div>
                </div>
              `;
            case 'qr':
              return qrUrl ? `
                <div class="text-center" style="margin: 15px 0;">
                  <div class="text-xs font-black uppercase mb-1" style="${isTech ? 'background: #000; color: #fff; padding: 4px;' : ''}">${isProvisional ? 'QUÉT MÃ THANH TOÁN' : 'MÃ QR GIAO DỊCH'}</div>
                  <img src="${qrUrl}" class="qr-img" />
                </div>
              ` : '';
            case 'footer':
              return `<div class="text-center text-xs italic" style="margin-top: 15px; border-top: 1px dashed #eee; padding-top: 10px;">${field.value || 'CẢM ƠN QUÝ KHÁCH. HẸN GẶP LẠI!'}</div>`;
            default:
              if (field.isCustom) {
                return `<div class="text-center text-xs py-1" style="opacity: 0.8;">${field.value}</div>`;
              }
              return '';
          }
        }).join('')}
        <script>window.print(); setTimeout(() => window.close(), 1000);</script>
      </div>
    </body>
  </html>`;
};

export const printOrder = (order: PrintOrderData, settings: PrintSettings, isProvisional: boolean = false) => {
  const event = new CustomEvent<PrintEventDetail>(PRINT_EVENT, {
    detail: { order, settings, isProvisional }
  });
  window.dispatchEvent(event);
};
