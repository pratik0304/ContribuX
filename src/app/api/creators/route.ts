import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/mongoose";
import { User } from "@/models/User";
import { Subscription } from "@/models/Subscription";
import { Post } from "@/models/Post";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search") || "";
    const category = searchParams.get("category") || "All";

    await dbConnect();

    // Fetch filtered creators and select fields that are safe for the public
    let query: any = { role: "creator" };
    if (category !== "All") {
      query.category = category;
    }
    if (search.trim()) {
      query.$or = [
        { name: { $regex: search.trim(), $options: "i" } },
        { bio: { $regex: search.trim(), $options: "i" } },
        { category: { $regex: search.trim(), $options: "i" } },
      ];
    }

    const creators = await User.find(query)
      .select("name bio category profilePicture coverPicture createdAt")
      .sort({ createdAt: -1 });

    // Get subscriber counts for all creators in one query
    const subscriberCounts = await Subscription.aggregate([
      { $match: { status: "active", creatorId: { $ne: null } } },
      { $group: { _id: "$creatorId", count: { $sum: 1 } } },
    ]);

    const subscriberMap = new Map<string, number>();
    for (const item of subscriberCounts) {
      if (item._id) {
        subscriberMap.set(item._id.toString(), item.count);
      }
    }

    // Map to format that the frontend expects
    const formattedCreators = creators.map((creator) => {
      // Create a deterministic gradient based on creator name
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
      
      return {
        id: creator._id.toString(),
        name: creator.name,
        bio: creator.bio || "Creator on ContribuX",
        category: creator.category || "General",
        supporters: subscriberMap.get(creator._id.toString()) || 0,
        initial: creator.name.charAt(0).toUpperCase(),
        gradient,
        profilePicture: creator.profilePicture || "",
      };
    });

    return NextResponse.json(formattedCreators, { status: 200 });
  } catch (error) {
    console.error("Failed to fetch creators:", error);
    return NextResponse.json(
      { message: "Failed to fetch creators." },
      { status: 500 }
    );
  }
}
