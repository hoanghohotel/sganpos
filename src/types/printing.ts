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

export const PRINT_EVENT = 'app:print';

export interface PrintEventDetail {
  order: PrintOrderData;
  settings: PrintSettings;
  isProvisional?: boolean;
}
