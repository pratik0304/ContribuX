"use client";

import { IndianRupee, Download, CheckCircle2, Clock, FileText } from "lucide-react";
import { useSubscriptions } from "@/lib/useSubscriptions";

export default function PaymentsPage() {
  const { getActiveSubscriptions, getMonthlyTotal, subscriptions } = useSubscriptions();
  const activeSubs = getActiveSubscriptions();
  const monthlyTotal = getMonthlyTotal();

  // Generate payment history from subscriptions
  const paymentHistory = subscriptions.map((sub, i) => ({
    id: `PAY${String(i + 1).padStart(3, "0")}`,
    creator: sub.creatorName,
    type: "Subscription",
    amount: sub.price,
    date: sub.subscribedOn,
    status: sub.status === "active" ? "completed" : "cancelled",
    tier: sub.tierName,
  }));

  const totalSpent = paymentHistory
    .filter((p) => p.status === "completed")
    .reduce((sum, p) => sum + p.amount, 0);

  return (
    <div className="p-6 md:p-8 max-w-5xl mx-auto w-full animate-fade-in">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-10">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Payment History</h1>
          <p className="text-gray-500">Track all your subscription and donation payments.</p>
        </div>
        <button className="flex items-center gap-2 glass glass-hover text-white px-5 py-2.5 rounded-full font-medium transition-all hover:scale-105">
          <Download size={18} />
          Download Receipts
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-10 stagger-children">
        <div className="glass-card rounded-2xl p-6">
          <p className="text-sm text-gray-500 mb-2">Total Spent</p>
          <p className="text-3xl font-bold text-white flex items-center gap-1">
            <IndianRupee size={24} />{totalSpent.toLocaleString()}
          </p>
        </div>
        <div className="glass-card rounded-2xl p-6">
          <p className="text-sm text-gray-500 mb-2">Active Subscriptions</p>
          <p className="text-3xl font-bold text-white">{activeSubs.length}</p>
        </div>
        <div className="glass-card rounded-2xl p-6">
          <p className="text-sm text-gray-500 mb-2">Monthly Recurring</p>
          <p className="text-3xl font-bold text-white flex items-center gap-1">
            <IndianRupee size={20} />{monthlyTotal.toLocaleString()}
          </p>
          <p className="text-xs text-gray-600 mt-1">/ month</p>
        </div>
      </div>

      <div className="glass-card rounded-2xl overflow-hidden">
        <div className="p-6 border-b border-white/5">
          <h3 className="text-lg font-bold text-white">All Transactions</h3>
        </div>

        {paymentHistory.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/5 text-left">
                  <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">ID</th>
                  <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Creator</th>
                  <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Tier</th>
                  <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Amount</th>
                  <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Date</th>
                  <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {paymentHistory.map((p) => (
                  <tr key={p.id} className="hover:bg-white/[0.02] transition-colors">
                    <td className="px-6 py-4 text-sm text-gray-400 font-mono">{p.id}</td>
                    <td className="px-6 py-4 text-sm text-white font-medium">{p.creator}</td>
                    <td className="px-6 py-4">
                      <span className="text-xs glass px-2.5 py-1 rounded-full text-gray-300">{p.tier}</span>
                    </td>
                    <td className="px-6 py-4 text-sm text-white font-semibold">₹{p.amount}</td>
                    <td className="px-6 py-4 text-sm text-gray-500">{p.date}</td>
                    <td className="px-6 py-4">
                      <span className={`flex items-center gap-1.5 text-xs font-medium ${
                        p.status === "completed" ? "text-green-400" : "text-yellow-400"
                      }`}>
                        {p.status === "completed" ? <CheckCircle2 size={14} /> : <Clock size={14} />}
                        {p.status.charAt(0).toUpperCase() + p.status.slice(1)}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-10 text-center">
            <FileText size={40} className="mx-auto mb-4 text-gray-700" />
            <p className="text-gray-500 font-medium">No transactions yet</p>
            <p className="text-sm text-gray-600 mt-1">When you subscribe to a creator, your payments will appear here.</p>
          </div>
        )}
      </div>
    </div>
  );
}
