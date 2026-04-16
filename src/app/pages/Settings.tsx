import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  User, Lock, Bell, Shield, Trash2, Eye, EyeOff,
  Check, Crown, Music2, Sparkles, LogOut, Camera,
  ChevronRight, AlertTriangle, Download, Loader2,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { PlanModal } from "../components/PlanModal";
import { useNavigate } from "react-router";
import { toast } from "sonner";

// ── Section tab types ──────────────────────────────────────────────────────────
type Tab = "profile" | "security" | "subscription" | "notifications" | "danger";

const TABS: { id: Tab; label: string; icon: typeof User }[] = [
  { id: "profile",       label: "Profile",       icon: User    },
  { id: "security",      label: "Security",       icon: Lock    },
  { id: "subscription",  label: "Subscription",   icon: Crown   },
  { id: "notifications", label: "Notifications",  icon: Bell    },
  { id: "danger",        label: "Danger Zone",    icon: Trash2  },
];

// ── Notification prefs stored in localStorage ──────────────────────────────────
const NOTIF_KEY = "fw_notif_prefs";
function loadNotifPrefs() {
  try { return JSON.parse(localStorage.getItem(NOTIF_KEY) || "{}"); } catch { return {}; }
}
function saveNotifPrefs(prefs: Record<string, boolean>) {
  try { localStorage.setItem(NOTIF_KEY, JSON.stringify(prefs)); } catch { /**/ }
}

const DEFAULT_NOTIFS = {
  newReleases:    true,
  recommendations: true,
  accountAlerts:  true,
  newsletter:     false,
  promotions:     false,
};

export function Settings() {
  const navigate  = useNavigate();
  const {
    user, logout,
    changePassword, updateProfile, deleteAccount, getFullUser,
  } = useAuth();

  const [tab, setTab] = useState<Tab>("profile");

  // Profile state
  const [name, setName]                 = useState(user?.name ?? "");
  const [savingProfile, setSavingProfile] = useState(false);

  // Security state
  const [currentPass, setCurrentPass]   = useState("");
  const [newPass, setNewPass]           = useState("");
  const [confirmPass, setConfirmPass]   = useState("");
  const [showCurrentPass, setShowCurrentPass] = useState(false);
  const [showNewPass, setShowNewPass]   = useState(false);
  const [savingPass, setSavingPass]     = useState(false);

  // Subscription
  const [genUsage, setGenUsage]         = useState<{ plan: string; label: string; used: number; limit: number; remaining: number; maxDuration: number; canDownload: boolean } | null>(null);

  // Plan modal state
const [planModalOpen, setPlanModalOpen] = useState(false);
const [planModalDefault, setPlanModalDefault] = useState<string | undefined>(undefined);

  // Notifications
  const [notifs, setNotifs]             = useState({ ...DEFAULT_NOTIFS, ...loadNotifPrefs() });

  // Danger zone
  const [deleteConfirm, setDeleteConfirm] = useState("");
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const fullUser = getFullUser();
  const isPremium = fullUser?.isPremium ?? false;

  // Load AI generation usage
  useEffect(() => {
    if (!user?.email) return;
    fetch(`/api/generate/usage?email=${encodeURIComponent(user.email)}`)
      .then(r => r.json())
      .then(data => { if (!data.error) setGenUsage(data); })
      .catch(() => {});
  }, [user?.email]);

  // Sync name field when user changes
  useEffect(() => { if (user?.name) setName(user.name); }, [user?.name]);

  if (!user) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center text-center px-4">
        <User className="w-12 h-12 text-gray-300 dark:text-gray-600 mb-4" />
        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Please sign in</h2>
        <button onClick={() => navigate("/login")}
          className="mt-4 px-6 py-2.5 rounded-xl bg-violet-600 text-white hover:bg-violet-700 transition-colors">
          Sign In
        </button>
      </div>
    );
  }

  // ── Handlers ─────────────────────────────────────────────────────────────────
  const handleSaveProfile = () => {
    setSavingProfile(true);
    const result = updateProfile(name);
    setTimeout(() => {
      setSavingProfile(false);
      if (result.success) toast.success("Profile updated successfully");
      else toast.error(result.error);
    }, 400);
  };

  const handleChangePassword = () => {
    if (newPass !== confirmPass) { toast.error("New passwords do not match"); return; }
    if (newPass.length < 6) { toast.error("Password must be at least 6 characters"); return; }
    setSavingPass(true);
    const result = changePassword(currentPass, newPass);
    setTimeout(() => {
      setSavingPass(false);
      if (result.success) {
        toast.success("Password changed successfully");
        setCurrentPass(""); setNewPass(""); setConfirmPass("");
      } else {
        toast.error(result.error);
      }
    }, 400);
  };

  const handleNotifChange = (key: string, value: boolean) => {
    const updated = { ...notifs, [key]: value };
    setNotifs(updated as typeof notifs);
    saveNotifPrefs(updated);
    toast.success("Notification preference saved");
  };

  const handleDeleteAccount = () => {
    if (deleteConfirm !== user.email) {
      toast.error("Email does not match. Please type your exact email to confirm.");
      return;
    }
    const result = deleteAccount();
    if (result.success) {
      toast.success("Account deleted. We're sorry to see you go.");
      navigate("/");
    } else {
      toast.error(result.error);
    }
  };

  const handleLogout = () => {
    logout();
    navigate("/");
    toast.success("Signed out successfully");
  };

  // ── Input classes ─────────────────────────────────────────────────────────────
  const inputCls = "w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 focus:border-violet-400 focus:ring-2 focus:ring-violet-100 dark:focus:ring-violet-900 outline-none text-gray-900 dark:text-white text-sm transition-colors";

  const PLAN_COLORS: Record<string, string> = {
    free:    "text-gray-600 dark:text-gray-300",
    basic:   "text-blue-600 dark:text-blue-400",
    premium: "text-amber-600 dark:text-amber-400",
  };

  return (
    <div className="min-h-screen dark:bg-gray-950 pb-20">
      {/* ── Page header ── */}
      <div className="bg-gradient-to-br from-violet-600 to-fuchsia-600 text-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-10">
          <h1 className="text-2xl sm:text-3xl font-black mb-1">Account Settings</h1>
          <p className="text-white/70 text-sm">Manage your profile, security and subscription</p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
        <div className="flex flex-col sm:flex-row gap-6">

          {/* ── Sidebar tabs ── */}
          <div className="sm:w-52 flex-shrink-0">
            {/* User card */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-4 mb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-violet-500 to-fuchsia-500 flex items-center justify-center text-white font-bold text-lg flex-shrink-0">
                  {user.name.charAt(0).toUpperCase()}
                </div>
                <div className="min-w-0">
                  <p className="font-semibold text-gray-900 dark:text-white text-sm truncate">{user.name}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{user.email}</p>
                  <div className="flex items-center gap-1 mt-1">
                    {isPremium
                      ? <span className="flex items-center gap-1 text-xs text-amber-500 font-medium"><Crown className="w-3 h-3" /> Premium</span>
                      : <span className="text-xs text-gray-400">Free Plan</span>
                    }
                  </div>
                </div>
              </div>
            </div>

            {/* Tabs */}
            <nav className="space-y-1">
              {TABS.map(({ id, label, icon: Icon }) => (
                <button
                  key={id}
                  onClick={() => setTab(id)}
                  className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-medium transition-all text-left ${
                    tab === id
                      ? "bg-violet-600 text-white shadow-sm"
                      : id === "danger"
                        ? "text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20"
                        : "text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
                  }`}
                >
                  <Icon className="w-4 h-4 flex-shrink-0" />
                  {label}
                </button>
              ))}
              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-all text-left mt-4 border-t border-gray-100 dark:border-gray-700 pt-4"
              >
                <LogOut className="w-4 h-4 flex-shrink-0" /> Sign Out
              </button>
            </nav>
          </div>

          {/* ── Main content ── */}
          <div className="flex-1 min-w-0">
            <AnimatePresence mode="wait">

              {/* ══ PROFILE ════════════════════════════════════════════════════ */}
              {tab === "profile" && (
                <motion.div key="profile" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-5">
                  <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-6">
                    <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-5 flex items-center gap-2">
                      <User className="w-5 h-5 text-violet-500" /> Profile Information
                    </h2>

                    {/* Avatar */}
                    <div className="flex items-center gap-4 mb-6 pb-6 border-b border-gray-100 dark:border-gray-700">
                      <div className="relative">
                        <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-violet-500 to-fuchsia-500 flex items-center justify-center text-white font-black text-3xl shadow-lg">
                          {user.name.charAt(0).toUpperCase()}
                        </div>
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900 dark:text-white">{user.name}</p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">{user.email}</p>
                        <p className="text-xs text-gray-400 mt-1">
                          Member since {fullUser?.createdAt ? new Date(fullUser.createdAt).toLocaleDateString("en-GB", { month: "long", year: "numeric" }) : "—"}
                        </p>
                      </div>
                    </div>

                    {/* Edit name */}
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Display Name</label>
                        <input
                          value={name}
                          onChange={e => setName(e.target.value)}
                          placeholder="Your name"
                          className={inputCls}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Email Address</label>
                        <input
                          value={user.email}
                          disabled
                          className={inputCls + " opacity-60 cursor-not-allowed"}
                        />
                        <p className="text-xs text-gray-400 mt-1.5">Email cannot be changed. Contact support if needed.</p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Account Status</label>
                        <div className="flex items-center gap-2">
                          <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 text-xs font-semibold">
                            <Check className="w-3.5 h-3.5" /> Verified
                          </span>
                          {isPremium && (
                            <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-50 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 text-xs font-semibold">
                              <Crown className="w-3.5 h-3.5" /> Premium
                            </span>
                          )}
                        </div>
                      </div>
                      <button
                        onClick={handleSaveProfile}
                        disabled={savingProfile || name === user.name}
                        className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-violet-600 text-white font-medium hover:bg-violet-700 disabled:opacity-50 transition-colors text-sm"
                      >
                        {savingProfile ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                        Save Changes
                      </button>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* ══ SECURITY ═══════════════════════════════════════════════════ */}
              {tab === "security" && (
                <motion.div key="security" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-5">

                  {/* Change password */}
                  <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-6">
                    <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-5 flex items-center gap-2">
                      <Lock className="w-5 h-5 text-violet-500" /> Change Password
                    </h2>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Current Password</label>
                        <div className="relative">
                          <input
                            type={showCurrentPass ? "text" : "password"}
                            value={currentPass}
                            onChange={e => setCurrentPass(e.target.value)}
                            placeholder="Enter current password"
                            className={inputCls + " pr-11"}
                          />
                          <button type="button" onClick={() => setShowCurrentPass(v => !v)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                            {showCurrentPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </button>
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">New Password</label>
                        <div className="relative">
                          <input
                            type={showNewPass ? "text" : "password"}
                            value={newPass}
                            onChange={e => setNewPass(e.target.value)}
                            placeholder="Min 6 characters"
                            className={inputCls + " pr-11"}
                          />
                          <button type="button" onClick={() => setShowNewPass(v => !v)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                            {showNewPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </button>
                        </div>
                        {/* Password strength indicator */}
                        {newPass && (
                          <div className="mt-2 flex gap-1">
                            {[1,2,3,4].map(i => (
                              <div key={i} className={`h-1 flex-1 rounded-full transition-colors ${
                                newPass.length >= i * 3
                                  ? newPass.length >= 10 ? "bg-emerald-500" : newPass.length >= 7 ? "bg-yellow-400" : "bg-red-400"
                                  : "bg-gray-200 dark:bg-gray-600"
                              }`} />
                            ))}
                            <span className="text-xs text-gray-400 ml-2">
                              {newPass.length >= 10 ? "Strong" : newPass.length >= 7 ? "Medium" : "Weak"}
                            </span>
                          </div>
                        )}
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Confirm New Password</label>
                        <input
                          type="password"
                          value={confirmPass}
                          onChange={e => setConfirmPass(e.target.value)}
                          placeholder="Repeat new password"
                          className={inputCls + (confirmPass && confirmPass !== newPass ? " border-red-400 focus:border-red-400" : "")}
                        />
                        {confirmPass && confirmPass !== newPass && (
                          <p className="text-xs text-red-500 mt-1">Passwords do not match</p>
                        )}
                      </div>
                      <button
                        onClick={handleChangePassword}
                        disabled={savingPass || !currentPass || !newPass || !confirmPass}
                        className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-violet-600 text-white font-medium hover:bg-violet-700 disabled:opacity-50 transition-colors text-sm"
                      >
                        {savingPass ? <Loader2 className="w-4 h-4 animate-spin" /> : <Lock className="w-4 h-4" />}
                        Update Password
                      </button>
                    </div>
                  </div>

                  {/* Session info */}
                  <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-6">
                    <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                      <Shield className="w-5 h-5 text-violet-500" /> Security Info
                    </h2>
                    <div className="space-y-3">
                      {[
                        { label: "Email verified", value: "Yes", ok: true },
                        { label: "Account status", value: fullUser?.blocked ? "Blocked" : "Active", ok: !fullUser?.blocked },
                        { label: "Two-factor auth", value: "Not available", ok: null },
                      ].map(({ label, value, ok }) => (
                        <div key={label} className="flex items-center justify-between py-2 border-b border-gray-50 dark:border-gray-700 last:border-0">
                          <span className="text-sm text-gray-600 dark:text-gray-400">{label}</span>
                          <span className={`text-sm font-medium ${
                            ok === true ? "text-emerald-600 dark:text-emerald-400" :
                            ok === false ? "text-red-500" :
                            "text-gray-400"
                          }`}>
                            {ok === true && <Check className="w-3.5 h-3.5 inline mr-1" />}
                            {value}
                          </span>
                        </div>
                      ))}
                    </div>
                    <button
                      onClick={() => navigate("/forgot-password")}
                      className="mt-4 text-sm text-violet-600 dark:text-violet-400 hover:underline flex items-center gap-1"
                    >
                      Forgot your password? Reset it <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </motion.div>
              )}

              {/* ══ SUBSCRIPTION ════════════════════════════════════════════════ */}
              {tab === "subscription" && (
                <motion.div key="subscription" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-5">

                  {/* Music streaming plan */}
                  <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-6">
                    <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-5 flex items-center gap-2">
                      <Music2 className="w-5 h-5 text-violet-500" /> Music Streaming Plan
                    </h2>
                    <div className={`flex items-center justify-between p-4 rounded-2xl mb-4 ${
                      isPremium ? "bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700" : "bg-gray-50 dark:bg-gray-700"
                    }`}>
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                          isPremium ? "bg-amber-100 dark:bg-amber-800/50" : "bg-gray-200 dark:bg-gray-600"
                        }`}>
                          {isPremium ? <Crown className="w-5 h-5 text-amber-500" /> : <Music2 className="w-5 h-5 text-gray-400" />}
                        </div>
                        <div>
                          <p className={`font-bold ${isPremium ? "text-amber-700 dark:text-amber-300" : "text-gray-700 dark:text-gray-300"}`}>
                            {isPremium ? "Premium Plan" : "Free Plan"}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            {isPremium ? "Full songs · Unlimited downloads · High quality" : "Preview only on premium songs · 3 downloads/day"}
                          </p>
                        </div>
                      </div>
                      <span className={`px-3 py-1 rounded-lg text-xs font-bold ${
                        isPremium ? "bg-amber-500 text-white" : "bg-gray-200 dark:bg-gray-600 text-gray-600 dark:text-gray-300"
                      }`}>
                        {isPremium ? "ACTIVE" : "FREE"}
                      </span>
                    </div>
                    {!isPremium && (
                      <div className="bg-violet-50 dark:bg-violet-900/20 rounded-xl p-4 text-sm text-violet-700 dark:text-violet-300">
                        <p className="font-medium mb-1">Upgrade to Premium Streaming</p>
                        <p className="text-xs text-violet-600 dark:text-violet-400">Contact your admin to upgrade your streaming plan.</p>
                      </div>
                    )}
                  </div>

                  {/* AI generation plan */}
                  <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-6">
                    <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-5 flex items-center gap-2">
                      <Sparkles className="w-5 h-5 text-violet-500" /> AI Music Generation
                    </h2>
                    {genUsage ? (
                      <div>
                        <div className="flex items-center justify-between mb-3">
                          <div>
                            <p className={`font-bold text-lg ${PLAN_COLORS[genUsage.plan] || "text-gray-700 dark:text-gray-300"}`}>
                              {genUsage.label} Plan
                            </p>
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                              Resets monthly · Max {genUsage.maxDuration}s · {genUsage.canDownload ? "Download included" : "No download"}
                            </p>
                          </div>
                          <span className={`px-2.5 py-1 rounded-lg text-xs font-bold capitalize ${
                            genUsage.plan === "premium" ? "bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300" :
                            genUsage.plan === "basic"   ? "bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400" :
                            "bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300"
                          }`}>
                            {genUsage.plan}
                          </span>
                        </div>

                        {/* Usage bar */}
                        <div className="bg-gray-100 dark:bg-gray-700 rounded-full h-2.5 mb-2 overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all ${
                              genUsage.plan === "premium" ? "bg-amber-500" :
                              genUsage.plan === "basic"   ? "bg-blue-500" : "bg-violet-500"
                            }`}
                            style={{ width: `${Math.min((genUsage.used / genUsage.limit) * 100, 100)}%` }}
                          />
                        </div>
                        <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400">
                          <span>{genUsage.used} used</span>
                          <span>{genUsage.remaining} remaining of {genUsage.limit}</span>
                        </div>

                        {/* Clickable plan cards */}
                        <div className="mt-5 grid sm:grid-cols-3 gap-3">
                          {[
                            { id: "free",    label: "Free",    emoji: "🎵", gens: "3/mo",   dur: "5s",  dl: false, tag: "" },
                            { id: "basic",   label: "Basic",   emoji: "⚡", gens: "20/mo",  dur: "30s", dl: true,  tag: "Popular" },
                            { id: "premium", label: "Premium", emoji: "👑", gens: "200/mo", dur: "60s", dl: true,  tag: "Best" },
                          ].map(p => {
                            const isCurrent = genUsage.plan === p.id;
                            return (
                              <button
                                key={p.id}
                                onClick={() => { setPlanModalDefault(p.id); setPlanModalOpen(true); }}
                                className={`relative rounded-xl border p-4 text-left text-sm transition-all hover:scale-[1.02] active:scale-[0.98] ${
                                  isCurrent
                                    ? "border-violet-500 bg-violet-50 dark:bg-violet-900/20 ring-1 ring-violet-400"
                                    : "border-gray-200 dark:border-gray-600 hover:border-violet-300 dark:hover:border-violet-600 opacity-70 hover:opacity-100"
                                } bg-white dark:bg-gray-800`}
                              >
                                {p.tag && <span className="absolute -top-2.5 right-3 px-2 py-0.5 rounded-full bg-violet-600 text-white text-[10px] font-bold">{p.tag}</span>}
                                {isCurrent && <Check className="absolute top-2.5 right-2.5 w-4 h-4 text-violet-600" />}
                                <span className="text-xl block mb-1.5">{p.emoji}</span>
                                <p className="font-bold text-gray-900 dark:text-white">{p.label}</p>
                                <p className="text-xs text-gray-500 mt-1">{p.gens}</p>
                                <p className="text-xs text-gray-500">Up to {p.dur}</p>
                                <p className={`text-xs font-medium mt-0.5 ${p.dl ? "text-emerald-500" : "text-red-400"}`}>
                                  {p.dl ? "Download ✓" : "No download"}
                                </p>
                                <p className="text-xs text-violet-600 dark:text-violet-400 mt-2 font-medium">
                                  {isCurrent ? "Your plan" : "View details →"}
                                </p>
                              </button>
                            );
                          })}
                        </div>

                        {genUsage.plan !== "premium" && (
                          <p className="mt-4 text-xs text-gray-400 dark:text-gray-500 text-center">
                            Contact your admin to upgrade your AI generation plan.
                          </p>
                        )}
                      </div>
                    ) : (
                      <div className="flex items-center justify-center py-8 text-gray-400">
                        <Loader2 className="w-5 h-5 animate-spin mr-2" /> Loading usage…
                      </div>
                    )}
                  </div>
                </motion.div>
              )}

              {/* ══ NOTIFICATIONS ═══════════════════════════════════════════════ */}
              {tab === "notifications" && (
                <motion.div key="notifications" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                  <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-6">
                    <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-5 flex items-center gap-2">
                      <Bell className="w-5 h-5 text-violet-500" /> Notification Preferences
                    </h2>
                    <div className="space-y-4">
                      {[
                        { key: "newReleases",    label: "New Releases",     desc: "When new songs or albums are uploaded" },
                        { key: "recommendations",label: "Recommendations",  desc: "AI-curated songs based on your taste" },
                        { key: "accountAlerts",  label: "Account Alerts",   desc: "Security and account activity alerts" },
                        { key: "newsletter",     label: "Newsletter",       desc: "Monthly music digest and features" },
                        { key: "promotions",     label: "Promotions",       desc: "Special offers and plan upgrades" },
                      ].map(({ key, label, desc }) => (
                        <div key={key} className="flex items-center justify-between py-3 border-b border-gray-50 dark:border-gray-700 last:border-0">
                          <div>
                            <p className="text-sm font-medium text-gray-900 dark:text-white">{label}</p>
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{desc}</p>
                          </div>
                          <button
                            onClick={() => handleNotifChange(key, !notifs[key as keyof typeof notifs])}
                            className={`relative w-11 h-6 rounded-full transition-colors flex-shrink-0 ${
                              notifs[key as keyof typeof notifs] ? "bg-violet-600" : "bg-gray-200 dark:bg-gray-600"
                            }`}
                          >
                            <span className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${
                              notifs[key as keyof typeof notifs] ? "translate-x-5" : "translate-x-0"
                            }`} />
                          </button>
                        </div>
                      ))}
                    </div>
                    <p className="text-xs text-gray-400 mt-4">Note: These preferences are stored locally. Email notifications require server configuration.</p>
                  </div>
                </motion.div>
              )}

              {/* ══ DANGER ZONE ═════════════════════════════════════════════════ */}
              {tab === "danger" && (
                <motion.div key="danger" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-5">

                  {/* Data export */}
                  <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-6">
                    <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                      <Download className="w-5 h-5 text-violet-500" /> Export Your Data
                    </h2>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">Download a copy of your account data including your profile and generated tracks.</p>
                    <button
                      onClick={() => {
                        const data = {
                          profile: { name: user.name, email: user.email },
                          exportedAt: new Date().toISOString(),
                        };
                        const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
                        const url  = URL.createObjectURL(blob);
                        const a    = document.createElement("a");
                        a.href     = url;
                        a.download = "flickwave-data.json";
                        a.click();
                        URL.revokeObjectURL(url);
                        toast.success("Data exported");
                      }}
                      className="flex items-center gap-2 px-5 py-2.5 rounded-xl border border-gray-200 dark:border-gray-600 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                    >
                      <Download className="w-4 h-4" /> Download My Data
                    </button>
                  </div>

                  {/* Delete account */}
                  <div className="bg-white dark:bg-gray-800 rounded-2xl border border-red-200 dark:border-red-800/50 p-6">
                    <h2 className="text-lg font-bold text-red-600 dark:text-red-400 mb-2 flex items-center gap-2">
                      <AlertTriangle className="w-5 h-5" /> Delete Account
                    </h2>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                      Permanently delete your FlickWave account. This action cannot be undone. All your data will be removed.
                    </p>
                    <button
                      onClick={() => setShowDeleteModal(true)}
                      className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 text-red-600 dark:text-red-400 text-sm font-medium hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" /> Delete My Account
                    </button>
                  </div>
                </motion.div>
              )}

            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* ── Delete confirmation modal ── */}
      <AnimatePresence>
        {showDeleteModal && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
            onClick={() => setShowDeleteModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
              onClick={e => e.stopPropagation()}
              className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-sm p-6"
            >
              <div className="w-14 h-14 rounded-2xl bg-red-50 dark:bg-red-900/30 flex items-center justify-center mx-auto mb-4">
                <AlertTriangle className="w-7 h-7 text-red-500" />
              </div>
              <h3 className="text-lg font-bold text-gray-900 dark:text-white text-center mb-2">Delete Account?</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 text-center mb-5">
                This is permanent and cannot be undone. Type your email to confirm:
              </p>
              <p className="text-xs font-mono text-center text-gray-600 dark:text-gray-400 mb-3 bg-gray-50 dark:bg-gray-700 rounded-lg py-2">
                {user.email}
              </p>
              <input
                value={deleteConfirm}
                onChange={e => setDeleteConfirm(e.target.value)}
                placeholder="Type your email here"
                className="w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 outline-none text-sm text-gray-900 dark:text-white mb-4 focus:border-red-400"
              />
              <div className="flex gap-3">
                <button onClick={() => { setShowDeleteModal(false); setDeleteConfirm(""); }}
                  className="flex-1 py-2.5 rounded-xl border border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-300 text-sm font-medium hover:bg-gray-50 transition-colors">
                  Cancel
                </button>
                <button
                  onClick={handleDeleteAccount}
                  disabled={deleteConfirm !== user.email}
                  className="flex-1 py-2.5 rounded-xl bg-red-600 text-white text-sm font-medium hover:bg-red-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  Delete Forever
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      {/* Plan Modal */}
      {genUsage && (
        <PlanModal
          open={planModalOpen}
          onClose={() => { setPlanModalOpen(false); setPlanModalDefault(undefined); }}
          currentPlan={genUsage.plan}
          defaultPlan={planModalDefault}
        />
      )}
    </div>
  );
}