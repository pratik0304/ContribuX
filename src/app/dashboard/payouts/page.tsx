"use client";

import { useState, useEffect } from "react";
import { IndianRupee, Download, CheckCircle2, Clock, AlertCircle, ArrowUpRight, Loader2, CreditCard } from "lucide-react";

interface Transaction {
  id: string;
  txnId: string;
  supporter: string;
  creator: string;
  amount: number;
  tier: string;
  type: string;
  date: string;
  status: "completed" | "pending" | "failed" | "refunded";
  paymentGatewayId: string;
}

interface PayoutRequest {
  id: string;
  txnId: string;
  amount: number;
  status: "pending" | "completed" | "failed";
  bankName: string;
  accountNumber: string;
  date: string;
}

const statusConfig: Record<string, { icon: any; color: string; bg: string }> = {
  completed: { icon: CheckCircle2, color: "text-green-400", bg: "bg-green-500/20" },
  pending: { icon: Clock, color: "text-yellow-400", bg: "bg-yellow-500/20" },
  failed: { icon: AlertCircle, color: "text-red-400", bg: "bg-red-500/20" },
  refunded: { icon: AlertCircle, color: "text-purple-400", bg: "bg-purple-500/20" },
};

export default function PayoutsPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [payouts, setPayouts] = useState<PayoutRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [withdrawing, setWithdrawing] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [activeTab, setActiveTab] = useState<"earnings" | "payouts">("earnings");

  useEffect(() => {
    async function fetchData() {
      try {
        const [txnsRes, payoutsRes] = await Promise.all([
          fetch("/api/transactions"),
          fetch("/api/payouts"),
        ]);
        if (txnsRes.ok) {
          const data = await txnsRes.json();
          setTransactions(data);
        }
        if (payoutsRes.ok) {
          const data = await payoutsRes.json();
          setPayouts(data);
        }
      } catch (err) {
        console.error("Failed to fetch payouts or transactions:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  const totalEarnings = transactions
    .filter((t) => t.status === "completed")
    .reduce((sum, t) => sum + t.amount, 0);

  const pendingAmount = transactions
    .filter((t) => t.status === "pending")
    .reduce((sum, t) => sum + t.amount, 0);

  const totalPayouts = payouts
    .filter((p) => p.status === "completed" || p.status === "pending")
    .reduce((sum, p) => sum + p.amount, 0);

  // Available = Total Earnings - Payouts (completed/pending)
  const availableAmount = totalEarnings - totalPayouts;

  const handleWithdraw = async () => {
    if (availableAmount <= 0 || withdrawing) return;
    setWithdrawing(true);
    setErrorMsg("");

    try {
      const res = await fetch("/api/payouts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount: availableAmount }),
      });
      const data = await res.json();
      if (res.ok) {
        setPayouts([data, ...payouts]);
        alert(`Withdrawal request of ₹${availableAmount} initiated successfully!`);
      } else {
        setErrorMsg(data.error || "Failed to initiate withdrawal");
      }
    } catch (err) {
      console.error("Withdrawal error:", err);
      setErrorMsg("Failed to connect to payouts server.");
    } finally {
      setWithdrawing(false);
    }
  };

  const handleExportCSV = () => {
    if (transactions.length === 0) return;
    
    const headers = ["Transaction ID", "Supporter", "Tier/Type", "Amount (INR)", "Date", "Status", "Gateway ID"];
    const rows = transactions.map((t) => [
      t.txnId,
      t.supporter,
      t.tier,
      t.amount,
      t.date,
      t.status,
      t.paymentGatewayId,
    ]);

    const csvContent =
      "data:text/csv;charset=utf-8," +
      [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `contribux_transactions_${new Date().toISOString().split("T")[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] text-gray-400">
        <Loader2 className="w-10 h-10 animate-spin text-indigo-500 mb-4" />
        <p className="text-sm">Loading earnings and payouts...</p>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-6xl mx-auto w-full animate-fade-in">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-10">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Payouts</h1>
          <p className="text-gray-400">Track your earnings and manage payouts.</p>
        </div>
        <button
          onClick={handleExportCSV}
          disabled={transactions.length === 0}
          className="flex items-center gap-2 bg-white text-black px-5 py-2.5 rounded-full font-medium hover:bg-gray-200 transition-colors disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
        >
          <Download size={18} />
          Export CSV
        </button>
      </div>

      {errorMsg && (
        <div className="mb-6 p-4 glass bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm">
          {errorMsg}
        </div>
      )}

      {/* Balance Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-10">
        <div className="bg-gradient-to-br from-indigo-600/20 to-purple-600/20 border border-indigo-500/30 rounded-2xl p-6">
          <p className="text-sm text-gray-300 mb-2">Total Earnings</p>
          <p className="text-3xl font-bold text-white flex items-center gap-1">
            <IndianRupee size={24} />{totalEarnings.toLocaleString()}
          </p>
          <span className="text-xs text-green-400 flex items-center gap-1 mt-2">
            <ArrowUpRight size={14} /> Real-time active data
          </span>
        </div>
        <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
          <p className="text-sm text-gray-300 mb-2">Pending Clearances</p>
          <p className="text-3xl font-bold text-yellow-400 flex items-center gap-1">
            <IndianRupee size={24} />{pendingAmount.toLocaleString()}
          </p>
          <span className="text-xs text-gray-400 mt-2 block">Processing via Razorpay</span>
        </div>
        <div className="bg-white/5 border border-white/10 rounded-2xl p-6 flex flex-col justify-between">
          <div>
            <p className="text-sm text-gray-300 mb-2">Available for Payout</p>
            <p className="text-3xl font-bold text-white flex items-center gap-1">
              <IndianRupee size={24} />{availableAmount.toLocaleString()}
            </p>
          </div>
          <button 
            onClick={handleWithdraw}
            disabled={availableAmount <= 0 || withdrawing}
            className="mt-4 w-fit text-xs bg-indigo-600 text-white px-5 py-2 rounded-full hover:bg-indigo-700 hover:scale-105 transition-all font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 cursor-pointer"
          >
            {withdrawing ? (
              <>
                <Loader2 size={12} className="animate-spin" />
                <span>Withdrawing...</span>
              </>
            ) : (
              "Withdraw Now"
            )}
          </button>
        </div>
      </div>

      {/* Tab switcher */}
      <div className="flex border-b border-white/10 mb-6">
        <button
          onClick={() => setActiveTab("earnings")}
          className={`px-6 py-3 font-semibold text-sm transition-all border-b-2 cursor-pointer ${
            activeTab === "earnings"
              ? "border-indigo-500 text-white"
              : "border-transparent text-gray-500 hover:text-gray-300"
          }`}
        >
          Earnings History ({transactions.length})
        </button>
        <button
          onClick={() => setActiveTab("payouts")}
          className={`px-6 py-3 font-semibold text-sm transition-all border-b-2 cursor-pointer ${
            activeTab === "payouts"
              ? "border-indigo-500 text-white"
              : "border-transparent text-gray-500 hover:text-gray-300"
          }`}
        >
          Withdrawal Requests ({payouts.length})
        </button>
      </div>

      {/* Transaction History content */}
      {activeTab === "earnings" ? (
        <div className="bg-white/5 border border-white/10 rounded-3xl overflow-hidden shadow-xl">
          <div className="p-6 border-b border-white/10">
            <h3 className="text-lg font-bold text-white">Earnings History</h3>
          </div>
          
          {transactions.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-white/5 text-left bg-white/[0.02]">
                    <th className="px-6 py-4 text-xs font-semibold text-gray-400 uppercase tracking-wider">Transaction</th>
                    <th className="px-6 py-4 text-xs font-semibold text-gray-400 uppercase tracking-wider">Supporter</th>
                    <th className="px-6 py-4 text-xs font-semibold text-gray-400 uppercase tracking-wider">Type</th>
                    <th className="px-6 py-4 text-xs font-semibold text-gray-400 uppercase tracking-wider">Amount</th>
                    <th className="px-6 py-4 text-xs font-semibold text-gray-400 uppercase tracking-wider">Date</th>
                    <th className="px-6 py-4 text-xs font-semibold text-gray-400 uppercase tracking-wider">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {transactions.map((txn) => {
                    const sc = statusConfig[txn.status] || statusConfig.completed;
                    const StatusIcon = sc.icon;
                    return (
                      <tr key={txn.id} className="hover:bg-white/5 transition-colors">
                        <td className="px-6 py-4 text-sm text-gray-300 font-mono">{txn.txnId}</td>
                        <td className="px-6 py-4 text-sm text-white font-medium">{txn.supporter}</td>
                        <td className="px-6 py-4">
                          <span className="text-xs bg-white/10 text-gray-300 px-2.5 py-1 rounded-full font-medium">
                            {txn.tier}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm text-white font-semibold">₹{txn.amount}</td>
                        <td className="px-6 py-4 text-sm text-gray-400">{txn.date}</td>
                        <td className="px-6 py-4">
                          <span className={`flex items-center gap-1.5 text-xs font-medium ${sc.color}`}>
                            <StatusIcon size={14} />
                            {txn.status.charAt(0).toUpperCase() + txn.status.slice(1)}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-20 text-gray-500">
              <CreditCard size={48} className="mb-4 opacity-40 text-gray-400" />
              <p className="font-semibold">No transactions yet</p>
              <p className="text-sm text-gray-600 mt-1">When supporters subscribe or support your tiers, your transactions will appear here.</p>
            </div>
          )}
        </div>
      ) : (
        <div className="bg-white/5 border border-white/10 rounded-3xl overflow-hidden shadow-xl">
          <div className="p-6 border-b border-white/10">
            <h3 className="text-lg font-bold text-white">Withdrawal Requests</h3>
          </div>
          
          {payouts.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-white/5 text-left bg-white/[0.02]">
                    <th className="px-6 py-4 text-xs font-semibold text-gray-400 uppercase tracking-wider">Payout ID</th>
                    <th className="px-6 py-4 text-xs font-semibold text-gray-400 uppercase tracking-wider">Bank Name</th>
                    <th className="px-6 py-4 text-xs font-semibold text-gray-400 uppercase tracking-wider">Account Number</th>
                    <th className="px-6 py-4 text-xs font-semibold text-gray-400 uppercase tracking-wider">Amount</th>
                    <th className="px-6 py-4 text-xs font-semibold text-gray-400 uppercase tracking-wider">Date</th>
                    <th className="px-6 py-4 text-xs font-semibold text-gray-400 uppercase tracking-wider">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {payouts.map((p) => {
                    const sc = statusConfig[p.status] || statusConfig.pending;
                    const StatusIcon = sc.icon;
                    return (
                      <tr key={p.id} className="hover:bg-white/5 transition-colors">
                        <td className="px-6 py-4 text-sm text-gray-300 font-mono">{p.txnId}</td>
                        <td className="px-6 py-4 text-sm text-white font-medium">{p.bankName}</td>
                        <td className="px-6 py-4 text-sm text-gray-400 font-mono">{p.accountNumber}</td>
                        <td className="px-6 py-4 text-sm text-white font-semibold">₹{p.amount}</td>
                        <td className="px-6 py-4 text-sm text-gray-400">{p.date}</td>
                        <td className="px-6 py-4">
                          <span className={`flex items-center gap-1.5 text-xs font-medium ${sc.color}`}>
                            <StatusIcon size={14} />
                            {p.status.charAt(0).toUpperCase() + p.status.slice(1)}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-20 text-gray-500">
              <CreditCard size={48} className="mb-4 opacity-40 text-gray-400" />
              <p className="font-semibold">No payout requests yet</p>
              <p className="text-sm text-gray-600 mt-1">When you initiate a withdrawal, the payout settlement status will display here.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
