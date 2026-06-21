"use client";

import Link from "next/link";
import { Heart, Users, Lock, Eye, Share2, CheckCircle2, X, IndianRupee, Shield, LogIn, MessageSquare, Coffee, Loader2 } from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useSubscriptions } from "@/lib/useSubscriptions";

// ── Razorpay Payment Modal ──
function PaymentModal({ tier, creator, onClose, onSuccess }: {
  tier: any;
  creator: any;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const { data: session } = useSession();
  const [step, setStep] = useState<"confirm" | "processing" | "success" | "error">("confirm");
  const [errorMsg, setErrorMsg] = useState("");
  const [paymentId, setPaymentId] = useState("");

  const initiatePayment = async () => {
    setStep("processing");
    setErrorMsg("");

    try {
      // Step 1: Create order on server
      const orderRes = await fetch("/api/razorpay/order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: tier.price,
          currency: "INR",
          receipt: `rcpt_${String(tier.id).slice(-8)}_${Date.now()}`,
          notes: {
            creatorName: creator.name,
            tierName: tier.name,
          },
        }),
      });

      const order = await orderRes.json();
      if (!orderRes.ok) throw new Error(order.error || "Failed to create order");

      // Step 2: Open Razorpay Checkout
      const options = {
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
        amount: order.amount,
        currency: order.currency,
        name: "ContribuX",
        description: `${tier.name} - ${creator.name}`,
        order_id: order.id,
        handler: async function (response: any) {
          // Step 3: Verify payment on server AND persist subscription
          try {
            const supporterId = (session?.user as any)?.id;
            const verifyRes = await fetch("/api/razorpay/verify", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
                // Send subscription data for DB persistence
                creatorId: creator.id,
                tierId: tier.id,
                supporterId: supporterId,
                amount: tier.price,
              }),
            });

            const verifyData = await verifyRes.json();
            if (verifyData.verified) {
              setPaymentId(response.razorpay_payment_id);
              setStep("success");
            } else {
              setErrorMsg("Payment verification failed. Please contact support.");
              setStep("error");
            }
          } catch {
            setErrorMsg("Payment verification failed. Please try again.");
            setStep("error");
          }
        },
        prefill: {
          email: session?.user?.email || "",
          name: session?.user?.name || "",
        },
        theme: {
          color: "#6366f1",
        },
        modal: {
          ondismiss: function () {
            setStep("confirm");
          },
        },
      };

      const rzp = new (window as any).Razorpay(options);
      rzp.on("payment.failed", function (response: any) {
        setErrorMsg(response.error?.description || "Payment failed. Please try again.");
        setStep("error");
      });
      rzp.open();
    } catch (error: any) {
      setErrorMsg(error.message || "Something went wrong. Please try again.");
      setStep("error");
    }
  };

  const handleDone = () => {
    onSuccess();
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-[#0f0f1a] border border-white/10 rounded-3xl w-full max-w-md overflow-hidden shadow-2xl animate-scale-in" onClick={(e) => e.stopPropagation()}>

        {step === "confirm" && (
          <>
            {/* Header */}
            <div className="bg-gradient-to-r from-indigo-600 to-purple-600 p-6 relative">
              <button onClick={onClose} className="absolute top-4 right-4 text-white/70 hover:text-white transition-colors">
                <X size={20} />
              </button>
              <div className="flex items-center gap-2 mb-3">
                <Shield size={18} className="text-white/80" />
                <span className="text-white/80 text-sm font-medium">Secured by Razorpay</span>
              </div>
              <p className="text-white/70 text-sm">Subscribe to {creator.name}</p>
              <p className="text-white text-3xl font-bold mt-1">₹{tier.price}<span className="text-base font-normal text-white/70">/month</span></p>
            </div>

            {/* Tier Info */}
            <div className="p-6 space-y-5">
              <div className="glass rounded-xl p-4">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm text-gray-300 font-medium">{tier.name} Tier</span>
                  <span className="text-xs bg-indigo-500/20 text-indigo-400 px-2 py-0.5 rounded-full">Monthly</span>
                </div>
                <ul className="space-y-1">
                  {tier.benefits?.map((b: string, i: number) => (
                    <li key={i} className="text-xs text-gray-500 flex items-center gap-2">
                      <CheckCircle2 size={12} className="text-green-400" /> {b}
                    </li>
                  ))}
                </ul>
              </div>

              <button
                onClick={initiatePayment}
                className="w-full py-3.5 bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-bold rounded-xl hover:shadow-[0_0_25px_-5px_rgba(99,102,241,0.5)] transition-all hover:scale-[1.02] flex items-center justify-center gap-2"
              >
                <IndianRupee size={18} />
                Pay ₹{tier.price} with Razorpay
              </button>

              <p className="text-[10px] text-gray-600 text-center">
                Test mode — use Razorpay test cards. No real charges.
              </p>
            </div>
          </>
        )}

        {step === "processing" && (
          <div className="p-12 text-center">
            <div className="w-16 h-16 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-6" />
            <h3 className="text-xl font-bold text-white mb-2">Initiating Payment...</h3>
            <p className="text-gray-500 text-sm">Opening Razorpay checkout</p>
          </div>
        )}

        {step === "success" && (
          <div className="p-12 text-center animate-scale-in">
            <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle2 size={40} className="text-green-400" />
            </div>
            <h3 className="text-xl font-bold text-white mb-2">Payment Successful! 🎉</h3>
            <p className="text-gray-400 text-sm mb-2">You are now a <strong className="text-white">{tier.name}</strong> of {creator.name}</p>
            <p className="text-xs text-gray-600 mb-6 font-mono">{paymentId}</p>
            <button
              onClick={handleDone}
              className="w-full py-3 bg-white text-black font-bold rounded-xl hover:bg-gray-200 transition-colors"
            >
              View Exclusive Content
            </button>
          </div>
        )}

        {step === "error" && (
          <div className="p-12 text-center animate-scale-in">
            <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
              <X size={40} className="text-red-400" />
            </div>
            <h3 className="text-xl font-bold text-white mb-2">Payment Failed</h3>
            <p className="text-gray-400 text-sm mb-6">{errorMsg}</p>
            <div className="space-y-3">
              <button
                onClick={() => setStep("confirm")}
                className="w-full py-3 bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-bold rounded-xl hover:shadow-lg transition-all"
              >
                Try Again
              </button>
              <button
                onClick={onClose}
                className="w-full py-2 text-gray-500 text-sm hover:text-gray-300 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}


// ── Login Required Modal ──
function LoginRequiredModal({ onClose }: { onClose: () => void }) {
  const router = useRouter();
  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-[#0f0f1a] border border-white/10 rounded-3xl w-full max-w-sm overflow-hidden shadow-2xl animate-scale-in" onClick={(e) => e.stopPropagation()}>
        <div className="p-8 text-center">
          <div className="w-16 h-16 bg-indigo-500/20 rounded-full flex items-center justify-center mx-auto mb-5">
            <LogIn size={28} className="text-indigo-400" />
          </div>
          <h3 className="text-xl font-bold text-white mb-2">Login Required</h3>
          <p className="text-gray-500 text-sm mb-6">
            You need to be logged in to subscribe to a creator. Create a free account or sign in to continue.
          </p>
          <div className="space-y-3">
            <button
              onClick={() => router.push("/login")}
              className="w-full py-3 bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-bold rounded-xl hover:shadow-lg hover:shadow-indigo-500/25 transition-all hover:scale-[1.02] flex items-center justify-center gap-2"
            >
              <LogIn size={18} /> Sign In
            </button>
            <button
              onClick={() => router.push("/register")}
              className="w-full py-3 glass glass-hover text-gray-300 font-medium rounded-xl transition-all"
            >
              Create Account
            </button>
            <button
              onClick={onClose}
              className="w-full py-2 text-gray-600 text-sm hover:text-gray-400 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Creator Profile Page ──
export default function CreatorProfilePage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const { data: session } = useSession();
  const isOwnProfile = session && (session.user as any)?.id === id;

  const { isSubscribed } = useSubscriptions();
  const [paymentModal, setPaymentModal] = useState<{ tier: any } | null>(null);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [expandedPost, setExpandedPost] = useState<string | null>(null);
  const [localSubscribed, setLocalSubscribed] = useState<string[]>([]);
  
  const [creator, setCreator] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Check DB subscription status
  const [dbSubscribedTiers, setDbSubscribedTiers] = useState<string[]>([]);

  const [expandedComments, setExpandedComments] = useState<string | null>(null);
  const [newCommentText, setNewCommentText] = useState("");
  const [submittingComment, setSubmittingComment] = useState<string | null>(null);

  // One-time tipping states
  const [tipAmount, setTipAmount] = useState(100);
  const [customTip, setCustomTip] = useState("");
  const [tippingStep, setTippingStep] = useState<"idle" | "processing" | "success" | "error">("idle");
  const [tippingPaymentId, setTippingPaymentId] = useState("");

  const handleLikeToggle = async (postId: string) => {
    if (!session) {
      setShowLoginModal(true);
      return;
    }

    try {
      const res = await fetch(`/api/posts/${postId}/like`, {
        method: "POST",
      });
      if (res.ok) {
        const data = await res.json();
        setCreator((prev: any) => {
          if (!prev) return null;
          const updatedPosts = prev.posts_list.map((post: any) => {
            if (post.id === postId) {
              return {
                ...post,
                likes: data.likes,
                likesCount: data.likesCount,
              };
            }
            return post;
          });
          return {
            ...prev,
            posts_list: updatedPosts,
          };
        });
      }
    } catch (err) {
      console.error("Failed to toggle like:", err);
    }
  };

  const handleAddComment = async (postId: string) => {
    if (!session || !newCommentText.trim()) return;

    setSubmittingComment(postId);
    try {
      const res = await fetch(`/api/posts/${postId}/comment`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: newCommentText }),
      });

      if (res.ok) {
        const data = await res.json();
        setNewCommentText("");
        setCreator((prev: any) => {
          if (!prev) return null;
          const updatedPosts = prev.posts_list.map((post: any) => {
            if (post.id === postId) {
              const formattedComment = {
                id: data.comment.id,
                userId: data.comment.userId,
                userName: data.comment.userName,
                text: data.comment.text,
                date: new Date(data.comment.createdAt).toISOString().split("T")[0],
              };
              return {
                ...post,
                comments: [...(post.comments || []), formattedComment],
              };
            }
            return post;
          });
          return {
            ...prev,
            posts_list: updatedPosts,
          };
        });
      }
    } catch (err) {
      console.error("Failed to add comment:", err);
    } finally {
      setSubmittingComment(null);
    }
  };

  useEffect(() => {
    async function fetchCreator() {
      if (!id) return;
      try {
        const res = await fetch(`/api/creators/${id}`);
        if (res.ok) {
          const data = await res.json();
          setCreator(data);
        } else {
          router.push("/explore");
        }
      } catch (error) {
        console.error("Failed to fetch creator:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchCreator();
  }, [id, router]);

  // Check if current user is subscribed via DB
  useEffect(() => {
    async function checkSubscription() {
      const supporterId = (session?.user as any)?.id;
      if (!supporterId || !id) return;

      try {
        const res = await fetch(`/api/subscriptions/check?creatorId=${id}&supporterId=${supporterId}`);
        if (res.ok) {
          const data = await res.json();
          if (data.subscribed && data.tierId) {
            setDbSubscribedTiers([data.tierId]);
          }
        }
      } catch (err) {
        console.error("Failed to check subscription:", err);
      }
    }
    checkSubscription();
  }, [session, id]);

  // Gate subscribe actions behind auth
  const handleSubscribeClick = (tier: any) => {
    if (!session) {
      setShowLoginModal(true);
      return;
    }
    setPaymentModal({ tier });
  };

  const handleTipClick = async (amount: number) => {
    if (!session) {
      setShowLoginModal(true);
      return;
    }
    setTippingStep("processing");

    try {
      // Step 1: Create order on server
      const orderRes = await fetch("/api/razorpay/order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount,
          currency: "INR",
          receipt: `tip_${String(creator.id).slice(-8)}_${Date.now()}`,
          notes: {
            creatorName: creator.name,
            type: "donation",
          },
        }),
      });

      const order = await orderRes.json();
      if (!orderRes.ok) throw new Error(order.error || "Failed to create order");

      // Step 2: Open Razorpay Checkout
      const options = {
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
        amount: order.amount,
        currency: order.currency,
        name: "ContribuX Tipping",
        description: `Support ${creator.name} with a one-time tip`,
        order_id: order.id,
        handler: async function (response: any) {
          try {
            const supporterId = (session?.user as any)?.id;
            const verifyRes = await fetch("/api/razorpay/verify", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
                creatorId: creator.id,
                supporterId: supporterId,
                amount: amount,
                type: "donation",
              }),
            });

            const verifyData = await verifyRes.json();
            if (verifyData.verified) {
              setTippingPaymentId(response.razorpay_payment_id);
              setTippingStep("success");
              setCreator((prev: any) => prev ? { ...prev, supporters: prev.supporters + 1 } : null);
            } else {
              setTippingStep("error");
            }
          } catch (err) {
            console.error("Tip verification failed:", err);
            setTippingStep("error");
          }
        },
        prefill: {
          email: session?.user?.email || "",
          name: session?.user?.name || "",
        },
        theme: {
          color: "#6366f1",
        },
        modal: {
          ondismiss: function () {
            setTippingStep("idle");
          },
        },
      };

      const rzp = new (window as any).Razorpay(options);
      rzp.open();
    } catch (err) {
      console.error("Tipping failed:", err);
      setTippingStep("error");
    }
  };

  const isUnlocked = (post: any) => {
    if (post.isPublic) return true;
    if (isOwnProfile) return true;
    if (!post.tierId) return false;
    const tierIndex = creator.tiers.findIndex((t: any) => t.id === post.tierId);
    return creator.tiers.some((t: any, i: number) =>
      (localSubscribed.includes(t.id) || dbSubscribedTiers.includes(t.id) || isSubscribed(id, t.id)) && i >= tierIndex
    );
  };

  const isTierSubscribed = (tierId: string) => {
    return localSubscribed.includes(tierId) || dbSubscribedTiers.includes(tierId) || isSubscribed(id, tierId);
  };

  const isSubscribedToAny = 
    localSubscribed.length > 0 || 
    dbSubscribedTiers.length > 0 || 
    (creator?.tiers && creator.tiers.some((t: any) => isSubscribed(id, t.id)));

  const handlePaymentSuccess = (tier: any) => {
    // Subscription is persisted via MongoDB API during payment verification
    // Update local UI state immediately
    setLocalSubscribed((prev) => [...prev, tier.id]);
    setDbSubscribedTiers((prev) => [...prev, tier.id]);
    // Update supporter count locally
    if (creator) {
      setCreator({ ...creator, supporters: creator.supporters + 1 });
    }
  };

  return (
    <div className="flex-1 animate-fade-in">
      {/* Loading State */}
      {loading && (
        <div className="flex justify-center items-center py-40">
          <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
      )}

      {/* Profile Content */}
      {!loading && creator && (
        <>
          {/* Cover */}
          <div className="h-48 md:h-64 bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 relative overflow-hidden">
            {creator.coverPicture ? (
              <img src={creator.coverPicture} alt="Cover" className="w-full h-full object-cover" />
            ) : null}
            <div className="absolute inset-0 mesh-gradient opacity-50" />
            <div className="absolute inset-0 bg-gradient-to-t from-[#050510] to-transparent" />
          </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 -mt-16 relative z-10">
        {/* Profile Header */}
        <div className="flex flex-col md:flex-row items-start gap-6 mb-10">
          {creator.profilePicture ? (
            <img
              src={creator.profilePicture}
              alt={creator.name}
              className="w-28 h-28 rounded-2xl object-cover border-4 border-[#050510] shrink-0 shadow-2xl"
            />
          ) : (
            <div className={`w-28 h-28 rounded-2xl bg-gradient-to-br ${creator.gradient} flex items-center justify-center text-white text-4xl font-bold border-4 border-[#050510] shrink-0 shadow-2xl`}>
              {creator.initial}
            </div>
          )}
          <div className="flex-1">
            <h1 className="text-3xl font-bold text-white">{creator.name}</h1>
            <p className="text-gray-500 text-sm mt-1 mb-3">{creator.category}</p>
            <p className="text-gray-400 max-w-xl">{creator.bio}</p>
            <div className="flex items-center gap-6 mt-4 text-sm text-gray-500">
              <span className="flex items-center gap-1"><Users size={16} /> {creator.supporters} supporters</span>
              <span className="flex items-center gap-1"><Eye size={16} /> {creator.posts} posts</span>
            </div>
          </div>
          <div className="flex gap-3 items-center">
            {isSubscribedToAny && (
              <Link
                href={`/dashboard/chats?contactId=${id}`}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-medium text-sm transition-all hover:scale-105"
              >
                <MessageSquare size={18} />
                <span>Message</span>
              </Link>
            )}
            <button className="glass glass-hover text-white p-2.5 rounded-xl transition-all hover:scale-105">
              <Share2 size={18} />
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 pb-16">
          {/* Posts */}
          <div className="lg:col-span-2 space-y-4">
            <h2 className="text-xl font-bold text-white mb-4">Posts</h2>
            {creator.posts_list.length === 0 && (
              <div className="glass-card rounded-2xl p-8 text-center">
                <p className="text-gray-500">No posts yet. Check back later!</p>
              </div>
            )}
            {creator.posts_list.map((post: any) => {
              const unlocked = isUnlocked(post);
              const isExpanded = expandedPost === post.id;

              return (
                <div
                  key={post.id}
                  className="glass-card rounded-2xl p-6"
                >
                  <div className="flex items-center gap-2 mb-3">
                    {post.isPublic ? (
                      <span className="flex items-center gap-1 text-xs bg-green-500/20 text-green-400 px-2.5 py-1 rounded-full">
                        <Eye size={12} /> Public
                      </span>
                    ) : unlocked ? (
                      <span className="flex items-center gap-1 text-xs bg-emerald-500/20 text-emerald-400 px-2.5 py-1 rounded-full">
                        <CheckCircle2 size={12} /> Unlocked
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 text-xs bg-indigo-500/20 text-indigo-400 px-2.5 py-1 rounded-full">
                        <Lock size={12} /> {post.tier} only
                      </span>
                    )}
                    <span className="text-xs text-gray-600">{post.date}</span>
                  </div>

                  <h3 className="text-lg font-bold text-white mb-3">{post.title}</h3>

                  {unlocked || post.isPublic ? (
                    <>
                      {/* Show media if present */}
                      {post.mediaUrl && post.mediaType === "image" && (
                        <div className="rounded-xl overflow-hidden mb-4 border border-white/10">
                          <img src={post.mediaUrl} alt={post.title} className="w-full max-h-96 object-cover" />
                        </div>
                      )}
                      {post.mediaUrl && post.mediaType === "video" && (
                        <div className="rounded-xl overflow-hidden mb-4 border border-white/10">
                          <video src={post.mediaUrl} controls className="w-full max-h-96" />
                        </div>
                      )}

                      <div className="text-gray-400 text-sm leading-relaxed whitespace-pre-line">
                        {isExpanded ? post.content : post.content.substring(0, 200) + (post.content.length > 200 ? "..." : "")}
                      </div>
                      {post.content.length > 200 && (
                        <button
                          onClick={() => setExpandedPost(isExpanded ? null : post.id)}
                          className="text-indigo-400 text-sm mt-3 hover:text-indigo-300 transition-colors font-medium"
                        >
                          {isExpanded ? "Show less" : "Read more →"}
                        </button>
                      )}

                      {/* Likes and Comments */}
                      <div className="mt-6 pt-4 border-t border-white/5 flex flex-col gap-4">
                        <div className="flex items-center gap-6 text-sm text-gray-500">
                          <button
                            onClick={() => handleLikeToggle(post.id)}
                            className={`flex items-center gap-1.5 hover:text-red-400 transition-all duration-200 active:scale-75 ${
                              post.likes?.includes((session?.user as any)?.id) ? "text-red-500 font-medium" : ""
                            }`}
                          >
                            <Heart 
                              size={16} 
                              className={`transition-transform duration-300 ${
                                post.likes?.includes((session?.user as any)?.id) ? "scale-110" : ""
                              }`}
                              fill={post.likes?.includes((session?.user as any)?.id) ? "currentColor" : "none"} 
                            />
                            <span>{post.likesCount || 0}</span>
                          </button>
                          <button
                            onClick={() => setExpandedComments(expandedComments === post.id ? null : post.id)}
                            className="flex items-center gap-1.5 hover:text-indigo-400 transition-colors"
                          >
                            <MessageSquare size={16} />
                            <span>{post.comments?.length || 0} comments</span>
                          </button>
                        </div>

                        {/* Comments Expanded Section */}
                        {expandedComments === post.id && (
                          <div className="space-y-4 pt-2">
                            {post.comments?.length > 0 ? (
                              <div className="space-y-3 max-h-60 overflow-y-auto pr-2">
                                {post.comments.map((comment: any) => (
                                  <div key={comment.id} className="p-3 bg-white/[0.02] border border-white/5 rounded-xl text-sm">
                                    <div className="flex justify-between items-center mb-1">
                                      <span className="font-semibold text-white text-xs">{comment.userName}</span>
                                      <span className="text-[10px] text-gray-600 font-mono">{comment.date}</span>
                                    </div>
                                    <p className="text-gray-400 text-xs">{comment.text}</p>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <p className="text-xs text-gray-600 italic">No comments yet. Be the first to comment!</p>
                            )}

                            {/* Add Comment Input */}
                            <div className="flex gap-2">
                              <input
                                type="text"
                                value={newCommentText}
                                onChange={(e) => setNewCommentText(e.target.value)}
                                placeholder={session ? "Write a comment..." : "Log in to comment"}
                                disabled={!session || submittingComment === post.id}
                                className="flex-1 bg-black/45 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500 transition-colors disabled:opacity-50"
                              />
                              <button
                                onClick={() => handleAddComment(post.id)}
                                disabled={!session || !newCommentText.trim() || submittingComment === post.id}
                                className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-xl text-xs font-semibold transition-all disabled:opacity-40 flex items-center gap-1.5"
                              >
                                {submittingComment === post.id ? (
                                  <>
                                    <Loader2 size={12} className="animate-spin text-white" />
                                    <span>Sending...</span>
                                  </>
                                ) : (
                                  "Comment"
                                )}
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    </>
                  ) : (
                    <div className="mt-4 p-6 bg-white/[0.02] rounded-xl border border-dashed border-white/10 text-center">
                      <Lock size={24} className="mx-auto mb-3 text-gray-600" />
                      <p className="text-gray-500 text-sm mb-1">This content is exclusive to <strong className="text-white">{post.tier}</strong> members.</p>
                      <p className="text-gray-600 text-xs mb-4">Subscribe to unlock this and all {post.tier}-level content.</p>
                      <button
                        onClick={() => {
                          const tier = creator.tiers.find((t: any) => t.id === post.tierId);
                          if (tier) handleSubscribeClick(tier);
                        }}
                        className="text-sm bg-gradient-to-r from-indigo-500 to-purple-600 text-white px-5 py-2 rounded-full hover:shadow-lg hover:shadow-indigo-500/20 transition-all font-medium hover:scale-105"
                      >
                        Subscribe to {post.tier} · ₹{creator.tiers.find((t: any) => t.id === post.tierId)?.price}/mo
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Tiers Sidebar */}
          <div className="space-y-6">
            {/* One-Time Tip Card */}
            {creator.payoutSetup && !isOwnProfile && (
              <div className="glass-card rounded-3xl p-6 relative overflow-hidden border border-indigo-500/10 shadow-xl shadow-black/20 animate-fade-in">
                <div className="absolute -top-16 -right-16 w-32 h-32 bg-indigo-500/10 rounded-full mix-blend-screen filter blur-[50px] opacity-15 pointer-events-none" />
                <h3 className="text-lg font-bold text-white mb-1 flex items-center gap-2">
                  <Coffee size={20} className="text-indigo-400 shrink-0" />
                  Support {creator.name}
                </h3>
                <p className="text-xs text-gray-500 mb-5">Send a one-time tip to show your appreciation.</p>

                {tippingStep === "success" ? (
                  <div className="text-center py-4 animate-scale-in">
                    <div className="w-12 h-12 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-3">
                      <CheckCircle2 size={24} className="text-green-400" />
                    </div>
                    <h4 className="text-sm font-bold text-white mb-1">Thank you! 🎉</h4>
                    <p className="text-xs text-gray-500">Your donation was successful.</p>
                    <button 
                      onClick={() => setTippingStep("idle")}
                      className="text-xs text-indigo-400 hover:text-indigo-300 font-semibold mt-4 transition-colors"
                    >
                      Send another tip
                    </button>
                  </div>
                ) : tippingStep === "error" ? (
                  <div className="text-center py-4 animate-scale-in">
                    <div className="w-12 h-12 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-3">
                      <X size={24} className="text-red-400" />
                    </div>
                    <h4 className="text-sm font-bold text-white mb-1">Payment Failed</h4>
                    <p className="text-xs text-gray-500">Something went wrong during checkout.</p>
                    <button 
                      onClick={() => setTippingStep("idle")}
                      className="text-xs text-indigo-400 hover:text-indigo-300 font-semibold mt-4 transition-colors"
                    >
                      Try again
                    </button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {/* Presets */}
                    <div className="grid grid-cols-4 gap-2">
                      {[50, 100, 200, 500].map((amt) => (
                        <button
                          key={amt}
                          type="button"
                          onClick={() => {
                            setTipAmount(amt);
                            setCustomTip("");
                          }}
                          className={`py-2 px-1 text-xs font-semibold rounded-xl border text-center transition-all ${
                            tipAmount === amt && !customTip
                              ? "bg-indigo-600 text-white border-indigo-600 shadow-md shadow-indigo-600/10 scale-105"
                              : "glass text-gray-400 border-white/5 hover:border-white/10"
                          }`}
                        >
                          ₹{amt}
                        </button>
                      ))}
                    </div>

                    {/* Custom Input */}
                    <div className="relative">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 text-sm font-semibold">₹</span>
                      <input
                        type="number"
                        min="10"
                        placeholder="Other amount (min ₹10)"
                        value={customTip}
                        onChange={(e) => {
                          setCustomTip(e.target.value);
                          setTipAmount(Number(e.target.value) || 0);
                        }}
                        className="w-full bg-black/45 border border-white/10 rounded-xl pl-8 pr-4 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-500 transition-colors placeholder-gray-600"
                      />
                    </div>

                    <button
                      onClick={() => handleTipClick(tipAmount)}
                      disabled={tippingStep === "processing" || tipAmount < 10}
                      className="w-full py-3 bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-bold rounded-xl hover:shadow-lg hover:shadow-indigo-500/20 transition-all hover:scale-[1.02] disabled:opacity-50 disabled:pointer-events-none flex items-center justify-center gap-2"
                    >
                      {tippingStep === "processing" ? (
                        <>
                          <Loader2 size={16} className="animate-spin text-white" />
                          Processing...
                        </>
                      ) : (
                        `Support ₹${tipAmount}`
                      )}
                    </button>
                  </div>
                )}
              </div>
            )}

            <h2 className="text-xl font-bold text-white mb-4">Membership Tiers</h2>
            {creator.tiers.map((tier: any) => {
              const subscribed = isTierSubscribed(tier.id);
              return (
                <div
                  key={tier.id}
                  className={`border rounded-2xl p-6 transition-all duration-300 ${
                    subscribed
                      ? "bg-indigo-500/10 border-indigo-500/30 glow-border-indigo"
                      : "glass-card"
                  }`}
                >
                  {subscribed && (
                    <div className="flex items-center gap-1 text-xs text-green-400 font-medium mb-3">
                      <CheckCircle2 size={14} /> Subscribed
                    </div>
                  )}
                  <h3 className="text-xl font-bold text-white mb-1">{tier.name}</h3>
                  <div className="flex items-baseline gap-1 mb-4">
                    <span className="text-2xl font-extrabold text-white">₹{tier.price}</span>
                    <span className="text-gray-500 text-sm">/ month</span>
                  </div>
                  <ul className="space-y-2 mb-6">
                    {tier.benefits?.map((b: string, j: number) => (
                      <li key={j} className="flex items-start gap-2 text-sm text-gray-400">
                        <CheckCircle2 size={14} className="text-indigo-400 mt-0.5 shrink-0" /> {b}
                      </li>
                    ))}
                  </ul>
                  {isOwnProfile ? (
                    <button className="w-full py-2.5 glass text-indigo-400 font-medium rounded-xl cursor-default flex items-center justify-center gap-2">
                      Your Tier
                    </button>
                  ) : subscribed ? (
                    <button className="w-full py-2.5 glass text-gray-400 font-medium rounded-xl cursor-default flex items-center justify-center gap-2">
                      <CheckCircle2 size={16} className="text-green-400" /> Active
                    </button>
                  ) : (
                    <button
                      onClick={() => handleSubscribeClick(tier)}
                      className="w-full py-2.5 bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-medium rounded-xl hover:shadow-lg hover:shadow-indigo-500/20 transition-all hover:scale-[1.02]"
                    >
                      Subscribe
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </>
  )}

      {/* Login Required Modal */}
      {showLoginModal && (
        <LoginRequiredModal onClose={() => setShowLoginModal(false)} />
      )}

      {/* Payment Modal */}
      {paymentModal && (
        <PaymentModal
          tier={paymentModal.tier}
          creator={creator}
          onClose={() => setPaymentModal(null)}
          onSuccess={() => handlePaymentSuccess(paymentModal.tier)}
        />
      )}
    </div>
  );
}
