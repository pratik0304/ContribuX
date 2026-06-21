import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import dbConnect from "@/lib/mongoose";
import { Post } from "@/models/Post";
import { User } from "@/models/User";
import mongoose from "mongoose";
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

    const userId = user._id as mongoose.Types.ObjectId;
    
    // Initialize likes array if it doesn't exist
    if (!post.likes) {
      post.likes = [];
    }

    const likedIndex = post.likes.findIndex((id) => id.toString() === userId.toString());
    const isLiked = likedIndex > -1;

    if (isLiked) {
      // Unlike
      post.likes.splice(likedIndex, 1);
    } else {
      // Like
      post.likes.push(userId);

      // Create notification for creator if the user who liked is not the creator
      if (post.creatorId.toString() !== userId.toString()) {
        try {
          await Notification.create({
            recipientId: post.creatorId,
            senderId: userId,
            type: 'like',
            title: 'Post liked',
            message: `${user.name} liked your post "${post.title}".`,
          });
        } catch (err) {
          console.error("Failed to create like notification:", err);
        }
      }
    }

    await post.save();

    return NextResponse.json({
      liked: !isLiked,
      likesCount: post.likes.length,
      likes: post.likes.map(id => id.toString()),
    }, { status: 200 });
  } catch (error: any) {
    console.error("Failed to toggle post like:", error);
    return NextResponse.json(
      { error: "Failed to toggle like" },
      { status: 500 }
    );
  }
}
