"use client";

import Sidebar from "@/components/Sidebar";
import AuthGuard from "@/components/AuthGuard";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthGuard>
      <div className="flex flex-1 w-full max-w-[1600px] mx-auto">
        <Sidebar />
        <div className="flex-1 w-full animate-fade-in">
          {children}
        </div>
      </div>
    </AuthGuard>
  );
}
