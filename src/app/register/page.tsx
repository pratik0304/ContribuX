"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { 
  Coffee, 
  Palette, 
  Heart, 
  Loader2, 
  Eye, 
  EyeOff, 
  CheckCircle2,
  Video,
  Mic,
  Music,
  BookOpen,
  Gamepad2,
  GraduationCap,
  Package,
  Sparkles
} from "lucide-react";

const CATEGORIES = [
  { name: "Videos", icon: Video },
  { name: "Podcasts", icon: Mic },
  { name: "Visual Art", icon: Palette },
  { name: "Music", icon: Music },
  { name: "Writing/Newsletters", icon: BookOpen },
  { name: "Games/Game Mods", icon: Gamepad2 },
  { name: "Education/Courses", icon: GraduationCap },
  { name: "Physical Goods", icon: Package },
  { name: "Other", icon: Sparkles },
];

export default function RegisterPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<"creator" | "supporter">("creator");
  const [category, setCategory] = useState("");
  const [step, setStep] = useState(1);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [success, setSuccess] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email || !password) {
      setError("All fields are required");
      return;
    }
    if (password.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }

    if (role === "creator" && step === 1) {
      setStep(2);
      return;
    }

    if (role === "creator" && !category) {
      setError("Please select a category to continue");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password, role, category }),
      });

      if (res.ok) {
        setSuccess(true);
        setTimeout(() => router.push("/login"), 1500);
      } else {
        const data = await res.json();
        setError(data.message || "Registration failed");
      }
    } catch {
      setError("An error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="flex-1 flex items-center justify-center min-h-[calc(100vh-16rem)] py-12 px-4">
        <div className="text-center animate-scale-in">
          <div className="w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle2 size={40} className="text-green-400" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">Account Created! 🎉</h2>
          <p className="text-gray-500">Redirecting you to login...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex items-center justify-center min-h-[calc(100vh-16rem)] py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Background effects */}
      <div className="absolute inset-0 mesh-gradient pointer-events-none" />
      <div className="absolute top-1/4 right-1/4 w-96 h-96 bg-pink-500/15 rounded-full mix-blend-screen filter blur-[120px] pointer-events-none animate-blob" />
      <div className="absolute bottom-1/4 left-1/4 w-96 h-96 bg-indigo-500/10 rounded-full mix-blend-screen filter blur-[120px] pointer-events-none animate-blob animation-delay-2000" />

      <div className={`w-full space-y-8 glass rounded-3xl p-8 relative z-10 animate-scale-in shadow-2xl shadow-black/30 transition-all duration-300 ${step === 2 ? 'max-w-2xl' : 'max-w-md'}`}>
        {step === 1 ? (
          <>
            {/* Header */}
            <div className="text-center">
              <div className="flex justify-center mb-4">
                <div className="relative">
                  <div className="bg-gradient-to-br from-indigo-500 to-purple-600 text-white p-3 rounded-2xl shadow-lg shadow-indigo-500/25">
                    <Coffee size={32} />
                  </div>
                  <div className="absolute inset-0 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl blur-xl opacity-30" />
                </div>
              </div>
              <h2 className="mt-6 text-3xl font-extrabold text-white">Create an account</h2>
              <p className="mt-2 text-sm text-gray-500">
                Already have an account?{" "}
                <Link href="/login" className="font-medium text-indigo-400 hover:text-indigo-300 transition-colors">
                  Sign in
                </Link>
              </p>
            </div>

            <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
              {/* Role Selector */}
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-3">I am a...</label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setRole("creator")}
                    className={`flex flex-col items-center gap-2 p-4 rounded-2xl border-2 transition-all duration-200 ${
                      role === "creator"
                        ? "border-indigo-500 bg-indigo-500/10 shadow-lg shadow-indigo-500/10 scale-[1.02]"
                        : "border-white/10 bg-white/[0.02] hover:border-white/20"
                    }`}
                  >
                    <Palette size={24} className={`transition-colors ${role === "creator" ? "text-indigo-400" : "text-gray-500"}`} />
                    <span className={`text-sm font-medium ${role === "creator" ? "text-white" : "text-gray-500"}`}>Creator</span>
                    <span className="text-[10px] text-gray-600">I create content</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setRole("supporter")}
                    className={`flex flex-col items-center gap-2 p-4 rounded-2xl border-2 transition-all duration-200 ${
                      role === "supporter"
                        ? "border-emerald-500 bg-emerald-500/10 shadow-lg shadow-emerald-500/10 scale-[1.02]"
                        : "border-white/10 bg-white/[0.02] hover:border-white/20"
                    }`}
                  >
                    <Heart size={24} className={`transition-colors ${role === "supporter" ? "text-emerald-400" : "text-gray-500"}`} />
                    <span className={`text-sm font-medium ${role === "supporter" ? "text-white" : "text-gray-500"}`}>Supporter</span>
                    <span className="text-[10px] text-gray-600">I support creators</span>
                  </button>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">Full Name</label>
                  <input
                    type="text"
                    required
                    className="appearance-none rounded-xl relative block w-full px-4 py-3.5 bg-white/[0.03] border border-white/10 text-white placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 sm:text-sm transition-all duration-200"
                    placeholder="Your full name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">Email address</label>
                  <input
                    type="email"
                    required
                    className="appearance-none rounded-xl relative block w-full px-4 py-3.5 bg-white/[0.03] border border-white/10 text-white placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 sm:text-sm transition-all duration-200"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">Password</label>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      required
                      className="appearance-none rounded-xl relative block w-full px-4 py-3.5 bg-white/[0.03] border border-white/10 text-white placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 sm:text-sm transition-all duration-200 pr-12"
                      placeholder="Min 6 characters"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-600 hover:text-gray-400 transition-colors"
                    >
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>
              </div>

              {error && (
                <div className="text-red-400 text-sm bg-red-500/10 p-3.5 rounded-xl border border-red-500/20 text-center animate-shake">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="group relative w-full flex justify-center py-3.5 px-4 border border-transparent text-sm font-semibold rounded-xl text-white bg-gradient-to-r from-indigo-500 to-purple-600 hover:shadow-lg hover:shadow-indigo-500/25 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-all duration-200 disabled:opacity-50 hover:scale-[1.02]"
              >
                {role === "creator" ? "Continue" : "Sign up"}
              </button>
            </form>
          </>
        ) : (
          <form className="space-y-6 animate-fade-in" onSubmit={handleSubmit}>
            <div className="text-center">
              <h2 className="text-3xl font-extrabold text-white">What do you create?</h2>
              <p className="mt-2 text-sm text-gray-400">
                Customize your experience by selecting all that apply.
              </p>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 my-6">
              {CATEGORIES.map((cat) => {
                const IconComponent = cat.icon;
                const isSelected = category === cat.name;
                return (
                  <button
                    key={cat.name}
                    type="button"
                    onClick={() => setCategory(cat.name)}
                    className={`flex flex-col items-center justify-center p-5 rounded-2xl border-2 transition-all duration-200 text-center gap-2 ${
                      isSelected
                        ? "border-indigo-500 bg-indigo-500/10 shadow-lg shadow-indigo-500/10 scale-[1.02]"
                        : "border-white/10 bg-white/[0.02] hover:border-white/20 hover:bg-white/[0.04]"
                    }`}
                  >
                    <IconComponent size={24} className={`transition-colors ${isSelected ? "text-indigo-400" : "text-gray-500"}`} />
                    <span className={`text-xs font-semibold ${isSelected ? "text-white" : "text-gray-400"}`}>
                      {cat.name}
                    </span>
                  </button>
                );
              })}
            </div>

            {error && (
              <div className="text-red-400 text-sm bg-red-500/10 p-3.5 rounded-xl border border-red-500/20 text-center animate-shake">
                {error}
              </div>
            )}

            <div className="space-y-4">
              <button
                type="submit"
                disabled={loading || !category}
                className="group relative w-full flex justify-center py-3.5 px-4 border border-transparent text-sm font-semibold rounded-xl text-white bg-gradient-to-r from-indigo-500 to-purple-600 hover:shadow-lg hover:shadow-indigo-500/25 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-all duration-200 disabled:opacity-50 hover:scale-[1.02]"
              >
                {loading ? (
                  <span className="flex items-center gap-2">
                    <Loader2 size={18} className="animate-spin" />
                    Creating account...
                  </span>
                ) : (
                  "Sign up"
                )}
              </button>

              <button
                type="button"
                onClick={() => setStep(1)}
                className="w-full text-center text-sm font-medium text-gray-500 hover:text-gray-300 transition-colors block py-2"
              >
                Back
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
