import mongoose, { Schema, Document } from 'mongoose';

export interface ISettings extends Document {
  tenantId: string;
  storeName: string;
  logoUrl?: string;
  address?: string;
  hotline?: string;
  bankAccount?: string;
  bankName?: string;
  bankCode?: string;
  bankLogoUrl?: string;
  bankAccountHolder?: string;
  subdomain?: string;
  customPath?: string;
  taxRate?: number;
  defaultPrintTemplate?: string;
  templateFields?: any[];
  printers?: any[];
}

const SettingsSchema: Schema = new Schema({
  tenantId: { type: String, required: true, index: true, unique: true },
  storeName: { type: String, default: 'SAIGON AN COFFEE' },
  logoUrl: { type: String, default: '/logo.svg' },
  address: { type: String, default: '32 Đoàn Kết, KĐT Ghẽ, Mao Điền, Hải Phòng.' },
  hotline: { type: String, default: '098 666 1932' },
  bankAccount: { type: String, default: '11415686' },
  bankName: { type: String, default: 'VietinBank' },
  bankCode: { type: String, default: 'ICB' },
  bankLogoUrl: { type: String, default: 'https://api.vietqr.io/img/ICB.png' },
  bankAccountHolder: { type: String, default: 'HO KINH DOANH SAI GON AN COFFEE' },
  subdomain: { type: String },
  customPath: { type: String },
  taxRate: { type: Number, default: 0 },
  defaultPrintTemplate: { type: String, default: 'classic' },
  templateFields: { type: Array },
  printers: { type: Array, default: [] },
}, { timestamps: true });

export default mongoose.models.Settings || mongoose.model<ISettings>('Settings', SettingsSchema);
