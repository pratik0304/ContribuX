"use client";

import { Bell, Heart, UserPlus, IndianRupee, MessageSquare, Check, Trash2, Loader2 } from "lucide-react";
import { useState, useEffect } from "react";

interface NotificationItem {
  id: string;
  type: "subscriber" | "donation" | "like" | "comment" | "payout";
  title: string;
  message: string;
  read: boolean;
  createdAt: string;
}

const getIconConfig = (type: string) => {
  switch (type) {
    case "subscriber":
      return { icon: UserPlus, color: "text-indigo-400", bg: "bg-indigo-500/20" };
    case "donation":
      return { icon: IndianRupee, color: "text-emerald-400", bg: "bg-emerald-500/20" };
    case "like":
      return { icon: Heart, color: "text-pink-400", bg: "bg-pink-500/20" };
    case "comment":
      return { icon: MessageSquare, color: "text-purple-400", bg: "bg-purple-500/20" };
    case "payout":
      return { icon: IndianRupee, color: "text-emerald-400", bg: "bg-emerald-500/20" };
    default:
      return { icon: Bell, color: "text-gray-400", bg: "bg-gray-500/20" };
  }
};

function formatTime(dateStr: string) {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString([], { month: "short", day: "numeric" });
}

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch real notifications
  const fetchNotifications = async () => {
    try {
      const res = await fetch("/api/notifications");
      if (res.ok) {
        const data = await res.json();
        setNotifications(data);
      }
    } catch (err) {
      console.error("Failed to fetch notifications:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  const markAllRead = async () => {
    try {
      const res = await fetch("/api/notifications", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "markAllRead" }),
      });
      if (res.ok) {
        setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
      }
    } catch (err) {
      console.error("Failed to mark all read:", err);
    }
  };

  const markSingleRead = async (id: string) => {
    try {
      const res = await fetch("/api/notifications", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "markRead", id }),
      });
      if (res.ok) {
        setNotifications((prev) =>
          prev.map((n) => (n.id === id ? { ...n, read: true } : n))
        );
      }
    } catch (err) {
      console.error("Failed to mark notification as read:", err);
    }
  };

  const deleteNotification = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation(); // Avoid triggering click to mark read
    try {
      const res = await fetch("/api/notifications", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "delete", id }),
      });
      if (res.ok) {
        setNotifications((prev) => prev.filter((n) => n.id !== id));
      }
    } catch (err) {
      console.error("Failed to delete notification:", err);
    }
  };

  const unreadCount = notifications.filter((n) => !n.read).length;

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] text-gray-400">
        <Loader2 className="w-10 h-10 animate-spin text-indigo-500 mb-4" />
        <p className="text-sm">Loading notifications...</p>
      </div>
    );
  }

  return (
    <div className="p-6 md:p-8 max-w-4xl mx-auto w-full animate-fade-in">
      <div className="flex justify-between items-center mb-10">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Notifications</h1>
          <p className="text-gray-400">
            {unreadCount > 0 ? `You have ${unreadCount} unread notifications.` : "You're all caught up!"}
          </p>
        </div>
        {unreadCount > 0 && (
          <button
            onClick={markAllRead}
            className="flex items-center gap-2 text-sm text-indigo-400 hover:text-indigo-300 font-medium transition-colors"
          >
            <Check size={16} />
            Mark all as read
          </button>
        )}
      </div>

      <div className="space-y-3 stagger-children">
        {notifications.map((notif) => {
          const { icon: Icon, color, bg } = getIconConfig(notif.type);
          return (
            <div
              key={notif.id}
              onClick={() => !notif.read && markSingleRead(notif.id)}
              className={`flex items-start gap-4 p-5 rounded-2xl border transition-all group cursor-pointer ${
                notif.read
                  ? "glass glass-hover"
                  : "bg-indigo-500/5 border-indigo-500/20 hover:border-indigo-500/30"
              }`}
            >
              <div className={`w-10 h-10 rounded-full ${bg} ${color} flex items-center justify-center shrink-0`}>
                <Icon size={18} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="text-white font-medium text-sm">{notif.title}</h3>
                  {!notif.read && (
                    <span className="w-2 h-2 bg-indigo-500 rounded-full shrink-0" />
                  )}
                </div>
                <p className="text-gray-400 text-sm">{notif.message}</p>
                <p className="text-gray-600 text-xs mt-2 font-mono">{formatTime(notif.createdAt)}</p>
              </div>
              <button
                onClick={(e) => deleteNotification(notif.id, e)}
                className="p-1.5 rounded-lg opacity-0 group-hover:opacity-100 hover:bg-red-500/10 text-gray-500 hover:text-red-400 transition-all shrink-0"
              >
                <Trash2 size={14} />
              </button>
            </div>
          );
        })}

        {notifications.length === 0 && (
          <div className="text-center py-20 text-gray-500">
            <Bell size={48} className="mx-auto mb-4 opacity-30 text-gray-400" />
            <p className="font-semibold">No notifications yet</p>
            <p className="text-sm text-gray-600 mt-1">We'll alert you when there are new activities on your account.</p>
          </div>
        )}
      </div>
    </div>
  );
}
