import { motion } from "motion/react";
import { HelpCircle, Mail, MessageCircle, BookOpen } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

const MESSAGES_KEY = "fw_support_messages";

const faqs = [
  { q: "How do I create an account?", a: "Click the Sign Up button on the navigation bar and fill in your email and password. You'll receive a verification code to confirm your account." },
  { q: "Is FlickWave free to use?", a: "FlickWave offers a free tier with ad-supported listening. Premium subscriptions remove ads and unlock offline downloads." },
  { q: "How do I report a problem with a song?", a: "Use the contact form below or email us directly. Include the song title and a description of the issue." },
  { q: "Can I upload my own music?", a: "Artist accounts can upload music through our artist portal. Contact us to learn more about becoming a FlickWave artist." },
  { q: "How does the trending algorithm work?", a: "Trending songs are ranked based on play count, recent listening activity, and user engagement metrics." },
];

export function Support() {
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [name, setName]       = useState("");
  const [email, setEmail]     = useState("");
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);

  const inputCls = "w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 focus:border-violet-400 focus:ring-2 focus:ring-violet-100 dark:focus:ring-violet-900 outline-none text-gray-900 dark:text-white";

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim() || !message.trim()) {
      toast.error("Please fill in all fields");
      return;
    }
    setSending(true);

    // Save to localStorage so admin panel can read it
    try {
      const stored = JSON.parse(localStorage.getItem(MESSAGES_KEY) || "[]");
      stored.unshift({
        id:        Date.now().toString(),
        name:      name.trim(),
        email:     email.trim(),
        message:   message.trim(),
        createdAt: new Date().toISOString(),
        read:      false,
      });
      localStorage.setItem(MESSAGES_KEY, JSON.stringify(stored));
    } catch { /**/ }

    setTimeout(() => {
      toast.success("Message sent! We'll get back to you soon.");
      setName("");
      setEmail("");
      setMessage("");
      setSending(false);
    }, 600);
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <div className="text-center mb-12">
          <div className="w-16 h-16 rounded-2xl bg-violet-100 dark:bg-violet-900/40 flex items-center justify-center mx-auto mb-4">
            <HelpCircle className="w-8 h-8 text-violet-600 dark:text-violet-400" />
          </div>
          <h1 className="text-3xl text-gray-900 dark:text-white mb-2" style={{ fontWeight: 800 }}>Support Center</h1>
          <p className="text-gray-500 dark:text-gray-400">We're here to help you get the most out of FlickWave</p>
        </div>

        <div className="grid sm:grid-cols-3 gap-4 mb-12">
          {[
            { icon: Mail,          title: "Email Us",       desc: "support@flickwave.com" },
            { icon: MessageCircle, title: "Live Chat",      desc: "Available 9am–6pm EST" },
            { icon: BookOpen,      title: "Knowledge Base", desc: "Browse articles & guides" },
          ].map(({ icon: Icon, title, desc }) => (
            <motion.div key={title} whileHover={{ y: -2 }}
              className="p-6 rounded-2xl bg-gray-50 dark:bg-gray-800 border border-gray-100 dark:border-gray-700 text-center cursor-pointer hover:border-violet-200 dark:hover:border-violet-700 transition-colors">
              <Icon className="w-6 h-6 mx-auto mb-2 text-violet-500" />
              <p className="text-gray-900 dark:text-white" style={{ fontWeight: 600 }}>{title}</p>
              <p className="text-sm text-gray-500 dark:text-gray-400">{desc}</p>
            </motion.div>
          ))}
        </div>

        <h2 className="text-2xl text-gray-900 dark:text-white mb-6" style={{ fontWeight: 700 }}>Frequently Asked Questions</h2>
        <div className="space-y-3 mb-12">
          {faqs.map((faq, i) => (
            <div key={i} className="rounded-2xl border border-gray-200 dark:border-gray-700 overflow-hidden">
              <button onClick={() => setOpenFaq(openFaq === i ? null : i)}
                className="w-full text-left px-5 py-4 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                <span className="text-gray-900 dark:text-white" style={{ fontWeight: 500 }}>{faq.q}</span>
                <span className="text-gray-400 text-xl">{openFaq === i ? "−" : "+"}</span>
              </button>
              {openFaq === i && (
                <motion.div initial={{ height: 0 }} animate={{ height: "auto" }} className="px-5 pb-4">
                  <p className="text-gray-600 dark:text-gray-400 text-sm">{faq.a}</p>
                </motion.div>
              )}
            </div>
          ))}
        </div>

        <h2 className="text-2xl text-gray-900 dark:text-white mb-6" style={{ fontWeight: 700 }}>Send us a Message</h2>
        <form onSubmit={handleSend} className="space-y-4">
          <div className="grid sm:grid-cols-2 gap-4">
            <input placeholder="Your Name"  value={name}  onChange={e => setName(e.target.value)}  className={inputCls} />
            <input placeholder="Your Email" value={email} onChange={e => setEmail(e.target.value)} type="email" className={inputCls} />
          </div>
          <textarea
            placeholder="How can we help?"
            rows={4}
            value={message}
            onChange={e => setMessage(e.target.value)}
            className={inputCls + " resize-none"}
          />
          <button disabled={sending}
            className="px-6 py-3 rounded-xl bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white hover:opacity-90 transition-opacity disabled:opacity-60">
            {sending ? "Sending…" : "Send Message"}
          </button>
        </form>
      </motion.div>
    </div>
  );
}