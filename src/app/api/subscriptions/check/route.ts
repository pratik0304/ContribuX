import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import { getServerSession } from "next-auth";
import dbConnect from '@/lib/mongoose';
import { Subscription } from '@/models/Subscription';
import { User } from '@/models/User';

// GET /api/subscriptions/check?creatorId=xxx&supporterId=xxx
export async function GET(request: NextRequest) {
  try {
    const creatorId = request.nextUrl.searchParams.get('creatorId');
    const supporterId = request.nextUrl.searchParams.get('supporterId');

    if (!creatorId) {
      return NextResponse.json(
        { error: 'creatorId is required' },
        { status: 400 }
      );
    }

    // Validate that creator ID is a valid ObjectId
    if (!mongoose.Types.ObjectId.isValid(creatorId)) {
      return NextResponse.json({ subscribed: false });
    }

    await dbConnect();

    // Resolve supporter database ObjectId
    let supporterOid: mongoose.Types.ObjectId | null = null;
    if (supporterId && mongoose.Types.ObjectId.isValid(supporterId)) {
      supporterOid = new mongoose.Types.ObjectId(supporterId);
    } else {
      const session = await getServerSession();
      if (session?.user?.email) {
        const dbUser = await User.findOne({ email: session.user.email });
        if (dbUser) supporterOid = dbUser._id;
      }
    }

    if (!supporterOid) {
      return NextResponse.json({ subscribed: false });
    }

    const subscription = await Subscription.findOne({
      supporterId: supporterOid,
      creatorId: new mongoose.Types.ObjectId(creatorId),
      status: 'active',
    }).populate('tierId', 'name price');

    if (subscription) {
      return NextResponse.json({
        subscribed: true,
        tierId: subscription.tierId?._id?.toString() || subscription.tierId?.toString() || 'tier_default',
        tierName: (subscription.tierId as any)?.name || 'Tier',
        price: subscription.price,
      });
    }

    return NextResponse.json({ subscribed: false });
  } catch (error: any) {
    console.error('Check subscription failed:', error);
    return NextResponse.json(
      { error: 'Failed to check subscription' },
      { status: 500 }
    );
  }
}
