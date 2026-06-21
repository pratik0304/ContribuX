import mongoose, { Schema, Document, Model } from 'mongoose';

export interface ISubscription extends Document {
  supporterId: mongoose.Types.ObjectId;
  creatorId: mongoose.Types.ObjectId;
  tierId: mongoose.Types.ObjectId;
  status: 'active' | 'cancelled' | 'expired';
  startDate: Date;
  endDate?: Date;
  nextBillingDate: Date;
  price: number;
  currency: string;
  createdAt: Date;
  updatedAt: Date;
}

const SubscriptionSchema: Schema = new Schema(
  {
    supporterId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    creatorId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    tierId: { type: Schema.Types.ObjectId, ref: 'Tier' },
    status: {
      type: String,
      enum: ['active', 'cancelled', 'expired'],
      default: 'active',
    },
    startDate: { type: Date, default: Date.now },
    endDate: { type: Date },
    nextBillingDate: { type: Date, required: true },
    price: { type: Number, required: true },
    currency: { type: String, default: 'INR' },
  },
  {
    timestamps: true,
  }
);

// Compound index: one active subscription per supporter per creator
SubscriptionSchema.index({ supporterId: 1, creatorId: 1, status: 1 });
SubscriptionSchema.index({ creatorId: 1, status: 1 });

export const Subscription: Model<ISubscription> =
  mongoose.models.Subscription || mongoose.model<ISubscription>('Subscription', SubscriptionSchema);
