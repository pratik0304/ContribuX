import Link from "next/link";
import { Coffee, Heart } from "lucide-react";

export default function Footer() {
  return (
    <footer className="relative border-t border-white/5 bg-black/60 backdrop-blur-sm py-16 mt-auto overflow-hidden">
      {/* Subtle gradient glow at top */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-1/2 h-px bg-gradient-to-r from-transparent via-indigo-500/50 to-transparent" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12">
          {/* Brand */}
          <div className="col-span-1 md:col-span-2">
            <div className="flex items-center gap-2.5 mb-4">
              <div className="bg-gradient-to-br from-indigo-500 to-purple-600 text-white p-1.5 rounded-xl">
                <Coffee size={18} />
              </div>
              <span className="font-bold text-xl tracking-tight text-gradient">
                ContribuX
              </span>
            </div>
            <p className="text-gray-500 text-sm max-w-sm leading-relaxed mb-6">
              Empowering creators in India to build their independence through direct audience support, subscriptions, and exclusive content.
            </p>
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-xs text-gray-400">
              Made with <Heart size={12} className="text-red-400 fill-red-400" /> in India 🇮🇳
            </div>
          </div>

          {/* Platform */}
          <div>
            <h3 className="font-semibold text-white mb-5 text-sm uppercase tracking-wider">Platform</h3>
            <ul className="space-y-3 text-sm text-gray-500">
              <li>
                <Link href="/explore" className="hover:text-white transition-colors duration-200 hover:translate-x-1 inline-block">
                  Explore
                </Link>
              </li>
              <li>
                <Link href="/pricing" className="hover:text-white transition-colors duration-200 hover:translate-x-1 inline-block">
                  Pricing
                </Link>
              </li>
              <li>
                <Link href="/about" className="hover:text-white transition-colors duration-200 hover:translate-x-1 inline-block">
                  About Us
                </Link>
              </li>
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h3 className="font-semibold text-white mb-5 text-sm uppercase tracking-wider">Legal</h3>
            <ul className="space-y-3 text-sm text-gray-500">
              <li>
                <Link href="/terms" className="hover:text-white transition-colors duration-200 hover:translate-x-1 inline-block">
                  Terms of Service
                </Link>
              </li>
              <li>
                <Link href="/privacy" className="hover:text-white transition-colors duration-200 hover:translate-x-1 inline-block">
                  Privacy Policy
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-16 pt-8 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-gray-600 text-sm">
            &copy; {new Date().getFullYear()} ContribuX. All rights reserved.
          </p>
          <div className="flex items-center gap-2 text-xs text-gray-600">
            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            Secured by Razorpay
          </div>
        </div>
      </div>
    </footer>
  );
}
