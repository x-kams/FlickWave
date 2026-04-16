import { Link } from "react-router";
import { Home } from "lucide-react";
import { motion } from "motion/react";

export function NotFound() {
  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4">
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="text-center">
        <p className="text-7xl mb-4" style={{ fontWeight: 800 }}>
          <span className="bg-gradient-to-r from-violet-600 to-fuchsia-600 bg-clip-text text-transparent">404</span>
        </p>
        <h1 className="text-2xl text-gray-900 dark:text-white mb-2" style={{ fontWeight: 700 }}>Page not found</h1>
        <p className="text-gray-500 dark:text-gray-400 mb-6">The page you're looking for doesn't exist.</p>
        <Link to="/" className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-violet-600 text-white hover:bg-violet-700 transition-colors">
          <Home className="w-4 h-4" /> Go Home
        </Link>
      </motion.div>
    </div>
  );
}