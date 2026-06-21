"use client";

import { useState, useEffect } from "react";
import { PlusCircle, Edit2, Trash2, Check, X, CheckCircle2, AlertTriangle, Loader2 } from "lucide-react";
import { useSession } from "next-auth/react";

interface Tier {
  id: string;
  name: string;
  price: number;
  description: string;
  benefits: string[];
}

export default function MembershipPage() {
  const { data: session } = useSession();
  const [tiers, setTiers] = useState<Tier[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  // Form state
  const [formName, setFormName] = useState("");
  const [formPrice, setFormPrice] = useState("");
  const [formDesc, setFormDesc] = useState("");
  const [formBenefits, setFormBenefits] = useState("");

  // Fetch real tiers
  useEffect(() => {
    async function fetchTiers() {
      const userId = (session?.user as any)?.id;
      if (!userId) return;

      try {
        const res = await fetch(`/api/tiers?creatorId=${userId}`);
        if (res.ok) {
          const data = await res.json();
          setTiers(data);
        }
      } catch (err) {
        console.error("Failed to fetch tiers:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchTiers();
  }, [session]);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2500);
  };

  const resetForm = () => {
    setFormName("");
    setFormPrice("");
    setFormDesc("");
    setFormBenefits("");
  };

  const handleSave = async () => {
    if (!formName || !formPrice) return;
    setSaving(true);

    try {
      const res = await fetch("/api/tiers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formName,
          price: Number(formPrice),
          description: formDesc,
          benefits: formBenefits.split(",").map((b) => b.trim()).filter(Boolean),
        }),
      });

      if (!res.ok) throw new Error("Failed to create tier");

      const newTier = await res.json();
      setTiers([...tiers, newTier]);
      resetForm();
      setIsAdding(false);
      showToast("Tier created successfully");
    } catch (err: any) {
      showToast("Failed to create tier");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const res = await fetch(`/api/tiers/${id}`, { method: "DELETE" });
      if (res.ok) {
        setTiers(tiers.filter((t) => t.id !== id));
        showToast("Tier deleted");
      }
    } catch (err) {
      showToast("Failed to delete tier");
    }
    setDeleteTarget(null);
  };

  const startEdit = (tier: Tier) => {
    setEditingId(tier.id);
    setFormName(tier.name);
    setFormPrice(tier.price.toString());
    setFormDesc(tier.description);
    setFormBenefits(tier.benefits.join(", "));
  };

  const handleUpdate = async () => {
    if (!editingId || !formName || !formPrice) return;
    setSaving(true);

    try {
      const res = await fetch(`/api/tiers/${editingId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formName,
          price: Number(formPrice),
          description: formDesc,
          benefits: formBenefits.split(",").map((b) => b.trim()).filter(Boolean),
        }),
      });

      if (!res.ok) throw new Error("Failed to update tier");

      const updated = await res.json();
      setTiers(tiers.map((t) => (t.id === editingId ? updated : t)));
      setEditingId(null);
      resetForm();
      showToast("Tier updated successfully");
    } catch (err: any) {
      showToast("Failed to update tier");
    } finally {
      setSaving(false);
    }
  };

  const cancelEdit = () => {
    setEditingId(null);
    setIsAdding(false);
    resetForm();
  };

  const isEditing = isAdding || editingId !== null;

  return (
    <div className="p-6 md:p-8 max-w-5xl mx-auto w-full animate-fade-in">
      {/* Toast */}
      {toast && (
        <div className="fixed top-20 right-4 z-50 glass rounded-xl px-5 py-3 text-sm font-medium text-green-400 flex items-center gap-2 animate-fade-in-down shadow-lg">
          <CheckCircle2 size={16} /> {toast}
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteTarget && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setDeleteTarget(null)}>
          <div className="glass rounded-3xl w-full max-w-sm p-6 animate-scale-in shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-red-500/20 flex items-center justify-center">
                <AlertTriangle size={20} className="text-red-400" />
              </div>
              <h3 className="text-lg font-bold text-white">Delete Tier?</h3>
            </div>
            <p className="text-gray-400 text-sm mb-6">This will permanently remove this membership tier. Existing subscribers may lose access.</p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteTarget(null)} className="flex-1 py-2.5 rounded-xl glass glass-hover text-gray-300 font-medium text-sm transition-all">
                Cancel
              </button>
              <button onClick={() => handleDelete(deleteTarget)} className="flex-1 py-2.5 rounded-xl bg-red-500 hover:bg-red-600 text-white font-medium text-sm transition-all hover:scale-[1.02]">
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="flex justify-between items-center mb-10">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Membership Tiers</h1>
          <p className="text-gray-500">Create and manage subscription levels for your audience.</p>
        </div>
        {!isEditing && (
          <button
            onClick={() => { resetForm(); setIsAdding(true); }}
            className="flex items-center gap-2 bg-gradient-to-r from-indigo-500 to-purple-600 text-white px-5 py-2.5 rounded-full font-medium hover:shadow-lg hover:shadow-indigo-500/20 transition-all hover:scale-105"
          >
            <PlusCircle size={18} />
            Create Tier
          </button>
        )}
      </div>

      {/* Add / Edit Form */}
      {isEditing && (
        <div className="glass-card rounded-2xl p-8 mb-8 animate-fade-in-up">
          <h2 className="text-xl font-bold text-white mb-6">
            {editingId ? "Edit Tier" : "Create New Tier"}
          </h2>
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">Tier Name *</label>
                <input
                  type="text"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="e.g. VIP Member"
                  className="w-full bg-white/[0.03] border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 transition-all"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">Monthly Price (₹) *</label>
                <input
                  type="number"
                  value={formPrice}
                  onChange={(e) => setFormPrice(e.target.value)}
                  placeholder="99"
                  className="w-full bg-white/[0.03] border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">Description</label>
              <textarea
                rows={3}
                value={formDesc}
                onChange={(e) => setFormDesc(e.target.value)}
                placeholder="What is this tier about?"
                className="w-full bg-white/[0.03] border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 transition-all resize-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">Benefits (comma separated)</label>
              <textarea
                rows={2}
                value={formBenefits}
                onChange={(e) => setFormBenefits(e.target.value)}
                placeholder="Benefit 1, Benefit 2, Benefit 3"
                className="w-full bg-white/[0.03] border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 transition-all resize-none"
              />
            </div>

            <div className="flex justify-end gap-4 pt-4 border-t border-white/5">
              <button
                onClick={cancelEdit}
                className="px-6 py-2.5 rounded-full glass glass-hover text-gray-300 font-medium flex items-center gap-2 transition-all"
              >
                <X size={16} /> Cancel
              </button>
              <button
                onClick={editingId ? handleUpdate : handleSave}
                disabled={!formName || !formPrice || saving}
                className="px-6 py-2.5 rounded-full bg-white text-black font-medium hover:bg-gray-200 transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed hover:scale-105"
              >
                {saving ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />}
                {saving ? "Saving..." : editingId ? "Update Tier" : "Save Tier"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <div className="flex justify-center py-20">
          <Loader2 size={32} className="text-indigo-500 animate-spin" />
        </div>
      )}

      {/* Tier Cards */}
      {!loading && (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 stagger-children">
          {tiers.map((tier) => (
            <div key={tier.id} className="glass-card rounded-3xl p-6 flex flex-col h-full group relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-indigo-500 to-purple-500 opacity-0 group-hover:opacity-100 transition-opacity" />

              <div className="flex justify-between items-start mb-4">
                <h3 className="text-2xl font-bold text-white">{tier.name}</h3>
                <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => startEdit(tier)}
                    className="text-gray-400 hover:text-white p-1.5 rounded-lg hover:bg-white/10 transition-all"
                  >
                    <Edit2 size={16} />
                  </button>
                  <button
                    onClick={() => setDeleteTarget(tier.id)}
                    className="text-red-400 hover:text-red-300 p-1.5 rounded-lg hover:bg-red-500/10 transition-all"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>

              <div className="flex items-baseline gap-1 mb-4">
                <span className="text-3xl font-extrabold text-white">₹{tier.price}</span>
                <span className="text-gray-500 text-sm">/ month</span>
              </div>

              <p className="text-gray-400 text-sm mb-6 flex-1">{tier.description}</p>

              <div className="space-y-3">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Benefits</p>
                <ul className="space-y-2">
                  {tier.benefits.map((benefit, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-gray-400">
                      <CheckCircle2 size={14} className="text-indigo-400 mt-0.5 shrink-0" />
                      {benefit}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ))}
        </div>
      )}

      {!loading && tiers.length === 0 && !isEditing && (
        <div className="text-center py-16">
          <div className="w-16 h-16 glass rounded-2xl flex items-center justify-center mx-auto mb-4 text-gray-600">
            <PlusCircle size={28} />
          </div>
          <p className="text-gray-400 font-medium text-lg mb-2">No tiers yet.</p>
          <p className="text-sm text-gray-600 mb-4">Create your first membership tier to start earning.</p>
          <button
            onClick={() => { resetForm(); setIsAdding(true); }}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-gradient-to-r from-indigo-500 to-purple-600 text-white text-sm font-medium hover:shadow-lg hover:shadow-indigo-500/20 transition-all hover:scale-105"
          >
            <PlusCircle size={16} /> Create First Tier
          </button>
        </div>
      )}
    </div>
  );
}
