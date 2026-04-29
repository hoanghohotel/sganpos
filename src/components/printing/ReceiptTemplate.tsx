import React, { forwardRef } from 'react';
import { PrintOrderData, PrintSettings } from '../../lib/printing';
import { useAuthStore } from '../../store/authStore';
import ThermalReceiptLayout from './ThermalReceiptLayout';

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
    const isEco = templateId === 'eco';
    const isTech = templateId === 'tech';
    const isVoucher = templateId === 'voucher';
    const isBakery = templateId === 'bakery';
    const isBento = templateId === 'bento';

    const isThermal = ['xprinter', 'zywell', 'xpos', 'gprinter'].includes(settings.brand || '');
    const isXprinter = settings.brand === 'xprinter';

    const printWidth = settings.printWidth === '58mm' ? '58mm' : '80mm';

    const printStyles = (
      <style>
        {`
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
          @media print {
            html, body { 
              margin: 0 !important; 
              padding: 0 !important; 
              height: auto !important;
              overflow: visible !important;
              background: white !important;
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
              font-family: 'Poppins', sans-serif;
            }
            img { filter: grayscale(1) contrast(2) !important; }
            .no-print { display: none !important; }
            @page {
              margin: 0;
              size: ${printWidth} auto;
            }
            .thermal-receipt-root, .print-container {
              width: ${printWidth} !important;
              margin: 0 !important;
              padding: 0 !important;
            }
          }
        `}
      </style>
    );

    // If it's a thermal printer and we want high-fidelity thermal layout
    if (isThermal && templateId === 'classic') {
      return (
        <div ref={ref} className="thermal-receipt-root" style={{ width: printWidth, margin: '0 auto', background: '#fff' }}>
           {printStyles}
           <ThermalReceiptLayout order={order} settings={settings} isProvisional={isProvisional} />
        </div>
      );
    }

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

    const fields = (settings.templateFields && settings.templateFields.length > 0) ? settings.templateFields : [
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

    const getTemplateStyle = () => {
      const base = {
        width: printWidth,
        margin: '0 auto',
        backgroundColor: '#fff',
        boxSizing: 'border-box' as const,
        overflow: 'visible',
        color: '#000',
        lineHeight: '1.4'
      };

      if (isModern) return { ...base, padding: '30px', fontFamily: "'Poppins', sans-serif", borderRadius: '25px', fontSize: '13px' };
      if (isMinimal) return { ...base, padding: '10px', fontFamily: "'Poppins', sans-serif", fontSize: '11px', lineHeight: '1.2' };
      if (isRetro) return { ...base, padding: '15px', fontFamily: "monospace", fontSize: '12px', border: '1px dashed #000' };
      if (isElegant) return { ...base, padding: '25px', fontFamily: "serif", fontSize: '13px', border: '4px double #000' };
      if (isEco) return { ...base, padding: '20px', fontFamily: "'Poppins', sans-serif", fontSize: '13px', borderLeft: '10px solid #059669' };
      if (isTech) return { ...base, padding: '20px', fontFamily: "monospace", fontSize: '12px', backgroundColor: '#fff', border: '2px solid #000' };
      if (isVoucher) return { ...base, padding: '25px', border: '2px dashed #000', borderRadius: '15px' };
      if (isBakery) return { ...base, padding: '20px', fontFamily: "cursive", fontSize: '15px' };
      if (isBento) return { ...base, padding: '20px', fontSize: '12px' };
      
      return { ...base, padding: '20px', fontFamily: "'Poppins', sans-serif", fontSize: '13px' };
    };

    return (
      <div ref={ref} style={getTemplateStyle()}>
        {printStyles}
        {fields.filter(f => f.enabled).map((field, idx) => {
          switch (field.id) {
            case 'logo':
              return settings.logoUrl ? (
                <div key={field.id} style={{ textAlign: 'center', marginBottom: isModern ? '20px' : '15px' }}>
                  <img src={settings.logoUrl} style={{ width: '80px', height: '80px', objectFit: 'contain', borderRadius: isModern ? '20px' : '0' }} alt="Logo" />
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
                    fontSize: isModern ? '26px' : isTech ? '22px' : '20px',
                    color: isModern || isEco ? '#059669' : '#000',
                    letterSpacing: isRetro || isTech ? '2px' : 'normal',
                    padding: isTech ? '10px' : '0',
                    border: isTech ? '2px solid #000' : 'none',
                    marginBottom: isTech ? '15px' : '0'
                  }}
                >
                  {settings.storeName || 'POSAPP STORE'}
                </div>
              );
            case 'address':
              return (
                <div key={field.id} style={{ textAlign: 'center', fontSize: '11px', marginTop: '4px', opacity: 0.8, fontStyle: isBakery ? 'italic' : 'normal' }}>
                  {settings.address || ''}
                </div>
              );
            case 'hotline':
              return (
                <div key={field.id} style={{ textAlign: 'center', fontSize: '11px', fontWeight: 700, marginTop: '2px' }}>
                  {isTech && '> '}Hotline: {settings.hotline || ''}
                </div>
              );
            case 'sep-1':
            case 'sep-2':
              return (
                <div 
                  key={`${field.id}-${idx}`} 
                  style={{ 
                    borderTop: isRetro || isVoucher ? '2px dashed #000' : isTech ? '4px solid #000' : '1px solid #eee',
                    margin: isMinimal ? '10px 0' : '16px 0',
                    position: 'relative'
                  }} 
                >
                  {isVoucher && (
                    <>
                      <div style={{ position: 'absolute', left: '-35px', top: '-10px', width: '20px', height: '20px', background: '#fff', borderRadius: '50%', border: '2px dashed #000' }} />
                      <div style={{ position: 'absolute', right: '-35px', top: '-10px', width: '20px', height: '20px', background: '#fff', borderRadius: '50%', border: '2px dashed #000' }} />
                    </>
                  )}
                </div>
              );
            case 'order-info':
              return (
                <div key={field.id} style={{ margin: '15px 0' }}>
                  <div style={{ 
                    textAlign: 'center', 
                    fontWeight: 900, 
                    marginBottom: '12px', 
                    fontSize: isModern ? '14px' : '12px',
                    backgroundColor: isModern ? '#ecfdf5' : isTech ? '#000' : 'transparent',
                    color: isModern ? '#059669' : isTech ? '#fff' : '#000',
                    padding: isModern || isTech ? '8px' : '0',
                    borderRadius: isModern ? '12px' : '0'
                  }}>
                    {isProvisional ? 'PHIẾU TẠM TÍNH' : 'HÓA ĐƠN THANH TOÁN'}
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '11px' }}>
                    {order.orderCode && (
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span>Mã đơn:</span>
                        <b style={{ fontWeight: 900 }}>#{order.orderCode}</b>
                      </div>
                    )}
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span>Vị trí:</span>
                      <b style={{ fontWeight: 900 }}>{order.tableName || 'Mang về'}</b>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span>Thời gian:</span>
                      <span>{dateStr}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span>Phục vụ:</span>
                      <span>{staffName}</span>
                    </div>
                    {order.paymentMethod && (
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '4px', borderTop: '1px dotted #ccc', paddingTop: '4px' }}>
                        <span>Thanh toán:</span>
                        <b>{order.paymentMethod === 'CASH' ? 'Tiền mặt' : 'Chuyển khoản'}</b>
                      </div>
                    )}
                  </div>
                </div>
              );
            case 'items-list':
              return (
                <div key={field.id} style={{ margin: '15px 0' }}>
                  <div style={{ 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    fontWeight: 900, 
                    fontSize: '11px', 
                    borderBottom: isTech ? '2px solid #000' : '1.5px solid #000', 
                    paddingBottom: '6px', 
                    marginBottom: '10px',
                    textTransform: 'uppercase'
                  }}>
                    <div style={{ flex: 1 }}>Sản phẩm</div>
                    <div style={{ width: '40px', textAlign: 'center' }}>SL</div>
                    <div style={{ width: '90px', textAlign: 'right' }}>Thành tiền</div>
                  </div>
                  {order.items.map((item, i) => (
                    <div 
                      key={i} 
                      style={{ 
                        display: 'flex', 
                        justifyContent: 'space-between', 
                        marginBottom: '8px', 
                        fontSize: isBento ? '14px' : '12px',
                        borderBottom: isModern ? '1px solid #f1f5f9' : (isBento ? '1px solid #eee' : 'none'),
                        paddingBottom: isModern || isBento ? '8px' : '0',
                        pageBreakInside: 'avoid'
                      }}
                    >
                      <div style={{ flex: 1, fontWeight: 700, paddingRight: '5px' }}>
                        {isTech && '[ ] '}{item.name}
                      </div>
                      <div style={{ width: '40px', textAlign: 'center' }}>{item.quantity}</div>
                      <div style={{ width: '90px', textAlign: 'right', fontWeight: 900 }}>
                        {(item.price * item.quantity).toLocaleString('vi-VN')}
                      </div>
                    </div>
                  ))}
                </div>
              );
            case 'totals':
              return (
                <div key={field.id} style={{ margin: '15px 0', borderTop: isTech ? '2px solid #000' : '1px solid #eee', paddingTop: '10px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', marginBottom: '4px' }}>
                    <span>Tạm tính:</span>
                    <span>{order.subtotal.toLocaleString('vi-VN')}</span>
                  </div>
                  {(order.discountAmount || 0) > 0 && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', marginBottom: '4px', color: '#dc2626' }}>
                      <span>Chiết khấu:</span>
                      <span>-{(order.discountAmount || 0).toLocaleString('vi-VN')}</span>
                    </div>
                  )}
                  {(order.taxAmount || 0) > 0 && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', marginBottom: '4px' }}>
                      <span>VAT ({order.taxRate}%):</span>
                      <span>{(order.taxAmount || 0).toLocaleString('vi-VN')}</span>
                    </div>
                  )}
                  <div 
                    style={{ 
                      display: 'flex', 
                      justifyContent: 'space-between', 
                      fontWeight: 900, 
                      fontSize: '22px', 
                      borderTop: isTech ? '4px double #000' : '2px solid #000', 
                      marginTop: '10px', 
                      paddingTop: '10px',
                      color: isModern || isEco ? '#059669' : '#000',
                      letterSpacing: isTech ? '-1px' : 'normal'
                    }}
                  >
                    <span>TỔNG:</span>
                    <span>{order.total.toLocaleString('vi-VN')}</span>
                  </div>
                </div>
              );
            case 'qr':
              return qrUrl ? (
                <div key={field.id} style={{ 
                  textAlign: 'center', 
                  margin: '20px 0',
                  padding: isModern ? '15px' : '0',
                  backgroundColor: isModern ? '#f8fafc' : 'transparent',
                  borderRadius: '20px'
                }}>
                  <div style={{ fontSize: '10px', fontWeight: 900, textTransform: 'uppercase', marginBottom: '8px', color: isTech ? '#fff' : '#000', backgroundColor: isTech ? '#000' : 'transparent', display: isTech ? 'inline-block' : 'block', padding: isTech ? '4px 12px' : '0' }}>
                    {isProvisional ? 'QUÉT ĐỂ THANH TOÁN' : 'MÃ TRA CỨU'}
                  </div>
                  <img src={qrUrl} style={{ width: isModern ? '160px' : '140px', height: 'auto', margin: '10px auto', display: 'block', maxWidth: '100%', filter: 'contrast(1.2)' }} alt="QR Code" />
                </div>
              ) : null;
            case 'footer':
              return (
                <div key={field.id} style={{ 
                  textAlign: 'center', 
                  fontSize: '11px', 
                  fontStyle: 'italic', 
                  marginTop: '20px', 
                  paddingTop: '15px',
                  borderTop: isRetro ? '1px dashed #ccc' : '1px solid #f1f5f9'
                }}>
                  {field.value || 'CẢM ƠN QUÝ KHÁCH. HẸN GẶP LẠI!'}
                  {isTech && <div style={{ fontSize: '10px', marginTop: '10px', opacity: 0.5 }}>SYSTEM_OK_CHECKED</div>}
                </div>
              );
            default:
              if (field.isCustom) {
                return (
                  <div key={idx} style={{ textAlign: 'center', fontSize: '11px', padding: '5px 0', opacity: 0.8 }}>
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
