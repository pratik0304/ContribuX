import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import dbConnect from '@/lib/mongoose';
import { Post } from '@/models/Post';
import { User } from '@/models/User';

// DELETE /api/posts/[id] — Delete a post (creator only, must own the post)
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession();
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    await dbConnect();

    const user = await User.findOne({ email: session.user.email });
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const post = await Post.findById(id);
    if (!post) {
      return NextResponse.json({ error: 'Post not found' }, { status: 404 });
    }

    if (post.creatorId.toString() !== user._id.toString()) {
      return NextResponse.json({ error: 'Not authorized to delete this post' }, { status: 403 });
    }

    await Post.findByIdAndDelete(id);

    return NextResponse.json({ message: 'Post deleted successfully' });
  } catch (error: any) {
    console.error('Delete post failed:', error);
    return NextResponse.json(
      { error: 'Failed to delete post' },
      { status: 500 }
    );
  }
}

// PUT /api/posts/[id] — Update a post (creator only, must own the post)
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession();
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    await dbConnect();

    const user = await User.findOne({ email: session.user.email });
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const post = await Post.findById(id);
    if (!post) {
      return NextResponse.json({ error: 'Post not found' }, { status: 404 });
    }

    if (post.creatorId.toString() !== user._id.toString()) {
      return NextResponse.json({ error: 'Not authorized to update this post' }, { status: 403 });
    }

    const body = await request.json();
    const { title, content, mediaUrl, mediaType, isPublic, requiredTierIds, status } = body;

    if (!title?.trim() || !content?.trim()) {
      return NextResponse.json({ error: 'Title and content are required' }, { status: 400 });
    }

    post.title = title.trim();
    post.content = content.trim();
    post.mediaUrl = mediaUrl || undefined;
    post.mediaType = mediaType || 'none';
    post.isPublic = isPublic !== false;
    post.requiredTierIds = requiredTierIds || [];
    if (status) {
      post.status = status === 'draft' ? 'draft' : 'published';
    }

    await post.save();

    return NextResponse.json({
      id: post._id.toString(),
      title: post.title,
      content: post.content,
      mediaUrl: post.mediaUrl,
      mediaType: post.mediaType,
      isPublic: post.isPublic,
      requiredTierIds: post.requiredTierIds,
      status: post.status,
      createdAt: post.createdAt,
      updatedAt: post.updatedAt,
    });
  } catch (error: any) {
    console.error('Update post failed:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to update post' },
      { status: 500 }
    );
  }
}
