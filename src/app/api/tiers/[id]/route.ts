import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import dbConnect from '@/lib/mongoose';
import { Tier } from '@/models/Tier';
import { User } from '@/models/User';

// PUT /api/tiers/[id] — Update a tier
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession();
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    await dbConnect();

    const user = await User.findOne({ email: session.user.email });
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const tier = await Tier.findById(id);
    if (!tier) {
      return NextResponse.json({ error: 'Tier not found' }, { status: 404 });
    }

    if (tier.creatorId.toString() !== user._id.toString()) {
      return NextResponse.json({ error: 'Not authorized' }, { status: 403 });
    }

    const body = await request.json();
    const { name, description, price, benefits } = body;

    if (name) tier.name = name.trim();
    if (description !== undefined) tier.description = description.trim();
    if (price && price > 0) tier.price = Number(price);
    if (benefits) tier.benefits = benefits;

    await tier.save();

    return NextResponse.json({
      id: tier._id.toString(),
      name: tier.name,
      description: tier.description,
      price: tier.price,
      benefits: tier.benefits,
    });
  } catch (error: any) {
    console.error('Update tier failed:', error);
    return NextResponse.json({ error: 'Failed to update tier' }, { status: 500 });
  }
}

// DELETE /api/tiers/[id] — Delete a tier
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession();
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    await dbConnect();

    const user = await User.findOne({ email: session.user.email });
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const tier = await Tier.findById(id);
    if (!tier) {
      return NextResponse.json({ error: 'Tier not found' }, { status: 404 });
    }

    if (tier.creatorId.toString() !== user._id.toString()) {
      return NextResponse.json({ error: 'Not authorized' }, { status: 403 });
    }

    await Tier.findByIdAndDelete(id);

    return NextResponse.json({ message: 'Tier deleted successfully' });
  } catch (error: any) {
    console.error('Delete tier failed:', error);
    return NextResponse.json({ error: 'Failed to delete tier' }, { status: 500 });
  }
}
