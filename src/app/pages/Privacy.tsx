import { motion } from "motion/react";
import { Shield } from "lucide-react";

export function Privacy() {
  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <div className="flex items-center gap-3 mb-8">
          <div className="w-12 h-12 rounded-xl bg-violet-100 dark:bg-violet-900/40 flex items-center justify-center">
            <Shield className="w-6 h-6 text-violet-600 dark:text-violet-400" />
          </div>
          <div>
            <h1 className="text-3xl text-gray-900 dark:text-white" style={{ fontWeight: 800 }}>Privacy Policy</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">Last updated: April 1, 2026</p>
          </div>
        </div>

        <div className="space-y-8 text-gray-600 dark:text-gray-400">
          {[
            { title: "Information We Collect", content: "We collect information you provide directly, such as your name, email address, and account preferences. We also automatically collect usage data including listening history, device information, and interaction patterns to improve your experience." },
            { title: "How We Use Your Information", content: "Your information helps us personalize your music experience, recommend new artists and songs, improve our platform, communicate important updates, and maintain the security of your account." },
            { title: "Data Storage & Security", content: "We implement industry-standard security measures to protect your personal information. Data is encrypted in transit and at rest. We regularly audit our security practices and limit access to personal data to authorized personnel only." },
            { title: "Third-Party Services", content: "We may share anonymized, aggregated data with analytics partners. We never sell your personal information. Third-party integrations (such as social media login) are governed by their respective privacy policies." },
            { title: "Your Rights", content: "You have the right to access, correct, or delete your personal data at any time. You can export your data, opt out of marketing communications, and request account deletion through your account settings or by contacting our support team." },
            { title: "Cookies & Tracking", content: "We use essential cookies to maintain your session and preferences. Optional analytics cookies help us understand how users interact with our platform. You can manage cookie preferences in your browser settings." },
            { title: "Children's Privacy", content: "FlickWave is not intended for children under 13. We do not knowingly collect personal information from children. If you believe a child has provided us with personal data, please contact us immediately." },
            { title: "Contact Us", content: "For privacy-related inquiries, contact us at privacy@flickwave.com or through our Support page." },
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