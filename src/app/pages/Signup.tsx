import { useState } from "react";
import { Link, useNavigate } from "react-router";
import { motion } from "motion/react";
import { Music, Eye, EyeOff } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { toast } from "sonner";

export function Signup() {
  const [showPass, setShowPass] = useState(false);
  const [name, setName]         = useState("");
  const [email, setEmail]       = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading]   = useState(false);
  const navigate                = useNavigate();
  const { signup }              = useAuth();

  // signup() is async — must await it, otherwise result is a Promise
  // and result.success is always undefined → never navigates to /verify
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email || !password) {
      toast.error("Please fill in all fields");
      return;
    }
    if (password.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }
    setLoading(true);
    try {
      const result = await signup(name, email, password);
      if (result.success) {
        toast.success("Account created! Check your email for the verification code.");
        navigate("/verify");
      } else {
        toast.error(result.error ?? "Signup failed");
      }
    } catch {
      toast.error("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 bg-gradient-to-br from-fuchsia-50 via-white to-violet-50 dark:from-gray-900 dark:via-gray-900 dark:to-gray-800">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-violet-500 to-fuchsia-500 flex items-center justify-center mx-auto mb-4">
            <Music className="w-7 h-7 text-white" />
          </div>
          <h1 className="text-2xl text-gray-900 dark:text-white" style={{ fontWeight: 700 }}>Create your account</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Join FlickWave for free</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            placeholder="Full name"
            value={name}
            onChange={e => setName(e.target.value)}
            className="w-full px-4 py-3 rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 focus:border-violet-400 focus:ring-2 focus:ring-violet-100 dark:focus:ring-violet-900 outline-none text-gray-900 dark:text-white"
          />
          <input
            placeholder="Email address"
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            className="w-full px-4 py-3 rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 focus:border-violet-400 focus:ring-2 focus:ring-violet-100 dark:focus:ring-violet-900 outline-none text-gray-900 dark:text-white"
          />
          <div className="relative">
            <input
              placeholder="Password (min 6 characters)"
              type={showPass ? "text" : "password"}
              value={password}
              onChange={e => setPassword(e.target.value)}
              className="w-full px-4 py-3 rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 focus:border-violet-400 focus:ring-2 focus:ring-violet-100 dark:focus:ring-violet-900 outline-none pr-12 text-gray-900 dark:text-white"
            />
            <button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400">
              {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
          <button
            disabled={loading}
            className="w-full py-3 rounded-xl bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white shadow-lg shadow-violet-200 dark:shadow-violet-900/30 hover:shadow-violet-300 transition-all disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {loading ? "Sending OTP…" : "Create Account"}
          </button>
        </form>

        <p className="text-center text-sm text-gray-500 dark:text-gray-400 mt-6">
          Already have an account?{" "}
          <Link to="/login" className="text-violet-600 dark:text-violet-400 hover:underline" style={{ fontWeight: 500 }}>
            Sign In
          </Link>
        </p>
      </motion.div>
    </div>
  );
}