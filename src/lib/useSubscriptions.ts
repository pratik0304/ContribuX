"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";

export interface Subscription {
  id: string;
  creatorId: string;
  creatorName: string;
  creatorInitial: string;
  creatorGradient: string;
  creatorCategory: string;
  tierName: string;
  tierId: string;
  price: number;
  subscribedOn: string;
  nextBilling: string;
  status: "active" | "cancelled";
}

export function useSubscriptions() {
  const { data: session } = useSession();
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [loaded, setLoaded] = useState(false);

  const fetchSubscriptions = useCallback(async () => {
    const userId = (session?.user as any)?.id;
    if (!userId) {
      setLoaded(true);
      return;
    }

    try {
      const res = await fetch(`/api/subscriptions?supporterId=${userId}`);
      if (res.ok) {
        const data = await res.json();
        
        const gradients = [
          "from-pink-500 to-rose-500",
          "from-indigo-500 to-blue-500",
          "from-purple-500 to-violet-500",
          "from-emerald-500 to-teal-500",
          "from-orange-500 to-amber-500",
          "from-cyan-500 to-sky-500",
        ];

        const mapped: Subscription[] = data.map((sub: any) => {
          const charCode = sub.creatorName?.charCodeAt(0) || 0;
          const creatorGradient = gradients[charCode % gradients.length];
          
          return {
            id: sub.id,
            creatorId: sub.creatorId,
            creatorName: sub.creatorName || "Unknown",
            creatorInitial: sub.creatorName?.charAt(0).toUpperCase() || "C",
            creatorGradient,
            creatorCategory: sub.creatorCategory || "General",
            tierName: sub.tierName || "Supporter",
            tierId: sub.tierId || "tier_default",
            price: sub.price || 0,
            subscribedOn: sub.startDate ? new Date(sub.startDate).toISOString().split("T")[0] : "-",
            nextBilling: sub.nextBillingDate ? new Date(sub.nextBillingDate).toISOString().split("T")[0] : "-",
            status: sub.status === "cancelled" ? "cancelled" : "active",
          };
        });
        setSubscriptions(mapped);
      }
    } catch (err) {
      console.error("Failed to load subscriptions:", err);
    } finally {
      setLoaded(true);
    }
  }, [session]);

  // Load subscriptions on mount or session change
  useEffect(() => {
    fetchSubscriptions();
  }, [fetchSubscriptions]);

  const cancel = useCallback(async (subscriptionId: string) => {
    try {
      const res = await fetch(`/api/subscriptions/${subscriptionId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status: "cancelled" }),
      });

      if (res.ok) {
        setSubscriptions((prev) =>
          prev.map((s) =>
            s.id === subscriptionId
              ? { ...s, status: "cancelled" as const, nextBilling: "-" }
              : s
          )
        );
        return true;
      }
    } catch (err) {
      console.error("Failed to cancel subscription on server:", err);
    }
    return false;
  }, []);

  const resubscribe = useCallback(async (subscriptionId: string) => {
    try {
      // For now, reactivate the subscription directly if it is still within cycle
      const res = await fetch(`/api/subscriptions/${subscriptionId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status: "active" }), // We would need to allow setting active back in the route or direct to payment page
      });

      // Wait, let's fall back to updating locally or instructions if the PUT fails
      if (res.ok) {
        const nextMonth = new Date();
        nextMonth.setMonth(nextMonth.getMonth() + 1);

        setSubscriptions((prev) =>
          prev.map((s) =>
            s.id === subscriptionId
              ? {
                  ...s,
                  status: "active" as const,
                  subscribedOn: new Date().toISOString().split("T")[0],
                  nextBilling: nextMonth.toISOString().split("T")[0],
                }
              : s
          )
        );
        return true;
      }
    } catch (err) {
      console.error("Failed to reactivate subscription:", err);
    }
    return false;
  }, []);

  const isSubscribed = useCallback(
    (creatorId: string, tierId?: string) => {
      return subscriptions.some(
        (s) =>
          s.creatorId === creatorId &&
          s.status === "active" &&
          (tierId ? s.tierId === tierId : true)
      );
    },
    [subscriptions]
  );

  const getActiveSubscriptions = useCallback(() => {
    return subscriptions.filter((s) => s.status === "active");
  }, [subscriptions]);

  const getCancelledSubscriptions = useCallback(() => {
    return subscriptions.filter((s) => s.status === "cancelled");
  }, [subscriptions]);

  const getMonthlyTotal = useCallback(() => {
    return subscriptions
      .filter((s) => s.status === "active")
      .reduce((sum, s) => sum + s.price, 0);
  }, [subscriptions]);

  return {
    subscriptions,
    loaded,
    cancel,
    resubscribe,
    isSubscribed,
    getActiveSubscriptions,
    getCancelledSubscriptions,
    getMonthlyTotal,
    refetch: fetchSubscriptions,
  };
}
