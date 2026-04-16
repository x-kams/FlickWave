import { motion } from "motion/react";
import { Music, Users, Globe, Zap } from "lucide-react";
import { ImageWithFallback } from "../components/figma/ImageWithFallback";

export function About() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <div className="text-center mb-12">
          <h1 className="text-4xl text-gray-900 dark:text-white mb-4" style={{ fontWeight: 800 }}>
            About <span className="bg-gradient-to-r from-violet-600 to-fuchsia-600 bg-clip-text text-transparent">FlickWave</span>
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
            We believe music is the universal language that connects people across borders, cultures, and generations.
          </p>
        </div>

        <div className="rounded-3xl overflow-hidden mb-12 shadow-lg">
          <ImageWithFallback
            src="https://images.unsplash.com/photo-1762788109986-8dcd959eeccb?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjb25jZXJ0JTIwbXVzaWMlMjBjcm93ZCUyMHZpYnJhbnR8ZW58MXx8fHwxNzc1Mzg5NjcwfDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral"
            alt="Concert"
            className="w-full h-64 sm:h-80 object-cover"
          />
        </div>

        <div className="grid sm:grid-cols-2 gap-6 mb-12">
          {[
            { icon: Music, title: "10K+ Songs", desc: "A vast library of tracks across every genre imaginable." },
            { icon: Users, title: "500K+ Listeners", desc: "A growing community of passionate music lovers worldwide." },
            { icon: Globe, title: "50+ Countries", desc: "Available and streaming across the globe, 24/7." },
            { icon: Zap, title: "Zero Latency", desc: "Optimized streaming for instant, buffer-free playback." },
          ].map(({ icon: Icon, title, desc }, i) => (
            <motion.div key={title} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }} className="p-6 rounded-2xl bg-gradient-to-br from-violet-50 to-fuchsia-50 dark:from-violet-900/20 dark:to-fuchsia-900/20 border border-violet-100 dark:border-violet-800/50">
              <Icon className="w-8 h-8 text-violet-500 mb-3" />
              <h3 className="text-gray-900 dark:text-white mb-1" style={{ fontWeight: 700 }}>{title}</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">{desc}</p>
            </motion.div>
          ))}
        </div>

        <div className="prose max-w-none">
          <h2 className="text-2xl text-gray-900 dark:text-white mb-4" style={{ fontWeight: 700 }}>Our Mission</h2>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            FlickWave was founded in 2024 with a simple mission: make high-quality music accessible to everyone. We partner with independent artists and major labels to bring you the widest selection of music, from chart-topping hits to hidden gems.
          </p>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            Our platform is built with cutting-edge technology to deliver crystal-clear audio quality, intelligent recommendations, and a seamless experience across all your devices. Whether you're commuting, working out, or relaxing at home, FlickWave adapts to your lifestyle.
          </p>
          <h2 className="text-2xl text-gray-900 dark:text-white mb-4 mt-8" style={{ fontWeight: 700 }}>Our Team</h2>
          <p className="text-gray-600 dark:text-gray-400">
            We're a passionate team of music lovers, engineers, and designers based across multiple continents. United by our love for music and technology, we work tirelessly to create the best possible listening experience for our community.
          </p>
        </div>
      </motion.div>
    </div>
  );
}