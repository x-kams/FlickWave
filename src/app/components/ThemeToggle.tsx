import { Sun, Moon } from "lucide-react";
import { useTheme } from "../context/ThemeContext";
import { motion } from "motion/react";

export function ThemeToggle({ className = "" }: { className?: string }) {
  const { dark, toggle } = useTheme();
  return (
    <button
      onClick={toggle}
      className={`relative p-2 rounded-xl transition-colors ${
        dark ? "bg-gray-800 text-yellow-400 hover:bg-gray-700" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
      } ${className}`}
      aria-label="Toggle theme"
    >
      <motion.div
        key={dark ? "moon" : "sun"}
        initial={{ rotate: -90, opacity: 0 }}
        animate={{ rotate: 0, opacity: 1 }}
        transition={{ duration: 0.2 }}
      >
        {dark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
      </motion.div>
    </button>
  );
}
