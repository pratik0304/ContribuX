import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongoose';
import { Post } from '@/models/Post';
import { User } from '@/models/User';

// GET /api/posts/creator/[creatorId] — Fetch all posts by a creator
export async function GET(
  request: Request,
  { params }: { params: Promise<{ creatorId: string }> }
) {
  try {
    const { creatorId } = await params;

    await dbConnect();

    // Verify the creator exists
    const creator = await User.findById(creatorId);
    if (!creator || creator.role !== 'creator') {
      return NextResponse.json({ error: 'Creator not found' }, { status: 404 });
    }

    const posts = await Post.find({ creatorId })
      .sort({ createdAt: -1 })
      .populate('requiredTierIds', 'name price');

    const formattedPosts = posts.map((post) => ({
      id: post._id.toString(),
      title: post.title,
      content: post.content,
      mediaUrl: post.mediaUrl || null,
      mediaType: post.mediaType || 'none',
      isPublic: post.isPublic,
      requiredTierIds: post.requiredTierIds?.map((t: any) => t._id?.toString?.() || t.toString()) || [],
      requiredTiers: post.requiredTierIds?.map((t: any) => ({
        id: t._id?.toString?.() || t.toString(),
        name: t.name || 'Tier',
        price: t.price || 0,
      })) || [],
      createdAt: post.createdAt,
      date: post.createdAt ? post.createdAt.toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
    }));

    return NextResponse.json(formattedPosts);
  } catch (error: any) {
    console.error('Fetch posts failed:', error);
    return NextResponse.json(
      { error: 'Failed to fetch posts' },
      { status: 500 }
    );
  }
}
