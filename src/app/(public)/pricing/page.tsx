import Link from "next/link";
import { Check, ArrowRight } from "lucide-react";

const plans = [
  {
    name: "Free",
    price: "₹0",
    description: "Get started and build your audience.",
    features: [
      "Creator profile page",
      "Unlimited public posts",
      "Basic analytics",
      "Community support",
    ],
    cta: "Get Started",
    highlighted: false,
  },
  {
    name: "Pro",
    price: "₹499",
    period: "/month",
    description: "Everything you need to grow and monetize.",
    features: [
      "Everything in Free",
      "Unlimited membership tiers",
      "Exclusive content gating",
      "Priority payouts",
      "Advanced analytics",
      "Custom branding",
      "Email notifications",
    ],
    cta: "Start Pro Trial",
    highlighted: true,
  },
  {
    name: "Business",
    price: "₹1,999",
    period: "/month",
    description: "For established creators and teams.",
    features: [
      "Everything in Pro",
      "Team collaboration",
      "API access",
      "Dedicated account manager",
      "Custom domain support",
      "White-label options",
      "Priority support",
    ],
    cta: "Contact Sales",
    highlighted: false,
  },
];

export default function PricingPage() {
  return (
    <div className="flex-1 py-20 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-5xl font-extrabold text-white mb-4">
            Simple, transparent{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-400">
              pricing
            </span>
          </h1>
          <p className="text-gray-400 text-lg max-w-2xl mx-auto">
            Start for free. Upgrade when you&apos;re ready to unlock the full power of ContribuX.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {plans.map((plan) => (
            <div
              key={plan.name}
              className={`rounded-3xl p-8 flex flex-col relative overflow-hidden ${
                plan.highlighted
                  ? "bg-gradient-to-b from-indigo-600/20 to-purple-600/20 border-2 border-indigo-500/50"
                  : "bg-white/5 border border-white/10"
              }`}
            >
              {plan.highlighted && (
                <div className="absolute top-0 right-0 bg-indigo-600 text-white text-xs font-bold px-4 py-1 rounded-bl-xl">
                  POPULAR
                </div>
              )}
              <h3 className="text-xl font-bold text-white">{plan.name}</h3>
              <div className="flex items-baseline gap-1 mt-4 mb-2">
                <span className="text-4xl font-extrabold text-white">{plan.price}</span>
                {plan.period && <span className="text-gray-400">{plan.period}</span>}
              </div>
              <p className="text-gray-400 text-sm mb-8">{plan.description}</p>

              <ul className="space-y-3 flex-1 mb-8">
                {plan.features.map((feature, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-gray-300">
                    <Check size={16} className="text-indigo-400 mt-0.5 shrink-0" />
                    {feature}
                  </li>
                ))}
              </ul>

              <Link
                href="/register"
                className={`w-full py-3 rounded-xl font-medium text-center flex items-center justify-center gap-2 transition-colors ${
                  plan.highlighted
                    ? "bg-white text-black hover:bg-gray-200"
                    : "bg-white/10 text-white hover:bg-white/20"
                }`}
              >
                {plan.cta} <ArrowRight size={16} />
              </Link>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
