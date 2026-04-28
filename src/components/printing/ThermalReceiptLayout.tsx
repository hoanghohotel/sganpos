import React from 'react';
import { PrintOrderData, PrintSettings } from '../../types/printing';

interface ThermalReceiptLayoutProps {
  order: PrintOrderData;
  settings: PrintSettings;
  isProvisional?: boolean;
}

const ThermalReceiptLayout: React.FC<ThermalReceiptLayoutProps> = ({ order, settings, isProvisional }) => {
  const width = settings.printWidth === '58mm' ? 32 : 42; 
  const dateStr = order.createdAt ? new Date(order.createdAt).toLocaleString('vi-VN') : new Date().toLocaleString('vi-VN');

  const qrUrl = (order.paymentMethod === 'TRANSFER' || isProvisional) && settings.bankCode
    ? `https://img.vietqr.io/image/${settings.bankCode}-${settings.bankAccount}-compact2.png?amount=${order.total}&addInfo=${encodeURIComponent(`TT ${order.orderCode || ''} ${order.tableName || ''}`)}&accountName=${encodeURIComponent(settings.bankAccountHolder || '')}`
    : null;

  return (
    <div className="thermal-preview" style={{ 
      imageRendering: 'pixelated', 
      fontFamily: '"Courier New", Courier, monospace',
      width: '100%',
      color: '#000',
      backgroundColor: '#fff',
      padding: '0 2mm'
    }}>
      <style>
        {`
          .thermal-row { display: flex; justify-content: space-between; width: 100%; margin: 2px 0; }
          .thermal-line { border-top: 1px dashed #000; margin: 5px 0; width: 100%; }
          .thermal-text-center { text-align: center; }
          .thermal-bold { font-weight: bold; }
          .thermal-large { font-size: 1.5em; line-height: 1.2; }
          .thermal-br { height: 10px; }
        `}
      </style>
      
      {settings.logoUrl && (
        <div style={{ textAlign: 'center', marginBottom: '10px' }}>
          <img src={settings.logoUrl} style={{ width: '60px', height: '60px', objectFit: 'contain', filter: 'grayscale(1) contrast(2)' }} alt="Logo" />
        </div>
      )}

      <div className="thermal-text-center thermal-bold thermal-large">
        {settings.storeName || 'SAIGON AN COFFEE'}
      </div>
      <div className="thermal-text-center" style={{ fontSize: '12px' }}>{settings.address || ''}</div>
      <div className="thermal-text-center" style={{ fontSize: '12px' }}>Hotline: {settings.hotline || ''}</div>
      
      <div className="thermal-line" />
      
      <div className="thermal-text-center thermal-bold">
        {isProvisional ? 'PHIEU TAM TINH' : 'HOA DON THANH TOAN'}
      </div>
      
      <div className="thermal-br" />
      
      <div className="thermal-row">
        <span>Ma Don:</span>
        <span className="thermal-bold">#{order.orderCode || ''}</span>
      </div>
      <div className="thermal-row">
        <span>Ban:</span>
        <span className="thermal-bold">{order.tableName || 'Mang ve'}</span>
      </div>
      <div className="thermal-row">
        <span>Ngay:</span>
        <span>{dateStr}</span>
      </div>
      
      <div className="thermal-line" />
      
      <div className="thermal-row thermal-bold" style={{ fontSize: '11px' }}>
        <span>Ten mon</span>
        <span>T.Tien</span>
      </div>
      
      <div className="thermal-line" />
      
      {order.items.map((item, i) => (
        <div key={i} style={{ marginBottom: '8px' }}>
          <div className="thermal-bold" style={{ fontSize: '13px' }}>{item.name}</div>
          <div className="thermal-row" style={{ fontSize: '12px' }}>
            <span>{item.quantity} x {item.price.toLocaleString('vi-VN')}</span>
            <span className="thermal-bold">{(item.price * item.quantity).toLocaleString('vi-VN')}</span>
          </div>
        </div>
      ))}
      
      <div className="thermal-line" />
      
      <div className="thermal-row" style={{ fontSize: '12px' }}>
        <span>Tam tinh:</span>
        <span>{order.subtotal.toLocaleString('vi-VN')}</span>
      </div>
      
      {(order.discountAmount || 0) > 0 && (
        <div className="thermal-row" style={{ fontSize: '12px' }}>
          <span>Giam gia:</span>
          <span>-{order.discountAmount?.toLocaleString('vi-VN')}</span>
        </div>
      )}
      
      <div className="thermal-row thermal-bold" style={{ fontSize: '16px', marginTop: '5px', paddingTop: '5px', borderTop: '1px solid #000' }}>
        <span>TONG CONG:</span>
        <span>{order.total.toLocaleString('vi-VN')}d</span>
      </div>
      
      {qrUrl && (
        <div style={{ textAlign: 'center', margin: '15px 0' }}>
           <div className="thermal-bold" style={{ fontSize: '10px', marginBottom: '5px' }}>MA QR THANH TOAN</div>
           <img src={qrUrl} style={{ width: '130px', height: '130px', display: 'block', margin: '0 auto', filter: 'grayscale(1) contrast(2)' }} alt="QR" />
        </div>
      )}

      <div className="thermal-br" />
      
      <div className="thermal-text-center" style={{ fontStyle: 'italic', fontSize: '11px' }}>
        Cam on va hen gap lai!
      </div>
      
      {isProvisional && (
        <div className="thermal-text-center thermal-bold" style={{ marginTop: '10px' }}>
          VUI LONG THANH TOAN TAI QUAY
        </div>
      )}
      
      <div className="thermal-br" />
      <div className="thermal-br" />
    </div>
  );
};

export default ThermalReceiptLayout;
