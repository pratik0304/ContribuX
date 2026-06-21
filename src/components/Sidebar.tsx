"use client";

import Link from "next/link";
import {
  Home,
  Library,
  Users,
  BarChart3,
  Wallet,
  Settings,
  MessageSquare,
  Bell,
  LogOut,
  Compass,
  Heart,
  Shield,
  AlertTriangle,
  CreditCard,
  PlusCircle,
  Menu,
  X,
} from "lucide-react";
import { signOut, useSession } from "next-auth/react";
import { usePathname } from "next/navigation";
import { useState } from "react";

export default function Sidebar() {
  const { data: session } = useSession();
  const pathname = usePathname();
  const role = (session?.user as any)?.role || "supporter";
  const userName = session?.user?.name || "User";
  const userInitial = userName.charAt(0).toUpperCase();
  const [mobileOpen, setMobileOpen] = useState(false);

  // ── Role-based menu items ──
  const creatorMenu = [
    { icon: Home, label: "Dashboard", href: "/dashboard" },
    { icon: Library, label: "My Posts", href: "/dashboard/library" },
    { icon: Users, label: "Membership", href: "/dashboard/membership" },
    { icon: BarChart3, label: "Insights", href: "/dashboard/insights" },
    { icon: Wallet, label: "Payouts", href: "/dashboard/payouts" },
    { icon: MessageSquare, label: "Chats", href: "/dashboard/chats" },
    { icon: Bell, label: "Notifications", href: "/dashboard/notifications" },
    { icon: Settings, label: "Settings", href: "/dashboard/settings" },
  ];

  const supporterMenu = [
    { icon: Home, label: "Dashboard", href: "/dashboard" },
    { icon: Compass, label: "Explore", href: "/explore" },
    { icon: Heart, label: "Subscriptions", href: "/dashboard/subscriptions" },
    { icon: CreditCard, label: "Payments", href: "/dashboard/payments" },
    { icon: MessageSquare, label: "Chats", href: "/dashboard/chats" },
    { icon: Bell, label: "Notifications", href: "/dashboard/notifications" },
    { icon: Settings, label: "Settings", href: "/dashboard/settings" },
  ];

  const adminMenu = [
    { icon: Home, label: "Dashboard", href: "/admin" },
    { icon: Users, label: "Users", href: "/admin" },
    { icon: Shield, label: "Creators", href: "/admin" },
    { icon: AlertTriangle, label: "Disputes", href: "/admin" },
    { icon: BarChart3, label: "Analytics", href: "/dashboard/insights" },
    { icon: Settings, label: "Settings", href: "/dashboard/settings" },
  ];

  const menuItems =
    role === "admin" ? adminMenu :
    role === "creator" ? creatorMenu :
    supporterMenu;

  const roleColors = {
    creator: { bg: "from-indigo-500 to-purple-600", text: "text-indigo-400", label: "Creator" },
    admin: { bg: "from-red-500 to-orange-600", text: "text-red-400", label: "Admin" },
    supporter: { bg: "from-emerald-500 to-teal-600", text: "text-emerald-400", label: "Supporter" },
  };

  const currentRole = roleColors[role as keyof typeof roleColors] || roleColors.supporter;

  const NavContent = () => (
    <>
      {/* Profile section */}
      <div className="p-4 border-b border-white/5">
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${currentRole.bg} flex items-center justify-center text-white font-bold text-sm shadow-lg`}>
            {userInitial}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-white truncate">{userName}</p>
            <div className="flex items-center justify-between gap-2 mt-0.5">
              <p className={`text-[10px] uppercase tracking-widest font-bold ${currentRole.text}`}>
                {currentRole.label}
              </p>
              {role === "creator" && (session?.user as any)?.id && (
                <Link
                  href={`/creator/${(session?.user as any)?.id}`}
                  onClick={() => setMobileOpen(false)}
                  className="text-[10px] text-indigo-400 hover:text-indigo-300 font-semibold hover:underline transition-all"
                >
                  View Profile
                </Link>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Menu items */}
      <div className="px-3 py-3 space-y-0.5 flex-1">
        {menuItems.map((item) => {
          const IconComponent = item.icon;
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.label + item.href}
              href={item.href}
              onClick={() => setMobileOpen(false)}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl font-medium text-sm transition-all duration-200 group relative ${
                isActive
                  ? "bg-white/10 text-white sidebar-active"
                  : "text-gray-500 hover:bg-white/5 hover:text-gray-300"
              }`}
            >
              <IconComponent
                size={18}
                className={`transition-all duration-200 ${
                  isActive ? "text-indigo-400" : "group-hover:text-gray-300 group-hover:scale-110"
                }`}
              />
              {item.label}
              {isActive && (
                <div className="absolute right-3 w-1.5 h-1.5 rounded-full bg-indigo-400" />
              )}
            </Link>
          );
        })}
      </div>

      {/* Quick action */}
      {role === "creator" && (
        <div className="px-3 pb-2">
          <Link
            href="/dashboard/create"
            onClick={() => setMobileOpen(false)}
            className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 text-white text-sm font-medium hover:shadow-lg hover:shadow-indigo-500/20 hover:scale-[1.02] transition-all duration-200"
          >
            <PlusCircle size={16} />
            Create Post
          </Link>
        </div>
      )}

      {/* Logout */}
      <div className="p-3 border-t border-white/5">
        <button
          onClick={() => signOut({ callbackUrl: "/" })}
          className="flex items-center gap-3 px-3 py-2.5 w-full rounded-xl text-gray-500 hover:text-red-400 hover:bg-red-500/10 transition-all duration-200 font-medium text-sm"
        >
          <LogOut size={18} />
          Log Out
        </button>
      </div>
    </>
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="w-64 border-r border-white/5 bg-black/40 backdrop-blur-sm h-[calc(100vh-4rem)] sticky top-16 overflow-y-auto hidden md:flex flex-col">
        <NavContent />
      </aside>

      {/* Mobile Toggle */}
      <button
        className="md:hidden fixed bottom-6 left-6 z-40 w-12 h-12 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 text-white flex items-center justify-center shadow-lg shadow-indigo-500/25 hover:scale-110 transition-transform"
        onClick={() => setMobileOpen(!mobileOpen)}
      >
        {mobileOpen ? <X size={20} /> : <Menu size={20} />}
      </button>

      {/* Mobile Drawer */}
      {mobileOpen && (
        <>
          <div className="md:hidden fixed inset-0 bg-black/60 backdrop-blur-sm z-30" onClick={() => setMobileOpen(false)} />
          <aside className="md:hidden fixed left-0 top-16 bottom-0 w-72 bg-[#0a0a14] border-r border-white/10 z-30 flex flex-col animate-slide-left overflow-y-auto">
            <NavContent />
          </aside>
        </>
      )}
    </>
  );
}
