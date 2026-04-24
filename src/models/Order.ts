import mongoose, { Schema, Document } from 'mongoose';

export interface IOrderItem {
  productId: mongoose.Types.ObjectId;
  name: string;
  price: number;
  quantity: number;
  size?: string;
  sugar?: string;
  ice?: string;
  toppings: { name: string; price: number }[];
  notes?: string;
}

export interface IOrder extends Document {
  tenantId: string;
  orderType: 'DINE_IN' | 'TAKEAWAY' | 'DELIVERY';
  tableId?: mongoose.Types.ObjectId;
  customer?: {
    name: string;
    phone: string;
    address?: string;
  };
  items: IOrderItem[];
  status: 'PENDING' | 'PREPARING' | 'READY' | 'COMPLETED';
  paymentStatus: 'UNPAID' | 'PAID';
  total: number;
  paymentMethod?: 'CASH' | 'TRANSFER';
  shiftId: mongoose.Types.ObjectId;
}

const OrderSchema: Schema = new Schema({
  tenantId: { type: String, required: true, index: true },
  shiftId: { type: Schema.Types.ObjectId, ref: 'Shift', required: true },
  orderType: { 
    type: String, 
    enum: ['DINE_IN', 'TAKEAWAY', 'DELIVERY'], 
    required: true 
  },
  tableId: { type: Schema.Types.ObjectId, ref: 'Table' },
  paymentMethod: {
    type: String,
    enum: ['CASH', 'TRANSFER'],
  },
  customer: {
    name: { type: String },
    phone: { type: String },
    address: { type: String },
  },
  items: [
    {
      productId: { type: Schema.Types.ObjectId, ref: 'Product', required: true },
      name: { type: String, required: true },
      price: { type: Number, required: true },
      quantity: { type: Number, required: true },
      size: { type: String },
      sugar: { type: String },
      ice: { type: String },
      toppings: [
        {
          name: { type: String },
          price: { type: Number },
        }
      ],
      notes: { type: String },
    },
  ],
  status: {
    type: String,
    enum: ['PENDING', 'PREPARING', 'READY', 'COMPLETED'],
    default: 'PENDING',
  },
  paymentStatus: {
    type: String,
    enum: ['UNPAID', 'PAID'],
    default: 'UNPAID',
  },
  total: { type: Number, required: true },
}, { timestamps: true });

// Multi-tenant index
OrderSchema.index({ tenantId: 1, createdAt: -1 });

export default mongoose.models.Order || mongoose.model<IOrder>('Order', OrderSchema);
