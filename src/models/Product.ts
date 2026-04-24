import mongoose, { Schema, Document } from 'mongoose';

export interface IProduct extends Document {
  tenantId: string;
  name: string;
  category: string;
  image?: string;
  basePrice: number;
  sizes: { name: string; price: number }[];
  sugarLevels: string[];
  iceLevels: string[];
  toppings: { name: string; price: number }[];
}

const ProductSchema: Schema = new Schema({
  tenantId: { type: String, required: true, index: true },
  name: { type: String, required: true },
  category: { type: String, required: true, default: 'Chưa phân loại' },
  image: { type: String },
  basePrice: { type: Number, required: true },
  sizes: [
    {
      name: { type: String, required: true },
      price: { type: Number, required: true },
    },
  ],
  sugarLevels: [{ type: String }],
  iceLevels: [{ type: String }],
  toppings: [
    {
      name: { type: String, required: true },
      price: { type: Number, required: true },
    },
  ],
}, { timestamps: true });

// Multi-tenant index
ProductSchema.index({ tenantId: 1, name: 1 });

export default mongoose.models.Product || mongoose.model<IProduct>('Product', ProductSchema);
