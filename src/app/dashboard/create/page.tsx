"use client";

import { useState, useEffect, useRef } from "react";
import { Image as ImageIcon, Video, FileText, Lock, Globe, CheckCircle2, ArrowLeft, X, Upload, Loader2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";

export default function CreatePostPage() {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [visibility, setVisibility] = useState("public");
  const [selectedTiers, setSelectedTiers] = useState<string[]>([]);
  const [published, setPublished] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();
  const { data: session } = useSession();

  // Media upload state
  const [mediaUrl, setMediaUrl] = useState("");
  const [mediaType, setMediaType] = useState<"image" | "video" | "none">("none");
  const [mediaPreview, setMediaPreview] = useState("");
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [acceptType, setAcceptType] = useState("");

  // Real tiers from API
  const [availableTiers, setAvailableTiers] = useState<any[]>([]);
  const [loadingTiers, setLoadingTiers] = useState(true);

  // Fetch real tiers for this creator
  useEffect(() => {
    async function fetchTiers() {
      if (!session?.user) return;
      try {
        const userId = (session.user as any).id;
        const res = await fetch(`/api/tiers?creatorId=${userId}`);
        if (res.ok) {
          const data = await res.json();
          setAvailableTiers(data);
        }
      } catch (err) {
        console.error("Failed to fetch tiers:", err);
      } finally {
        setLoadingTiers(false);
      }
    }
    fetchTiers();
  }, [session]);

  const handleTierToggle = (tierId: string) => {
    setSelectedTiers((prev) =>
      prev.includes(tierId) ? prev.filter((id) => id !== tierId) : [...prev, tierId]
    );
  };

  const handleFileSelect = (type: "image" | "video") => {
    setAcceptType(type === "image" ? "image/jpeg,image/png,image/gif,image/webp" : "video/mp4,video/webm");
    // Need to wait for state to update before triggering click
    setTimeout(() => {
      fileInputRef.current?.click();
    }, 0);
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate size (10MB)
    if (file.size > 10 * 1024 * 1024) {
      setUploadError("File too large. Maximum size is 10MB.");
      return;
    }

    setUploading(true);
    setUploadError("");

    // Show local preview
    const localPreview = URL.createObjectURL(file);
    setMediaPreview(localPreview);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Upload failed");
      }

      setMediaUrl(data.url);
      setMediaType(data.mediaType);
    } catch (err: any) {
      setUploadError(err.message || "Upload failed");
      setMediaPreview("");
      setMediaUrl("");
      setMediaType("none");
    } finally {
      setUploading(false);
      // Reset file input
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const removeMedia = () => {
    setMediaUrl("");
    setMediaType("none");
    setMediaPreview("");
    setUploadError("");
  };

  const handlePublish = async () => {
    if (!title.trim() || !content.trim()) return;
    setSaving(true);
    setError("");

    try {
      const res = await fetch("/api/posts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          content: content.trim(),
          mediaUrl: mediaUrl || undefined,
          mediaType: mediaType,
          isPublic: visibility === "public",
          requiredTierIds: visibility === "tier" ? selectedTiers : [],
          status: "published",
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to publish post");
      }

      setPublished(true);
    } catch (err: any) {
      setError(err.message || "Failed to publish. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const handleDraft = async () => {
    if (!title.trim() || !content.trim()) {
      setError("Please enter a title and content to save draft.");
      return;
    }
    setSaving(true);
    setError("");
    try {
      const res = await fetch("/api/posts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          content: content.trim(),
          mediaUrl: mediaUrl || undefined,
          mediaType: mediaType,
          isPublic: visibility === "public",
          requiredTierIds: visibility === "tier" ? selectedTiers : [],
          status: "draft",
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to save draft");
      }
      alert("Draft saved successfully to library!");
      router.push("/dashboard/library");
    } catch (err: any) {
      setError(err.message || "Failed to save draft.");
    } finally {
      setSaving(false);
    }
  };

  if (published) {
    return (
      <div className="p-8 max-w-2xl mx-auto w-full flex flex-col items-center justify-center min-h-[60vh] text-center">
        <div className="w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center mb-6">
          <CheckCircle2 size={48} className="text-green-400" />
        </div>
        <h1 className="text-3xl font-bold text-white mb-3">Post Published! 🎉</h1>
        <p className="text-gray-400 mb-2">
          &ldquo;{title}&rdquo; is now live and visible to{" "}
          {visibility === "public" ? "everyone" : `${selectedTiers.length} tier(s)`}.
        </p>
        <p className="text-gray-500 text-sm mb-8">Your supporters will be notified.</p>
        <div className="flex gap-4">
          <Link
            href="/dashboard/library"
            className="px-6 py-3 bg-white text-black font-medium rounded-full hover:bg-gray-200 transition-colors"
          >
            View in Library
          </Link>
          <button
            onClick={() => {
              setPublished(false);
              setTitle("");
              setContent("");
              setVisibility("public");
              setSelectedTiers([]);
              setMediaUrl("");
              setMediaType("none");
              setMediaPreview("");
              setError("");
            }}
            className="px-6 py-3 bg-white/10 text-white font-medium rounded-full hover:bg-white/20 transition-colors"
          >
            Create Another
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-4xl mx-auto w-full">
      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept={acceptType}
        onChange={handleFileChange}
        className="hidden"
      />

      <div className="flex items-center gap-4 mb-10">
        <Link href="/dashboard/library" className="p-2 rounded-lg hover:bg-white/10 text-gray-400 hover:text-white transition-colors">
          <ArrowLeft size={20} />
        </Link>
        <div>
          <h1 className="text-3xl font-bold text-white mb-1">Create a Post</h1>
          <p className="text-gray-400 text-sm">Share content with your audience or exclusive tiers.</p>
        </div>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm">
          {error}
        </div>
      )}

      <div className="bg-white/5 border border-white/10 rounded-3xl p-8 mb-8">
        <div className="space-y-6">
          <div>
            <input
              type="text"
              placeholder="Post Title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full bg-transparent border-b border-white/10 px-2 py-4 text-3xl font-bold text-white focus:outline-none focus:border-indigo-500 transition-colors placeholder:text-gray-600"
            />
          </div>

          <div className="flex gap-4 pb-4 border-b border-white/10">
            <button
              onClick={() => handleFileSelect("image")}
              disabled={uploading}
              className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 rounded-lg text-sm text-gray-300 hover:text-white transition-colors disabled:opacity-50"
            >
              <ImageIcon size={16} /> Image
            </button>
            <button
              onClick={() => handleFileSelect("video")}
              disabled={uploading}
              className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 rounded-lg text-sm text-gray-300 hover:text-white transition-colors disabled:opacity-50"
            >
              <Video size={16} /> Video
            </button>
          </div>

          {/* Upload status / preview */}
          {uploading && (
            <div className="flex items-center gap-3 p-4 bg-indigo-500/10 border border-indigo-500/20 rounded-xl">
              <Loader2 size={20} className="text-indigo-400 animate-spin" />
              <span className="text-indigo-300 text-sm">Uploading file...</span>
            </div>
          )}

          {uploadError && (
            <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm flex items-center justify-between">
              {uploadError}
              <button onClick={() => setUploadError("")} className="text-red-400 hover:text-red-300">
                <X size={16} />
              </button>
            </div>
          )}

          {mediaPreview && !uploading && (
            <div className="relative rounded-xl overflow-hidden border border-white/10">
              {mediaType === "image" ? (
                <img src={mediaPreview} alt="Upload preview" className="w-full max-h-80 object-cover" />
              ) : (
                <video src={mediaPreview} controls className="w-full max-h-80" />
              )}
              <button
                onClick={removeMedia}
                className="absolute top-3 right-3 p-1.5 bg-black/70 rounded-full text-white hover:bg-red-500 transition-colors"
              >
                <X size={16} />
              </button>
              {mediaUrl && (
                <div className="absolute bottom-3 left-3 bg-green-500/20 text-green-400 text-xs px-2.5 py-1 rounded-full flex items-center gap-1">
                  <CheckCircle2 size={12} /> Uploaded
                </div>
              )}
            </div>
          )}

          <div>
            <textarea
              rows={10}
              placeholder="What's on your mind? Type your exclusive content here..."
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="w-full bg-transparent border-none px-2 py-4 text-lg text-white focus:outline-none resize-y placeholder:text-gray-600 min-h-[200px]"
            />
          </div>

          {/* Word count */}
          <div className="flex justify-between text-xs text-gray-500 border-t border-white/10 pt-3">
            <span>{content.length} characters</span>
            <span>{content.split(/\s+/).filter(Boolean).length} words</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="md:col-span-2">
          <div className="bg-white/5 border border-white/10 rounded-3xl p-6">
            <h3 className="text-lg font-bold text-white mb-4">Who can see this?</h3>

            <div className="space-y-4">
              <label
                className={`flex items-start gap-4 p-4 border rounded-xl cursor-pointer hover:bg-white/5 transition-colors ${
                  visibility === "public" ? "border-indigo-500/50 bg-indigo-500/5" : "border-white/10"
                }`}
              >
                <input
                  type="radio"
                  name="visibility"
                  value="public"
                  checked={visibility === "public"}
                  onChange={() => setVisibility("public")}
                  className="mt-1 w-4 h-4 text-indigo-600 bg-gray-800 border-gray-600 focus:ring-indigo-600 focus:ring-2"
                />
                <div>
                  <div className="flex items-center gap-2 text-white font-medium mb-1">
                    <Globe size={16} className="text-green-400" />
                    Public
                  </div>
                  <p className="text-sm text-gray-400">Anyone can see this post. Great for announcements.</p>
                </div>
              </label>

              <label
                className={`flex items-start gap-4 p-4 border rounded-xl cursor-pointer hover:bg-white/5 transition-colors ${
                  visibility === "tier" ? "border-indigo-500/50 bg-indigo-500/5" : "border-white/10"
                }`}
              >
                <input
                  type="radio"
                  name="visibility"
                  value="tier"
                  checked={visibility === "tier"}
                  onChange={() => setVisibility("tier")}
                  className="mt-1 w-4 h-4 text-indigo-600 bg-gray-800 border-gray-600 focus:ring-indigo-600 focus:ring-2"
                />
                <div className="w-full">
                  <div className="flex items-center gap-2 text-white font-medium mb-1">
                    <Lock size={16} className="text-indigo-400" />
                    Supporters Only
                  </div>
                  <p className="text-sm text-gray-400 mb-4">Only supporters in specific tiers can see this.</p>

                  {visibility === "tier" && (
                    <div className="space-y-2 mt-4 pl-4 border-l-2 border-indigo-500/30">
                      {loadingTiers ? (
                        <p className="text-sm text-gray-500">Loading tiers...</p>
                      ) : availableTiers.length > 0 ? (
                        availableTiers.map((tier) => (
                          <label key={tier.id} className="flex items-center gap-3 p-2 hover:bg-white/5 rounded-lg cursor-pointer">
                            <input
                              type="checkbox"
                              checked={selectedTiers.includes(tier.id)}
                              onChange={() => handleTierToggle(tier.id)}
                              className="rounded bg-gray-800 border-gray-600 text-indigo-600 focus:ring-indigo-600"
                            />
                            <span className="text-gray-300 font-medium">{tier.name}</span>
                            <span className="text-gray-500 text-sm ml-auto">₹{tier.price}/mo</span>
                          </label>
                        ))
                      ) : (
                        <p className="text-sm text-gray-500">No tiers created yet. <Link href="/dashboard/membership" className="text-indigo-400 hover:text-indigo-300">Create a tier first →</Link></p>
                      )}
                    </div>
                  )}
                </div>
              </label>
            </div>
          </div>
        </div>

        <div>
          <div className="bg-white/5 border border-white/10 rounded-3xl p-6 sticky top-24">
            <h3 className="text-lg font-bold text-white mb-4">Publish</h3>
            <p className="text-sm text-gray-400 mb-6">Ready to share your work with the world?</p>

            {(!title.trim() || !content.trim()) && (
              <p className="text-xs text-yellow-400/80 mb-4 bg-yellow-500/10 p-2 rounded-lg">
                Add a title and content to publish.
              </p>
            )}

            {visibility === "tier" && selectedTiers.length === 0 && (
              <p className="text-xs text-yellow-400/80 mb-4 bg-yellow-500/10 p-2 rounded-lg">
                Please select at least one tier for exclusive access.
              </p>
            )}

            <button
              onClick={handlePublish}
              disabled={!title.trim() || !content.trim() || saving || uploading || (visibility === "tier" && selectedTiers.length === 0)}
              className="w-full py-3 bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-bold rounded-xl hover:shadow-[0_0_20px_-5px_rgba(99,102,241,0.5)] transition-all hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
            >
              {saving ? "Publishing..." : "Publish Post"}
            </button>
            <button
              onClick={handleDraft}
              disabled={saving}
              className="w-full py-3 mt-3 bg-white/5 text-gray-300 font-medium rounded-xl hover:bg-white/10 hover:text-white transition-colors disabled:opacity-50"
            >
              Save as Draft
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
