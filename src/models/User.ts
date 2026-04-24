import mongoose, { Schema, Document } from 'mongoose';

export interface IUser extends Document {
  tenantId: string;
  name: string;
  email?: string;
  phone?: string;
  password: string;
  role: 'ADMIN' | 'STAFF';
  isActive: boolean;
}

const UserSchema: Schema = new Schema({
  tenantId: { type: String, required: true, index: true },
  name: { type: String, required: true },
  email: { type: String, lowercase: true, trim: true },
  phone: { type: String, trim: true },
  password: { type: String, required: true },
  role: { 
    type: String, 
    enum: ['ADMIN', 'STAFF'], 
    default: 'STAFF' 
  },
  isActive: { type: Boolean, default: true }
}, { timestamps: true });

// Ensure unique email/phone per tenant if they are provided
UserSchema.index({ tenantId: 1, email: 1 }, { 
  unique: true, 
  partialFilterExpression: { email: { $type: "string" } } 
});
UserSchema.index({ tenantId: 1, phone: 1 }, { 
  unique: true, 
  partialFilterExpression: { phone: { $type: "string" } } 
});

export default mongoose.models.User || mongoose.model<IUser>('User', UserSchema);
