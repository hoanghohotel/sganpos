import mongoose, { Schema, Document } from 'mongoose';

export interface IUser extends Document {
  tenantId: string;
  name: string;
  email?: string;
  phone?: string;
  password: string;
  role: 'ADMIN' | 'MANAGER' | 'STAFF';
  managerId?: string;
  permissions: string[];
  isActive: boolean;
  isVerified: boolean;
  verificationToken?: string;
}

const UserSchema: Schema = new Schema({
  tenantId: { type: String, required: true, index: true },
  name: { type: String, required: true },
  email: { type: String, lowercase: true, trim: true },
  phone: { type: String, trim: true },
  password: { type: String, required: true },
  role: { 
    type: String, 
    enum: ['ADMIN', 'MANAGER', 'STAFF'], 
    default: 'STAFF' 
  },
  managerId: { type: String, index: true },
  permissions: { type: [String], default: [] },
  isActive: { type: Boolean, default: true },
  isVerified: { type: Boolean, default: false },
  verificationToken: { type: String }
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
