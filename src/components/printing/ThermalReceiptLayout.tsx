import React from 'react';
import { Printer, Text, Row, Line, Br } from 'react-thermal-printer';
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
      zoom: settings.printWidth === '58mm' ? 1 : 1.2
    }}>
      <Printer type="epson" width={width}>
        {settings.logoUrl && (
          <div style={{ textAlign: 'center', marginBottom: '10px' }}>
            <img src={settings.logoUrl} style={{ width: '60px', height: '60px', objectFit: 'contain', filter: 'grayscale(1) contrast(2)' }} alt="Logo" />
          </div>
        )}
        <Text align="center" size={{ width: 2, height: 2 }} bold>
          {settings.storeName || 'SAIGON AN COFFEE'}
        </Text>
        <Text align="center">{settings.address || ''}</Text>
        <Text align="center">Hotline: {settings.hotline || ''}</Text>
        <Line character="-" />
        <Text align="center" bold>
          {isProvisional ? 'PHIEU TAM TINH' : 'HOA DON THANH TOAN'}
        </Text>
        <Br />
        <Row left="Ma Don:" right={`#${order.orderCode || ''}`} />
        <Row left="Ban:" right={order.tableName || 'Mang ve'} />
        <Row left="Ngay:" right={dateStr} />
        <Line character="-" />
        <Row left="Ten mon" right="T.Tien" />
        <Line character="-" />
        {order.items.map((item, i) => (
          <React.Fragment key={i}>
            <Text bold>{item.name}</Text>
            <Row left={`${item.quantity} x ${item.price.toLocaleString('vi-VN')}`} right={(item.price * item.quantity).toLocaleString('vi-VN')} />
          </React.Fragment>
        ))}
        <Line character="-" />
        <Row left="Tam tinh:" right={order.subtotal.toLocaleString('vi-VN')} />
        {(order.discountAmount || 0) > 0 && (
          <Row left="Giam gia:" right={`-${order.discountAmount?.toLocaleString('vi-VN')}`} />
        )}
        <Row left="TONG CONG:" right={`${order.total.toLocaleString('vi-VN')}d`} />
        
        {qrUrl && (
          <div style={{ textAlign: 'center', margin: '15px 0' }}>
             <Text align="center" bold>MA QR THANH TOAN</Text>
             <img src={qrUrl} style={{ width: '120px', height: 'auto', display: 'block', margin: '5px auto', filter: 'grayscale(1) contrast(2)' }} alt="QR" />
          </div>
        )}

        <Br />
        <Text align="center" italic>
          Cam on va hen gap lai!
        </Text>
        {isProvisional && (
          <Text align="center" bold>VUI LONG THANH TOAN TAI QUAY</Text>
        )}
      </Printer>
    </div>
  );
};

export default ThermalReceiptLayout;
