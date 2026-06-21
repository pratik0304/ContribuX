import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import dbConnect from "@/lib/mongoose";
import { Payout } from "@/models/Payout";
import { Transaction } from "@/models/Transaction";
import { User } from "@/models/User";
import { Notification } from "@/models/Notification";

// GET /api/payouts — Fetch past payouts for the logged-in creator
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await dbConnect();

    const user = await User.findOne({ email: session.user.email });
    if (!user || user.role !== "creator") {
      return NextResponse.json({ error: "Only creators can view payouts" }, { status: 403 });
    }

    const payouts = await Payout.find({ creatorId: user._id })
      .sort({ createdAt: -1 });

    const formatted = payouts.map((p) => ({
      id: p._id.toString(),
      txnId: `PAY${p._id.toString().slice(-6).toUpperCase()}`,
      amount: p.amount,
      status: p.status,
      bankName: p.bankName,
      accountNumber: `******${p.accountNumber.slice(-4)}`,
      date: p.createdAt ? p.createdAt.toISOString().split("T")[0] : new Date().toISOString().split("T")[0],
    }));

    return NextResponse.json(formatted, { status: 200 });
  } catch (error: any) {
    console.error("Failed to fetch payouts:", error);
    return NextResponse.json(
      { error: "Failed to fetch payouts" },
      { status: 500 }
    );
  }
}

// POST /api/payouts — Request a payout
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await dbConnect();

    const user = await User.findOne({ email: session.user.email });
    if (!user || user.role !== "creator") {
      return NextResponse.json({ error: "Only creators can request payouts" }, { status: 403 });
    }

    if (!user.payoutSetup || !user.payoutDetails?.accountNumber || !user.payoutDetails?.bankName) {
      return NextResponse.json(
        { error: "Please setup bank details in settings before requesting payout" },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { amount } = body;

    const withdrawAmount = Number(amount);
    if (isNaN(withdrawAmount) || withdrawAmount <= 0) {
      return NextResponse.json({ error: "Invalid payout amount" }, { status: 400 });
    }

    // Calculate dynamic available balance
    const incomeTransactions = await Transaction.find({
      creatorId: user._id,
      status: "completed",
    });
    const totalEarnings = incomeTransactions.reduce((sum, t) => sum + t.amount, 0);

    const pastPayouts = await Payout.find({
      creatorId: user._id,
      status: { $in: ["completed", "pending"] },
    });
    const totalPayouts = pastPayouts.reduce((sum, p) => sum + p.amount, 0);

    const availableAmount = totalEarnings - totalPayouts;

    if (withdrawAmount > availableAmount) {
      return NextResponse.json({ error: "Insufficient available balance" }, { status: 400 });
    }

    // Create payout record
    const payout = await Payout.create({
      creatorId: user._id,
      amount: withdrawAmount,
      status: "pending",
      bankName: user.payoutDetails.bankName,
      accountNumber: user.payoutDetails.accountNumber,
    });

    // Create notification alert
    try {
      await Notification.create({
        recipientId: user._id,
        type: "payout",
        title: "Payout Requested",
        message: `Your withdrawal request of ₹${withdrawAmount} has been received and is processing.`,
      });
    } catch (notifErr) {
      console.error("Failed to create payout notification:", notifErr);
    }

    return NextResponse.json({
      id: payout._id.toString(),
      txnId: `PAY${payout._id.toString().slice(-6).toUpperCase()}`,
      amount: payout.amount,
      status: payout.status,
      date: payout.createdAt ? payout.createdAt.toISOString().split("T")[0] : new Date().toISOString().split("T")[0],
    }, { status: 201 });
  } catch (error: any) {
    console.error("Failed to request payout:", error);
    return NextResponse.json(
      { error: "Failed to request payout" },
      { status: 500 }
    );
  }
}
