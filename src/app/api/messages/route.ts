import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import dbConnect from "@/lib/mongoose";
import { Message } from "@/models/Message";
import { User } from "@/models/User";
import { Subscription } from "@/models/Subscription";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const contactId = request.nextUrl.searchParams.get("contactId");
    if (!contactId) {
      return NextResponse.json({ error: "contactId is required" }, { status: 400 });
    }

    await dbConnect();
    const user = await User.findOne({ email: session.user.email });
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const userId = user._id;

    // Fetch conversation logs
    const messages = await Message.find({
      $or: [
        { senderId: userId, receiverId: contactId },
        { senderId: contactId, receiverId: userId },
      ],
    }).sort({ createdAt: 1 });

    const formattedMessages = messages.map((msg) => ({
      id: msg._id.toString(),
      senderId: msg.senderId.toString(),
      receiverId: msg.receiverId.toString(),
      isMe: msg.senderId.toString() === userId.toString(),
      text: msg.text,
      time: msg.createdAt.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    }));

    return NextResponse.json(formattedMessages, { status: 200 });
  } catch (error: any) {
    console.error("Failed to fetch messages:", error);
    return NextResponse.json(
      { error: "Failed to fetch messages" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await dbConnect();
    const user = await User.findOne({ email: session.user.email });
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const body = await request.json();
    const { receiverId, text } = body;

    if (!receiverId || !text) {
      return NextResponse.json(
        { error: "receiverId and text are required" },
        { status: 400 }
      );
    }

    // Verify receiver exists
    const receiver = await User.findById(receiverId);
    if (!receiver) {
      return NextResponse.json({ error: "Receiver not found" }, { status: 404 });
    }

    // Verify subscription status: only active subscribers can chat
    if (user.role === "supporter" && receiver.role === "creator") {
      const activeSub = await Subscription.findOne({
        supporterId: user._id,
        creatorId: receiver._id,
        status: "active",
      });
      if (!activeSub) {
        return NextResponse.json(
          { error: "You must be subscribed to this creator to message them" },
          { status: 403 }
        );
      }
    } else if (user.role === "creator" && receiver.role === "supporter") {
      const activeSub = await Subscription.findOne({
        supporterId: receiver._id,
        creatorId: user._id,
        status: "active",
      });
      if (!activeSub) {
        return NextResponse.json(
          { error: "You can only message supporters who are subscribed to you" },
          { status: 403 }
        );
      }
    }

    // Create the message
    const newMessage = await Message.create({
      senderId: user._id,
      receiverId,
      text,
    });

    return NextResponse.json({
      id: newMessage._id.toString(),
      senderId: newMessage.senderId.toString(),
      receiverId: newMessage.receiverId.toString(),
      isMe: true,
      text: newMessage.text,
      time: newMessage.createdAt.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    }, { status: 201 });
  } catch (error: any) {
    console.error("Failed to send message:", error);
    return NextResponse.json(
      { error: "Failed to send message" },
      { status: 500 }
    );
  }
}
