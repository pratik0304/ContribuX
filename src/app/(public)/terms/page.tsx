export default function TermsPage() {
  return (
    <div className="flex-1 py-20 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto prose prose-invert">
        <h1 className="text-4xl font-extrabold text-white mb-8">Terms of Service</h1>
        <p className="text-gray-400 mb-6">Last updated: June 1, 2026</p>

        <h2 className="text-xl font-bold text-white mt-8 mb-4">1. Acceptance of Terms</h2>
        <p className="text-gray-300 leading-relaxed mb-4">
          By accessing or using ContribuX, you agree to be bound by these Terms of Service. If you do not agree, please do not use the platform.
        </p>

        <h2 className="text-xl font-bold text-white mt-8 mb-4">2. User Accounts</h2>
        <p className="text-gray-300 leading-relaxed mb-4">
          You must provide accurate information when creating an account. You are responsible for maintaining the security of your account credentials.
        </p>

        <h2 className="text-xl font-bold text-white mt-8 mb-4">3. Creator Responsibilities</h2>
        <p className="text-gray-300 leading-relaxed mb-4">
          Creators are responsible for the content they publish. Content must not violate any applicable laws or infringe on intellectual property rights.
        </p>

        <h2 className="text-xl font-bold text-white mt-8 mb-4">4. Payments & Refunds</h2>
        <p className="text-gray-300 leading-relaxed mb-4">
          All payments are processed through Razorpay. Refunds are handled on a case-by-case basis in accordance with our refund policy.
        </p>

        <h2 className="text-xl font-bold text-white mt-8 mb-4">5. Limitation of Liability</h2>
        <p className="text-gray-300 leading-relaxed mb-4">
          ContribuX is provided &quot;as is&quot; without warranties. We are not liable for any indirect or consequential damages arising from your use of the platform.
        </p>

        <h2 className="text-xl font-bold text-white mt-8 mb-4">6. Contact</h2>
        <p className="text-gray-300 leading-relaxed">
          If you have questions about these terms, contact us at <span className="text-indigo-400">support@contribux.com</span>.
        </p>
      </div>
    </div>
  );
}
