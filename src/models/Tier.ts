import mongoose, { Schema, Document, Model } from 'mongoose';

export interface ITier extends Document {
  creatorId: mongoose.Types.ObjectId;
  name: string;
  description: string;
  price: number;
  benefits: string[];
  createdAt: Date;
  updatedAt: Date;
}

const TierSchema: Schema = new Schema(
  {
    creatorId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    name: { type: String, required: true },
    description: { type: String, required: true },
    price: { type: Number, required: true },
    benefits: [{ type: String }],
  },
  {
    timestamps: true,
  }
);

export const Tier: Model<ITier> = mongoose.models.Tier || mongoose.model<ITier>('Tier', TierSchema);
