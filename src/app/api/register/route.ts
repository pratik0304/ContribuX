import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import dbConnect from "@/lib/mongoose";
import { User } from "@/models/User";

export async function POST(req: Request) {
  try {
    const { name, email, password, role, category } = await req.json();

    if (!name || !email || !password) {
      return NextResponse.json({ message: "All fields are required." }, { status: 400 });
    }

    if (password.length < 6) {
      return NextResponse.json({ message: "Password must be at least 6 characters." }, { status: 400 });
    }

    // Validate role — only allow creator or supporter (not admin)
    const validRole = role === "supporter" ? "supporter" : "creator";

    await dbConnect();

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return NextResponse.json({ message: "Email already in use." }, { status: 400 });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const userPayload: any = {
      name,
      email,
      password: hashedPassword,
      role: validRole,
    };

    if (validRole === "creator" && category) {
      userPayload.category = category;
    }

    await User.create(userPayload);

    return NextResponse.json({ message: "User registered successfully." }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ message: "An error occurred. Please try again." }, { status: 500 });
  }
}
