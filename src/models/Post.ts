import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IPost extends Document {
  creatorId: mongoose.Types.ObjectId;
  title: string;
  content: string;
  mediaUrl?: string;
  mediaType?: 'image' | 'video' | 'none';
  isPublic: boolean;
  requiredTierIds: mongoose.Types.ObjectId[];
  likes: mongoose.Types.ObjectId[];
  comments: {
    _id?: mongoose.Types.ObjectId;
    userId: mongoose.Types.ObjectId;
    userName: string;
    text: string;
    createdAt: Date;
  }[];
  status: 'draft' | 'published';
  createdAt: Date;
  updatedAt: Date;
}

const PostSchema: Schema = new Schema(
  {
    creatorId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    title: { type: String, required: true },
    content: { type: String, required: true },
    mediaUrl: { type: String },
    mediaType: { type: String, enum: ['image', 'video', 'none'], default: 'none' },
    isPublic: { type: Boolean, default: true },
    requiredTierIds: [{ type: Schema.Types.ObjectId, ref: 'Tier' }],
    likes: [{ type: Schema.Types.ObjectId, ref: 'User' }],
    comments: [{
      userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
      userName: { type: String, required: true },
      text: { type: String, required: true },
      createdAt: { type: Date, default: Date.now }
    }],
    status: { type: String, enum: ['draft', 'published'], default: 'published' },
  },
  {
    timestamps: true,
  }
);

PostSchema.index({ creatorId: 1, createdAt: -1 });

export const Post: Model<IPost> = mongoose.models.Post || mongoose.model<IPost>('Post', PostSchema);
