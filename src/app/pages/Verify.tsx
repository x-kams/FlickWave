import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router";
import { motion } from "motion/react";
import { Mail, RefreshCw } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { toast } from "sonner";

export function Verify() {
  const { pendingEmail, verifyOtp, resendOtp } = useAuth();
  const navigate = useNavigate();

  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [resendTimer, setResendTimer] = useState(30);
  const [resending, setResending] = useState(false);

  const inputsRef = useRef<(HTMLInputElement | null)[]>([]);

  // If no pending verification, go back to signup
  useEffect(() => {
    if (!pendingEmail) {
      navigate("/signup");
    } else {
      inputsRef.current[0]?.focus();
    }
  }, [pendingEmail, navigate]);

  // Resend countdown
  useEffect(() => {
    if (resendTimer <= 0) return;
    const t = setTimeout(() => setResendTimer(r => r - 1), 1000);
    return () => clearTimeout(t);
  }, [resendTimer]);

  const handleChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;
    const next = [...otp];
    next[index] = value.slice(-1);
    setOtp(next);
    if (value && index < 5) inputsRef.current[index + 1]?.focus();
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      inputsRef.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const text = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    const next = [...otp];
    for (let i = 0; i < text.length; i++) next[i] = text[i];
    setOtp(next);
    inputsRef.current[Math.min(text.length, 5)]?.focus();
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const code = otp.join("");

    if (code.length < 6) {
      toast.error("Please enter the complete 6-digit code");
      return;
    }

    const result = verifyOtp(code);

    if (result.success) {
      toast.success("Email verified! Welcome to FlickWave!");
      navigate("/");
    } else {
      toast.error(result.error ?? "Verification failed");
      setOtp(["", "", "", "", "", ""]);
      inputsRef.current[0]?.focus();
    }
  };

  const handleResend = async () => {
    setResending(true);
    try {
      await resendOtp();
      toast.success("New OTP sent!");
      setResendTimer(30);
    } catch {
      toast.error("Failed to resend. Please try again.");
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 bg-gradient-to-br from-violet-50 via-white to-fuchsia-50 dark:from-gray-900 dark:via-gray-900 dark:to-gray-800">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-sm">

        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-violet-500 to-fuchsia-500 flex items-center justify-center mx-auto mb-4">
            <Mail className="w-8 h-8 text-white" />
          </div>

          <h1 className="text-2xl text-gray-900 dark:text-white font-bold">
            Verify your email
          </h1>

          <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
            We sent a 6-digit code to <br />
            <span className="text-violet-600 dark:text-violet-400 font-semibold">
              {pendingEmail}
            </span>
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="flex justify-center gap-2.5" onPaste={handlePaste}>
            {otp.map((digit, i) => (
              <input
                key={i}
                ref={el => { inputsRef.current[i] = el; }}
                type="text"
                inputMode="numeric"
                maxLength={1}
                value={digit}
                onChange={e => handleChange(i, e.target.value)}
                onKeyDown={e => handleKeyDown(i, e)}
                className="w-12 h-14 rounded-xl bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-600 focus:border-violet-500 focus:ring-2 focus:ring-violet-100 outline-none text-center text-xl font-bold text-gray-900 dark:text-white transition-all"
              />
            ))}
          </div>

          <button className="w-full py-3 rounded-xl bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white shadow-lg hover:shadow-violet-300 transition-all">
            Verify Email
          </button>
        </form>

        <div className="text-center mt-6">
          {resendTimer > 0 ? (
            <p className="text-sm text-gray-400">
              Resend code in{" "}
              <span className="text-violet-600 font-semibold">
                {resendTimer}s
              </span>
            </p>
          ) : (
            <button
              onClick={handleResend}
              disabled={resending}
              className="text-sm text-violet-600 hover:underline flex items-center gap-1.5 mx-auto disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${resending ? "animate-spin" : ""}`} />
              {resending ? "Sending…" : "Resend Code"}
            </button>
          )}
        </div>

      </motion.div>
    </div>
  );
}