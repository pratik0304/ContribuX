import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IUser extends Document {
  name: string;
  email: string;
  password?: string;
  role: 'creator' | 'supporter' | 'admin';
  bio?: string;
  profilePicture?: string;
  coverPicture?: string;
  category?: string;
  socialLinks?: {
    twitter?: string;
    instagram?: string;
    youtube?: string;
    website?: string;
  };
  payoutSetup?: boolean;
  payoutDetails?: {
    bankName?: string;
    accountHolderName?: string;
    accountNumber?: string;
    ifscCode?: string;
    upiId?: string;
  };
  status: 'active' | 'pending' | 'verified' | 'suspended';
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema: Schema = new Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, select: false },
    role: {
      type: String,
      enum: ['creator', 'supporter', 'admin'],
      default: 'supporter',
    },
    bio: { type: String, default: '' },
    profilePicture: { type: String, default: '' },
    coverPicture: { type: String, default: '' },
    category: { type: String, default: 'General' },
    socialLinks: {
      twitter: { type: String, default: '' },
      instagram: { type: String, default: '' },
      youtube: { type: String, default: '' },
      website: { type: String, default: '' },
    },
    payoutSetup: { type: Boolean, default: false },
    payoutDetails: {
      bankName: { type: String, default: '' },
      accountHolderName: { type: String, default: '' },
      accountNumber: { type: String, default: '' },
      ifscCode: { type: String, default: '' },
      upiId: { type: String, default: '' },
    },
    status: {
      type: String,
      enum: ['active', 'pending', 'verified', 'suspended'],
      default: 'active',
    },
  },
  {
    timestamps: true,
  }
);

export const User: Model<IUser> = mongoose.models.User || mongoose.model<IUser>('User', UserSchema);
