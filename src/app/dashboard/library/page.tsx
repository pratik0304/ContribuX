"use client";

import { useState, useEffect, useRef } from "react";
import { Eye, Lock, Edit2, Trash2, Search, Loader2, AlertTriangle, Image as ImageIcon, Video, X } from "lucide-react";
import { useSession } from "next-auth/react";

export default function LibraryPage() {
  const { data: session } = useSession();
  const [filter, setFilter] = useState<"all" | "public" | "exclusive">("all");
  const [search, setSearch] = useState("");
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Real tiers from API
  const [availableTiers, setAvailableTiers] = useState<any[]>([]);

  // Edit states
  const [editPost, setEditPost] = useState<any | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editContent, setEditContent] = useState("");
  const [editVisibility, setEditVisibility] = useState("public");
  const [editSelectedTiers, setEditSelectedTiers] = useState<string[]>([]);
  const [editMediaUrl, setEditMediaUrl] = useState("");
  const [editMediaType, setEditMediaType] = useState<"image" | "video" | "none">("none");
  const [editMediaPreview, setEditMediaPreview] = useState("");
  const [editUploading, setEditUploading] = useState(false);
  const [editUploadError, setEditUploadError] = useState("");
  const [editSaving, setEditSaving] = useState(false);
  const [editError, setEditError] = useState("");
  const [editStatus, setEditStatus] = useState<"draft" | "published">("published");

  const editFileInputRef = useRef<any>(null);
  const [acceptType, setAcceptType] = useState("");

  // Fetch real posts & tiers
  useEffect(() => {
    async function fetchPosts() {
      const userId = (session?.user as any)?.id;
      if (!userId) return;

      try {
        const res = await fetch(`/api/posts/creator/${userId}`);
        if (res.ok) {
          const data = await res.json();
          setPosts(data);
        }
      } catch (err) {
        console.error("Failed to fetch posts:", err);
      } finally {
        setLoading(false);
      }
    }
    async function fetchTiers() {
      const userId = (session?.user as any)?.id;
      if (!userId) return;
      try {
        const res = await fetch(`/api/tiers?creatorId=${userId}`);
        if (res.ok) {
          const data = await res.json();
          setAvailableTiers(data);
        }
      } catch (err) {
        console.error("Failed to fetch tiers:", err);
      }
    }
    fetchPosts();
    fetchTiers();
  }, [session]);

  const handleTierToggle = (tierId: string) => {
    setEditSelectedTiers((prev) =>
      prev.includes(tierId) ? prev.filter((id) => id !== tierId) : [...prev, tierId]
    );
  };

  const handleFileSelect = (type: "image" | "video") => {
    setAcceptType(type === "image" ? "image/jpeg,image/png,image/gif,image/webp" : "video/mp4,video/webm");
    setTimeout(() => {
      editFileInputRef.current?.click();
    }, 0);
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      setEditUploadError("File too large. Maximum size is 10MB.");
      return;
    }

    setEditUploading(true);
    setEditUploadError("");

    const localPreview = URL.createObjectURL(file);
    setEditMediaPreview(localPreview);

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

      setEditMediaUrl(data.url);
      setEditMediaType(data.mediaType);
    } catch (err: any) {
      setEditUploadError(err.message || "Upload failed");
      setEditMediaPreview("");
      setEditMediaUrl("");
      setEditMediaType("none");
    } finally {
      setEditUploading(false);
      if (editFileInputRef.current) editFileInputRef.current.value = "";
    }
  };

  const removeMedia = () => {
    setEditMediaUrl("");
    setEditMediaType("none");
    setEditMediaPreview("");
    setEditUploadError("");
  };

  const handleStartEdit = (post: any) => {
    setEditPost(post);
    setEditTitle(post.title);
    setEditContent(post.content);
    setEditVisibility(post.isPublic ? "public" : "tier");
    setEditSelectedTiers(post.requiredTierIds || []);
    setEditMediaUrl(post.mediaUrl || "");
    setEditMediaType(post.mediaType || "none");
    setEditMediaPreview(post.mediaUrl || "");
    setEditStatus(post.status || "published");
    setEditUploadError("");
    setEditError("");
  };

  const handleSaveEdit = async () => {
    if (!editPost || !editTitle.trim() || !editContent.trim()) return;
    setEditSaving(true);
    setEditError("");

    try {
      const res = await fetch(`/api/posts/${editPost.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: editTitle.trim(),
          content: editContent.trim(),
          mediaUrl: editMediaUrl || undefined,
          mediaType: editMediaType,
          isPublic: editVisibility === "public",
          requiredTierIds: editVisibility === "tier" ? editSelectedTiers : [],
          status: editStatus,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to update post");
      }

      // Update state
      setPosts((prevPosts) =>
        prevPosts.map((p) =>
          p.id === editPost.id
            ? {
                ...p,
                title: data.title,
                content: data.content,
                mediaUrl: data.mediaUrl,
                mediaType: data.mediaType,
                isPublic: data.isPublic,
                requiredTierIds: data.requiredTierIds,
                status: data.status,
              }
            : p
        )
      );

      setEditPost(null);
    } catch (err: any) {
      setEditError(err.message || "Failed to update post");
    } finally {
      setEditSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    setDeleting(true);
    try {
      const res = await fetch(`/api/posts/${id}`, { method: "DELETE" });
      if (res.ok) {
        setPosts(posts.filter((p) => p.id !== id));
      }
    } catch (err) {
      console.error("Failed to delete post:", err);
    } finally {
      setDeleting(false);
      setDeleteTarget(null);
    }
  };

  const filtered = posts.filter((p) => {
    const matchFilter =
      filter === "all" ||
      (filter === "public" && p.isPublic) ||
      (filter === "exclusive" && !p.isPublic);
    const matchSearch =
      p.title.toLowerCase().includes(search.toLowerCase()) ||
      p.content.toLowerCase().includes(search.toLowerCase());
    return matchFilter && matchSearch;
  });

  return (
    <div className="p-8 max-w-5xl mx-auto w-full">
      {/* Delete Confirmation Modal */}
      {deleteTarget && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setDeleteTarget(null)}>
          <div className="glass rounded-3xl w-full max-w-sm p-6 animate-scale-in shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-red-500/20 flex items-center justify-center">
                <AlertTriangle size={20} className="text-red-400" />
              </div>
              <h3 className="text-lg font-bold text-white">Delete Post?</h3>
            </div>
            <p className="text-gray-400 text-sm mb-6">This will permanently delete this post. This action cannot be undone.</p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteTarget(null)} className="flex-1 py-2.5 rounded-xl glass glass-hover text-gray-300 font-medium text-sm transition-all">
                Cancel
              </button>
              <button
                onClick={() => handleDelete(deleteTarget)}
                disabled={deleting}
                className="flex-1 py-2.5 rounded-xl bg-red-500 hover:bg-red-600 text-white font-medium text-sm transition-all hover:scale-[1.02] disabled:opacity-50"
              >
                {deleting ? "Deleting..." : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-10">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Library</h1>
          <p className="text-gray-400">Manage all your published content.</p>
        </div>
        <a
          href="/dashboard/create"
          className="flex items-center gap-2 bg-indigo-600 text-white px-5 py-2.5 rounded-full font-medium hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-500/20"
        >
          + New Post
        </a>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4 mb-8">
        <div className="relative flex-1">
          <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" />
          <input
            type="text"
            placeholder="Search posts..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-white/5 border border-white/10 rounded-xl pl-11 pr-4 py-2.5 text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
          />
        </div>
        <div className="flex gap-2">
          {(["all", "public", "exclusive"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-2 rounded-lg text-sm font-medium capitalize transition-colors ${
                filter === f
                  ? "bg-white text-black"
                  : "bg-white/5 text-gray-300 hover:bg-white/10 border border-white/10"
              }`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="flex justify-center py-20">
          <Loader2 size={32} className="text-indigo-500 animate-spin" />
        </div>
      )}

      {/* Post List */}
      {!loading && (
        <div className="space-y-4">
          {filtered.map((post) => (
            <div
              key={post.id}
              className="bg-white/5 border border-white/10 rounded-2xl p-6 hover:border-white/20 transition-colors group"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-2">
                    {post.status === "draft" ? (
                      <span className="flex items-center gap-1 text-xs bg-yellow-500/20 text-yellow-400 px-2.5 py-1 rounded-full font-medium animate-pulse">
                        📂 Draft
                      </span>
                    ) : post.isPublic ? (
                      <span className="flex items-center gap-1 text-xs bg-green-500/20 text-green-400 px-2.5 py-1 rounded-full font-medium">
                        <Eye size={12} /> Public
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 text-xs bg-indigo-500/20 text-indigo-400 px-2.5 py-1 rounded-full font-medium">
                        <Lock size={12} /> Exclusive
                      </span>
                    )}
                    <span className="text-xs text-gray-500">{post.date}</span>
                  </div>
                  <h3 className="text-lg font-bold text-white mb-2 truncate group-hover:text-indigo-400 transition-colors">
                    {post.title}
                  </h3>
                  <p className="text-gray-400 text-sm line-clamp-2">{post.content}</p>

                  {/* Show media thumbnail */}
                  {post.mediaUrl && post.mediaType === "image" && (
                    <div className="mt-3 rounded-lg overflow-hidden border border-white/10 w-32 h-20">
                      <img src={post.mediaUrl} alt="" className="w-full h-full object-cover" />
                    </div>
                  )}
                  {post.mediaUrl && post.mediaType === "video" && (
                    <div className="mt-3 text-xs text-gray-500 flex items-center gap-1">
                      📹 Video attached
                    </div>
                  )}
                </div>
                <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => handleStartEdit(post)}
                    className="p-2 rounded-lg hover:bg-indigo-500/10 text-gray-400 hover:text-indigo-400 transition-colors"
                  >
                    <Edit2 size={16} />
                  </button>
                  <button
                    onClick={() => setDeleteTarget(post.id)}
                    className="p-2 rounded-lg hover:bg-red-500/10 text-gray-400 hover:text-red-400 transition-colors"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            </div>
          ))}

          {filtered.length === 0 && (
            <div className="text-center py-16 text-gray-500">
              <p className="text-lg">{posts.length === 0 ? "No posts yet. Create your first post!" : "No posts found matching your search."}</p>
            </div>
          )}
        </div>
      )}

      {/* Hidden file input for editing media */}
      <input
        ref={editFileInputRef}
        type="file"
        accept={acceptType}
        onChange={handleFileChange}
        className="hidden"
      />

      {/* Edit Post Modal */}
      {editPost && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto" onClick={() => setEditPost(null)}>
          <div className="glass rounded-3xl w-full max-w-2xl p-6 md:p-8 animate-scale-in shadow-2xl my-8 text-left" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-white">Edit Post</h3>
              <button onClick={() => setEditPost(null)} className="p-1.5 rounded-lg hover:bg-white/10 text-gray-400 hover:text-white transition-colors">
                <X size={20} />
              </button>
            </div>

            {editError && (
              <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm">
                {editError}
              </div>
            )}

            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">Title *</label>
                <input
                  type="text"
                  placeholder="Post Title"
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  className="w-full bg-white/[0.03] border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all placeholder:text-gray-600 font-bold"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">Content *</label>
                <textarea
                  rows={6}
                  placeholder="What's on your mind?..."
                  value={editContent}
                  onChange={(e) => setEditContent(e.target.value)}
                  className="w-full bg-white/[0.03] border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all resize-y placeholder:text-gray-600 min-h-[120px]"
                />
              </div>

              {/* Media selection */}
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">Attach Media</label>
                <div className="flex gap-4 mb-3">
                  <button
                    onClick={() => handleFileSelect("image")}
                    disabled={editUploading}
                    className="flex items-center gap-2 px-4 py-2.5 bg-white/5 hover:bg-white/10 rounded-xl text-sm text-gray-300 hover:text-white transition-colors disabled:opacity-50"
                  >
                    <ImageIcon size={16} /> Image
                  </button>
                  <button
                    onClick={() => handleFileSelect("video")}
                    disabled={editUploading}
                    className="flex items-center gap-2 px-4 py-2.5 bg-white/5 hover:bg-white/10 rounded-xl text-sm text-gray-300 hover:text-white transition-colors disabled:opacity-50"
                  >
                    <Video size={16} /> Video
                  </button>
                </div>

                {editUploading && (
                  <div className="flex items-center gap-3 p-3 bg-indigo-500/10 border border-indigo-500/20 rounded-xl">
                    <Loader2 size={16} className="text-indigo-400 animate-spin" />
                    <span className="text-indigo-300 text-xs">Uploading...</span>
                  </div>
                )}

                {editUploadError && (
                  <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-xs flex items-center justify-between">
                    {editUploadError}
                    <button onClick={() => setEditUploadError("")} className="text-red-400 hover:text-red-300">
                      <X size={14} />
                    </button>
                  </div>
                )}

                {editMediaPreview && !editUploading && (
                  <div className="relative rounded-xl overflow-hidden border border-white/10 w-48 h-32 mt-2">
                    {editMediaType === "image" ? (
                      <img src={editMediaPreview} alt="Preview" className="w-full h-full object-cover" />
                    ) : (
                      <video src={editMediaPreview} className="w-full h-full object-cover" />
                    )}
                    <button
                      onClick={removeMedia}
                      className="absolute top-2 right-2 p-1 bg-black/70 rounded-full text-white hover:bg-red-500 transition-colors"
                    >
                      <X size={14} />
                    </button>
                  </div>
                )}
              </div>

              {/* Publishing Status selection */}
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">Publishing Status</label>
                <div className="grid grid-cols-2 gap-4">
                  <button
                    type="button"
                    onClick={() => setEditStatus("draft")}
                    className={`p-3 rounded-xl border text-left transition-all ${
                      editStatus === "draft"
                        ? "bg-yellow-500/10 border-yellow-500/40 text-white"
                        : "bg-white/[0.03] border-white/10 text-gray-400 hover:bg-white/5"
                    }`}
                  >
                    <div className="font-semibold text-sm mb-1 text-white">📂 Save as Draft</div>
                    <div className="text-[10px] text-gray-400 leading-tight">Keep it private to edit later.</div>
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditStatus("published")}
                    className={`p-3 rounded-xl border text-left transition-all ${
                      editStatus === "published"
                        ? "bg-green-500/10 border-green-500/40 text-white"
                        : "bg-white/[0.03] border-white/10 text-gray-400 hover:bg-white/5"
                    }`}
                  >
                    <div className="font-semibold text-sm mb-1 text-white">🚀 Publish Now</div>
                    <div className="text-[10px] text-gray-400 leading-tight">Publish to matching visibility.</div>
                  </button>
                </div>
              </div>

              {/* Visibility selection */}
              {editStatus === "published" && (
                <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">Who can see this?</label>
                <div className="grid grid-cols-2 gap-4">
                  <button
                    type="button"
                    onClick={() => setEditVisibility("public")}
                    className={`p-3 rounded-xl border text-left transition-all ${
                      editVisibility === "public"
                        ? "bg-indigo-500/10 border-indigo-500/40 text-white"
                        : "bg-white/[0.03] border-white/10 text-gray-400 hover:bg-white/5"
                    }`}
                  >
                    <div className="font-semibold text-sm mb-1 text-white">Public</div>
                    <div className="text-[10px] text-gray-400 leading-tight">Visible to everyone.</div>
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditVisibility("tier")}
                    className={`p-3 rounded-xl border text-left transition-all ${
                      editVisibility === "tier"
                        ? "bg-indigo-500/10 border-indigo-500/40 text-white"
                        : "bg-white/[0.03] border-white/10 text-gray-400 hover:bg-white/5"
                    }`}
                  >
                    <div className="font-semibold text-sm mb-1 text-white">Supporters Only</div>
                    <div className="text-[10px] text-gray-400 leading-tight">Only selected tiers.</div>
                  </button>
                </div>

                {editVisibility === "tier" && (
                  <div className="mt-4 pl-4 border-l-2 border-indigo-500/30 space-y-2 max-h-36 overflow-y-auto">
                    {availableTiers.length > 0 ? (
                      availableTiers.map((tier) => (
                        <label key={tier.id} className="flex items-center gap-3 p-1.5 hover:bg-white/5 rounded-lg cursor-pointer text-sm">
                          <input
                            type="checkbox"
                            checked={editSelectedTiers.includes(tier.id)}
                            onChange={() => handleTierToggle(tier.id)}
                            className="rounded bg-gray-800 border-gray-600 text-indigo-600 focus:ring-indigo-600"
                          />
                          <span className="text-gray-300 font-medium">{tier.name}</span>
                          <span className="text-gray-500 text-xs ml-auto">{"₹"}{tier.price}{"/mo"}</span>
                        </label>
                      ))
                    ) : (
                      <p className="text-xs text-gray-500">No tiers available.</p>
                    )}
                  </div>
                )}
              </div>
              )}
            </div>

            <div className="flex gap-3 mt-8 pt-6 border-t border-white/5">
              <button onClick={() => setEditPost(null)} className="flex-1 py-2.5 rounded-xl glass glass-hover text-gray-300 font-medium text-sm transition-all">
                Cancel
              </button>
              <button
                onClick={handleSaveEdit}
                disabled={!editTitle.trim() || !editContent.trim() || editSaving || editUploading || (editVisibility === "tier" && editSelectedTiers.length === 0)}
                className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 hover:scale-[1.02] text-white font-medium text-sm transition-all disabled:opacity-50"
              >
                {editSaving ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
