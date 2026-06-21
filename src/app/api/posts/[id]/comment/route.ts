import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import dbConnect from "@/lib/mongoose";
import { Post } from "@/models/Post";
import { User } from "@/models/User";
import { Notification } from "@/models/Notification";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession();
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: postId } = await params;

    await dbConnect();
    const user = await User.findOne({ email: session.user.email });
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const post = await Post.findById(postId);
    if (!post) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 });
    }

    const body = await request.json();
    const { text } = body;

    if (!text || !text.trim()) {
      return NextResponse.json({ error: "Comment text is required" }, { status: 400 });
    }

    // Initialize comments array if it doesn't exist
    if (!post.comments) {
      post.comments = [];
    }

    const newComment = {
      userId: user._id,
      userName: user.name,
      text: text.trim(),
      createdAt: new Date(),
    };

    post.comments.push(newComment as any);
    await post.save();

    // Get the newly created comment (the last one)
    const savedComment = post.comments[post.comments.length - 1];

    // Create notification for creator if the user commenting is not the creator
    if (post.creatorId.toString() !== user._id.toString()) {
      try {
        await Notification.create({
          recipientId: post.creatorId,
          senderId: user._id,
          type: 'comment',
          title: 'New comment',
          message: `${user.name} commented on your post "${post.title}": "${text.trim().substring(0, 30)}${text.trim().length > 30 ? '...' : ''}"`,
        });
      } catch (err) {
        console.error("Failed to create comment notification:", err);
      }
    }

    return NextResponse.json({
      message: "Comment added successfully",
      comment: {
        id: savedComment._id?.toString(),
        userId: savedComment.userId.toString(),
        userName: savedComment.userName,
        text: savedComment.text,
        createdAt: savedComment.createdAt,
      },
      commentsCount: post.comments.length,
    }, { status: 201 });
  } catch (error: any) {
    console.error("Failed to add post comment:", error);
    return NextResponse.json(
      { error: "Failed to add comment" },
      { status: 500 }
    );
  }
}
