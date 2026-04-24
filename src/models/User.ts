import mongoose, { Schema, Document } from 'mongoose';

export interface IUser extends Document {
  tenantId: string;
  name: string;
  email: string;
  password: string;
  role: 'ADMIN' | 'STAFF';
  isActive: boolean;
}

const UserSchema: Schema = new Schema({
  tenantId: { type: String, required: true, index: true },
  name: { type: String, required: true },
  email: { type: String, required: true },
  password: { type: String, required: true },
  role: { 
    type: String, 
    enum: ['ADMIN', 'STAFF'], 
    default: 'STAFF' 
  },
  isActive: { type: Boolean, default: true }
}, { timestamps: true });

// Ensure unique email per tenant
UserSchema.index({ tenantId: 1, email: 1 }, { unique: true });

export default mongoose.models.User || mongoose.model<IUser>('User', UserSchema);
