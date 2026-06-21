import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import mongoose from "mongoose";
import { getServerSession } from "next-auth";
import dbConnect from "@/lib/mongoose";
import { Subscription } from "@/models/Subscription";
import { Transaction } from "@/models/Transaction";
import { Tier } from "@/models/Tier";
import { User } from "@/models/User";
import { Notification } from "@/models/Notification";

export async function POST(request: NextRequest) {
  try {
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      // Additional fields for subscription creation
      creatorId,
      tierId,
      supporterId,
      amount,
      type,
    } = await request.json();

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return NextResponse.json(
        { error: "Missing payment verification fields" },
        { status: 400 }
      );
    }

    // Generate the expected signature
    const body = razorpay_order_id + "|" + razorpay_payment_id;
    const expectedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET!)
      .update(body)
      .digest("hex");

    const isAuthentic = expectedSignature === razorpay_signature;

    if (isAuthentic) {
      // Payment verified successfully — persist subscription and transaction
      if (creatorId) {
        try {
          await dbConnect();

          // Get tier price if available
          let price = amount || 0;
          if (tierId && tierId !== 'tier_default') {
            const tier = await Tier.findById(tierId);
            if (tier) price = tier.price;
          }

          // Cast to ObjectId for reliable matching
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
            throw new Error("Unable to identify supporter (invalid supporterId and no session user)");
          }
          const creatorOid = new mongoose.Types.ObjectId(creatorId);

          if (type === "donation") {
            // Create donation transaction record (one-time tip)
            await Transaction.create({
              supporterId: supporterOid,
              creatorId: creatorOid,
              amount: price,
              currency: 'INR',
              status: 'completed',
              paymentGatewayId: razorpay_payment_id,
              type: 'donation',
            });

            // Create notification
            try {
              const supporterUser = await User.findById(supporterOid);
              const supporterName = supporterUser?.name || "A supporter";
              await Notification.create({
                recipientId: creatorOid,
                senderId: supporterOid,
                type: 'donation',
                title: 'Donation received',
                message: `${supporterName} donated ₹${price} to support your work.`,
              });
            } catch (err) {
              console.error("Failed to create donation notification:", err);
            }
          } else {
            const nextBillingDate = new Date();
            nextBillingDate.setMonth(nextBillingDate.getMonth() + 1);

            // Check for existing active subscription
            const existingSub = await Subscription.findOne({
              supporterId: supporterOid,
              creatorId: creatorOid,
              status: 'active',
            });

            const subTierId = (tierId && tierId !== 'tier_default') ? tierId : undefined;

            if (existingSub) {
              // Update existing subscription
              existingSub.tierId = subTierId || existingSub.tierId;
              existingSub.price = price;
              existingSub.startDate = new Date();
              existingSub.nextBillingDate = nextBillingDate;
              existingSub.status = 'active';
              await existingSub.save();
            } else {
              // Create new subscription
              await Subscription.create({
                supporterId: supporterOid,
                creatorId: creatorOid,
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
              supporterId: supporterOid,
              creatorId: creatorOid,
              tierId: tierId !== 'tier_default' ? tierId : undefined,
              amount: price,
              currency: 'INR',
              status: 'completed',
              paymentGatewayId: razorpay_payment_id,
              type: 'subscription',
            });

            // Create notification
            try {
              const supporterUser = await User.findById(supporterOid);
              const supporterName = supporterUser?.name || "A supporter";
              let tierName = "Membership";
              if (tierId && tierId !== 'tier_default') {
                const tier = await Tier.findById(tierId);
                if (tier) tierName = tier.name;
              }
              await Notification.create({
                recipientId: creatorOid,
                senderId: supporterOid,
                type: 'subscriber',
                title: 'New subscriber!',
                message: `${supporterName} subscribed to your ${tierName} tier.`,
              });
            } catch (err) {
              console.error("Failed to create subscription notification:", err);
            }
          }
        } catch (dbError) {
          console.error("DB operations after payment failed:", dbError);
          // Don't fail the whole response — payment was already verified
        }
      }

      return NextResponse.json({
        verified: true,
        paymentId: razorpay_payment_id,
        orderId: razorpay_order_id,
      });
    } else {
      return NextResponse.json(
        { verified: false, error: "Payment signature mismatch" },
        { status: 400 }
      );
    }
  } catch (error: any) {
    console.error("Payment verification failed:", error);
    return NextResponse.json(
      { error: error.message || "Verification failed" },
      { status: 500 }
    );
  }
}
