import React, { forwardRef } from 'react';
import { PrintOrderData, PrintSettings } from '../../lib/printing';
import { useAuthStore } from '../../store/authStore';

interface ReceiptTemplateProps {
  order: PrintOrderData;
  settings: PrintSettings;
  isProvisional?: boolean;
}

const ReceiptTemplate = forwardRef<HTMLDivElement, ReceiptTemplateProps>(
  ({ order, settings, isProvisional = false }, ref) => {
    const templateId = settings.defaultPrintTemplate || 'classic';
    const isModern = templateId === 'modern';
    const isMinimal = templateId === 'minimal';
    const isRetro = templateId === 'retro';
    const isElegant = templateId === 'elegant';

    const isThermal = ['xprinter', 'zywell', 'xpos', 'gprinter'].includes(settings.brand || '');
    const isXprinter = settings.brand === 'xprinter';

    const qrUrl = (order.paymentMethod === 'TRANSFER' || isProvisional) && settings.bankCode
      ? `https://img.vietqr.io/image/${settings.bankCode}-${settings.bankAccount}-compact2.png?amount=${order.total}&addInfo=${encodeURIComponent(`TT ${order.orderCode || ''} ${order.tableName || ''}`)}&accountName=${encodeURIComponent(settings.bankAccountHolder || '')}`
      : null;

    let staffName = '';
    try {
      const state = useAuthStore.getState();
      staffName = state?.user?.name || '';
    } catch (e) {
      staffName = '';
    }

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

    const printWidth = settings.printWidth === '58mm' ? '58mm' : '80mm';

    return (
      <div 
        ref={ref} 
        style={{
          width: printWidth,
          margin: '0 auto',
          padding: isThermal ? '5px' : (isModern ? '30px' : isElegant ? '25px' : '20px'),
          fontFamily: isRetro ? "'JetBrains Mono', monospace" : "'Inter', sans-serif",
          fontSize: isMinimal ? '11px' : '13px',
          lineHeight: isThermal ? '1.2' : '1.4',
          color: '#000',
          backgroundColor: '#fff',
          borderRadius: isModern ? '20px' : '0',
          border: isElegant ? '4px double #000' : 'none',
          boxSizing: 'border-box',
          imageRendering: isThermal ? 'pixelated' : 'auto',
          overflow: 'visible'
        }}
      >
        <style>
          {`
            @media print {
              html, body { 
                margin: 0 !important; 
                padding: 0 !important; 
                height: auto !important;
                overflow: visible !important;
              }
              img { filter: grayscale(1) contrast(2) !important; }
              ${isThermal ? '.item-row { font-weight: bold !important; }' : ''}
              ${isXprinter ? 'body { width: 100% !important; margin: 0 !important; }' : ''}
              @page {
                margin: 0;
                size: ${printWidth} auto;
              }
            }
          `}
        </style>
        {fields.filter(f => f.enabled).map((field, idx) => {
          switch (field.id) {
            case 'logo':
              return settings.logoUrl ? (
                <div key={field.id} style={{ textAlign: 'center', marginBottom: '15px' }}>
                  <img src={settings.logoUrl} style={{ width: '80px', height: '80px', objectFit: 'contain' }} alt="Logo" />
                </div>
              ) : null;
            case 'store-name':
              return (
                <div 
                  key={field.id} 
                  style={{ 
                    textAlign: 'center', 
                    fontWeight: 900, 
                    textTransform: 'uppercase',
                    fontSize: isModern ? '24px' : '18px',
                    color: isModern ? '#059669' : '#000',
                    borderBottom: isElegant ? '2px solid #000' : 'none',
                    paddingBottom: isElegant ? '10px' : '0',
                    marginBottom: isElegant ? '15px' : '0',
                    letterSpacing: isRetro ? '2px' : isElegant ? '1px' : 'normal'
                  }}
                >
                  {settings.storeName || 'SAIGON AN COFFEE'}
                </div>
              );
            case 'address':
              return (
                <div key={field.id} style={{ textAlign: 'center', fontSize: '10px', marginTop: '4px', color: '#444' }}>
                  {settings.address || ''}
                </div>
              );
            case 'hotline':
              return (
                <div key={field.id} style={{ textAlign: 'center', fontSize: '10px', fontWeight: 700, marginTop: '2px' }}>
                  Hotline: {settings.hotline || ''}
                </div>
              );
            case 'sep-1':
            case 'sep-2':
              return (
                <div 
                  key={`${field.id}-${idx}`} 
                  style={{ 
                    borderTop: isRetro ? '1px dashed #000' : isMinimal ? '1px solid #eee' : '1px solid #000',
                    margin: '16px 0'
                  }} 
                />
              );
            case 'order-info':
              return (
                <div key={field.id} style={{ margin: '15px 0', fontSize: '10px' }}>
                  <div style={{ textAlign: 'center', fontWeight: 900, marginBottom: '12px', fontSize: '12px', fontStyle: 'italic', borderBottom: '1px solid #eee', paddingBottom: '5px' }}>
                    {isProvisional ? 'PHIẾU TẠM TÍNH' : 'HÓA ĐƠN THANH TOÁN'}
                  </div>
                  {order.orderCode && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2px' }}>
                      <span>Mã Đơn:</span>
                      <b style={{ fontWeight: 900 }}>#{order.orderCode}</b>
                    </div>
                  )}
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2px' }}>
                    <span>Bàn:</span>
                    <b style={{ fontWeight: 900 }}>{order.tableName || 'Mang về'}</b>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2px' }}>
                    <span>Ngày:</span>
                    <span>{dateStr}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2px' }}>
                    <span>Nhân viên:</span>
                    <span>{staffName}</span>
                  </div>
                  {order.paymentMethod && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '4px', paddingTop: '4px', borderTop: '1px dotted #ccc' }}>
                      <span>PTTT:</span>
                      <b>{order.paymentMethod === 'CASH' ? 'Tiền mặt' : 'Chuyển khoản'}</b>
                    </div>
                  )}
                </div>
              );
            case 'items-list':
              return (
                <div key={field.id} style={{ margin: '15px 0', padding: 0 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 700, fontSize: '10px', borderBottom: '1.5px solid #000', paddingBottom: '4px', marginBottom: '8px' }}>
                    <div style={{ flex: 1 }}>Tên món</div>
                    <div style={{ width: '40px', textAlign: 'center' }}>SL</div>
                    <div style={{ width: '90px', textAlign: 'right' }}>Thành tiền</div>
                  </div>
                  {order.items.map((item, i) => (
                    <div key={i} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px', fontSize: '12px', borderBottom: isModern ? '1px solid #f1f5f9' : 'none', paddingBottom: isModern ? '6px' : '0', pageBreakInside: 'avoid' }}>
                      <div style={{ flex: 1, fontWeight: 700, paddingRight: '5px' }}>{item.name}</div>
                      <div style={{ width: '40px', textAlign: 'center' }}>{item.quantity}</div>
                      <div style={{ width: '90px', textAlign: 'right', fontWeight: 700 }}>{(item.price * item.quantity).toLocaleString('vi-VN')}</div>
                    </div>
                  ))}
                </div>
              );
            case 'totals':
              return (
                <div key={field.id} style={{ margin: '15px 0', paddingTop: '5px', borderTop: '1px solid #000' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', marginBottom: '2px' }}>
                    <span>Tạm tính:</span>
                    <span>{order.subtotal.toLocaleString('vi-VN')}đ</span>
                  </div>
                  {(order.discountAmount || 0) > 0 && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', marginBottom: '2px' }}>
                      <span>Giảm giá:</span>
                      <span>-{(order.discountAmount || 0).toLocaleString('vi-VN')}đ</span>
                    </div>
                  )}
                  {(order.taxAmount || 0) > 0 && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', marginBottom: '2px' }}>
                      <span>Thuế ({order.taxRate}%):</span>
                      <span>{(order.taxAmount || 0).toLocaleString('vi-VN')}đ</span>
                    </div>
                  )}
                  <div 
                    style={{ 
                      display: 'flex', 
                      justifyContent: 'space-between', 
                      fontWeight: 900, 
                      fontSize: '20px', 
                      borderTop: isMinimal ? '1px solid #eee' : '1px solid #000', 
                      marginTop: '12px', 
                      paddingTop: '12px',
                      color: isModern ? '#059669' : '#000'
                    }}
                  >
                    <span>TỔNG CỘNG:</span>
                    <span>{order.total.toLocaleString('vi-VN')}đ</span>
                  </div>
                </div>
              );
            case 'qr':
              return qrUrl ? (
                <div key={field.id} style={{ textAlign: 'center', margin: '15px 0' }}>
                  <div style={{ fontSize: '10px', fontWeight: 900, textTransform: 'uppercase', marginBottom: '4px' }}>
                    {isProvisional ? 'QUÉT MÃ THANH TOÁN' : 'MÃ QR GIAO DỊCH'}
                  </div>
                  <img src={qrUrl} style={{ width: '140px', height: 'auto', margin: '10px auto', display: 'block', maxWidth: '100%' }} alt="QR Code" />
                </div>
              ) : null;
            case 'footer':
              return (
                <div key={field.id} style={{ textAlign: 'center', fontSize: '10px', fontStyle: 'italic', marginTop: '15px', borderTop: '1px dashed #eee', paddingTop: '10px' }}>
                  {field.value || 'Cảm ơn và hẹn gặp lại!'}
                </div>
              );
            default:
              if (field.isCustom) {
                return (
                  <div key={idx} style={{ textAlign: 'center', fontSize: '10px', padding: '4px 0' }}>
                    {field.value}
                  </div>
                );
              }
              return null;
          }
        })}
      </div>
    );
  }
);

ReceiptTemplate.displayName = 'ReceiptTemplate';

export default ReceiptTemplate;
