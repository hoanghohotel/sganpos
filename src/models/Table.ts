import mongoose, { Schema, Document } from 'mongoose';

export interface ITable extends Document {
  tenantId: string;
  name: string;
  status: 'EMPTY' | 'OCCUPIED';
  currentOrderId?: mongoose.Types.ObjectId;
}

const TableSchema: Schema = new Schema({
  tenantId: { type: String, required: true, index: true },
  name: { type: String, required: true },
  status: {
    type: String,
    enum: ['EMPTY', 'OCCUPIED'],
    default: 'EMPTY',
  },
  currentOrderId: { type: Schema.Types.ObjectId, ref: 'Order' },
}, { timestamps: true });

// Multi-tenant index
TableSchema.index({ tenantId: 1, name: 1 });

export default mongoose.models.Table || mongoose.model<ITable>('Table', TableSchema);
