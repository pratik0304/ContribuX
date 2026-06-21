import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import bcrypt from "bcryptjs";
import dbConnect from "@/lib/mongoose";
import { User } from "@/models/User";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await dbConnect();
    
    // Find logged-in user to verify admin role
    const adminUser = await User.findOne({ email: session.user.email });
    if (!adminUser || adminUser.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Fetch all users
    const users = await User.find({}).select("-password").sort({ createdAt: -1 });

    const formattedUsers = users.map((u) => ({
      id: u._id.toString(),
      name: u.name,
      email: u.email,
      role: u.role,
      status: u.status || "active",
      joined: u.createdAt ? u.createdAt.toISOString().split("T")[0] : new Date().toISOString().split("T")[0],
      bio: u.bio || "",
      profilePicture: u.profilePicture || "",
      coverPicture: u.coverPicture || "",
      category: u.category || "General",
      socialLinks: {
        twitter: u.socialLinks?.twitter || "",
        instagram: u.socialLinks?.instagram || "",
        youtube: u.socialLinks?.youtube || "",
        website: u.socialLinks?.website || "",
      },
      payoutSetup: u.payoutSetup || false,
      payoutDetails: {
        bankName: u.payoutDetails?.bankName || "",
        accountHolderName: u.payoutDetails?.accountHolderName || "",
        accountNumber: u.payoutDetails?.accountNumber || "",
        ifscCode: u.payoutDetails?.ifscCode || "",
        upiId: u.payoutDetails?.upiId || "",
      },
    }));

    return NextResponse.json(formattedUsers, { status: 200 });
  } catch (error: any) {
    console.error("Failed to fetch users for admin:", error);
    return NextResponse.json(
      { error: "Failed to fetch users" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await dbConnect();
    
    // Find logged-in user to verify admin role
    const adminUser = await User.findOne({ email: session.user.email });
    if (!adminUser || adminUser.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const { name, email, password, role, status } = body;

    if (!name || !email || !password) {
      return NextResponse.json(
        { error: "Name, email, and password are required" },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: "Password must be at least 6 characters" },
        { status: 400 }
      );
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return NextResponse.json(
        { error: "Email is already in use" },
        { status: 400 }
      );
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = await User.create({
      name,
      email,
      password: hashedPassword,
      role: role || "supporter",
      status: status || "active",
    });

    return NextResponse.json({
      message: "User created successfully",
      user: {
        id: newUser._id.toString(),
        name: newUser.name,
        email: newUser.email,
        role: newUser.role,
        status: newUser.status,
      }
    }, { status: 201 });
  } catch (error: any) {
    console.error("Failed to create user by admin:", error);
    return NextResponse.json(
      { error: "Failed to create user" },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await dbConnect();
    
    // Find logged-in user to verify admin role
    const adminUser = await User.findOne({ email: session.user.email });
    if (!adminUser || adminUser.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const { 
      userId, 
      status, 
      name, 
      email, 
      role, 
      bio, 
      category, 
      socialLinks, 
      payoutDetails 
    } = body;

    if (!userId) {
      return NextResponse.json(
        { error: "userId is required" },
        { status: 400 }
      );
    }

    const user = await User.findById(userId);
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Prevent suspending the admin themselves
    if (user.role === "admin" && status === "suspended") {
      return NextResponse.json(
        { error: "Cannot suspend admin users" },
        { status: 400 }
      );
    }

    // Update fields if provided
    if (status !== undefined) {
      const validStatuses = ["active", "pending", "verified", "suspended"];
      if (!validStatuses.includes(status)) {
        return NextResponse.json(
          { error: "Invalid status value" },
          { status: 400 }
        );
      }
      user.status = status;
    }

    if (name !== undefined) {
      user.name = name;
    }

    if (email !== undefined) {
      // Check if email is in use by another user
      const existingUser = await User.findOne({ email, _id: { $ne: userId } });
      if (existingUser) {
        return NextResponse.json(
          { error: "Email is already in use by another account" },
          { status: 400 }
        );
      }
      user.email = email;
    }

    if (role !== undefined) {
      const validRoles = ["supporter", "creator", "admin"];
      if (!validRoles.includes(role)) {
        return NextResponse.json(
          { error: "Invalid role value" },
          { status: 400 }
        );
      }
      user.role = role as any;
    }

    if (bio !== undefined) {
      user.bio = bio;
    }

    if (category !== undefined) {
      user.category = category;
    }

    if (socialLinks !== undefined) {
      user.socialLinks = {
        twitter: socialLinks.twitter !== undefined ? socialLinks.twitter : user.socialLinks?.twitter || "",
        instagram: socialLinks.instagram !== undefined ? socialLinks.instagram : user.socialLinks?.instagram || "",
        youtube: socialLinks.youtube !== undefined ? socialLinks.youtube : user.socialLinks?.youtube || "",
        website: socialLinks.website !== undefined ? socialLinks.website : user.socialLinks?.website || "",
      };
    }

    if (payoutDetails !== undefined) {
      user.payoutDetails = {
        bankName: payoutDetails.bankName !== undefined ? payoutDetails.bankName : user.payoutDetails?.bankName || "",
        accountHolderName: payoutDetails.accountHolderName !== undefined ? payoutDetails.accountHolderName : user.payoutDetails?.accountHolderName || "",
        accountNumber: payoutDetails.accountNumber !== undefined ? payoutDetails.accountNumber : user.payoutDetails?.accountNumber || "",
        ifscCode: payoutDetails.ifscCode !== undefined ? payoutDetails.ifscCode : user.payoutDetails?.ifscCode || "",
        upiId: payoutDetails.upiId !== undefined ? payoutDetails.upiId : user.payoutDetails?.upiId || "",
      };

      // Set setup status based on details completeness
      const pd = user.payoutDetails;
      if (pd.bankName || pd.accountHolderName || pd.accountNumber || pd.upiId) {
        user.payoutSetup = true;
      } else {
        user.payoutSetup = false;
      }
    }

    await user.save();

    return NextResponse.json({
      message: "User updated successfully",
      user: {
        id: user._id.toString(),
        name: user.name,
        email: user.email,
        role: user.role,
        status: user.status,
      }
    }, { status: 200 });
  } catch (error: any) {
    console.error("Failed to update user by admin:", error);
    return NextResponse.json(
      { error: "Failed to update user" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await dbConnect();
    
    // Find logged-in user to verify admin role
    const adminUser = await User.findOne({ email: session.user.email });
    if (!adminUser || adminUser.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");

    if (!userId) {
      return NextResponse.json({ error: "userId is required" }, { status: 400 });
    }

    const user = await User.findById(userId);
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Prevent deleting their own admin account
    if (user.email === session.user.email) {
      return NextResponse.json({ error: "Cannot delete your own admin account" }, { status: 400 });
    }

    await User.findByIdAndDelete(userId);

    return NextResponse.json({ message: "User deleted successfully" }, { status: 200 });
  } catch (error: any) {
    console.error("Failed to delete user by admin:", error);
    return NextResponse.json(
      { error: "Failed to delete user" },
      { status: 500 }
    );
  }
}
