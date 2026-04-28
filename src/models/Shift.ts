import mongoose, { Schema, Document } from 'mongoose';

export interface IShift extends Document {
  tenantId: string;
  userId: mongoose.Types.ObjectId;
  userName: string;
  startTime: Date;
  endTime?: Date;
  openingBalance: number;
  closingBalance?: number;
  totalSales: number;
  cashSales: number;
  transferSales: number;
  productSales: { name: string; quantity: number; amount: number }[];
  notes?: string;
  status: 'OPEN' | 'CLOSED';
  code: string;
}

const ShiftSchema: Schema = new Schema({
  tenantId: { type: String, required: true, index: true },
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  userName: { type: String, required: true },
  code: { type: String },
  startTime: { type: Date, default: Date.now },
  endTime: { type: Date },
  openingBalance: { type: Number, default: 0 },
  closingBalance: { type: Number },
  totalSales: { type: Number, default: 0 },
  cashSales: { type: Number, default: 0 },
  transferSales: { type: Number, default: 0 },
  productSales: [
    {
      name: { type: String },
      quantity: { type: Number },
      amount: { type: Number }
    }
  ],
  notes: { type: String },
  status: { 
    type: String, 
    enum: ['OPEN', 'CLOSED'], 
    default: 'OPEN' 
  }
}, { timestamps: true });

ShiftSchema.index({ tenantId: 1, status: 1 });
ShiftSchema.index({ tenantId: 1, userId: 1 });

export default mongoose.models.Shift || mongoose.model<IShift>('Shift', ShiftSchema);
