"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Coffee } from "lucide-react";

interface AuthGuardProps {
  children: React.ReactNode;
  requiredRole?: "creator" | "supporter" | "admin";
}

export default function AuthGuard({ children, requiredRole }: AuthGuardProps) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [authorized, setAuthorized] = useState(false);

  useEffect(() => {
    if (status === "loading") return;

    if (status === "unauthenticated") {
      router.push("/login");
      return;
    }

    if (requiredRole) {
      const userRole = (session?.user as any)?.role;
      if (userRole !== requiredRole) {
        router.push("/dashboard");
        return;
      }
    }

    setAuthorized(true);
  }, [status, session, requiredRole, router]);

  if (status === "loading" || !authorized) {
    return (
      <div className="flex-1 flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-4 animate-fade-in">
          <div className="relative">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center animate-pulse-glow">
              <Coffee size={28} className="text-white" />
            </div>
            <div className="absolute inset-0 w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 blur-xl opacity-30" />
          </div>
          <div className="flex flex-col items-center gap-2">
            <div className="flex gap-1.5">
              <div className="w-2 h-2 rounded-full bg-indigo-400 animate-bounce" style={{ animationDelay: "0ms" }} />
              <div className="w-2 h-2 rounded-full bg-purple-400 animate-bounce" style={{ animationDelay: "150ms" }} />
              <div className="w-2 h-2 rounded-full bg-pink-400 animate-bounce" style={{ animationDelay: "300ms" }} />
            </div>
            <p className="text-sm text-gray-500 mt-2">Loading your dashboard...</p>
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
