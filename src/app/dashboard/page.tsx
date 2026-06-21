"use client";

import { useSession } from "next-auth/react";
import { PlusCircle, Link as LinkIcon, Settings, Bell, Edit3, Heart, Users, Eye, IndianRupee, Compass, CreditCard, ArrowUpRight, TrendingUp, BarChart3, CheckCircle2 } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useSubscriptions } from "@/lib/useSubscriptions";

// ── Creator Dashboard ──
function CreatorDashboard({ name, userId }: { name: string; userId: string }) {
  const [stats, setStats] = useState({ supporters: 0, posts: 0, income: 0, pageViews: 0 });
  const [profile, setProfile] = useState({ bio: "", profilePicture: "", payoutSetup: false });
  const [hasTiers, setHasTiers] = useState(false);
  const [recentActivities, setRecentActivities] = useState<any[]>([]);
  const [loadingActivity, setLoadingActivity] = useState(true);

  useEffect(() => {
    async function fetchStats() {
      try {
        const res = await fetch("/api/insights");
        if (res.ok) {
          const data = await res.json();
          setStats({
            supporters: data.stats?.supporters || 0,
            posts: data.stats?.posts || 0,
            income: data.stats?.monthlyRevenue || 0,
            pageViews: data.stats?.pageViews || 0,
          });
        }
      } catch (err) {
        console.error("Failed to fetch stats:", err);
      }
    }

    async function fetchProfile() {
      try {
        const res = await fetch("/api/users/profile");
        if (res.ok) {
          const data = await res.json();
          setProfile({
            bio: data.bio || "",
            profilePicture: data.profilePicture || "",
            payoutSetup: data.payoutSetup || false,
          });
        }
      } catch (err) {
        console.error("Failed to fetch profile settings:", err);
      }
    }

    async function checkTiers() {
      try {
        const res = await fetch(`/api/creators/${userId}`);
        if (res.ok) {
          const data = await res.json();
          const hasCustomTiers = data.tiers?.some((t: any) => t.id !== "tier_default") || false;
          setHasTiers(hasCustomTiers);
        }
      } catch (err) {
        console.error("Failed to check creator tiers:", err);
      }
    }

    async function fetchActivities() {
      try {
        const res = await fetch("/api/transactions");
        if (res.ok) {
          const data = await res.json();
          setRecentActivities(data);
        }
      } catch (err) {
        console.error("Failed to fetch activities:", err);
      } finally {
        setLoadingActivity(false);
      }
    }

    if (userId) {
      fetchStats();
      fetchProfile();
      checkTiers();
      fetchActivities();
    }
  }, [userId]);

  const isProfileDone = !!profile.bio && !!profile.profilePicture;
  const isTierDone = hasTiers;
  const isPayoutDone = profile.payoutSetup;

  return (
    <div className="p-6 md:p-8 max-w-4xl mx-auto w-full animate-fade-in">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-10">
        <div>
          <h1 className="text-3xl font-bold text-white flex items-center gap-3">
            Welcome back, {name}
          </h1>
          <p className="text-gray-500 mt-1">Manage your creator page and content.</p>
        </div>
        <Link
          href="/dashboard/create"
          className="flex items-center gap-2 bg-gradient-to-r from-indigo-500 to-purple-600 text-white px-5 py-2.5 rounded-full font-medium hover:shadow-lg hover:shadow-indigo-500/20 transition-all hover:scale-105"
        >
          <PlusCircle size={18} />
          Create Post
        </Link>
      </div>

      {/* Setup Checklist */}
      <div className="glass-card rounded-2xl p-8 mb-8 relative overflow-hidden">
        <div className="absolute -top-24 -right-24 w-48 h-48 bg-indigo-500 rounded-full mix-blend-screen filter blur-[80px] opacity-15 pointer-events-none" />

        <h2 className="text-xl font-bold text-white mb-2">Setup your page</h2>
        <p className="text-gray-500 mb-6">Complete your profile to start receiving support from your audience.</p>

        <div className="space-y-3 stagger-children">
          <Link href="/dashboard/settings" className={`flex items-center justify-between p-4 glass rounded-xl glass-hover transition-all group ${isProfileDone ? "border-green-500/30 bg-green-500/[0.02]" : ""}`}>
            <div className="flex items-center gap-4">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center shadow-lg transition-all ${isProfileDone ? "bg-green-500 text-white shadow-green-500/20" : "bg-gradient-to-br from-indigo-500 to-indigo-600 text-white shadow-indigo-500/20"}`}>
                {isProfileDone ? <CheckCircle2 size={20} /> : <Settings size={20} />}
              </div>
              <div>
                <h3 className={`font-medium transition-colors ${isProfileDone ? "text-green-400 group-hover:text-green-300 line-through opacity-70" : "text-white group-hover:text-indigo-400"}`}>Start with the basics</h3>
                <p className="text-sm text-gray-600">Add your name, photo, and a description of what you create.</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {isProfileDone && <span className="text-xs text-green-500 font-semibold bg-green-500/10 px-2.5 py-1 rounded-full">Completed</span>}
              <ArrowUpRight size={18} className={`transition-colors ${isProfileDone ? "text-green-500 group-hover:text-green-400" : "text-gray-600 group-hover:text-indigo-400"}`} />
            </div>
          </Link>

          <Link href="/dashboard/membership" className={`flex items-center justify-between p-4 glass rounded-xl glass-hover transition-all group ${isTierDone ? "border-green-500/30 bg-green-500/[0.02]" : ""}`}>
            <div className="flex items-center gap-4">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center shadow-lg transition-all ${isTierDone ? "bg-green-500 text-white shadow-green-500/20" : "bg-gradient-to-br from-purple-500 to-purple-600 text-white shadow-purple-500/20"}`}>
                {isTierDone ? <CheckCircle2 size={20} /> : <Edit3 size={20} />}
              </div>
              <div>
                <h3 className={`font-medium transition-colors ${isTierDone ? "text-green-400 group-hover:text-green-300 line-through opacity-70" : "text-white group-hover:text-purple-400"}`}>Create your first tier</h3>
                <p className="text-sm text-gray-600">Set up membership levels for your audience to subscribe to.</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {isTierDone && <span className="text-xs text-green-500 font-semibold bg-green-500/10 px-2.5 py-1 rounded-full">Completed</span>}
              <ArrowUpRight size={18} className={`transition-colors ${isTierDone ? "text-green-500 group-hover:text-green-400" : "text-gray-600 group-hover:text-purple-400"}`} />
            </div>
          </Link>

          <Link href="/dashboard/settings" className={`flex items-center justify-between p-4 glass rounded-xl glass-hover transition-all group ${isPayoutDone ? "border-green-500/30 bg-green-500/[0.02]" : ""}`}>
            <div className="flex items-center gap-4">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center shadow-lg transition-all ${isPayoutDone ? "bg-green-500 text-white shadow-green-500/20" : "bg-gradient-to-br from-pink-500 to-pink-600 text-white shadow-pink-500/20"}`}>
                {isPayoutDone ? <CheckCircle2 size={20} /> : <LinkIcon size={20} />}
              </div>
              <div>
                <h3 className={`font-medium transition-colors ${isPayoutDone ? "text-green-400 group-hover:text-green-300 line-through opacity-70" : "text-white group-hover:text-pink-400"}`}>Connect payouts</h3>
                <p className="text-sm text-gray-600">Enable payouts under settings to start receiving funds.</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {isPayoutDone && <span className="text-xs text-green-500 font-semibold bg-green-500/10 px-2.5 py-1 rounded-full">Connected</span>}
              <ArrowUpRight size={18} className={`transition-colors ${isPayoutDone ? "text-green-500 group-hover:text-green-400" : "text-gray-600 group-hover:text-pink-400"}`} />
            </div>
          </Link>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8 stagger-children">
        {[
          { label: "Supporters", value: stats.supporters.toLocaleString(), icon: Users, gradient: "from-indigo-500 to-blue-500" },
          { label: "Monthly Income", value: `₹${stats.income.toLocaleString()}`, icon: IndianRupee, gradient: "from-emerald-500 to-teal-500" },
          { label: "Active Posts", value: stats.posts.toLocaleString(), icon: BarChart3, gradient: "from-purple-500 to-violet-500" },
          { label: "Page Views", value: stats.pageViews.toLocaleString(), icon: Eye, gradient: "from-pink-500 to-rose-500" },
        ].map((stat) => {
          const Icon = stat.icon;
          return (
            <div key={stat.label} className="glass-card rounded-2xl p-5">
              <div className={`w-9 h-9 rounded-lg bg-gradient-to-br ${stat.gradient} flex items-center justify-center mb-3 shadow-lg`}>
                <Icon size={16} className="text-white" />
              </div>
              <p className="text-2xl font-bold text-white">{stat.value}</p>
              <p className="text-xs text-gray-600 mt-1">{stat.label}</p>
            </div>
          );
        })}
      </div>

      {/* Recent Activity */}
      <div className="glass-card rounded-2xl p-6">
        <h3 className="text-lg font-bold text-white mb-4">Recent Activity</h3>
        {loadingActivity ? (
          <div className="flex justify-center py-10">
            <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : recentActivities.length > 0 ? (
          <div className="space-y-3">
            {recentActivities.slice(0, 5).map((act) => (
              <div key={act.id} className="flex items-center justify-between p-3.5 glass rounded-xl hover:bg-white/[0.04] transition-all">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-indigo-500/10 text-indigo-400 flex items-center justify-center font-bold text-sm">
                    {act.supporter.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p className="text-white text-sm font-medium">
                      {act.supporter} {act.type === 'donation' ? 'tipped' : 'subscribed to'} <span className="text-indigo-400 font-semibold">{act.tier}</span>
                    </p>
                    <p className="text-[10px] text-gray-500 mt-0.5">{act.date}</p>
                  </div>
                </div>
                <span className="text-white font-bold text-sm">₹{act.amount}</span>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-10 text-center">
            <div className="w-14 h-14 glass rounded-2xl flex items-center justify-center mb-4 text-gray-600">
              <Bell size={24} />
            </div>
            <p className="text-gray-400 font-medium">No recent activity yet.</p>
            <p className="text-sm text-gray-600 mt-1">When supporters subscribe or donate, it will appear here.</p>
          </div>
        )}
      </div>
    </div>
  );
}


// ── Supporter Dashboard ──
function SupporterDashboard({ name }: { name: string }) {
  const { getActiveSubscriptions, getMonthlyTotal } = useSubscriptions();
  const activeSubs = getActiveSubscriptions();
  const monthlyTotal = getMonthlyTotal();
  const [creators, setCreators] = useState<any[]>([]);
  const [loadingCreators, setLoadingCreators] = useState(true);

  useEffect(() => {
    async function fetchCreators() {
      try {
        const res = await fetch("/api/creators");
        if (res.ok) {
          const data = await res.json();
          setCreators(data);
        }
      } catch (err) {
        console.error("Failed to fetch creators:", err);
      } finally {
        setLoadingCreators(false);
      }
    }
    fetchCreators();
  }, []);

  return (
    <div className="p-6 md:p-8 max-w-4xl mx-auto w-full animate-fade-in">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-10">
        <div>
          <h1 className="text-3xl font-bold text-white">
            Welcome, {name}
          </h1>
          <p className="text-gray-500 mt-1">Manage your subscriptions and discover new creators.</p>
        </div>
        <Link
          href="/explore"
          className="flex items-center gap-2 bg-gradient-to-r from-indigo-500 to-purple-600 text-white px-5 py-2.5 rounded-full font-medium hover:shadow-lg hover:shadow-indigo-500/20 transition-all hover:scale-105"
        >
          <Compass size={18} />
          Explore Creators
        </Link>
      </div>

      {/* Your Subscriptions */}
      <div className="glass-card rounded-2xl p-6 mb-8">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-bold text-white">Your Subscriptions</h3>
          {activeSubs.length > 0 && (
            <Link href="/dashboard/subscriptions" className="text-xs text-indigo-400 hover:text-indigo-300 transition-colors font-medium">
              View all →
            </Link>
          )}
        </div>
        {activeSubs.length > 0 ? (
          <div className="space-y-3 stagger-children">
            {activeSubs.slice(0, 3).map((sub) => (
              <div key={sub.id} className="flex items-center justify-between p-4 glass rounded-xl glass-hover transition-all">
                <div className="flex items-center gap-4">
                  <div className={`w-12 h-12 rounded-full bg-gradient-to-br ${sub.creatorGradient} flex items-center justify-center text-white font-bold shadow-lg`}>
                    {sub.creatorInitial}
                  </div>
                  <div>
                    <h4 className="text-white font-medium">{sub.creatorName}</h4>
                    <p className="text-sm text-gray-500">{sub.tierName} · ₹{sub.price}/mo</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-xs text-gray-600">Next billing</p>
                  <p className="text-sm text-gray-400">{sub.nextBilling}</p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-10 text-gray-500">
            <Heart size={36} className="mx-auto mb-3 opacity-40" />
            <p className="font-medium">No subscriptions yet</p>
            <Link href="/explore" className="text-indigo-400 text-sm hover:text-indigo-300 mt-2 inline-block font-medium">
              Explore creators →
            </Link>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 stagger-children">
        {/* Payment Summary */}
        <div className="glass-card rounded-2xl p-6">
          <h3 className="text-lg font-bold text-white mb-4">Payment Summary</h3>
          <div className="space-y-3">
            <div className="flex justify-between items-center p-3 glass rounded-xl">
              <span className="text-gray-500 text-sm">Total Monthly</span>
              <span className="text-white font-bold">₹{monthlyTotal.toLocaleString()}</span>
            </div>
            <div className="flex justify-between items-center p-3 glass rounded-xl">
              <span className="text-gray-500 text-sm">Active Subscriptions</span>
              <span className="text-white font-bold">{activeSubs.length}</span>
            </div>
          </div>
        </div>

        {/* Discover */}
        <div className="glass-card rounded-2xl p-6">
          <h3 className="text-lg font-bold text-white mb-4">Discover Creators</h3>
          <div className="space-y-3">
            {loadingCreators ? (
              <div className="flex justify-center py-6">
                <div className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
              </div>
            ) : creators.length > 0 ? (
              creators.slice(0, 3).map((c) => (
                <Link key={c.id} href={`/creator/${c.id}`} className="flex items-center gap-3 p-3 glass rounded-xl glass-hover transition-all group">
                  {c.profilePicture ? (
                    <img 
                      src={c.profilePicture} 
                      alt={c.name} 
                      className="w-10 h-10 rounded-full object-cover ring-2 ring-white/5"
                    />
                  ) : (
                    <div className={`w-10 h-10 rounded-full bg-gradient-to-br ${c.gradient} flex items-center justify-center text-white font-bold text-sm shadow-lg`}>
                      {c.initial}
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-white text-sm font-medium group-hover:text-indigo-400 transition-colors truncate">{c.name}</p>
                    <p className="text-xs text-gray-600">{c.category}</p>
                  </div>
                  <ArrowUpRight size={14} className="text-gray-600 group-hover:text-indigo-400 transition-colors" />
                </Link>
              ))
            ) : (
              <p className="text-gray-500 text-sm text-center py-4">No creators registered yet.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Main Page ──
export default function DashboardPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === "authenticated" && (session?.user as any)?.role === "admin") {
      router.push("/admin");
    }
  }, [status, router, session]);

  if (status === "loading") {
    return null; // AuthGuard in layout handles loading state
  }

  if (!session) return null;

  const role = (session.user as any)?.role || "supporter";
  const name = session.user?.name || "User";
  const userId = (session.user as any)?.id || "";

  if (role === "creator") {
    return <CreatorDashboard name={name} userId={userId} />;
  }

  return <SupporterDashboard name={name} />;
}
