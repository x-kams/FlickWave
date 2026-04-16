import { useState } from "react";
import { Link, useNavigate } from "react-router";
import { motion } from "motion/react";
import { Music, Eye, EyeOff } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { toast } from "sonner";

const DEMO_EMAIL = String(import.meta.env.VITE_DEMO_EMAIL || "").trim();
const DEMO_PASSWORD = String(import.meta.env.VITE_DEMO_PASSWORD || "");

export function Login() {
  const [showPass, setShowPass] = useState(false);
  const [email, setEmail]       = useState("");
  const [password, setPassword] = useState("");
  const navigate                = useNavigate();
  const { login }               = useAuth();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) { toast.error("Please fill in all fields"); return; }
    const result = login(email, password);
    if (result.success) {
      toast.success("Welcome back!");
      navigate("/");
    } else if (result.error === "UNVERIFIED") {
      toast.info("Account not verified. Redirecting to verification…");
      setTimeout(() => navigate("/verify"), 1000);
    } else {
      toast.error(result.error);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 bg-gradient-to-br from-violet-50 via-white to-fuchsia-50 dark:from-gray-900 dark:via-gray-900 dark:to-gray-800">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-violet-500 to-fuchsia-500 flex items-center justify-center mx-auto mb-4">
            <Music className="w-7 h-7 text-white" />
          </div>
          <h1 className="text-2xl text-gray-900 dark:text-white" style={{ fontWeight: 700 }}>Welcome back</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Sign in to continue to FlickWave</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            placeholder="Email address" type="email" value={email}
            onChange={e => setEmail(e.target.value)}
            className="w-full px-4 py-3 rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 focus:border-violet-400 focus:ring-2 focus:ring-violet-100 dark:focus:ring-violet-900 outline-none text-gray-900 dark:text-white"
          />
          <div className="relative">
            <input
              placeholder="Password" type={showPass ? "text" : "password"} value={password}
              onChange={e => setPassword(e.target.value)}
              className="w-full px-4 py-3 rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 focus:border-violet-400 focus:ring-2 focus:ring-violet-100 dark:focus:ring-violet-900 outline-none pr-12 text-gray-900 dark:text-white"
            />
            <button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400">
              {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>

          {/* Forgot password link */}
          <div className="text-right">
            <Link to="/forgot-password" className="text-sm text-violet-600 dark:text-violet-400 hover:underline">
              Forgot password?
            </Link>
          </div>

          <button className="w-full py-3 rounded-xl bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white shadow-lg shadow-violet-200 dark:shadow-violet-900/30 hover:shadow-violet-300 transition-all">
            Sign In
          </button>
        </form>

        <p className="text-center text-sm text-gray-500 dark:text-gray-400 mt-6">
          Don't have an account?{" "}
          <Link to="/signup" className="text-violet-600 dark:text-violet-400 hover:underline" style={{ fontWeight: 500 }}>Sign Up</Link>
        </p>
        {DEMO_EMAIL && DEMO_PASSWORD && (
          <p className="text-center text-xs text-gray-400 dark:text-gray-500 mt-3">
            Demo: {DEMO_EMAIL} / {DEMO_PASSWORD}
          </p>
        )}
      </motion.div>
    </div>
  );
}
