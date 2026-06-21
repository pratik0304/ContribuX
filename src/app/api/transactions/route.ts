import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import dbConnect from "@/lib/mongoose";
import { Transaction } from "@/models/Transaction";
import { User } from "@/models/User";
import { Tier } from "@/models/Tier";

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

    let query: any = {};
    if (user.role === "creator") {
      query.creatorId = user._id;
    } else {
      query.supporterId = user._id;
    }

    const transactions = await Transaction.find(query)
      .populate("supporterId", "name email profilePicture")
      .populate("creatorId", "name category profilePicture")
      .populate("tierId", "name price")
      .sort({ createdAt: -1 });

    const formatted = transactions.map((txn) => {
      const supporterName = (txn.supporterId as any)?.name || "Unknown Supporter";
      const creatorName = (txn.creatorId as any)?.name || "Unknown Creator";
      const tierName = (txn.tierId as any)?.name || (txn.type === "donation" ? "Donation" : "Subscription");
      
      return {
        id: txn._id.toString(),
        txnId: `TXN${txn._id.toString().slice(-6).toUpperCase()}`,
        supporter: supporterName,
        creator: creatorName,
        amount: txn.amount,
        tier: tierName,
        type: txn.type,
        date: txn.createdAt ? txn.createdAt.toISOString().split("T")[0] : new Date().toISOString().split("T")[0],
        status: txn.status,
        paymentGatewayId: txn.paymentGatewayId,
      };
    });

    return NextResponse.json(formatted, { status: 200 });
  } catch (error: any) {
    console.error("Failed to fetch transactions:", error);
    return NextResponse.json(
      { error: "Failed to fetch transactions" },
      { status: 500 }
    );
  }
}
