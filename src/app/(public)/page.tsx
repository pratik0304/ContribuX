import Link from "next/link";
import { 
  Coffee, 
  Shield, 
  Heart, 
  Zap, 
  ArrowRight, 
  CheckCircle2, 
  Users, 
  IndianRupee, 
  Star, 
  Palette, 
  Video, 
  Music,
  Mic,
  BookOpen,
  Gamepad2,
  GraduationCap,
  Package,
  Sparkles
} from "lucide-react";
import dbConnect from "@/lib/mongoose";
import { User } from "@/models/User";
import { Subscription } from "@/models/Subscription";

const iconMap: Record<string, any> = {
  "Videos": Video,
  "Podcasts": Mic,
  "Visual Art": Palette,
  "Music": Music,
  "Writing/Newsletters": BookOpen,
  "Games/Game Mods": Gamepad2,
  "Education/Courses": GraduationCap,
  "Physical Goods": Package,
  "Other": Sparkles
};

const steps = [
  { step: "01", title: "Create Your Page", description: "Sign up and set up your creator profile in minutes. Add your bio, photo, and social links." },
  { step: "02", title: "Set Up Tiers", description: "Create membership tiers with different price points and exclusive benefits for each level." },
  { step: "03", title: "Share Content", description: "Post public updates and gate exclusive content behind tiers to reward your top supporters." },
  { step: "04", title: "Get Paid", description: "Receive payments directly via Razorpay. Track earnings and withdraw to your bank account." },
];

const testimonials = [
  { name: "Aisha Sharma", role: "Digital Artist", quote: "ContribuX helped me turn my hobby into a full-time career. I now earn ₹1.2L/month from my art tutorials!", initial: "A", gradient: "from-pink-500 to-rose-500" },
  { name: "Rahul Dev", role: "Open Source Dev", quote: "Finally a platform that understands Indian creators. Razorpay integration and low fees make it perfect.", initial: "R", gradient: "from-indigo-500 to-blue-500" },
  { name: "Priya Beats", role: "Indie Musician", quote: "My supporters love the exclusive behind-the-scenes content. Subscriber count grew 3x in 2 months!", initial: "P", gradient: "from-purple-500 to-violet-500" },
];

const fallbackFeatured = [
  { name: "Aisha Sharma", category: "Visual Art", supporters: 245, initial: "A", gradient: "from-pink-500 to-rose-500", icon: Palette, id: "1" },
  { name: "Rahul Dev", category: "Videos", supporters: 892, initial: "R", gradient: "from-indigo-500 to-blue-500", icon: Video, id: "2" },
  { name: "Priya Beats", category: "Music", supporters: 1203, initial: "P", gradient: "from-purple-500 to-violet-500", icon: Music, id: "3" },
];

const features = [
  {
    icon: Heart,
    title: "Direct Support",
    description: "Let your audience fund your work through one-time donations or recurring subscriptions without high platform cuts.",
    gradient: "from-pink-500 to-rose-500",
    glow: "glow-pink",
  },
  {
    icon: Shield,
    title: "Exclusive Content",
    description: "Create membership tiers and gate your best content. Reward your top supporters with behind-the-scenes access.",
    gradient: "from-indigo-500 to-purple-500",
    glow: "glow-indigo",
  },
  {
    icon: Zap,
    title: "Seamless Payouts",
    description: "Powered by Razorpay. Get your earnings transferred directly to your Indian bank account with complete transparency.",
    gradient: "from-amber-500 to-orange-500",
    glow: "glow-purple",
  },
];

export default async function Home() {
  let displayCreators: any[] = [];
  try {
    await dbConnect();
    
    // Fetch real creators from the database
    const creators = await User.find({ role: "creator" })
      .select("name bio category profilePicture")
      .limit(3)
      .sort({ createdAt: -1 })
      .lean();

    // Fetch supporter count for each creator
    const dbCreators = await Promise.all(creators.map(async (c: any) => {
      const supporterCount = await Subscription.countDocuments({ creatorId: c._id, status: "active" });
      
      const gradients = [
        "from-pink-500 to-rose-500",
        "from-indigo-500 to-blue-500",
        "from-purple-500 to-violet-500",
        "from-emerald-500 to-teal-500",
        "from-orange-500 to-amber-500",
        "from-cyan-500 to-sky-500",
      ];
      const charCode = c.name.charCodeAt(0) || 0;
      const gradient = gradients[charCode % gradients.length];
      const category = c.category || "Other";
      
      return {
        id: c._id.toString(),
        name: c.name,
        category,
        supporters: supporterCount,
        initial: c.name.charAt(0).toUpperCase(),
        gradient,
        profilePicture: c.profilePicture || "",
        icon: iconMap[category] || Sparkles
      };
    }));

    displayCreators = [...dbCreators];
  } catch (err) {
    console.error("Failed to fetch dynamic creators for landing page:", err);
  }

  // Fallback to static list if database is empty or connection fails
  if (displayCreators.length < 3) {
    const existingNames = new Set(displayCreators.map(c => c.name));
    for (const fb of fallbackFeatured) {
      if (!existingNames.has(fb.name) && displayCreators.length < 3) {
        displayCreators.push(fb);
      }
    }
  }

  return (
    <div className="flex flex-col items-center w-full">
      {/* Hero Section */}
      <section className="w-full relative overflow-hidden pt-28 pb-20 md:pt-36 md:pb-28 px-4 sm:px-6 lg:px-8 flex justify-center text-center">
        {/* Mesh gradient background */}
        <div className="absolute inset-0 mesh-gradient pointer-events-none" />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-[1000px] h-[600px] opacity-25 pointer-events-none">
          <div className="absolute top-10 left-1/4 w-80 h-80 bg-indigo-600 rounded-full mix-blend-screen filter blur-[120px] animate-blob" />
          <div className="absolute top-10 right-1/4 w-80 h-80 bg-purple-600 rounded-full mix-blend-screen filter blur-[120px] animate-blob animation-delay-2000" />
          <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-80 h-80 bg-pink-600 rounded-full mix-blend-screen filter blur-[120px] animate-blob animation-delay-4000" />
        </div>



        <div className="relative z-10 max-w-4xl mx-auto animate-fade-in-up">
          <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight text-white mb-8 leading-[1.1]">
            Fund your creative <br className="hidden md:block" />
            <span className="text-gradient animate-gradient bg-[length:200%_200%]" style={{ backgroundImage: "linear-gradient(135deg, #6366f1, #a855f7, #ec4899, #6366f1)" }}>
              journey directly.
            </span>
          </h1>

          <p className="text-lg md:text-xl text-gray-400 mb-10 max-w-2xl mx-auto leading-relaxed">
            ContribuX is the open, transparent platform for independent creators to receive support, manage memberships, and share exclusive content with their biggest fans.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/register"
              className="w-full sm:w-auto px-8 py-4 bg-white text-black font-semibold rounded-full hover:scale-105 transition-all duration-300 flex items-center justify-center gap-2 shadow-lg shadow-white/10 hover:shadow-white/20"
            >
              Start Creating <ArrowRight size={18} />
            </Link>
            <Link
              href="/explore"
              className="w-full sm:w-auto px-8 py-4 glass glass-hover text-white font-semibold rounded-full transition-all duration-300 flex items-center justify-center hover:scale-105"
            >
              Explore Creators
            </Link>
          </div>

          <div className="mt-14 flex flex-wrap items-center justify-center gap-8 text-sm text-gray-500">
            <div className="flex items-center gap-2"><CheckCircle2 size={16} className="text-green-500" /> Zero hidden fees</div>
            <div className="flex items-center gap-2"><CheckCircle2 size={16} className="text-green-500" /> Instant payouts</div>
            <div className="flex items-center gap-2"><CheckCircle2 size={16} className="text-green-500" /> Own your audience</div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="w-full py-16 border-y border-white/5 bg-black/30 backdrop-blur-sm">
        <div className="max-w-5xl mx-auto px-4 grid grid-cols-2 md:grid-cols-4 gap-8 text-center stagger-children">
          <div className="group">
            <p className="text-3xl md:text-5xl font-extrabold text-white group-hover:text-gradient transition-all">3,400+</p>
            <p className="text-sm text-gray-500 mt-2">Creators</p>
          </div>
          <div className="group">
            <p className="text-3xl md:text-5xl font-extrabold text-white group-hover:text-gradient transition-all">28K+</p>
            <p className="text-sm text-gray-500 mt-2">Supporters</p>
          </div>
          <div className="group">
            <p className="text-3xl md:text-5xl font-extrabold text-white group-hover:text-gradient transition-all">₹48L+</p>
            <p className="text-sm text-gray-500 mt-2">Paid to Creators</p>
          </div>
          <div className="group">
            <p className="text-3xl md:text-5xl font-extrabold text-white group-hover:text-gradient transition-all">4.9★</p>
            <p className="text-sm text-gray-500 mt-2">Average Rating</p>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="w-full py-24 px-4 sm:px-6 lg:px-8 relative">
        <div className="absolute inset-0 mesh-gradient opacity-50 pointer-events-none" />
        <div className="max-w-7xl mx-auto relative z-10">
          <div className="text-center mb-16 animate-fade-in-up">
            <h2 className="text-3xl md:text-5xl font-bold text-white mb-4">Everything you need to <span className="text-gradient">thrive</span></h2>
            <p className="text-gray-500 max-w-2xl mx-auto">We provide the tools, you provide the creativity. A complete ecosystem for modern digital creators.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 stagger-children">
            {features.map((f) => {
              const Icon = f.icon;
              return (
                <div key={f.title} className="glass-card rounded-3xl p-8 group">
                  <div className={`w-14 h-14 bg-gradient-to-br ${f.gradient} rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 group-hover:rotate-3 transition-all duration-300 shadow-lg`}>
                    <Icon size={28} className="text-white" />
                  </div>
                  <h3 className="text-xl font-bold text-white mb-3">{f.title}</h3>
                  <p className="text-gray-500 leading-relaxed">{f.description}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="w-full py-24 bg-black/50 px-4 sm:px-6 lg:px-8 border-y border-white/5">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-bold text-white mb-4">How it <span className="text-gradient">works</span></h2>
            <p className="text-gray-500 max-w-xl mx-auto">Get set up and start earning in 4 simple steps.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 stagger-children">
            {steps.map((s) => (
              <div key={s.step} className="relative glass-card rounded-2xl p-6 group">
                <span className="text-6xl font-extrabold text-white/[0.03] absolute top-4 right-4 group-hover:text-white/[0.06] transition-colors">{s.step}</span>
                <div className="relative z-10">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 text-white flex items-center justify-center text-sm font-bold mb-4 shadow-lg shadow-indigo-500/20">{s.step}</div>
                  <h3 className="text-white font-bold mb-2">{s.title}</h3>
                  <p className="text-sm text-gray-500 leading-relaxed">{s.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Creators */}
      <section className="w-full py-24 px-4 sm:px-6 lg:px-8">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-bold text-white mb-4">Featured <span className="text-gradient">Creators</span></h2>
            <p className="text-gray-500 max-w-xl mx-auto">Discover talented creators already thriving on ContribuX.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 stagger-children">
            {displayCreators.map((c) => {
              const Icon = c.icon;
              return (
                <Link key={c.id} href={c.id.length === 1 ? "/explore" : `/creator/${c.id}`} className="glass-card rounded-3xl p-6 group">
                  <div className="flex items-center gap-4 mb-4">
                    {c.profilePicture ? (
                      <img 
                        src={c.profilePicture} 
                        alt={c.name} 
                        className="w-14 h-14 rounded-full object-cover shadow-lg ring-2 ring-white/5"
                      />
                    ) : (
                      <div className={`w-14 h-14 rounded-full bg-gradient-to-br ${c.gradient} flex items-center justify-center text-white text-xl font-bold shadow-lg ring-2 ring-white/5`}>
                        {c.initial}
                      </div>
                    )}
                    <div>
                      <h3 className="text-white font-bold group-hover:text-indigo-400 transition-colors">{c.name}</h3>
                      <p className="text-xs text-gray-600 flex items-center gap-1"><Icon size={12} /> {c.category}</p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-600">{c.supporters.toLocaleString()} supporters</span>
                    <span className="text-xs bg-indigo-500/20 text-indigo-400 px-3 py-1 rounded-full font-medium group-hover:bg-indigo-500/30 transition-colors">View Profile →</span>
                  </div>
                </Link>
              );
            })}
          </div>
          <div className="text-center mt-10">
            <Link href="/explore" className="text-indigo-400 hover:text-indigo-300 font-medium transition-colors inline-flex items-center gap-1 hover:gap-2">
              View all creators <ArrowRight size={16} />
            </Link>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="w-full py-24 bg-black/50 px-4 sm:px-6 lg:px-8 border-y border-white/5">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-bold text-white mb-4">Loved by <span className="text-gradient">creators</span></h2>
            <p className="text-gray-500 max-w-xl mx-auto">Hear from creators who are already building their independence on ContribuX.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 stagger-children">
            {testimonials.map((t) => (
              <div key={t.name} className="glass-card rounded-2xl p-6">
                <div className="flex gap-1 mb-4">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} size={14} className="text-yellow-400 fill-yellow-400" />
                  ))}
                </div>
                <p className="text-gray-300 text-sm leading-relaxed mb-6">&ldquo;{t.quote}&rdquo;</p>
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-full bg-gradient-to-br ${t.gradient} flex items-center justify-center text-white font-bold text-sm shadow-lg`}>
                    {t.initial}
                  </div>
                  <div>
                    <p className="text-white font-medium text-sm">{t.name}</p>
                    <p className="text-xs text-gray-600">{t.role}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="w-full py-32 px-4 relative overflow-hidden flex justify-center">
        <div className="absolute inset-0 mesh-gradient pointer-events-none" />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent to-indigo-900/10 pointer-events-none" />
        <div className="max-w-4xl mx-auto text-center relative z-10 animate-fade-in-up">
          <h2 className="text-4xl md:text-6xl font-bold text-white mb-6">Ready to take <span className="text-gradient">control</span>?</h2>
          <p className="text-xl text-gray-500 mb-10 max-w-2xl mx-auto">
            Join thousands of creators who are already funding their passion directly through their audience.
          </p>
          <Link
            href="/register"
            className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-bold rounded-full hover:shadow-[0_0_40px_-5px_rgba(99,102,241,0.4)] transition-all hover:scale-105 shadow-lg shadow-indigo-500/20"
          >
            Create Your Page <ArrowRight size={20} />
          </Link>
        </div>
      </section>
    </div>
  );
}
