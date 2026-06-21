import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import dbConnect from '@/lib/mongoose';
import { Tier } from '@/models/Tier';
import { User } from '@/models/User';

// GET /api/tiers?creatorId=xxx — List tiers for a creator
export async function GET(request: NextRequest) {
  try {
    const creatorId = request.nextUrl.searchParams.get('creatorId');
    if (!creatorId) {
      return NextResponse.json({ error: 'creatorId is required' }, { status: 400 });
    }

    await dbConnect();

    const tiers = await Tier.find({ creatorId }).sort({ price: 1 });

    const formattedTiers = tiers.map((tier) => ({
      id: tier._id.toString(),
      name: tier.name,
      description: tier.description,
      price: tier.price,
      benefits: tier.benefits,
    }));

    return NextResponse.json(formattedTiers);
  } catch (error: any) {
    console.error('Fetch tiers failed:', error);
    return NextResponse.json({ error: 'Failed to fetch tiers' }, { status: 500 });
  }
}

// POST /api/tiers — Create a tier (creator only)
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();

    const user = await User.findOne({ email: session.user.email });
    if (!user || user.role !== 'creator') {
      return NextResponse.json({ error: 'Only creators can create tiers' }, { status: 403 });
    }

    const body = await request.json();
    const { name, description, price, benefits } = body;

    if (!name?.trim() || !price || price <= 0) {
      return NextResponse.json({ error: 'Name and a valid price are required' }, { status: 400 });
    }

    const tier = await Tier.create({
      creatorId: user._id,
      name: name.trim(),
      description: description?.trim() || '',
      price: Number(price),
      benefits: benefits || [],
    });

    return NextResponse.json({
      id: tier._id.toString(),
      name: tier.name,
      description: tier.description,
      price: tier.price,
      benefits: tier.benefits,
    }, { status: 201 });
  } catch (error: any) {
    console.error('Create tier failed:', error);
    return NextResponse.json({ error: 'Failed to create tier' }, { status: 500 });
  }
}
