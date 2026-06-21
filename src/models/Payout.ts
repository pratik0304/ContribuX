import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IPayout extends Document {
  creatorId: mongoose.Types.ObjectId;
  amount: number;
  status: 'pending' | 'completed' | 'failed';
  bankName: string;
  accountNumber: string;
  createdAt: Date;
  updatedAt: Date;
}

const PayoutSchema: Schema = new Schema(
  {
    creatorId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    amount: { type: Number, required: true },
    status: {
      type: String,
      enum: ['pending', 'completed', 'failed'],
      default: 'pending',
    },
    bankName: { type: String, required: true },
    accountNumber: { type: String, required: true },
  },
  {
    timestamps: true,
  }
);

PayoutSchema.index({ creatorId: 1, createdAt: -1 });

export const Payout: Model<IPayout> =
  mongoose.models.Payout || mongoose.model<IPayout>('Payout', PayoutSchema);
