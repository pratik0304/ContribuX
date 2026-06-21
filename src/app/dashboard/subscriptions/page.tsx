"use client";

import { Heart, ExternalLink, XCircle, RotateCcw, IndianRupee, AlertTriangle, X } from "lucide-react";
import Link from "next/link";
import { useSubscriptions } from "@/lib/useSubscriptions";
import { useState } from "react";

function ConfirmModal({
  title,
  message,
  confirmText,
  confirmColor,
  onConfirm,
  onCancel,
}: {
  title: string;
  message: string;
  confirmText: string;
  confirmColor: string;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={onCancel}>
      <div className="glass rounded-3xl w-full max-w-sm p-6 animate-scale-in shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-full bg-red-500/20 flex items-center justify-center">
            <AlertTriangle size={20} className="text-red-400" />
          </div>
          <h3 className="text-lg font-bold text-white">{title}</h3>
        </div>
        <p className="text-gray-400 text-sm mb-6">{message}</p>
        <div className="flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 py-2.5 rounded-xl glass glass-hover text-gray-300 font-medium text-sm transition-all"
          >
            Keep Active
          </button>
          <button
            onClick={onConfirm}
            className={`flex-1 py-2.5 rounded-xl ${confirmColor} text-white font-medium text-sm transition-all hover:scale-[1.02]`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function SubscriptionsPage() {
  const {
    getActiveSubscriptions,
    getCancelledSubscriptions,
    getMonthlyTotal,
    cancel,
    resubscribe,
  } = useSubscriptions();

  const [cancelTarget, setCancelTarget] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  const active = getActiveSubscriptions();
  const cancelled = getCancelledSubscriptions();
  const monthlyTotal = getMonthlyTotal();

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  const handleCancel = (id: string) => {
    cancel(id);
    setCancelTarget(null);
    showToast("Subscription cancelled successfully");
  };

  const handleResubscribe = (id: string) => {
    resubscribe(id);
    showToast("Welcome back! Subscription reactivated");
  };

  return (
    <div className="p-6 md:p-8 max-w-4xl mx-auto w-full animate-fade-in">
      {/* Toast */}
      {toast && (
        <div className="fixed top-20 right-4 z-50 glass rounded-xl px-5 py-3 text-sm font-medium text-white flex items-center gap-2 animate-fade-in-down shadow-lg">
          {toast}
          <button onClick={() => setToast(null)} className="text-gray-400 hover:text-white">
            <X size={14} />
          </button>
        </div>
      )}

      {/* Cancel Confirmation Modal */}
      {cancelTarget && (
        <ConfirmModal
          title="Cancel Subscription?"
          message="You'll lose access to exclusive content at the end of your current billing period. You can always resubscribe later."
          confirmText="Cancel Subscription"
          confirmColor="bg-red-500 hover:bg-red-600"
          onConfirm={() => handleCancel(cancelTarget)}
          onCancel={() => setCancelTarget(null)}
        />
      )}

      <div className="mb-10">
        <h1 className="text-3xl font-bold text-white mb-2">My Subscriptions</h1>
        <p className="text-gray-500">Manage the creators you support.</p>
      </div>

      {/* Stats bar */}
      <div className="grid grid-cols-2 gap-4 mb-10">
        <div className="glass-card rounded-2xl p-5">
          <p className="text-sm text-gray-500 mb-1">Active Subscriptions</p>
          <p className="text-3xl font-bold text-white">{active.length}</p>
        </div>
        <div className="glass-card rounded-2xl p-5">
          <p className="text-sm text-gray-500 mb-1">Monthly Total</p>
          <p className="text-3xl font-bold text-white flex items-center gap-1">
            <IndianRupee size={20} />{monthlyTotal.toLocaleString()}
          </p>
        </div>
      </div>

      {/* Active */}
      <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
        <Heart size={18} className="text-pink-400" /> Active ({active.length})
      </h2>

      {active.length > 0 ? (
        <div className="space-y-4 mb-10 stagger-children">
          {active.map((sub) => (
            <div key={sub.id} className="glass-card rounded-2xl p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className={`w-14 h-14 rounded-full bg-gradient-to-br ${sub.creatorGradient} flex items-center justify-center text-white text-xl font-bold shadow-lg ring-2 ring-white/5`}>
                  {sub.creatorInitial}
                </div>
                <div>
                  <h3 className="text-white font-bold">{sub.creatorName}</h3>
                  <p className="text-sm text-gray-500">{sub.creatorCategory} · {sub.tierName} tier</p>
                  <p className="text-xs text-gray-600 mt-1">Since {sub.subscribedOn} · Next billing: {sub.nextBilling}</p>
                </div>
              </div>
              <div className="flex items-center gap-4 w-full sm:w-auto">
                <div className="text-right">
                  <p className="text-white font-bold">₹{sub.price}</p>
                  <p className="text-xs text-gray-600">/month</p>
                </div>
                <div className="flex gap-2 ml-auto sm:ml-0">
                  <Link href={`/creator/${sub.creatorId}`} className="p-2.5 rounded-xl glass glass-hover text-gray-400 hover:text-white transition-all">
                    <ExternalLink size={16} />
                  </Link>
                  <button
                    onClick={() => setCancelTarget(sub.id)}
                    className="p-2.5 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400 transition-all hover:scale-105"
                  >
                    <XCircle size={16} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="glass-card rounded-2xl p-10 text-center mb-10">
          <Heart size={40} className="mx-auto mb-4 text-gray-600" />
          <p className="text-gray-400 mb-2">No active subscriptions</p>
          <p className="text-sm text-gray-600 mb-4">Explore creators and support the work you love.</p>
          <Link
            href="/explore"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-gradient-to-r from-indigo-500 to-purple-600 text-white text-sm font-medium hover:shadow-lg hover:shadow-indigo-500/20 transition-all hover:scale-105"
          >
            Explore Creators
          </Link>
        </div>
      )}

      {/* Cancelled */}
      {cancelled.length > 0 && (
        <>
          <h2 className="text-lg font-bold text-gray-500 mb-4">Past Subscriptions ({cancelled.length})</h2>
          <div className="space-y-4 stagger-children">
            {cancelled.map((sub) => (
              <div key={sub.id} className="glass rounded-2xl p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 opacity-60 hover:opacity-80 transition-opacity">
                <div className="flex items-center gap-4">
                  <div className={`w-14 h-14 rounded-full bg-gradient-to-br ${sub.creatorGradient} flex items-center justify-center text-white text-xl font-bold`}>
                    {sub.creatorInitial}
                  </div>
                  <div>
                    <h3 className="text-white font-bold">{sub.creatorName}</h3>
                    <p className="text-sm text-gray-500">{sub.creatorCategory} · {sub.tierName} tier</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 w-full sm:w-auto">
                  <span className="text-xs bg-red-500/20 text-red-400 px-3 py-1 rounded-full font-medium">Cancelled</span>
                  <button
                    onClick={() => handleResubscribe(sub.id)}
                    className="flex items-center gap-1.5 text-xs bg-indigo-500/20 text-indigo-400 px-3 py-1.5 rounded-full font-medium hover:bg-indigo-500/30 transition-colors ml-auto sm:ml-0"
                  >
                    <RotateCcw size={12} /> Resubscribe
                  </button>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
