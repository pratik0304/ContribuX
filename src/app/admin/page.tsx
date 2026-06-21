"use client";

import {
  Users, Shield, AlertTriangle, IndianRupee, Search, CheckCircle2, XCircle, Eye, X, Loader2, Edit2, Plus, Trash2
} from "lucide-react";
import { useState, useEffect } from "react";
import AuthGuard from "@/components/AuthGuard";
import { useSession } from "next-auth/react";

interface UserRecord {
  id: string;
  name: string;
  email: string;
  role: "creator" | "supporter" | "admin";
  status: "active" | "pending" | "verified" | "suspended";
  joined: string;
  bio?: string;
  profilePicture?: string;
  coverPicture?: string;
  category?: string;
  socialLinks?: {
    twitter?: string;
    instagram?: string;
    youtube?: string;
    website?: string;
  };
  payoutSetup?: boolean;
  payoutDetails?: {
    bankName?: string;
    accountHolderName?: string;
    accountNumber?: string;
    ifscCode?: string;
    upiId?: string;
  };
}

const statusColors: Record<string, string> = {
  verified: "text-green-400 bg-green-500/20",
  active: "text-blue-400 bg-blue-500/20",
  pending: "text-yellow-400 bg-yellow-500/20",
  suspended: "text-red-400 bg-red-500/20",
  open: "text-yellow-400 bg-yellow-500/20",
  resolved: "text-green-400 bg-green-500/20",
};

const initialDisputes = [
  { id: "D001", reporter: "Sneha Patil", against: "Aisha Sharma", reason: "Inappropriate content", status: "open", date: "2026-06-05" },
  { id: "D002", reporter: "Amit Kumar", against: "Spammer Bot", reason: "Spam/Scam", status: "resolved", date: "2026-06-03" },
  { id: "D003", reporter: "Vikram Singh", against: "Rahul Dev", reason: "Refund request", status: "open", date: "2026-06-04" },
];

function AdminContent() {
  const { data: session } = useSession();
  const [stats, setStats] = useState({ totalUsers: 0, activeCreators: 0, totalRevenue: 0, openDisputes: 3 });
  const [users, setUsers] = useState<UserRecord[]>([]);
  const [disputes, setDisputes] = useState(initialDisputes);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [toast, setToast] = useState("");

  // Create User State
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createForm, setCreateForm] = useState({
    name: "",
    email: "",
    password: "",
    role: "supporter" as "supporter" | "creator" | "admin",
    status: "active" as "active" | "pending" | "verified" | "suspended",
  });
  const [creating, setCreating] = useState(false);

  // View User State
  const [viewingUser, setViewingUser] = useState<UserRecord | null>(null);

  // Edit User State
  const [editingUser, setEditingUser] = useState<UserRecord | null>(null);
  const [editForm, setEditForm] = useState({
    name: "",
    email: "",
    role: "supporter" as "supporter" | "creator" | "admin",
    status: "active" as "active" | "pending" | "verified" | "suspended",
    bio: "",
    category: "General",
    twitter: "",
    instagram: "",
    youtube: "",
    website: "",
    bankName: "",
    accountHolderName: "",
    accountNumber: "",
    ifscCode: "",
    upiId: "",
  });
  const [saving, setSaving] = useState(false);

  // Delete User State
  const [deleteUserTarget, setDeleteUserTarget] = useState<UserRecord | null>(null);
  const [deletingUser, setDeletingUser] = useState(false);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(""), 2500);
  };

  const fetchAdminData = async () => {
    try {
      const statsRes = await fetch("/api/admin/stats");
      const usersRes = await fetch("/api/admin/users");
      
      if (statsRes.ok && usersRes.ok) {
        const statsData = await statsRes.json();
        const usersData = await usersRes.json();
        
        setStats(statsData);
        setUsers(usersData);
      }
    } catch (err) {
      console.error("Failed to load admin dashboard data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAdminData();
  }, []);

  const updateUserStatus = async (id: string, newStatus: string, successMsg: string) => {
    try {
      const res = await fetch("/api/admin/users", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: id, status: newStatus }),
      });
      if (res.ok) {
        showToast(successMsg);
        fetchAdminData(); // Refresh list & stats
      } else {
        const err = await res.json();
        alert(err.error || "Failed to update user status");
      }
    } catch (error) {
      console.error(error);
      alert("An error occurred while updating status");
    }
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);
    try {
      const res = await fetch("/api/admin/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(createForm),
      });
      if (res.ok) {
        showToast("User created successfully!");
        setShowCreateModal(false);
        setCreateForm({ name: "", email: "", password: "", role: "supporter", status: "active" });
        fetchAdminData();
      } else {
        const err = await res.json();
        alert(err.error || "Failed to create user");
      }
    } catch (err) {
      console.error(err);
      alert("An error occurred during user creation");
    } finally {
      setCreating(false);
    }
  };

  const startEditUser = (user: UserRecord) => {
    setEditingUser(user);
    setEditForm({
      name: user.name,
      email: user.email,
      role: user.role,
      status: user.status,
      bio: user.bio || "",
      category: user.category || "General",
      twitter: user.socialLinks?.twitter || "",
      instagram: user.socialLinks?.instagram || "",
      youtube: user.socialLinks?.youtube || "",
      website: user.socialLinks?.website || "",
      bankName: user.payoutDetails?.bankName || "",
      accountHolderName: user.payoutDetails?.accountHolderName || "",
      accountNumber: user.payoutDetails?.accountNumber || "",
      ifscCode: user.payoutDetails?.ifscCode || "",
      upiId: user.payoutDetails?.upiId || "",
    });
  };

  const handleEditUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;
    setSaving(true);
    try {
      const res = await fetch("/api/admin/users", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: editingUser.id,
          name: editForm.name,
          email: editForm.email,
          role: editForm.role,
          status: editForm.status,
          bio: editForm.bio,
          category: editForm.category,
          socialLinks: {
            twitter: editForm.twitter,
            instagram: editForm.instagram,
            youtube: editForm.youtube,
            website: editForm.website,
          },
          payoutDetails: {
            bankName: editForm.bankName,
            accountHolderName: editForm.accountHolderName,
            accountNumber: editForm.accountNumber,
            ifscCode: editForm.ifscCode,
            upiId: editForm.upiId,
          }
        }),
      });
      if (res.ok) {
        showToast("User updated successfully!");
        setEditingUser(null);
        fetchAdminData();
      } else {
        const err = await res.json();
        alert(err.error || "Failed to update user");
      }
    } catch (err) {
      console.error(err);
      alert("An error occurred during user update");
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteUser = async (id: string) => {
    setDeletingUser(true);
    try {
      const res = await fetch(`/api/admin/users?userId=${id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        showToast("User deleted successfully!");
        setDeleteUserTarget(null);
        fetchAdminData();
      } else {
        const err = await res.json();
        alert(err.error || "Failed to delete user");
      }
    } catch (err) {
      console.error(err);
      alert("An error occurred during user deletion");
    } finally {
      setDeletingUser(false);
    }
  };

  const verifyUser = (id: string) => {
    updateUserStatus(id, "verified", "User verified successfully");
  };

  const suspendUser = (id: string) => {
    updateUserStatus(id, "suspended", "User suspended");
  };

  const unsuspendUser = (id: string) => {
    updateUserStatus(id, "active", "User unsuspended");
  };

  const resolveDispute = (id: string) => {
    setDisputes(disputes.map((d) => (d.id === id ? { ...d, status: "resolved" } : d)));
    showToast("Dispute resolved");
  };

  const filteredUsers = users.filter(
    (u) =>
      u.name.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-gray-400">
        <Loader2 className="w-10 h-10 animate-spin text-indigo-500 mb-4" />
        <p className="text-sm">Loading admin logs...</p>
      </div>
    );
  }

  const adminStatsCards = [
    { label: "Total Users", value: stats.totalUsers.toLocaleString(), icon: Users, gradient: "from-indigo-500 to-blue-500" },
    { label: "Active Creators", value: stats.activeCreators.toLocaleString(), icon: Shield, gradient: "from-emerald-500 to-teal-500" },
    { label: "Total Revenue", value: `₹${stats.totalRevenue.toLocaleString()}`, icon: IndianRupee, gradient: "from-purple-500 to-violet-500" },
    { label: "Open Disputes", value: stats.openDisputes.toString(), icon: AlertTriangle, gradient: "from-red-500 to-orange-500" },
  ];

  return (
    <div className="flex-1 py-8 md:py-12 px-4 sm:px-6 lg:px-8 animate-fade-in">
      {/* Toast */}
      {toast && (
        <div className="fixed top-20 right-4 z-50 glass rounded-xl px-5 py-3 text-sm font-medium text-green-400 flex items-center gap-2 animate-fade-in-down shadow-lg">
          <CheckCircle2 size={16} /> {toast}
          <button onClick={() => setToast("")} className="text-gray-500 hover:text-white ml-2">
            <X size={14} />
          </button>
        </div>
      )}

      <div className="max-w-7xl mx-auto">
        <div className="mb-10">
          <h1 className="text-3xl font-bold text-white mb-2">Admin Panel</h1>
          <p className="text-gray-500">Monitor platform activity, manage users, and resolve disputes.</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-10 stagger-children">
          {adminStatsCards.map((stat) => {
            const Icon = stat.icon;
            return (
              <div key={stat.label} className="glass-card rounded-2xl p-5">
                <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${stat.gradient} flex items-center justify-center mb-3 shadow-lg`}>
                  <Icon size={20} className="text-white" />
                </div>
                <p className="text-2xl font-bold text-white">{stat.value}</p>
                <p className="text-sm text-gray-500">{stat.label}</p>
              </div>
            );
          })}
        </div>

        {/* User Management */}
        <div className="glass-card rounded-2xl overflow-hidden mb-8 shadow-xl">
          <div className="p-6 border-b border-white/5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <h3 className="text-lg font-bold text-white">User Management</h3>
            <div className="flex items-center gap-3 w-full sm:w-auto">
              <div className="relative flex-1 sm:flex-none">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-600" />
                <input
                  type="text"
                  placeholder="Search users..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="bg-white/[0.03] border border-white/10 rounded-xl pl-9 pr-4 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all w-full"
                />
              </div>
              <button
                onClick={() => setShowCreateModal(true)}
                className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white text-sm px-4 py-2.5 rounded-xl transition-all font-semibold shadow-lg shadow-indigo-600/10 hover:shadow-indigo-600/20"
              >
                <Plus size={16} />
                <span>Add User</span>
              </button>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/5 text-left bg-white/[0.01]">
                  <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Name</th>
                  <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Email</th>
                  <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Role</th>
                  <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Joined</th>
                  <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {filteredUsers.map((user) => (
                  <tr key={user.id} className="hover:bg-white/[0.02] transition-colors">
                    <td className="px-6 py-4 text-sm text-white font-medium">{user.name}</td>
                    <td className="px-6 py-4 text-sm text-gray-500">{user.email}</td>
                    <td className="px-6 py-4">
                      <span className="text-xs glass px-2.5 py-1 rounded-full capitalize text-gray-300">{user.role}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`text-xs px-2.5 py-1 rounded-full font-medium capitalize ${statusColors[user.status] || "text-gray-400 bg-gray-500/20"}`}>
                        {user.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">{user.joined}</td>
                    <td className="px-6 py-4">
                      <div className="flex gap-2 items-center">
                        <button
                          onClick={() => setViewingUser(user)}
                          className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition-colors"
                          title="View Details"
                        >
                          <Eye size={14} />
                        </button>
                        <button
                          onClick={() => startEditUser(user)}
                          className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition-colors"
                          title="Edit User"
                        >
                          <Edit2 size={14} />
                        </button>
                        {user.email !== session?.user?.email && (
                          <button
                            onClick={() => setDeleteUserTarget(user)}
                            className="p-1.5 rounded-lg bg-white/5 hover:bg-red-500/20 text-gray-400 hover:text-red-400 transition-colors"
                            title="Delete User"
                          >
                            <Trash2 size={14} />
                          </button>
                        )}
                        {user.status === "pending" && (
                          <button
                            onClick={() => verifyUser(user.id)}
                            className="text-xs bg-green-500/20 text-green-400 px-3 py-1.5 rounded-full hover:bg-green-500/30 transition-colors font-medium"
                          >
                            Verify
                          </button>
                        )}
                        {user.role !== "admin" && (
                          user.status !== "suspended" ? (
                            <button
                              onClick={() => suspendUser(user.id)}
                              className="text-xs bg-red-500/20 text-red-400 px-3 py-1.5 rounded-full hover:bg-red-500/30 transition-colors font-medium"
                            >
                              Suspend
                            </button>
                          ) : (
                            <button
                              onClick={() => unsuspendUser(user.id)}
                              className="text-xs bg-blue-500/20 text-blue-400 px-3 py-1.5 rounded-full hover:bg-blue-500/30 transition-colors font-medium"
                            >
                              Activate
                            </button>
                          )
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Disputes */}
        <div className="glass-card rounded-2xl overflow-hidden shadow-xl">
          <div className="p-6 border-b border-white/5 bg-white/[0.01]">
            <h3 className="text-lg font-bold text-white">Disputes & Reports</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/5 text-left bg-white/[0.01]">
                  <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">ID</th>
                  <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Reporter</th>
                  <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Against</th>
                  <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Reason</th>
                  <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Date</th>
                  <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {disputes.map((d) => (
                  <tr key={d.id} className="hover:bg-white/[0.02] transition-colors">
                    <td className="px-6 py-4 text-sm text-gray-400 font-mono">{d.id}</td>
                    <td className="px-6 py-4 text-sm text-white">{d.reporter}</td>
                    <td className="px-6 py-4 text-sm text-white">{d.against}</td>
                    <td className="px-6 py-4 text-sm text-gray-500">{d.reason}</td>
                    <td className="px-6 py-4">
                      <span className={`text-xs px-2.5 py-1 rounded-full font-medium capitalize ${statusColors[d.status]}`}>
                        {d.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">{d.date}</td>
                    <td className="px-6 py-4">
                      {d.status === "open" ? (
                        <button
                          onClick={() => resolveDispute(d.id)}
                          className="text-xs bg-indigo-500/20 text-indigo-400 px-3 py-1.5 rounded-full hover:bg-indigo-500/30 transition-colors font-medium"
                        >
                          Resolve
                        </button>
                      ) : (
                        <span className="text-xs text-gray-600">—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Create User Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="relative w-full max-w-md bg-[#0F0F1A]/90 border border-white/10 rounded-3xl p-6 shadow-2xl glass-card overflow-hidden">
            <button 
              onClick={() => setShowCreateModal(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors"
            >
              <X size={20} />
            </button>
            
            <div className="mb-6">
              <h3 className="text-xl font-bold text-white">Create New User</h3>
              <p className="text-xs text-gray-500 mt-1">Manually register a supporter, creator, or admin account.</p>
            </div>

            <form onSubmit={handleCreateUser} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-400 mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. John Doe"
                  value={createForm.name}
                  onChange={(e) => setCreateForm({...createForm, name: e.target.value})}
                  className="w-full bg-white/[0.03] border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-400 mb-1">Email Address</label>
                <input
                  type="email"
                  required
                  placeholder="e.g. john@example.com"
                  value={createForm.email}
                  onChange={(e) => setCreateForm({...createForm, email: e.target.value})}
                  className="w-full bg-white/[0.03] border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-400 mb-1">Password</label>
                <input
                  type="password"
                  required
                  placeholder="At least 6 characters"
                  value={createForm.password}
                  onChange={(e) => setCreateForm({...createForm, password: e.target.value})}
                  className="w-full bg-white/[0.03] border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-400 mb-1">Role</label>
                  <select
                    value={createForm.role}
                    onChange={(e) => setCreateForm({...createForm, role: e.target.value as any})}
                    className="w-full bg-white/[0.03] border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                  >
                    <option value="supporter" className="bg-[#0F0F1A] text-white">Supporter</option>
                    <option value="creator" className="bg-[#0F0F1A] text-white">Creator</option>
                    <option value="admin" className="bg-[#0F0F1A] text-white">Admin</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-400 mb-1">Status</label>
                  <select
                    value={createForm.status}
                    onChange={(e) => setCreateForm({...createForm, status: e.target.value as any})}
                    className="w-full bg-white/[0.03] border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                  >
                    <option value="active" className="bg-[#0F0F1A] text-white">Active</option>
                    <option value="pending" className="bg-[#0F0F1A] text-white">Pending</option>
                    <option value="verified" className="bg-[#0F0F1A] text-white">Verified</option>
                  </select>
                </div>
              </div>

              <div className="flex gap-3 justify-end pt-4">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2.5 rounded-xl border border-white/10 text-gray-400 hover:text-white hover:bg-white/5 transition-all text-sm font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creating}
                  className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-medium transition-all text-sm disabled:opacity-50"
                >
                  {creating ? <Loader2 size={16} className="animate-spin" /> : null}
                  Create User
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* View User Details Modal */}
      {viewingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="relative w-full max-w-2xl bg-[#0F0F1A]/95 border border-white/10 rounded-3xl p-6 shadow-2xl glass-card overflow-hidden max-h-[85vh] overflow-y-auto">
            <button 
              onClick={() => setViewingUser(null)}
              className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors"
            >
              <X size={20} />
            </button>

            {/* Header Profile Section */}
            <div className="flex flex-col sm:flex-row gap-5 items-center pb-6 border-b border-white/5 mb-6">
              <div className="w-20 h-20 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-white text-3xl font-bold uppercase shadow-lg shadow-indigo-500/10">
                {viewingUser.name.charAt(0)}
              </div>
              <div className="text-center sm:text-left flex-1">
                <div className="flex flex-wrap justify-center sm:justify-start items-center gap-2 mb-1">
                  <h3 className="text-2xl font-bold text-white">{viewingUser.name}</h3>
                  <span className={`text-xs px-2.5 py-0.5 rounded-full font-medium capitalize ${statusColors[viewingUser.status]}`}>
                    {viewingUser.status}
                  </span>
                </div>
                <p className="text-sm text-gray-400">{viewingUser.email}</p>
                <div className="mt-2 flex flex-wrap justify-center sm:justify-start gap-2">
                  <span className="text-xs glass px-2.5 py-1 rounded-full capitalize text-indigo-300 font-medium">Role: {viewingUser.role}</span>
                  <span className="text-xs glass px-2.5 py-1 rounded-full capitalize text-gray-300">Joined: {viewingUser.joined}</span>
                  {viewingUser.role === "creator" && (
                    <span className="text-xs glass px-2.5 py-1 rounded-full text-indigo-400 font-medium">Category: {viewingUser.category || "General"}</span>
                  )}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Profile Info */}
              <div className="space-y-4">
                <div>
                  <h4 className="text-xs font-bold uppercase text-gray-500 tracking-wider mb-2">Profile Details</h4>
                  <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-4 space-y-3">
                    <div>
                      <span className="text-xs text-gray-500 block">Bio</span>
                      <p className="text-sm text-white">{viewingUser.bio || "No bio written yet."}</p>
                    </div>
                  </div>
                </div>

                {viewingUser.role === "creator" && (
                  <div>
                    <h4 className="text-xs font-bold uppercase text-gray-500 tracking-wider mb-2">Social Connections</h4>
                    <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-4 space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-500">Twitter:</span>
                        <span className="text-white font-medium">{viewingUser.socialLinks?.twitter || "—"}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-500">Instagram:</span>
                        <span className="text-white font-medium">{viewingUser.socialLinks?.instagram || "—"}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-500">YouTube:</span>
                        <span className="text-white font-medium">{viewingUser.socialLinks?.youtube || "—"}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-500">Website:</span>
                        <span className="text-white font-medium">{viewingUser.socialLinks?.website || "—"}</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Payout Details */}
              <div className="space-y-4">
                <div>
                  <h4 className="text-xs font-bold uppercase text-gray-500 tracking-wider mb-2">Payout Configuration</h4>
                  <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-4 space-y-2.5">
                    <div className="flex justify-between items-center text-sm mb-2">
                      <span className="text-gray-500">Setup Status:</span>
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${viewingUser.payoutSetup ? "bg-green-500/20 text-green-400" : "bg-yellow-500/20 text-yellow-400"}`}>
                        {viewingUser.payoutSetup ? "Setup Complete" : "Not Configured"}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Bank Name:</span>
                      <span className="text-white font-medium">{viewingUser.payoutDetails?.bankName || "—"}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Account Holder:</span>
                      <span className="text-white font-medium">{viewingUser.payoutDetails?.accountHolderName || "—"}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Account Number:</span>
                      <span className="text-white font-medium font-mono">{viewingUser.payoutDetails?.accountNumber || "—"}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">IFSC Code:</span>
                      <span className="text-white font-medium font-mono">{viewingUser.payoutDetails?.ifscCode || "—"}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">UPI ID:</span>
                      <span className="text-white font-medium">{viewingUser.payoutDetails?.upiId || "—"}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-6 border-t border-white/5 mt-6 gap-3">
              <button
                onClick={() => {
                  const userToEdit = viewingUser;
                  setViewingUser(null);
                  startEditUser(userToEdit);
                }}
                className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-sm transition-all"
              >
                Edit Profile
              </button>
              <button
                onClick={() => setViewingUser(null)}
                className="px-5 py-2 rounded-xl border border-white/10 text-gray-400 hover:text-white transition-all text-sm font-semibold"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit User Modal */}
      {editingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="relative w-full max-w-2xl bg-[#0F0F1A]/95 border border-white/10 rounded-3xl p-6 shadow-2xl glass-card overflow-hidden max-h-[90vh] overflow-y-auto">
            <button 
              onClick={() => setEditingUser(null)}
              className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors"
            >
              <X size={20} />
            </button>

            <div className="mb-6">
              <h3 className="text-xl font-bold text-white">Edit User: {editingUser.name}</h3>
              <p className="text-xs text-gray-500 mt-1">Modify user role, status, bio, social links, and banking information.</p>
            </div>

            <form onSubmit={handleEditUser} className="space-y-6">
              {/* Core details */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-400 mb-1">Full Name</label>
                  <input
                    type="text"
                    required
                    value={editForm.name}
                    onChange={(e) => setEditForm({...editForm, name: e.target.value})}
                    className="w-full bg-[#07070D] border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-400 mb-1">Email Address</label>
                  <input
                    type="email"
                    required
                    value={editForm.email}
                    onChange={(e) => setEditForm({...editForm, email: e.target.value})}
                    className="w-full bg-[#07070D] border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-400 mb-1">Role</label>
                  <select
                    value={editForm.role}
                    onChange={(e) => setEditForm({...editForm, role: e.target.value as any})}
                    className="w-full bg-[#07070D] border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  >
                    <option value="supporter" className="bg-[#0F0F1A] text-white">Supporter</option>
                    <option value="creator" className="bg-[#0F0F1A] text-white">Creator</option>
                    <option value="admin" className="bg-[#0F0F1A] text-white">Admin</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-400 mb-1">Status</label>
                  <select
                    value={editForm.status}
                    disabled={editingUser.role === "admin" && editForm.status === "suspended"}
                    onChange={(e) => setEditForm({...editForm, status: e.target.value as any})}
                    className="w-full bg-[#07070D] border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  >
                    <option value="active" className="bg-[#0F0F1A] text-white">Active</option>
                    <option value="pending" className="bg-[#0F0F1A] text-white">Pending</option>
                    <option value="verified" className="bg-[#0F0F1A] text-white">Verified</option>
                    <option value="suspended" className="bg-[#0F0F1A] text-white">Suspended</option>
                  </select>
                </div>
              </div>

              {/* Bio & category */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-xs font-semibold text-gray-400 mb-1">Biography (Bio)</label>
                  <textarea
                    rows={2}
                    value={editForm.bio}
                    onChange={(e) => setEditForm({...editForm, bio: e.target.value})}
                    placeholder="Tell supporters who this creator is..."
                    className="w-full bg-[#07070D] border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none resize-none focus:ring-1 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-400 mb-1">Creator Category</label>
                  <select
                    value={editForm.category}
                    onChange={(e) => setEditForm({...editForm, category: e.target.value})}
                    className="w-full bg-[#07070D] border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  >
                    <option value="General" className="bg-[#0F0F1A] text-white">General</option>
                    <option value="Videos" className="bg-[#0F0F1A] text-white">Videos</option>
                    <option value="Podcasts" className="bg-[#0F0F1A] text-white">Podcasts</option>
                    <option value="Visual Art" className="bg-[#0F0F1A] text-white">Visual Art</option>
                    <option value="Music" className="bg-[#0F0F1A] text-white">Music</option>
                    <option value="Writing/Newsletters" className="bg-[#0F0F1A] text-white">Writing</option>
                    <option value="Games/Game Mods" className="bg-[#0F0F1A] text-white">Games</option>
                    <option value="Education/Courses" className="bg-[#0F0F1A] text-white">Education</option>
                    <option value="Physical Goods" className="bg-[#0F0F1A] text-white">Physical Goods</option>
                    <option value="Other" className="bg-[#0F0F1A] text-white">Other</option>
                  </select>
                </div>
              </div>

              {/* Social Links */}
              <div>
                <h4 className="text-xs font-bold uppercase text-gray-500 tracking-wider mb-2">Social Profiles</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs text-gray-400 mb-1">Twitter URL</label>
                    <input
                      type="text"
                      placeholder="https://twitter.com/..."
                      value={editForm.twitter}
                      onChange={(e) => setEditForm({...editForm, twitter: e.target.value})}
                      className="w-full bg-[#07070D] border border-white/10 rounded-xl px-4 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-400 mb-1">Instagram URL</label>
                    <input
                      type="text"
                      placeholder="https://instagram.com/..."
                      value={editForm.instagram}
                      onChange={(e) => setEditForm({...editForm, instagram: e.target.value})}
                      className="w-full bg-[#07070D] border border-white/10 rounded-xl px-4 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-400 mb-1">YouTube URL</label>
                    <input
                      type="text"
                      placeholder="https://youtube.com/..."
                      value={editForm.youtube}
                      onChange={(e) => setEditForm({...editForm, youtube: e.target.value})}
                      className="w-full bg-[#07070D] border border-white/10 rounded-xl px-4 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-400 mb-1">Website URL</label>
                    <input
                      type="text"
                      placeholder="https://..."
                      value={editForm.website}
                      onChange={(e) => setEditForm({...editForm, website: e.target.value})}
                      className="w-full bg-[#07070D] border border-white/10 rounded-xl px-4 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    />
                  </div>
                </div>
              </div>

              {/* Payout Details */}
              <div>
                <h4 className="text-xs font-bold uppercase text-gray-500 tracking-wider mb-2">Banking & Payout Info</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="md:col-span-2">
                    <label className="block text-xs text-gray-400 mb-1">Bank Name</label>
                    <input
                      type="text"
                      value={editForm.bankName}
                      onChange={(e) => setEditForm({...editForm, bankName: e.target.value})}
                      className="w-full bg-[#07070D] border border-white/10 rounded-xl px-4 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-400 mb-1">IFSC Code</label>
                    <input
                      type="text"
                      value={editForm.ifscCode}
                      onChange={(e) => setEditForm({...editForm, ifscCode: e.target.value})}
                      className="w-full bg-[#07070D] border border-white/10 rounded-xl px-4 py-2 text-sm text-white focus:outline-none font-mono focus:ring-1 focus:ring-indigo-500"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-xs text-gray-400 mb-1">Account Holder Name</label>
                    <input
                      type="text"
                      value={editForm.accountHolderName}
                      onChange={(e) => setEditForm({...editForm, accountHolderName: e.target.value})}
                      className="w-full bg-[#07070D] border border-white/10 rounded-xl px-4 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-400 mb-1">UPI ID</label>
                    <input
                      type="text"
                      value={editForm.upiId}
                      onChange={(e) => setEditForm({...editForm, upiId: e.target.value})}
                      className="w-full bg-[#07070D] border border-white/10 rounded-xl px-4 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    />
                  </div>
                  <div className="md:col-span-3">
                    <label className="block text-xs text-gray-400 mb-1">Account Number</label>
                    <input
                      type="text"
                      value={editForm.accountNumber}
                      onChange={(e) => setEditForm({...editForm, accountNumber: e.target.value})}
                      className="w-full bg-[#07070D] border border-white/10 rounded-xl px-4 py-2 text-sm text-white focus:outline-none font-mono focus:ring-1 focus:ring-indigo-500"
                    />
                  </div>
                </div>
              </div>

              <div className="flex gap-3 justify-end pt-4 border-t border-white/5">
                <button
                  type="button"
                  onClick={() => setEditingUser(null)}
                  className="px-4 py-2.5 rounded-xl border border-white/10 text-gray-400 hover:text-white hover:bg-white/5 transition-all text-sm font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-medium transition-all text-sm disabled:opacity-50"
                >
                  {saving ? <Loader2 size={16} className="animate-spin" /> : null}
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete User Confirmation Modal */}
      {deleteUserTarget && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in"
          onClick={() => setDeleteUserTarget(null)}
        >
          <div 
            className="relative w-full max-w-md bg-[#0F0F1A]/90 border border-white/10 rounded-3xl p-6 shadow-2xl glass-card overflow-hidden animate-scale-in"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-red-500/20 flex items-center justify-center">
                <AlertTriangle size={20} className="text-red-400" />
              </div>
              <h3 className="text-lg font-bold text-white">Delete User?</h3>
            </div>
            
            <p className="text-gray-400 text-sm mb-6">
              Are you sure you want to permanently delete <strong>{deleteUserTarget.name}</strong> ({deleteUserTarget.email})? This action cannot be undone.
            </p>

            <div className="flex gap-3">
              <button 
                type="button"
                onClick={() => setDeleteUserTarget(null)} 
                className="flex-1 py-2.5 rounded-xl border border-white/10 text-gray-300 font-medium text-sm transition-all hover:bg-white/5"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => handleDeleteUser(deleteUserTarget.id)}
                disabled={deletingUser}
                className="flex-1 py-2.5 rounded-xl bg-red-500 hover:bg-red-600 text-white font-medium text-sm transition-all hover:scale-[1.02] disabled:opacity-50 flex items-center justify-center gap-1.5 shadow-lg shadow-red-500/10 hover:shadow-red-500/20"
              >
                {deletingUser ? <Loader2 size={14} className="animate-spin" /> : null}
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function AdminPage() {
  return (
    <AuthGuard requiredRole="admin">
      <AdminContent />
    </AuthGuard>
  );
}
