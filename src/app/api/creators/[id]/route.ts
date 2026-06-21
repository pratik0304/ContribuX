import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongoose";
import { User } from "@/models/User";
import { Subscription } from "@/models/Subscription";
import { Post } from "@/models/Post";
import { Tier } from "@/models/Tier";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await dbConnect();

    const { id } = await params;
    const creator = await User.findById(id).select("-password");

    if (!creator || creator.role !== "creator") {
      return NextResponse.json(
        { message: "Creator not found" },
        { status: 404 }
      );
    }

    // Default formatting
    const gradients = [
      "from-pink-500 to-rose-500",
      "from-indigo-500 to-blue-500",
      "from-purple-500 to-violet-500",
      "from-emerald-500 to-teal-500",
      "from-orange-500 to-amber-500",
      "from-cyan-500 to-sky-500",
    ];
    
    const charCode = creator.name.charCodeAt(0) || 0;
    const gradient = gradients[charCode % gradients.length];

    // Get real subscriber count
    const subscriberCount = await Subscription.countDocuments({
      creatorId: id,
      status: "active",
    });

    // Get real post count
    const postCount = await Post.countDocuments({ creatorId: id, status: { $ne: "draft" } });

    // Get real tiers from DB
    const dbTiers = await Tier.find({ creatorId: id }).sort({ price: 1 });
    
    let tiers;
    if (dbTiers.length > 0) {
      tiers = dbTiers.map((t) => ({
        id: t._id.toString(),
        name: t.name,
        price: t.price,
        description: t.description,
        benefits: t.benefits,
      }));
    } else {
      // Provide a default tier if none exist so subscriptions still work
      tiers = [{
        id: "tier_default",
        name: "Supporter",
        price: 99,
        description: "Support the creator's journey",
        benefits: [
          "Support the creator's journey",
          "Get early access to future updates",
          "Supporter badge on profile",
        ],
      }];
    }

    // Get real posts from DB
    const dbPosts = await Post.find({ creatorId: id, status: { $ne: "draft" } })
      .sort({ createdAt: -1 })
      .populate("requiredTierIds", "name price");

    const posts_list = dbPosts.map((post) => {
      const tierNames = post.requiredTierIds?.map((t: any) => t.name || "Tier") || [];
      const fallbackTier = tiers[0] || { id: "tier_default", name: "Supporter", price: 99 };
      return {
        id: post._id.toString(),
        title: post.title,
        content: post.content,
        mediaUrl: post.mediaUrl || null,
        mediaType: post.mediaType || "none",
        isPublic: post.isPublic,
        tier: post.isPublic ? null : (tierNames[0] || fallbackTier.name),
        tierId: post.isPublic ? null : (post.requiredTierIds?.[0]?._id?.toString() || post.requiredTierIds?.[0]?.toString() || fallbackTier.id),
        date: post.createdAt ? post.createdAt.toISOString().split("T")[0] : new Date().toISOString().split("T")[0],
        views: (post.likes?.length || 0) * 5 + 12,
        likes: post.likes?.map((id) => id.toString()) || [],
        likesCount: post.likes?.length || 0,
        comments: post.comments?.map((c) => ({
          id: c._id?.toString(),
          userId: c.userId.toString(),
          userName: c.userName,
          text: c.text,
          date: c.createdAt ? c.createdAt.toISOString().split("T")[0] : new Date().toISOString().split("T")[0],
        })) || [],
      };
    });

    const formattedCreator = {
      id: creator._id.toString(),
      name: creator.name,
      bio: creator.bio || "Hello! I am a creator on ContribuX.",
      category: creator.category || "General",
      supporters: subscriberCount,
      posts: postCount,
      initial: creator.name.charAt(0).toUpperCase(),
      gradient,
      socialLinks: creator.socialLinks,
      profilePicture: creator.profilePicture || "",
      coverPicture: creator.coverPicture || "",
      tiers,
      posts_list,
    };

    return NextResponse.json(formattedCreator, { status: 200 });
  } catch (error) {
    console.error("Failed to fetch creator profile:", error);
    return NextResponse.json(
      { message: "Failed to fetch creator profile." },
      { status: 500 }
    );
  }
}
