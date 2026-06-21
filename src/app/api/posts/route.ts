import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import dbConnect from '@/lib/mongoose';
import { Post } from '@/models/Post';
import { User } from '@/models/User';

// POST /api/posts — Create a new post (creator only)
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();

    // Get the creator user
    const user = await User.findOne({ email: session.user.email });
    if (!user || user.role !== 'creator') {
      return NextResponse.json({ error: 'Only creators can create posts' }, { status: 403 });
    }

    const body = await request.json();
    const { title, content, mediaUrl, mediaType, isPublic, requiredTierIds, status } = body;

    if (!title?.trim() || !content?.trim()) {
      return NextResponse.json({ error: 'Title and content are required' }, { status: 400 });
    }

    const post = await Post.create({
      creatorId: user._id,
      title: title.trim(),
      content: content.trim(),
      mediaUrl: mediaUrl || undefined,
      mediaType: mediaType || 'none',
      isPublic: isPublic !== false,
      requiredTierIds: requiredTierIds || [],
      status: status === 'draft' ? 'draft' : 'published',
    });

    return NextResponse.json({
      id: post._id.toString(),
      title: post.title,
      content: post.content,
      mediaUrl: post.mediaUrl,
      mediaType: post.mediaType,
      isPublic: post.isPublic,
      status: post.status,
      createdAt: post.createdAt,
    }, { status: 201 });
  } catch (error: any) {
    console.error('Create post failed:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create post' },
      { status: 500 }
    );
  }
}
