import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import dbConnect from "@/lib/mongoose";
import { Subscription } from "@/models/Subscription";
import { User } from "@/models/User";

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession();
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    await dbConnect();
    const user = await User.findOne({ email: session.user.email });
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const subscription = await Subscription.findById(id);
    if (!subscription) {
      return NextResponse.json({ error: "Subscription not found" }, { status: 404 });
    }

    // Ensure the logged in user is the owner (supporter) of the subscription
    if (subscription.supporterId.toString() !== user._id.toString()) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const { status } = body;

    if (status === "cancelled" || status === "active") {
      subscription.status = status;
      if (status === "active") {
        const nextBillingDate = new Date();
        nextBillingDate.setMonth(nextBillingDate.getMonth() + 1);
        subscription.nextBillingDate = nextBillingDate;
      }
      await subscription.save();
    } else {
      return NextResponse.json({ error: "Invalid status update" }, { status: 400 });
    }

    return NextResponse.json({
      message: "Subscription status updated successfully",
      subscription,
    }, { status: 200 });
  } catch (error: any) {
    console.error("Failed to update subscription:", error);
    return NextResponse.json(
      { error: "Failed to update subscription" },
      { status: 500 }
    );
  }
}
