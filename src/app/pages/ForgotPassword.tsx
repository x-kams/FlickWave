import { useState } from "react";
import { Link, useNavigate } from "react-router";
import { motion, AnimatePresence } from "motion/react";
import { KeyRound, Mail, Lock, Eye, EyeOff, ArrowLeft, Check } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { toast } from "sonner";

type Step = "email" | "otp" | "password" | "done";

export function ForgotPassword() {
  const { sendResetOtp, verifyResetOtp, resetPassword } = useAuth();
  const navigate = useNavigate();

  const [step, setStep]         = useState<Step>("email");
  const [email, setEmail]       = useState("");
  const [otp, setOtp]           = useState(["", "", "", "", "", ""]);
  const [newPass, setNewPass]   = useState("");
  const [confirmPass, setConfirmPass] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading]   = useState(false);

  const inputCls = "w-full px-4 py-3 rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 focus:border-violet-400 focus:ring-2 focus:ring-violet-100 dark:focus:ring-violet-900 outline-none text-gray-900 dark:text-white";

  // ── Step 1: send OTP ───────────────────────────────────────────────────────
  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) { toast.error("Please enter your email address"); return; }
    setLoading(true);
    try {
      const result = await sendResetOtp(email.trim());
      if (result.success) {
        toast.success("Reset code sent to your email!");
        setStep("otp");
      } else {
        toast.error(result.error ?? "Something went wrong");
      }
    } finally {
      setLoading(false);
    }
  };

  // ── Step 2: verify OTP ─────────────────────────────────────────────────────
  const handleOtpChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;
    const next = [...otp];
    next[index] = value.slice(-1);
    setOtp(next);
    if (value && index < 5) {
      (document.querySelector(`#otp-${index + 1}`) as HTMLInputElement)?.focus();
    }
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      (document.querySelector(`#otp-${index - 1}`) as HTMLInputElement)?.focus();
    }
  };

  const handleOtpSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const code = otp.join("");
    if (code.length < 6) { toast.error("Please enter the complete 6-digit code"); return; }
    const result = verifyResetOtp(code);
    if (result.success) {
      toast.success("Code verified! Set your new password.");
      setStep("password");
    } else {
      toast.error(result.error ?? "Invalid code");
      setOtp(["", "", "", "", "", ""]);
      (document.querySelector("#otp-0") as HTMLInputElement)?.focus();
    }
  };

  // ── Step 3: set new password ───────────────────────────────────────────────
  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newPass.length < 6) { toast.error("Password must be at least 6 characters"); return; }
    if (newPass !== confirmPass) { toast.error("Passwords do not match"); return; }
    const result = resetPassword(newPass);
    if (result.success) {
      setStep("done");
    } else {
      toast.error(result.error ?? "Failed to reset password");
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 bg-gradient-to-br from-violet-50 via-white to-fuchsia-50 dark:from-gray-900 dark:via-gray-900 dark:to-gray-800">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-sm">

        {/* Back link */}
        {step !== "done" && (
          <Link to="/login" className="flex items-center gap-1.5 text-sm text-gray-500 dark:text-gray-400 hover:text-violet-600 dark:hover:text-violet-400 mb-8 transition-colors">
            <ArrowLeft className="w-4 h-4" /> Back to Sign In
          </Link>
        )}

        {/* Icon + heading */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-violet-500 to-fuchsia-500 flex items-center justify-center mx-auto mb-4">
            {step === "done"
              ? <Check className="w-8 h-8 text-white" />
              : step === "password"
                ? <Lock className="w-8 h-8 text-white" />
                : step === "otp"
                  ? <Mail className="w-8 h-8 text-white" />
                  : <KeyRound className="w-8 h-8 text-white" />
            }
          </div>
          <h1 className="text-2xl text-gray-900 dark:text-white" style={{ fontWeight: 700 }}>
            {step === "email"    && "Forgot password?"}
            {step === "otp"     && "Enter reset code"}
            {step === "password"&& "Set new password"}
            {step === "done"    && "Password updated!"}
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
            {step === "email"    && "Enter your email and we'll send you a reset code."}
            {step === "otp"     && (<>We sent a 6-digit code to<br /><span className="text-violet-600 dark:text-violet-400 font-semibold">{email}</span></>)}
            {step === "password"&& "Choose a strong password for your account."}
            {step === "done"    && "Your password has been reset successfully."}
          </p>
        </div>

        {/* ── STEP 1: Email ─────────────────────────────────────────── */}
        <AnimatePresence mode="wait">
          {step === "email" && (
            <motion.form key="email" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onSubmit={handleEmailSubmit} className="space-y-4">
              <input
                type="email"
                placeholder="Email address"
                value={email}
                onChange={e => setEmail(e.target.value)}
                className={inputCls}
                autoFocus
              />
              <button disabled={loading}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white shadow-lg shadow-violet-200 dark:shadow-violet-900/30 hover:shadow-violet-300 transition-all disabled:opacity-60">
                {loading ? "Sending…" : "Send Reset Code"}
              </button>
            </motion.form>
          )}

          {/* ── STEP 2: OTP ───────────────────────────────────────────── */}
          {step === "otp" && (
            <motion.form key="otp" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onSubmit={handleOtpSubmit} className="space-y-6">
              <div className="flex justify-center gap-2.5">
                {otp.map((digit, i) => (
                  <input
                    key={i}
                    id={`otp-${i}`}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={digit}
                    onChange={e => handleOtpChange(i, e.target.value)}
                    onKeyDown={e => handleOtpKeyDown(i, e)}
                    className="w-12 h-14 rounded-xl bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-600 focus:border-violet-500 dark:focus:border-violet-400 focus:ring-2 focus:ring-violet-100 dark:focus:ring-violet-900 outline-none text-center text-xl text-gray-900 dark:text-white transition-all"
                    style={{ fontWeight: 700 }}
                    autoFocus={i === 0}
                  />
                ))}
              </div>
              <button className="w-full py-3 rounded-xl bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white shadow-lg transition-all">
                Verify Code
              </button>
              <p className="text-center text-sm text-gray-500 dark:text-gray-400">
                Didn't receive it?{" "}
                <button type="button" onClick={() => { setOtp(["","","","","",""]); setStep("email"); }}
                  className="text-violet-600 dark:text-violet-400 hover:underline">
                  Try again
                </button>
              </p>
            </motion.form>
          )}

          {/* ── STEP 3: New password ──────────────────────────────────── */}
          {step === "password" && (
            <motion.form key="password" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onSubmit={handlePasswordSubmit} className="space-y-4">
              <div className="relative">
                <input
                  type={showPass ? "text" : "password"}
                  placeholder="New password (min 6 characters)"
                  value={newPass}
                  onChange={e => setNewPass(e.target.value)}
                  className={inputCls + " pr-12"}
                  autoFocus
                />
                <button type="button" onClick={() => setShowPass(!showPass)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400">
                  {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              <input
                type={showPass ? "text" : "password"}
                placeholder="Confirm new password"
                value={confirmPass}
                onChange={e => setConfirmPass(e.target.value)}
                className={inputCls}
              />
              <button className="w-full py-3 rounded-xl bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white shadow-lg transition-all">
                Update Password
              </button>
            </motion.form>
          )}

          {/* ── STEP 4: Done ──────────────────────────────────────────── */}
          {step === "done" && (
            <motion.div key="done" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
              className="text-center space-y-4">
              <div className="w-16 h-16 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center mx-auto">
                <Check className="w-8 h-8 text-emerald-600 dark:text-emerald-400" />
              </div>
              <p className="text-gray-600 dark:text-gray-400 text-sm">
                You can now sign in with your new password.
              </p>
              <button onClick={() => navigate("/login")}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white shadow-lg transition-all">
                Go to Sign In
              </button>
            </motion.div>
          )}
        </AnimatePresence>

      </motion.div>
    </div>
  );
}