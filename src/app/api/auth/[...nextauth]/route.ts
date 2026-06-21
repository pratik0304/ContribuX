import NextAuth from "next-auth";
import type { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import dbConnect from "@/lib/mongoose";
import { User } from "@/models/User";

import mongoose from "mongoose";

const providers = [];

// Only add Google provider if credentials are configured
if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
  const GoogleProvider = require("next-auth/providers/google").default;
  providers.push(
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    })
  );
}

// Only add GitHub provider if credentials are configured
if (process.env.GITHUB_CLIENT_ID && process.env.GITHUB_CLIENT_SECRET) {
  const GithubProvider = require("next-auth/providers/github").default;
  providers.push(
    GithubProvider({
      clientId: process.env.GITHUB_CLIENT_ID,
      clientSecret: process.env.GITHUB_CLIENT_SECRET,
    })
  );
}

// Always add Credentials provider
providers.push(
  CredentialsProvider({
    name: "Credentials",
    credentials: {
      email: { label: "Email", type: "text" },
      password: { label: "Password", type: "password" },
    },
    async authorize(credentials) {
      if (!credentials?.email || !credentials?.password) {
        throw new Error("Invalid credentials");
      }

      // ── Real MongoDB authentication ──
      try {
        await dbConnect();

        // Check if input is a valid MongoDB ObjectId (UserId)
        const isObjectId = mongoose.Types.ObjectId.isValid(credentials.email);
        const query = isObjectId
          ? { _id: credentials.email }
          : { $or: [{ email: credentials.email }, { name: credentials.email }] };

        const user = await User.findOne(query).select(
          "+password"
        );

        if (!user || !user.password) {
          throw new Error("Invalid credentials");
        }

        const isPasswordCorrect = await bcrypt.compare(
          credentials.password,
          user.password
        );

        if (!isPasswordCorrect) {
          throw new Error("Invalid credentials");
        }

        return {
          id: user._id.toString(),
          email: user.email,
          name: user.name,
          role: user.role,
          image: user.profilePicture || "",
        };
      } catch (error: any) {
        if (error.message === "Invalid credentials") throw error;
        throw new Error("Authentication failed. Please try again later.");
      }
    },
  })
);

const authOptions: NextAuthOptions = {
  providers,
  callbacks: {
    async jwt({ token, user, trigger, session }) {
      if (user) {
        await dbConnect();
        const dbUser = await User.findOne({ email: user.email });
        if (dbUser) {
          token.id = dbUser._id.toString();
          token.role = dbUser.role || "supporter";
        } else {
          token.id = user.id;
          token.role = (user as any).role;
        }
        token.picture = user.image;
      }
      // Handle dynamic session updates from frontend
      if (trigger === "update" && session) {
        if (session.name) token.name = session.name;
        if (session.image) token.picture = session.image;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as any).id = token.id;
        (session.user as any).role = token.role;
        session.user.image = token.picture as string;
      }
      return session;
    },
    async signIn({ user, account }) {
      if (
        account?.provider === "google" ||
        account?.provider === "github"
      ) {
        await dbConnect();
        const existingUser = await User.findOne({ email: user.email ?? "" });
        if (!existingUser && user.email) {
          await User.create({
            email: user.email,
            name: user.name ?? "User",
            role: "supporter",
            profilePicture: user.image ?? "",
          });
        }
      }
      return true;
    },
  },
  pages: {
    signIn: "/login",
  },
  session: {
    strategy: "jwt",
  },
  secret: process.env.NEXTAUTH_SECRET,
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
