export default function PrivacyPage() {
  return (
    <div className="flex-1 py-20 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto prose prose-invert">
        <h1 className="text-4xl font-extrabold text-white mb-8">Privacy Policy</h1>
        <p className="text-gray-400 mb-6">Last updated: June 1, 2026</p>

        <h2 className="text-xl font-bold text-white mt-8 mb-4">1. Information We Collect</h2>
        <p className="text-gray-300 leading-relaxed mb-4">
          We collect personal information such as your name, email address, and payment details when you create an account or make a transaction on ContribuX.
        </p>

        <h2 className="text-xl font-bold text-white mt-8 mb-4">2. How We Use Your Information</h2>
        <p className="text-gray-300 leading-relaxed mb-4">
          Your information is used to provide, maintain, and improve our services, process transactions, and communicate with you about your account.
        </p>

        <h2 className="text-xl font-bold text-white mt-8 mb-4">3. Data Security</h2>
        <p className="text-gray-300 leading-relaxed mb-4">
          We implement industry-standard security measures including HTTPS, password hashing, and secure API endpoints to protect your data.
        </p>

        <h2 className="text-xl font-bold text-white mt-8 mb-4">4. Third-Party Services</h2>
        <p className="text-gray-300 leading-relaxed mb-4">
          We use Razorpay for payment processing. Your payment information is handled directly by Razorpay under their privacy policy.
        </p>

        <h2 className="text-xl font-bold text-white mt-8 mb-4">5. Your Rights</h2>
        <p className="text-gray-300 leading-relaxed mb-4">
          You may request access to, correction of, or deletion of your personal data at any time by contacting us.
        </p>

        <h2 className="text-xl font-bold text-white mt-8 mb-4">6. Contact</h2>
        <p className="text-gray-300 leading-relaxed">
          For privacy concerns, reach us at <span className="text-indigo-400">privacy@contribux.com</span>.
        </p>
      </div>
    </div>
  );
}
