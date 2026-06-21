import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import dbConnect from "@/lib/mongoose";
import { Subscription } from "@/models/Subscription";
import { Message } from "@/models/Message";
import { User } from "@/models/User";

export async function GET(request: NextRequest) {
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

    const userId = user._id;
    const contactMap = new Map<string, any>();

    // 1. Get contacts based on subscriptions
    if (user.role === "creator") {
      // Creators get their supporters
      const activeSubs = await Subscription.find({ creatorId: userId, status: "active" })
        .populate("supporterId", "name email profilePicture role category");
      
      for (const sub of activeSubs) {
        const sup = sub.supporterId as any;
        if (sup) {
          contactMap.set(sup._id.toString(), {
            id: sup._id.toString(),
            name: sup.name,
            role: sup.role,
            profilePicture: sup.profilePicture || "",
            category: "Supporter",
            isSubscribed: true,
          });
        }
      }
    } else {
      // Supporters get the creators they follow
      const activeSubs = await Subscription.find({ supporterId: userId, status: "active" })
        .populate("creatorId", "name email profilePicture role category");
      
      for (const sub of activeSubs) {
        const creator = sub.creatorId as any;
        if (creator) {
          contactMap.set(creator._id.toString(), {
            id: creator._id.toString(),
            name: creator.name,
            role: creator.role,
            profilePicture: creator.profilePicture || "",
            category: creator.category || "Creator",
            isSubscribed: true,
          });
        }
      }
    }

    // 2. Get contacts from existing messages (to include past chats)
    const messages = await Message.find({
      $or: [{ senderId: userId }, { receiverId: userId }],
    });

    const uniqueMessageContactIds = new Set<string>();
    for (const msg of messages) {
      const otherId = msg.senderId.toString() === userId.toString()
        ? msg.receiverId.toString()
        : msg.senderId.toString();
      uniqueMessageContactIds.add(otherId);
    }

    // Fetch details of those contacts not in map
    for (const contactId of uniqueMessageContactIds) {
      if (!contactMap.has(contactId)) {
        const contactUser = await User.findById(contactId).select("name email profilePicture role category");
        if (contactUser) {
          contactMap.set(contactId, {
            id: contactUser._id.toString(),
            name: contactUser.name,
            role: contactUser.role,
            profilePicture: contactUser.profilePicture || "",
            category: contactUser.role === "creator" ? (contactUser.category || "Creator") : "Supporter",
            isSubscribed: false,
          });
        }
      }
    }

    // 3. For each contact, fetch the last message preview
    const contactList = [];
    const gradients = [
      "from-blue-500 to-cyan-500",
      "from-pink-500 to-rose-500",
      "from-amber-500 to-orange-500",
      "from-purple-500 to-violet-500",
      "from-emerald-500 to-teal-500",
      "from-cyan-500 to-sky-500",
    ];

    for (const contact of contactMap.values()) {
      // Find last message between user and contact
      const lastMsg = await Message.findOne({
        $or: [
          { senderId: userId, receiverId: contact.id },
          { senderId: contact.id, receiverId: userId },
        ],
      }).sort({ createdAt: -1 });

      const charCode = contact.name.charCodeAt(0) || 0;
      const gradient = gradients[charCode % gradients.length];

      contactList.push({
        ...contact,
        initial: contact.name.charAt(0).toUpperCase(),
        gradient,
        lastMessage: lastMsg ? lastMsg.text : "No messages yet",
        time: lastMsg ? formatMessageTime(lastMsg.createdAt) : "",
        lastMsgTimeRaw: lastMsg ? lastMsg.createdAt : new Date(0),
      });
    }

    // Sort contact list by last message time (most recent first)
    contactList.sort((a, b) => b.lastMsgTimeRaw.getTime() - a.lastMsgTimeRaw.getTime());

    return NextResponse.json(contactList, { status: 200 });
  } catch (error: any) {
    console.error("Failed to fetch message contacts:", error);
    return NextResponse.json(
      { error: "Failed to fetch chat list" },
      { status: 500 }
    );
  }
}

// Helper to format message date/time nicely
function formatMessageTime(date: Date): string {
  const now = new Date();
  const msgDate = new Date(date);
  
  const diffTime = Math.abs(now.getTime() - msgDate.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  if (diffDays <= 1) {
    // Today: return time e.g., 10:30 AM
    return msgDate.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  } else if (diffDays === 2) {
    return "Yesterday";
  } else {
    // Older: return month and day e.g., Jun 12
    return msgDate.toLocaleDateString([], { month: "short", day: "numeric" });
  }
}
