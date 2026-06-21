"use client";

import { useState, useEffect, useRef } from "react";
import { Upload, Save, CheckCircle2, Loader2, AlertCircle, Image as ImageIcon } from "lucide-react";
import { useSession } from "next-auth/react";

export default function SettingsPage() {
  const { data: session, update: updateSession } = useSession();
  const role = (session?.user as any)?.role || "supporter";

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [uploading, setUploading] = useState<"profilePicture" | "coverPicture" | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [profile, setProfile] = useState({
    name: "",
    bio: "",
    category: "General",
    profilePicture: "",
    coverPicture: "",
    twitter: "",
    instagram: "",
    website: "",
    youtube: "",
    payoutSetup: false,
    bankName: "",
    accountHolderName: "",
    accountNumber: "",
    ifscCode: "",
    upiId: "",
  });

  const fileInputRef = useRef<HTMLInputElement>(null);
  const coverInputRef = useRef<HTMLInputElement>(null);

  // Password change states
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [changingPassword, setChangingPassword] = useState(false);
  const [passwordSuccess, setPasswordSuccess] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPassword || newPassword.length < 6) {
      setPasswordError("New password must be at least 6 characters long.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordError("Passwords do not match.");
      return;
    }

    setChangingPassword(true);
    setPasswordError(null);
    setPasswordSuccess(false);

    try {
      const res = await fetch("/api/users/change-password", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      const data = await res.json();
      if (res.ok) {
        setPasswordSuccess(true);
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
        setTimeout(() => setPasswordSuccess(false), 3000);
      } else {
        setPasswordError(data.error || "Failed to update password.");
      }
    } catch (err) {
      console.error(err);
      setPasswordError("An error occurred. Please try again.");
    } finally {
      setChangingPassword(false);
    }
  };

  useEffect(() => {
    async function fetchProfile() {
      try {
        const res = await fetch("/api/users/profile");
        if (res.ok) {
          const data = await res.json();
          setProfile({
            name: data.name || "",
            bio: data.bio || "",
            category: data.category || "General",
            profilePicture: data.profilePicture || "",
            coverPicture: data.coverPicture || "",
            twitter: data.socialLinks?.twitter || "",
            instagram: data.socialLinks?.instagram || "",
            website: data.socialLinks?.website || "",
            youtube: data.socialLinks?.youtube || "",
            payoutSetup: data.payoutSetup || false,
            bankName: data.payoutDetails?.bankName || "",
            accountHolderName: data.payoutDetails?.accountHolderName || "",
            accountNumber: data.payoutDetails?.accountNumber || "",
            ifscCode: data.payoutDetails?.ifscCode || "",
            upiId: data.payoutDetails?.upiId || "",
          });
        } else {
          setError("Failed to load profile settings.");
        }
      } catch (err) {
        console.error(err);
        setError("An error occurred while fetching your settings.");
      } finally {
        setLoading(false);
      }
    }
    fetchProfile();
  }, []);

  const handleFileUpload = async (
    e: React.ChangeEvent<HTMLInputElement>,
    field: "profilePicture" | "coverPicture"
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append("file", file);

    setUploading(field);
    setError(null);

    try {
      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();

      if (res.ok) {
        setProfile((prev) => ({ ...prev, [field]: data.url }));
      } else {
        setError(data.error || "File upload failed.");
      }
    } catch (err) {
      console.error(err);
      setError("An error occurred during file upload.");
    } finally {
      setUploading(null);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    setSaved(false);

    try {
      const res = await fetch("/api/users/profile", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: profile.name,
          bio: profile.bio,
          category: profile.category,
          profilePicture: profile.profilePicture,
          coverPicture: profile.coverPicture,
          payoutSetup: profile.payoutSetup,
          payoutDetails: {
            bankName: profile.bankName,
            accountHolderName: profile.accountHolderName,
            accountNumber: profile.accountNumber,
            ifscCode: profile.ifscCode,
            upiId: profile.upiId,
          },
          socialLinks: {
            twitter: profile.twitter,
            instagram: profile.instagram,
            website: profile.website,
            youtube: profile.youtube,
          },
        }),
      });

      if (res.ok) {
        setSaved(true);
        // Update local session dynamically
        await updateSession({ 
          name: profile.name,
          image: profile.profilePicture 
        });
        setTimeout(() => setSaved(false), 3000);
      } else {
        const data = await res.json();
        setError(data.error || "Failed to save profile changes.");
      }
    } catch (err) {
      console.error(err);
      setError("An error occurred while saving your profile.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] text-gray-400">
        <Loader2 className="w-10 h-10 animate-spin text-indigo-500 mb-4" />
        <p className="text-sm">Loading settings...</p>
      </div>
    );
  }

  const userInitial = profile.name.charAt(0).toUpperCase() || "U";

  return (
    <div className="p-6 md:p-8 max-w-4xl mx-auto w-full animate-fade-in">
      {/* Hidden inputs for uploads */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={(e) => handleFileUpload(e, "profilePicture")}
        accept="image/*"
        className="sr-only"
      />
      <input
        type="file"
        ref={coverInputRef}
        onChange={(e) => handleFileUpload(e, "coverPicture")}
        accept="image/*"
        className="sr-only"
      />

      <div className="mb-10">
        <h1 className="text-3xl font-bold text-white mb-2">Settings</h1>
        <p className="text-gray-400">Manage your profile and account details.</p>
      </div>

      {error && (
        <div className="mb-6 p-4 glass bg-red-500/10 border-red-500/25 rounded-2xl flex items-center gap-3 text-red-400 text-sm">
          <AlertCircle size={18} className="shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <div className="glass rounded-3xl overflow-hidden mb-8 shadow-2xl">
        {/* Cover Photo Block */}
        {role === "creator" && (
          <div className="relative h-48 bg-white/5 border-b border-white/10 group">
            {profile.coverPicture ? (
              <img
                src={profile.coverPicture}
                alt="Cover"
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full bg-gradient-to-r from-slate-900 to-indigo-950 flex items-center justify-center text-gray-600">
                <ImageIcon size={32} />
              </div>
            )}
            <button
              type="button"
              onClick={() => coverInputRef.current?.click()}
              disabled={uploading === "coverPicture"}
              className="absolute bottom-4 right-4 flex items-center gap-2 px-4 py-2 bg-black/60 hover:bg-black/80 backdrop-blur-md text-white text-xs font-semibold rounded-xl transition-all border border-white/10 cursor-pointer disabled:opacity-50"
            >
              {uploading === "coverPicture" ? (
                <Loader2 size={14} className="animate-spin" />
              ) : (
                <Upload size={14} />
              )}
              {profile.coverPicture ? "Change Cover" : "Upload Cover"}
            </button>
          </div>
        )}

        {/* Profile Details Container */}
        <div className="p-6 md:p-8">
          <div className="flex flex-col sm:flex-row items-center sm:items-end gap-6 mb-8 relative">
            {profile.profilePicture ? (
              <img
                src={profile.profilePicture}
                alt={profile.name}
                className={`w-28 h-28 rounded-full object-cover border-4 border-black/50 shadow-2xl bg-slate-900 shrink-0 ${role === "creator" ? "relative -top-12 sm:-top-16 -mb-12 sm:-mb-16" : ""}`}
              />
            ) : (
              <div className={`w-28 h-28 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 border-4 border-black/50 shadow-2xl flex items-center justify-center text-4xl text-white font-bold shrink-0 ${role === "creator" ? "relative -top-12 sm:-top-16 -mb-12 sm:-mb-16" : ""}`}>
                {userInitial}
              </div>
            )}
            <div className="text-center sm:text-left">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading === "profilePicture"}
                className="flex items-center gap-2 px-4 py-2.5 bg-white/10 hover:bg-white/20 text-white text-sm rounded-xl transition-colors border border-white/10 mb-2 disabled:opacity-50 cursor-pointer mx-auto sm:mx-0"
              >
                {uploading === "profilePicture" ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : (
                  <Upload size={16} />
                )}
                Change Avatar
              </button>
              <p className="text-xs text-gray-500">JPG, PNG, WEBP. Max 10MB.</p>
            </div>
          </div>

          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Display Name</label>
                <input
                  type="text"
                  value={profile.name}
                  onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                  placeholder="Your Name"
                  className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-indigo-500 transition-colors"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Email (Account)</label>
                <input
                  type="email"
                  value={session?.user?.email || ""}
                  disabled
                  className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-gray-500 cursor-not-allowed"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Role</label>
                <input
                  type="text"
                  value={role.charAt(0).toUpperCase() + role.slice(1)}
                  disabled
                  className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-gray-500 cursor-not-allowed capitalize"
                />
              </div>
              {role === "creator" && (
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Category</label>
                  <select
                    value={profile.category}
                    onChange={(e) => setProfile({ ...profile, category: e.target.value })}
                    className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-indigo-500 transition-colors appearance-none"
                  >
                    <option value="Videos">Videos</option>
                    <option value="Podcasts">Podcasts</option>
                    <option value="Visual Art">Visual Art</option>
                    <option value="Music">Music</option>
                    <option value="Writing/Newsletters">Writing/Newsletters</option>
                    <option value="Games/Game Mods">Games/Game Mods</option>
                    <option value="Education/Courses">Education/Courses</option>
                    <option value="Physical Goods">Physical Goods</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Bio</label>
              <textarea
                rows={4}
                value={profile.bio}
                onChange={(e) => setProfile({ ...profile, bio: e.target.value })}
                placeholder="Tell your audience what you're creating..."
                className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-indigo-500 transition-colors resize-none"
              />
              <p className="mt-2 text-right text-xs text-gray-500">{profile.bio.length} characters</p>
            </div>

            {/* Social Links — only for Creators */}
            {role === "creator" && (
              <div className="pt-6 border-t border-white/10">
                <h3 className="text-lg font-bold text-white mb-4">Social Links</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Twitter / X</label>
                    <input
                      type="text"
                      value={profile.twitter}
                      onChange={(e) => setProfile({ ...profile, twitter: e.target.value })}
                      placeholder="https://twitter.com/username"
                      className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-indigo-500 transition-colors"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Instagram</label>
                    <input
                      type="text"
                      value={profile.instagram}
                      onChange={(e) => setProfile({ ...profile, instagram: e.target.value })}
                      placeholder="https://instagram.com/username"
                      className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-indigo-500 transition-colors"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Website</label>
                    <input
                      type="text"
                      value={profile.website}
                      onChange={(e) => setProfile({ ...profile, website: e.target.value })}
                      placeholder="https://yoursite.com"
                      className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-indigo-500 transition-colors"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">YouTube</label>
                    <input
                      type="text"
                      value={profile.youtube}
                      onChange={(e) => setProfile({ ...profile, youtube: e.target.value })}
                      placeholder="https://youtube.com/@channel"
                      className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-indigo-500 transition-colors"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Payout Settings Check box */}
            {role === "creator" && (
              <div className="pt-6 border-t border-white/10">
                <h3 className="text-lg font-bold text-white mb-4">Payout Settings</h3>
                <div className="space-y-4">
                  <label className="flex items-center gap-3 p-4 glass rounded-2xl cursor-pointer hover:border-white/20 transition-all select-none">
                    <input
                      type="checkbox"
                      checked={profile.payoutSetup}
                      onChange={(e) => setProfile({ ...profile, payoutSetup: e.target.checked })}
                      className="w-5 h-5 accent-indigo-500 rounded cursor-pointer"
                    />
                    <div>
                      <span className="text-sm font-medium text-white block">Enable Direct Payouts</span>
                      <span className="text-xs text-gray-400">Enable this to receive support and subscriptions from your audience.</span>
                    </div>
                  </label>

                  {profile.payoutSetup && (
                    <div className="p-6 glass rounded-2xl space-y-4 animate-fade-in border border-indigo-500/10">
                      <h4 className="text-sm font-bold text-indigo-400 uppercase tracking-wider mb-2">Bank Account Details</h4>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-medium text-gray-400 mb-1.5">Bank Name</label>
                          <input
                            type="text"
                            value={profile.bankName}
                            onChange={(e) => setProfile({ ...profile, bankName: e.target.value })}
                            placeholder="e.g. HDFC Bank, SBI"
                            className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-indigo-500 transition-colors placeholder-gray-700"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-400 mb-1.5">Account Holder Name</label>
                          <input
                            type="text"
                            value={profile.accountHolderName}
                            onChange={(e) => setProfile({ ...profile, accountHolderName: e.target.value })}
                            placeholder="Name as in bank record"
                            className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-indigo-500 transition-colors placeholder-gray-700"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-400 mb-1.5">Account Number</label>
                          <input
                            type="text"
                            value={profile.accountNumber}
                            onChange={(e) => setProfile({ ...profile, accountNumber: e.target.value })}
                            placeholder="Account number"
                            className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-indigo-500 transition-colors placeholder-gray-700"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-400 mb-1.5">IFSC Code</label>
                          <input
                            type="text"
                            value={profile.ifscCode}
                            onChange={(e) => setProfile({ ...profile, ifscCode: e.target.value })}
                            placeholder="e.g. HDFC0000123"
                            className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-indigo-500 transition-colors placeholder-gray-700"
                          />
                        </div>
                      </div>

                      <div className="pt-2">
                        <label className="block text-xs font-medium text-gray-400 mb-1.5">UPI ID (Optional alternative)</label>
                        <input
                          type="text"
                          value={profile.upiId}
                          onChange={(e) => setProfile({ ...profile, upiId: e.target.value })}
                          placeholder="e.g. username@upi"
                          className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-indigo-500 transition-colors placeholder-gray-700"
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Security Section (Change Password) */}
            <div className="pt-6 border-t border-white/10">
              <h3 className="text-lg font-bold text-white mb-4">Security Settings</h3>
              
              {passwordError && (
                <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-xs">
                  {passwordError}
                </div>
              )}

              {passwordSuccess && (
                <div className="mb-4 p-3 bg-green-500/10 border border-green-500/20 rounded-xl text-green-400 text-xs flex items-center gap-1.5 animate-fade-in">
                  <CheckCircle2 size={14} /> Password updated successfully!
                </div>
              )}

              <form onSubmit={handlePasswordChange} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Current Password</label>
                    <input
                      type="password"
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-indigo-500 transition-colors"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">New Password</label>
                    <input
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="At least 6 chars"
                      className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-indigo-500 transition-colors"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Confirm New Password</label>
                    <input
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-indigo-500 transition-colors"
                    />
                  </div>
                </div>
                <div className="flex justify-end pt-2 mb-6">
                  <button
                    type="submit"
                    disabled={changingPassword || !newPassword || !confirmPassword}
                    className="flex items-center gap-2 px-6 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-semibold border border-white/15 transition-all disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                  >
                    {changingPassword ? (
                      <Loader2 size={12} className="animate-spin" />
                    ) : (
                      "Change Password"
                    )}
                  </button>
                </div>
              </form>
            </div>

            <div className="flex justify-end pt-6 border-t border-white/10">
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex items-center gap-2 px-8 py-3 rounded-full bg-white text-black font-bold hover:bg-gray-200 transition-colors disabled:opacity-50"
              >
                {saving ? (
                  <Loader2 size={18} className="animate-spin text-black" />
                ) : saved ? (
                  <CheckCircle2 size={18} className="text-green-600" />
                ) : (
                  <Save size={18} />
                )}
                {saving ? "Saving..." : saved ? "Saved!" : "Save Changes"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
