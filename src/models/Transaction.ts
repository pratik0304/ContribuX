import mongoose, { Schema, Document, Model } from 'mongoose';

export interface ITransaction extends Document {
  supporterId: mongoose.Types.ObjectId;
  creatorId: mongoose.Types.ObjectId;
  tierId?: mongoose.Types.ObjectId;
  amount: number;
  currency: string;
  status: 'pending' | 'completed' | 'failed' | 'refunded';
  paymentGatewayId: string;
  type: 'subscription' | 'donation';
  createdAt: Date;
  updatedAt: Date;
}

const TransactionSchema: Schema = new Schema(
  {
    supporterId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    creatorId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    tierId: { type: Schema.Types.ObjectId, ref: 'Tier' },
    amount: { type: Number, required: true },
    currency: { type: String, default: 'INR' },
    status: {
      type: String,
      enum: ['pending', 'completed', 'failed', 'refunded'],
      default: 'pending',
    },
    paymentGatewayId: { type: String, required: true },
    type: {
      type: String,
      enum: ['subscription', 'donation'],
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

TransactionSchema.index({ creatorId: 1, createdAt: -1 });
TransactionSchema.index({ supporterId: 1, createdAt: -1 });

export const Transaction: Model<ITransaction> = mongoose.models.Transaction || mongoose.model<ITransaction>('Transaction', TransactionSchema);
