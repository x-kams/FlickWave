import { motion } from "motion/react";
import { FileText } from "lucide-react";

export function Terms() {
  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <div className="flex items-center gap-3 mb-8">
          <div className="w-12 h-12 rounded-xl bg-fuchsia-100 dark:bg-fuchsia-900/40 flex items-center justify-center">
            <FileText className="w-6 h-6 text-fuchsia-600 dark:text-fuchsia-400" />
          </div>
          <div>
            <h1 className="text-3xl text-gray-900 dark:text-white" style={{ fontWeight: 800 }}>Terms & Conditions</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">Last updated: April 1, 2026</p>
          </div>
        </div>

        <div className="space-y-8 text-gray-600 dark:text-gray-400">
          {[
            { title: "1. Acceptance of Terms", content: "By accessing or using FlickWave, you agree to be bound by these Terms & Conditions. If you do not agree, please do not use our services. We reserve the right to update these terms at any time." },
            { title: "2. Account Registration", content: "You must provide accurate, current, and complete information during registration. You are responsible for maintaining the confidentiality of your account credentials and for all activities under your account." },
            { title: "3. Acceptable Use", content: "You agree to use FlickWave only for lawful purposes. You may not: reverse-engineer the platform, distribute copyrighted content without authorization, attempt to circumvent security measures, or use automated tools to scrape content." },
            { title: "4. Content & Intellectual Property", content: "All music, artwork, and content on FlickWave is protected by copyright and intellectual property laws. Streaming is for personal, non-commercial use only. Unauthorized reproduction or distribution is strictly prohibited." },
            { title: "5. Subscriptions & Payments", content: "Premium features require a paid subscription. Prices are subject to change with notice. Refunds are handled on a case-by-case basis. You can cancel your subscription at any time through account settings." },
            { title: "6. Termination", content: "We reserve the right to suspend or terminate accounts that violate these terms. Upon termination, your right to use the service ceases immediately. You may also delete your account at any time." },
            { title: "7. Limitation of Liability", content: "FlickWave is provided 'as is' without warranties. We are not liable for any indirect, incidental, or consequential damages arising from your use of the platform." },
            { title: "8. Governing Law", content: "These terms are governed by applicable laws. Any disputes will be resolved through binding arbitration. By using FlickWave, you consent to this dispute resolution process." },
          ].map(({ title, content }) => (
            <section key={title}>
              <h2 className="text-xl text-gray-900 dark:text-white mb-2" style={{ fontWeight: 700 }}>{title}</h2>
              <p className="text-sm leading-relaxed">{content}</p>
            </section>
          ))}
        </div>
      </motion.div>
    </div>
  );
}