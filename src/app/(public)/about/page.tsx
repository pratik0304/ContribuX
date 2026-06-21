import { Heart, Shield, Zap, Globe, Users, Code } from "lucide-react";

const team = [
  { name: "Pratik Andhare", role: "Founder & Developer", initial: "P", gradient: "from-indigo-500 to-purple-500" },
];

export default function AboutPage() {
  return (
    <div className="flex-1 py-20 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-5xl font-extrabold text-white mb-6">
            About <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-400">ContribuX</span>
          </h1>
          <p className="text-gray-400 text-lg max-w-2xl mx-auto leading-relaxed">
            ContribuX is a creator support and funding platform built to empower independent
            creators in India with transparent, low-fee monetization tools.
          </p>
        </div>

        {/* Mission */}
        <div className="bg-white/5 border border-white/10 rounded-3xl p-8 md:p-12 mb-12">
          <h2 className="text-2xl font-bold text-white mb-4">Our Mission</h2>
          <p className="text-gray-300 leading-relaxed mb-6">
            We believe every creator deserves a platform that respects their work and gives them
            full control over their earnings. ContribuX was built to solve the problems of high
            fees, limited customization, and lack of transparency that plague existing platforms.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center shrink-0">
                <Shield size={20} />
              </div>
              <div>
                <h3 className="text-white font-semibold mb-1">Transparent</h3>
                <p className="text-sm text-gray-400">No hidden fees. You see exactly where every rupee goes.</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-purple-500/20 text-purple-400 flex items-center justify-center shrink-0">
                <Globe size={20} />
              </div>
              <div>
                <h3 className="text-white font-semibold mb-1">India-First</h3>
                <p className="text-sm text-gray-400">Built with Razorpay for seamless Indian payments.</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-pink-500/20 text-pink-400 flex items-center justify-center shrink-0">
                <Heart size={20} />
              </div>
              <div>
                <h3 className="text-white font-semibold mb-1">Creator-Centric</h3>
                <p className="text-sm text-gray-400">Every feature is designed with creators in mind.</p>
              </div>
            </div>
          </div>
        </div>

        {/* Tech Stack */}
        <div className="bg-white/5 border border-white/10 rounded-3xl p-8 md:p-12 mb-12">
          <h2 className="text-2xl font-bold text-white mb-6">Technology Stack</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { name: "Next.js", desc: "Full-stack framework" },
              { name: "React", desc: "UI library" },
              { name: "MongoDB", desc: "Database" },
              { name: "Tailwind CSS", desc: "Styling" },
              { name: "NextAuth.js", desc: "Authentication" },
              { name: "Razorpay", desc: "Payments" },
              { name: "TypeScript", desc: "Type safety" },
              { name: "Vercel", desc: "Deployment" },
            ].map((tech) => (
              <div key={tech.name} className="bg-black/30 border border-white/5 rounded-xl p-4 text-center">
                <p className="text-white font-semibold">{tech.name}</p>
                <p className="text-xs text-gray-500 mt-1">{tech.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Team */}
        <div className="text-center">
          <h2 className="text-2xl font-bold text-white mb-8">Built By</h2>
          <div className="flex justify-center">
            {team.map((member) => (
              <div key={member.name} className="flex flex-col items-center">
                <div className={`w-20 h-20 rounded-full bg-gradient-to-br ${member.gradient} flex items-center justify-center text-white text-2xl font-bold mb-4`}>
                  {member.initial}
                </div>
                <p className="text-white font-bold">{member.name}</p>
                <p className="text-gray-400 text-sm">{member.role}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
