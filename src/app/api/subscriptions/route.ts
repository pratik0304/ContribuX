import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import mongoose from 'mongoose';
import dbConnect from '@/lib/mongoose';
import { Subscription } from '@/models/Subscription';
import { Transaction } from '@/models/Transaction';
import { Tier } from '@/models/Tier';
import { User } from '@/models/User';

// POST /api/subscriptions — Create a subscription after successful payment
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();

    const supporter = await User.findOne({ email: session.user.email });
    if (!supporter) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const body = await request.json();
    const { creatorId, tierId, paymentId, amount } = body;

    if (!creatorId || !tierId || !paymentId) {
      return NextResponse.json(
        { error: 'creatorId, tierId, and paymentId are required' },
        { status: 400 }
      );
    }

    // Verify creator exists
    const creator = await User.findById(creatorId);
    if (!creator || creator.role !== 'creator') {
      return NextResponse.json({ error: 'Creator not found' }, { status: 404 });
    }

    // Get tier info
    const tier = await Tier.findById(tierId);
    const price = tier ? tier.price : (amount || 0);

    // Check if already subscribed — if so, reactivate
    const existingSub = await Subscription.findOne({
      supporterId: supporter._id,
      creatorId,
      status: 'active',
    });

    const nextBillingDate = new Date();
    nextBillingDate.setMonth(nextBillingDate.getMonth() + 1);

    const subTierId = (tierId && tierId !== 'tier_default') ? tierId : undefined;

    let subscription;
    if (existingSub) {
      // Update existing subscription to new tier
      existingSub.tierId = subTierId || existingSub.tierId;
      existingSub.price = price;
      existingSub.startDate = new Date();
      existingSub.nextBillingDate = nextBillingDate;
      existingSub.status = 'active';
      await existingSub.save();
      subscription = existingSub;
    } else {
      // Create new subscription
      subscription = await Subscription.create({
        supporterId: supporter._id,
        creatorId,
        tierId: subTierId,
        status: 'active',
        startDate: new Date(),
        nextBillingDate,
        price,
        currency: 'INR',
      });
    }

    // Create transaction record
    await Transaction.create({
      supporterId: supporter._id,
      creatorId,
      tierId: subTierId,
      amount: price,
      currency: 'INR',
      status: 'completed',
      paymentGatewayId: paymentId,
      type: 'subscription',
    });

    return NextResponse.json({
      id: subscription._id.toString(),
      status: subscription.status,
      message: 'Subscription created successfully',
    }, { status: 201 });
  } catch (error: any) {
    console.error('Create subscription failed:', error);
    return NextResponse.json(
      { error: 'Failed to create subscription' },
      { status: 500 }
    );
  }
}

// GET /api/subscriptions?supporterId=xxx OR ?creatorId=xxx
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();

    const supporterId = request.nextUrl.searchParams.get('supporterId');
    const creatorId = request.nextUrl.searchParams.get('creatorId');

    let query: any = {};
    if (supporterId) {
      if (mongoose.Types.ObjectId.isValid(supporterId)) {
        query.supporterId = new mongoose.Types.ObjectId(supporterId);
      } else {
        const dbUser = await User.findOne({ email: session.user.email });
        if (dbUser) {
          query.supporterId = dbUser._id;
        }
      }
    }
    if (creatorId && mongoose.Types.ObjectId.isValid(creatorId)) {
      query.creatorId = new mongoose.Types.ObjectId(creatorId);
    }

    const subscriptions = await Subscription.find(query)
      .populate('creatorId', 'name category')
      .populate('tierId', 'name price')
      .populate('supporterId', 'name email')
      .sort({ createdAt: -1 });

    const formatted = subscriptions.map((sub) => ({
      id: sub._id.toString(),
      supporterId: sub.supporterId?._id?.toString() || sub.supporterId?.toString(),
      supporterName: (sub.supporterId as any)?.name || 'Unknown',
      creatorId: sub.creatorId?._id?.toString() || sub.creatorId?.toString(),
      creatorName: (sub.creatorId as any)?.name || 'Unknown',
      creatorCategory: (sub.creatorId as any)?.category || 'General',
      tierId: sub.tierId?._id?.toString() || sub.tierId?.toString() || 'tier_default',
      tierName: (sub.tierId as any)?.name || 'Supporter',
      price: sub.price,
      status: sub.status,
      startDate: sub.startDate,
      nextBillingDate: sub.nextBillingDate,
    }));

    return NextResponse.json(formatted);
  } catch (error: any) {
    console.error('Fetch subscriptions failed:', error);
    return NextResponse.json(
      { error: 'Failed to fetch subscriptions' },
      { status: 500 }
    );
  }
}
