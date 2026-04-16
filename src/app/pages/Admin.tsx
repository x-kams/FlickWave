import { useState, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Lock, Users, Music, BarChart3, Settings, Trash2, Plus, X,
  Disc3, LogOut, Sun, Moon, ChevronRight, Loader2,
  ShieldOff, Shield, Inbox, MailOpen, UserPlus, KeyRound,
  Eye, EyeOff, Send, Crown,
} from "lucide-react";
import { Sparkles } from "lucide-react";
import { useData } from "../context/DataContext";
import { useTheme } from "../context/ThemeContext";
import { useAuth, type StoredUser } from "../context/AuthContext";
import { formatCount } from "../data/mock";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line,
} from "recharts";
import { toast } from "sonner";

// ── Constants ──────────────────────────────────────────────────────────────────
const COLORS        = ["#8b5cf6", "#d946ef", "#f97316", "#10b981", "#3b82f6", "#ef4444"];
const ADMINS_KEY    = "fw_admin_accounts";
const MESSAGES_KEY  = "fw_support_messages";

const trafficData = [
  { month: "Jan", visits: 12400, plays: 45000 },
  { month: "Feb", visits: 18200, plays: 62000 },
  { month: "Mar", visits: 24600, plays: 89000 },
  { month: "Apr", visits: 31000, plays: 112000 },
  { month: "May", visits: 27800, plays: 98000 },
  { month: "Jun", visits: 35200, plays: 134000 },
];
const genreData = [
  { name: "Pop", value: 35 }, { name: "Rock", value: 25 },
  { name: "Electronic", value: 22 }, { name: "Classical", value: 18 },
];

// ── Admin account helpers ──────────────────────────────────────────────────────
interface AdminAccount {
  email: string;
  password: string;
  name: string;
  isSuperAdmin: boolean;
  createdAt: string;
}

const DEFAULT_SUPER_ADMIN: AdminAccount = {
  email: "admin@flickwave.com",
  password: "admin123",
  name: "Super Admin",
  isSuperAdmin: true,
  createdAt: new Date().toISOString(),
};

function loadAdmins(): AdminAccount[] {
  try {
    const raw  = localStorage.getItem(ADMINS_KEY);
    const list: AdminAccount[] = raw ? JSON.parse(raw) : [];
    if (!list.some(a => a.email === DEFAULT_SUPER_ADMIN.email)) {
      list.unshift(DEFAULT_SUPER_ADMIN);
      localStorage.setItem(ADMINS_KEY, JSON.stringify(list));
    }
    return list;
  } catch {
    return [DEFAULT_SUPER_ADMIN];
  }
}

function saveAdmins(admins: AdminAccount[]): void {
  try { localStorage.setItem(ADMINS_KEY, JSON.stringify(admins)); } catch { /**/ }
}

// ── Support message helpers ────────────────────────────────────────────────────
interface SupportMessage {
  id: string; name: string; email: string;
  message: string; createdAt: string; read: boolean; replied?: boolean;
}

function loadMessages(): SupportMessage[] {
  try { return JSON.parse(localStorage.getItem(MESSAGES_KEY) || "[]"); }
  catch { return []; }
}

function saveMessages(msgs: SupportMessage[]): void {
  try { localStorage.setItem(MESSAGES_KEY, JSON.stringify(msgs)); } catch { /**/ }
}

// ── Tab type ───────────────────────────────────────────────────────────────────
type Tab = "songs" | "artists" | "albums" | "users" | "messages" | "stats" | "settings";

// ── Modal ──────────────────────────────────────────────────────────────────────
function Modal({ open, onClose, title, children }: {
  open: boolean; onClose: () => void; title: string; children: React.ReactNode;
}) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
          onClick={onClose}>
          <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
            onClick={e => e.stopPropagation()}
            className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-gray-700">
              <h3 className="text-lg text-gray-900 dark:text-white" style={{ fontWeight: 700 }}>{title}</h3>
              <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-6">{children}</div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// ── Main component ─────────────────────────────────────────────────────────────
export function Admin() {
  const { dark, toggle } = useTheme();
  const { songs, artists, albums, addSong, deleteSong, addArtist, deleteArtist, addAlbum, deleteAlbum, getArtist, getAlbum, loading } = useData();
  const { getAllUsers, deleteUser, toggleBlockUser, togglePremium } = useAuth();

  // ── Auth state ────────────────────────────────────────────────────────────
  const [currentAdmin, setCurrentAdmin] = useState<AdminAccount | null>(() => {
    try {
      const saved = sessionStorage.getItem("fw_admin_session");
      if (!saved) return null;
      const parsed = JSON.parse(saved) as AdminAccount;
      // Verify still exists in admin list
      const admins = loadAdmins();
      return admins.find(a => a.email === parsed.email) ?? null;
    } catch { return null; }
  });

  const [loginEmail, setLoginEmail]       = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [showLoginPass, setShowLoginPass] = useState(false);

  // ── Tab ───────────────────────────────────────────────────────────────────
  const [tab, setTab] = useState<Tab>("songs");

  // ── Users ─────────────────────────────────────────────────────────────────
  const [users, setUsers]       = useState<StoredUser[]>(() => getAllUsers());
  const refreshUsers            = useCallback(() => setUsers(getAllUsers()), [getAllUsers]);

  // ── Messages ──────────────────────────────────────────────────────────────
  const [messages, setMessages] = useState<SupportMessage[]>(loadMessages);
  const refreshMessages         = () => setMessages(loadMessages());

  const markRead = (id: string) => {
    const updated = messages.map(m => m.id === id ? { ...m, read: true } : m);
    setMessages(updated); saveMessages(updated);
  };
  const deleteMessage = (id: string) => {
    const updated = messages.filter(m => m.id !== id);
    setMessages(updated); saveMessages(updated);
  };

  // ── Reply state ───────────────────────────────────────────────────────────────
  const [replyingTo, setReplyingTo]   = useState<string | null>(null);
  const [replyText, setReplyText]     = useState("");
  const [sendingReply, setSendingReply] = useState(false);

  const handleSendReply = async (msg: SupportMessage) => {
    if (!replyText.trim()) { toast.error("Please write a reply message"); return; }
    setSendingReply(true);
    try {
      const res = await fetch("/api/email/reply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          toEmail:         msg.email,
          userName:        msg.name,
          originalMessage: msg.message,
          replyText:       replyText.trim(),
          adminName:       currentAdmin?.name ?? "FlickWave Support",
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to send reply");
      // Mark as read + replied
      const updated = messages.map(m => m.id === msg.id ? { ...m, read: true, replied: true } : m);
      setMessages(updated);
      saveMessages(updated);
      toast.success(`Reply sent to ${msg.name} (${msg.email})`);
      setReplyingTo(null);
      setReplyText("");
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Reply failed");
    } finally { setSendingReply(false); }
  };

  // ── Admin accounts (settings) ─────────────────────────────────────────────
  const [admins, setAdmins]             = useState<AdminAccount[]>(loadAdmins);
  const [showAddAdmin, setShowAddAdmin] = useState(false);
  const [newAdmin, setNewAdmin]         = useState({ email: "", password: "", name: "" });
  const [addingAdmin, setAddingAdmin]   = useState(false);

  // ── Song form ─────────────────────────────────────────────────────────────
  const [showAddSong, setShowAddSong]         = useState(false);
  const [newSong, setNewSong]                 = useState({ title: "", artistId: "", albumId: "", cover: "", audioUrl: "" });
  const [audioFile, setAudioFile]             = useState<File | null>(null);
  const [audioInputType, setAudioInputType]   = useState<"url" | "file">("url");
  const [addingSong, setAddingSong]           = useState(false);

  // ── Artist form ───────────────────────────────────────────────────────────
  const [showAddArtist, setShowAddArtist] = useState(false);
  const [newArtist, setNewArtist]         = useState({ name: "", image: "", bio: "" });
  const [addingArtist, setAddingArtist]   = useState(false);

  // ── Album form ────────────────────────────────────────────────────────────
  const [showAddAlbum, setShowAddAlbum] = useState(false);
  const [newAlbum, setNewAlbum]         = useState({ title: "", artistId: "", cover: "", year: new Date().getFullYear() });
  const [addingAlbum, setAddingAlbum]   = useState(false);

  // ── Change password (settings) ────────────────────────────────────────────
  const [oldPass, setOldPass]     = useState("");
  const [newPass, setNewPass]     = useState("");
  const [confirmPass, setConfirmPass] = useState("");

  const inputCls  = "w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 focus:border-violet-400 focus:ring-2 focus:ring-violet-100 dark:focus:ring-violet-900 outline-none text-gray-900 dark:text-white text-sm";
  const selectCls = inputCls;

  // ── Login ─────────────────────────────────────────────────────────────────
  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!loginEmail.trim() || !loginPassword.trim()) {
      toast.error("Please enter email and password");
      return;
    }
    const admins = loadAdmins();
    const found  = admins.find(
      a => a.email.toLowerCase() === loginEmail.trim().toLowerCase()
        && a.password === loginPassword
    );
    if (!found) {
      toast.error("Invalid credentials or you do not have admin access.");
      return;
    }
    sessionStorage.setItem("fw_admin_session", JSON.stringify(found));
    setCurrentAdmin(found);
    toast.success(`Welcome, ${found.name}!`);
  };

  const handleLogout = () => {
    sessionStorage.removeItem("fw_admin_session");
    setCurrentAdmin(null);
    setLoginEmail("");
    setLoginPassword("");
  };

  // ── Add admin ─────────────────────────────────────────────────────────────
  const handleAddAdmin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAdmin.email || !newAdmin.password || !newAdmin.name) {
      toast.error("All fields are required"); return;
    }
    if (newAdmin.password.length < 6) {
      toast.error("Password must be at least 6 characters"); return;
    }
    const current = loadAdmins();
    if (current.some(a => a.email.toLowerCase() === newAdmin.email.toLowerCase())) {
      toast.error("An admin with this email already exists"); return;
    }
    setAddingAdmin(true);
    const updated: AdminAccount[] = [...current, {
      email: newAdmin.email.trim(),
      password: newAdmin.password,
      name: newAdmin.name.trim(),
      isSuperAdmin: false,
      createdAt: new Date().toISOString(),
    }];
    saveAdmins(updated);
    setAdmins(updated);
    toast.success(`${newAdmin.name} added as admin`);
    setNewAdmin({ email: "", password: "", name: "" });
    setShowAddAdmin(false);
    setAddingAdmin(false);
  };

  const removeAdmin = (email: string) => {
    if (!currentAdmin?.isSuperAdmin) { toast.error("Only the super admin can remove admins"); return; }
    if (email === DEFAULT_SUPER_ADMIN.email) { toast.error("Cannot remove the super admin"); return; }
    if (!confirm(`Remove ${email} from admin access?`)) return;
    const updated = loadAdmins().filter(a => a.email !== email);
    saveAdmins(updated);
    setAdmins(updated);
    toast.success("Admin removed");
  };

  // ── Change password ───────────────────────────────────────────────────────
  const handleChangePassword = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentAdmin) return;
    if (oldPass !== currentAdmin.password) { toast.error("Current password is incorrect"); return; }
    if (newPass.length < 6) { toast.error("New password must be at least 6 characters"); return; }
    if (newPass !== confirmPass) { toast.error("Passwords do not match"); return; }
    const current = loadAdmins();
    const found   = current.find(a => a.email === currentAdmin.email);
    if (found) {
      found.password = newPass;
      saveAdmins(current);
      setAdmins(current);
      const updated = { ...currentAdmin, password: newPass };
      sessionStorage.setItem("fw_admin_session", JSON.stringify(updated));
      setCurrentAdmin(updated);
      toast.success("Password updated successfully");
      setOldPass(""); setNewPass(""); setConfirmPass("");
    }
  };

  // ── Song handlers ─────────────────────────────────────────────────────────
  const handleAddSong = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSong.title || !newSong.artistId || !newSong.albumId) { toast.error("Title, artist and album are required"); return; }
    if (audioInputType === "file" && !audioFile) { toast.error("Please select an audio file"); return; }
    if (audioInputType === "url" && !newSong.audioUrl.trim()) { toast.error("Please enter audio URL"); return; }
    setAddingSong(true);
    try {
      const album = getAlbum(newSong.albumId);
      const fd    = new FormData();
      fd.append("title", newSong.title.trim());
      fd.append("artistId", newSong.artistId);
      fd.append("albumId", newSong.albumId);
      fd.append("cover", newSong.cover || album?.cover || "");
      if (audioInputType === "file" && audioFile) fd.append("audioFile", audioFile);
      else fd.append("audioUrl", newSong.audioUrl.trim());
      await addSong(fd);
      toast.success(`"${newSong.title}" added!`);
      setNewSong({ title: "", artistId: "", albumId: "", cover: "", audioUrl: "" });
      setAudioFile(null);
      setShowAddSong(false);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to add song");
    } finally { setAddingSong(false); }
  };

  const handleAddArtist = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newArtist.name.trim()) { toast.error("Artist name is required"); return; }
    setAddingArtist(true);
    try {
      await addArtist({ name: newArtist.name.trim(), image: newArtist.image.trim() || "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=300", bio: newArtist.bio.trim() || "FlickWave artist" });
      toast.success(`Artist "${newArtist.name}" added!`);
      setNewArtist({ name: "", image: "", bio: "" });
      setShowAddArtist(false);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to add artist");
    } finally { setAddingArtist(false); }
  };

  const handleAddAlbum = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAlbum.title.trim() || !newAlbum.artistId) { toast.error("Title and artist are required"); return; }
    setAddingAlbum(true);
    try {
      await addAlbum({ title: newAlbum.title.trim(), artistId: newAlbum.artistId, cover: newAlbum.cover.trim() || "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=300", year: newAlbum.year });
      toast.success(`Album "${newAlbum.title}" added!`);
      setNewAlbum({ title: "", artistId: "", cover: "", year: new Date().getFullYear() });
      setShowAddAlbum(false);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to add album");
    } finally { setAddingAlbum(false); }
  };

  const handleDeleteSong   = async (id: string, title: string)  => { try { await deleteSong(id);   toast.success(`"${title}" deleted`); } catch { toast.error("Delete failed"); } };
  const handleDeleteArtist = async (id: string, name: string)   => { try { await deleteArtist(id); toast.success(`"${name}" deleted`); }  catch { toast.error("Delete failed"); } };
  const handleDeleteAlbum  = async (id: string, title: string)  => { try { await deleteAlbum(id);  toast.success(`"${title}" deleted`); } catch { toast.error("Delete failed"); } };

  // ── Unread badge count ────────────────────────────────────────────────────
  const unreadCount = messages.filter(m => !m.read).length;

  // ══════════════════════════════════════════════════════════════════════════
  //  LOGIN SCREEN
  // ══════════════════════════════════════════════════════════════════════════
  if (!currentAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4 bg-gray-50 dark:bg-gray-950">
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="w-full max-w-sm">
          <div className="text-center mb-8">
            <div className="w-16 h-16 rounded-2xl bg-gray-900 dark:bg-white flex items-center justify-center mx-auto mb-4">
              <Lock className="w-7 h-7 text-white dark:text-gray-900" />
            </div>
            <h2 className="text-2xl text-gray-900 dark:text-white" style={{ fontWeight: 700 }}>Admin Access</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Sign in with your admin credentials
            </p>
          </div>
          <form onSubmit={handleLogin} className="space-y-4">
            <input
              placeholder="Admin email"
              type="email"
              value={loginEmail}
              onChange={e => setLoginEmail(e.target.value)}
              className="w-full px-4 py-3 rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 focus:border-violet-400 focus:ring-2 focus:ring-violet-100 dark:focus:ring-violet-900 outline-none text-gray-900 dark:text-white"
              autoFocus
            />
            <div className="relative">
              <input
                placeholder="Password"
                type={showLoginPass ? "text" : "password"}
                value={loginPassword}
                onChange={e => setLoginPassword(e.target.value)}
                className="w-full px-4 py-3 rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 focus:border-violet-400 focus:ring-2 focus:ring-violet-100 dark:focus:ring-violet-900 outline-none pr-12 text-gray-900 dark:text-white"
              />
              <button type="button" onClick={() => setShowLoginPass(v => !v)} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400">
                {showLoginPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            <button className="w-full py-3 rounded-xl bg-gray-900 dark:bg-white text-white dark:text-gray-900 hover:bg-gray-800 dark:hover:bg-gray-100 transition-colors font-semibold">
              Sign In
            </button>
          </form>
          <p className="text-center text-xs text-gray-400 dark:text-gray-500 mt-5">
            Access is restricted to authorised admins only.
          </p>
        </motion.div>
      </div>
    );
  }

  // ══════════════════════════════════════════════════════════════════════════
  //  TABS DEFINITION
  // ══════════════════════════════════════════════════════════════════════════
  const tabs: { id: Tab; label: string; icon: typeof Music; badge?: number }[] = [
    { id: "songs",    label: "Songs",    icon: Music    },
    { id: "artists",  label: "Artists",  icon: Users    },
    { id: "albums",   label: "Albums",   icon: Disc3    },
    { id: "users",    label: "Users",    icon: Users    },
    { id: "messages", label: "Messages", icon: Inbox,   badge: unreadCount },
    { id: "stats",    label: "Stats",    icon: BarChart3 },
    { id: "settings", label: "Settings", icon: Settings },
  ];

  // ══════════════════════════════════════════════════════════════════════════
  //  DASHBOARD
  // ══════════════════════════════════════════════════════════════════════════
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 transition-colors">

      {/* Top bar */}
      <div className="sticky top-0 z-50 bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between h-14">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gray-900 dark:bg-white flex items-center justify-center">
              <Lock className="w-4 h-4 text-white dark:text-gray-900" />
            </div>
            <div>
              <span className="text-gray-900 dark:text-white text-sm" style={{ fontWeight: 700 }}>FlickWave Admin</span>
              <span className="hidden sm:inline text-xs text-gray-400 ml-2">· {currentAdmin.name}</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={toggle} className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500 dark:text-gray-400">
              {dark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>
            <a href="/" className="text-sm text-violet-600 dark:text-violet-400 hover:underline flex items-center gap-1">
              View Site <ChevronRight className="w-3 h-3" />
            </a>
            <button onClick={handleLogout} className="flex items-center gap-1.5 text-sm text-gray-500 dark:text-gray-400 hover:text-red-500 ml-2 transition-colors">
              <LogOut className="w-3.5 h-3.5" /> Logout
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">

        {/* Loading */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-violet-500" />
            <span className="ml-3 text-gray-500 dark:text-gray-400">Loading data from MongoDB…</span>
          </div>
        ) : (
          <>
            {/* Stats summary */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
              {[
                { label: "Songs",   value: songs.length,   gradient: "from-violet-500 to-violet-600"   },
                { label: "Artists", value: artists.length, gradient: "from-fuchsia-500 to-fuchsia-600" },
                { label: "Albums",  value: albums.length,  gradient: "from-orange-500 to-orange-600"   },
                { label: "Users",   value: users.length,   gradient: "from-emerald-500 to-emerald-600" },
              ].map(s => (
                <div key={s.label} className={`bg-gradient-to-br ${s.gradient} rounded-2xl p-4 text-white`}>
                  <p className="text-sm text-white/70">{s.label}</p>
                  <p className="text-2xl" style={{ fontWeight: 700 }}>{s.value}</p>
                </div>
              ))}
            </div>

            {/* Tabs */}
            <div className="flex gap-1 mb-6 overflow-x-auto pb-1">
              {tabs.map(({ id, label, icon: Icon, badge }) => (
                <button key={id} onClick={() => setTab(id)}
                  className={`relative flex items-center gap-2 px-4 py-2 rounded-xl text-sm whitespace-nowrap transition-all ${
                    tab === id
                      ? "bg-gray-900 dark:bg-white text-white dark:text-gray-900"
                      : "text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
                  }`}>
                  <Icon className="w-4 h-4" />
                  {label}
                  {badge != null && badge > 0 && (
                    <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-red-500 text-white text-[10px] flex items-center justify-center font-bold">
                      {badge}
                    </span>
                  )}
                </button>
              ))}
            </div>

            {/* ══ SONGS ═══════════════════════════════════════════════════ */}
            {tab === "songs" && (
              <div>
                <div className="flex justify-between items-center mb-4">
                  <p className="text-gray-500 dark:text-gray-400">{songs.length} songs total</p>
                  <button onClick={() => setShowAddSong(true)} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-violet-600 text-white text-sm hover:bg-violet-700 transition-colors">
                    <Plus className="w-4 h-4" /> Add Song
                  </button>
                </div>
                <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
                          <th className="text-left px-4 py-3 text-gray-500">#</th>
                          <th className="text-left px-4 py-3 text-gray-500">Title</th>
                          <th className="text-left px-4 py-3 text-gray-500 hidden sm:table-cell">Artist</th>
                          <th className="text-left px-4 py-3 text-gray-500 hidden md:table-cell">Album</th>
                          <th className="text-left px-4 py-3 text-gray-500 hidden md:table-cell">Audio</th>
                          <th className="text-left px-4 py-3 text-gray-500 hidden md:table-cell">Plays</th>
                          <th className="px-4 py-3 text-right text-gray-500">Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {songs.map((s, i) => (
                          <tr key={s.id} className="border-b border-gray-50 dark:border-gray-700/50 hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors">
                            <td className="px-4 py-3 text-gray-400">{i + 1}</td>
                            <td className="px-4 py-3">
                              <div className="flex items-center gap-3">
                                <img src={s.cover || "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=60"} alt="" className="w-8 h-8 rounded-lg object-cover flex-shrink-0" />
                                <span className="text-gray-900 dark:text-white truncate max-w-[140px]" style={{ fontWeight: 500 }}>{s.title}</span>
                              </div>
                            </td>
                            <td className="px-4 py-3 text-gray-500 dark:text-gray-400 hidden sm:table-cell">{getArtist(s.artistId)?.name || "—"}</td>
                            <td className="px-4 py-3 text-gray-500 dark:text-gray-400 hidden md:table-cell">{getAlbum(s.albumId)?.title || "—"}</td>
                            <td className="px-4 py-3 hidden md:table-cell">
                              {s.audioUrl
                                ? <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600">✓ Audio</span>
                                : <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-400">No audio</span>}
                            </td>
                            <td className="px-4 py-3 text-gray-500 hidden md:table-cell">{formatCount(s.playCount)}</td>
                            <td className="px-4 py-3 text-right">
                              <button onClick={() => handleDeleteSong(s.id, s.title)} className="p-1.5 rounded-lg text-red-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors">
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  {songs.length === 0 && <div className="text-center py-12 text-gray-400"><Music className="w-10 h-10 mx-auto mb-2 opacity-50" /><p>No songs yet.</p></div>}
                </div>

                <Modal open={showAddSong} onClose={() => !addingSong && setShowAddSong(false)} title="Add New Song">
                  <form onSubmit={handleAddSong} className="space-y-4">
                    <div><label className="block text-sm text-gray-600 dark:text-gray-300 mb-1">Song Title *</label><input placeholder="Song title" value={newSong.title} onChange={e => setNewSong(p => ({ ...p, title: e.target.value }))} className={inputCls} /></div>
                    <div><label className="block text-sm text-gray-600 dark:text-gray-300 mb-1">Artist *</label>
                      <select value={newSong.artistId} onChange={e => setNewSong(p => ({ ...p, artistId: e.target.value, albumId: "" }))} className={selectCls}>
                        <option value="">Select artist</option>
                        {artists.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
                      </select>
                    </div>
                    <div><label className="block text-sm text-gray-600 dark:text-gray-300 mb-1">Album *</label>
                      <select value={newSong.albumId} onChange={e => setNewSong(p => ({ ...p, albumId: e.target.value }))} className={selectCls}>
                        <option value="">Select album</option>
                        {albums.filter(al => !newSong.artistId || al.artistId === newSong.artistId).map(al => <option key={al.id} value={al.id}>{al.title}</option>)}
                      </select>
                    </div>
                    <div><label className="block text-sm text-gray-600 dark:text-gray-300 mb-1">Cover Image URL (optional)</label><input placeholder="https://..." value={newSong.cover} onChange={e => setNewSong(p => ({ ...p, cover: e.target.value }))} className={inputCls} /></div>
                    <div>
                      <label className="block text-sm text-gray-600 dark:text-gray-300 mb-2">Audio *</label>
                      <div className="flex gap-2 mb-3">
                        <button type="button" onClick={() => setAudioInputType("url")} className={`flex-1 py-2 rounded-lg text-sm transition-colors ${audioInputType === "url" ? "bg-violet-600 text-white" : "bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300"}`}>URL</button>
                        <button type="button" onClick={() => setAudioInputType("file")} className={`flex-1 py-2 rounded-lg text-sm transition-colors ${audioInputType === "file" ? "bg-violet-600 text-white" : "bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300"}`}>Upload File</button>
                      </div>
                      {audioInputType === "url"
                        ? <input placeholder="https://example.com/song.mp3" value={newSong.audioUrl} onChange={e => setNewSong(p => ({ ...p, audioUrl: e.target.value }))} className={inputCls} />
                        : <label className="flex flex-col items-center justify-center w-full h-24 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl cursor-pointer hover:border-violet-400 transition-colors bg-gray-50 dark:bg-gray-700">
                            <input type="file" accept="audio/*" className="hidden" onChange={e => setAudioFile(e.target.files?.[0] || null)} />
                            {audioFile ? <div className="text-center px-3"><p className="text-sm text-violet-600 font-medium truncate max-w-xs">{audioFile.name}</p><p className="text-xs text-gray-400">{(audioFile.size / 1024 / 1024).toFixed(1)} MB</p></div>
                              : <div className="text-center"><p className="text-sm text-gray-500">Click to select audio file</p><p className="text-xs text-gray-400">MP3, WAV, OGG, FLAC (max 50 MB)</p></div>}
                          </label>
                      }
                    </div>
                    <div className="flex gap-3 pt-2">
                      <button type="button" onClick={() => setShowAddSong(false)} disabled={addingSong} className="flex-1 py-2.5 rounded-xl border border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-300 hover:bg-gray-50 disabled:opacity-50">Cancel</button>
                      <button type="submit" disabled={addingSong} className="flex-1 py-2.5 rounded-xl bg-violet-600 text-white hover:bg-violet-700 disabled:opacity-60 flex items-center justify-center gap-2">
                        {addingSong ? <><Loader2 className="w-4 h-4 animate-spin" />Adding…</> : "Add Song"}
                      </button>
                    </div>
                  </form>
                </Modal>
              </div>
            )}

            {/* ══ ARTISTS ══════════════════════════════════════════════════ */}
            {tab === "artists" && (
              <div>
                <div className="flex justify-between items-center mb-4">
                  <p className="text-gray-500 dark:text-gray-400">{artists.length} artists</p>
                  <button onClick={() => setShowAddArtist(true)} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-violet-600 text-white text-sm hover:bg-violet-700 transition-colors"><Plus className="w-4 h-4" /> Add Artist</button>
                </div>
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {artists.map(a => (
                    <motion.div key={a.id} layout className="flex items-start gap-4 p-4 rounded-2xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
                      <img src={a.image || "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=80"} alt="" className="w-14 h-14 rounded-full object-cover flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-gray-900 dark:text-white truncate" style={{ fontWeight: 600 }}>{a.name}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400 truncate mb-1">{a.bio}</p>
                        <p className="text-xs text-violet-600">{albums.filter(al => al.artistId === a.id).length} albums · {songs.filter(s => s.artistId === a.id).length} songs</p>
                      </div>
                      <button onClick={() => handleDeleteArtist(a.id, a.name)} className="p-1.5 rounded-lg text-red-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 flex-shrink-0"><Trash2 className="w-4 h-4" /></button>
                    </motion.div>
                  ))}
                </div>
                {artists.length === 0 && <div className="text-center py-12 text-gray-400"><Users className="w-10 h-10 mx-auto mb-2 opacity-50" /><p>No artists yet.</p></div>}

                <Modal open={showAddArtist} onClose={() => !addingArtist && setShowAddArtist(false)} title="Add New Artist">
                  <form onSubmit={handleAddArtist} className="space-y-4">
                    <div><label className="block text-sm text-gray-600 dark:text-gray-300 mb-1">Name *</label><input placeholder="Artist name" value={newArtist.name} onChange={e => setNewArtist(p => ({ ...p, name: e.target.value }))} className={inputCls} /></div>
                    <div><label className="block text-sm text-gray-600 dark:text-gray-300 mb-1">Image URL (optional)</label><input placeholder="https://..." value={newArtist.image} onChange={e => setNewArtist(p => ({ ...p, image: e.target.value }))} className={inputCls} /></div>
                    <div><label className="block text-sm text-gray-600 dark:text-gray-300 mb-1">Bio (optional)</label><textarea placeholder="Short bio…" value={newArtist.bio} onChange={e => setNewArtist(p => ({ ...p, bio: e.target.value }))} rows={3} className={inputCls + " resize-none"} /></div>
                    <div className="flex gap-3 pt-2">
                      <button type="button" onClick={() => setShowAddArtist(false)} disabled={addingArtist} className="flex-1 py-2.5 rounded-xl border border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-300 hover:bg-gray-50 disabled:opacity-50">Cancel</button>
                      <button type="submit" disabled={addingArtist} className="flex-1 py-2.5 rounded-xl bg-violet-600 text-white hover:bg-violet-700 disabled:opacity-60 flex items-center justify-center gap-2">
                        {addingArtist ? <><Loader2 className="w-4 h-4 animate-spin" />Adding…</> : "Add Artist"}
                      </button>
                    </div>
                  </form>
                </Modal>
              </div>
            )}

            {/* ══ ALBUMS ═══════════════════════════════════════════════════ */}
            {tab === "albums" && (
              <div>
                <div className="flex justify-between items-center mb-4">
                  <p className="text-gray-500 dark:text-gray-400">{albums.length} albums</p>
                  <button onClick={() => setShowAddAlbum(true)} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-violet-600 text-white text-sm hover:bg-violet-700 transition-colors"><Plus className="w-4 h-4" /> Add Album</button>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                  {albums.map(al => (
                    <motion.div key={al.id} layout className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 overflow-hidden group">
                      <div className="relative aspect-square">
                        <img src={al.cover || "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=300"} alt="" className="w-full h-full object-cover" />
                        <button onClick={() => handleDeleteAlbum(al.id, al.title)} className="absolute top-2 right-2 p-1.5 rounded-lg bg-red-500/80 text-white opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"><Trash2 className="w-3.5 h-3.5" /></button>
                      </div>
                      <div className="p-3">
                        <p className="text-sm text-gray-900 dark:text-white truncate" style={{ fontWeight: 600 }}>{al.title}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">{getArtist(al.artistId)?.name || "—"} · {al.year}</p>
                        <p className="text-xs text-violet-600 mt-0.5">{songs.filter(s => s.albumId === al.id).length} songs</p>
                      </div>
                    </motion.div>
                  ))}
                </div>
                {albums.length === 0 && <div className="text-center py-12 text-gray-400"><Disc3 className="w-10 h-10 mx-auto mb-2 opacity-50" /><p>No albums yet.</p></div>}

                <Modal open={showAddAlbum} onClose={() => !addingAlbum && setShowAddAlbum(false)} title="Add New Album">
                  <form onSubmit={handleAddAlbum} className="space-y-4">
                    <div><label className="block text-sm text-gray-600 dark:text-gray-300 mb-1">Album Title *</label><input placeholder="Album title" value={newAlbum.title} onChange={e => setNewAlbum(p => ({ ...p, title: e.target.value }))} className={inputCls} /></div>
                    <div><label className="block text-sm text-gray-600 dark:text-gray-300 mb-1">Artist *</label>
                      <select value={newAlbum.artistId} onChange={e => setNewAlbum(p => ({ ...p, artistId: e.target.value }))} className={selectCls}>
                        <option value="">Select artist</option>
                        {artists.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
                      </select>
                    </div>
                    <div><label className="block text-sm text-gray-600 dark:text-gray-300 mb-1">Year</label><input type="number" value={newAlbum.year} onChange={e => setNewAlbum(p => ({ ...p, year: Number(e.target.value) }))} className={inputCls} /></div>
                    <div><label className="block text-sm text-gray-600 dark:text-gray-300 mb-1">Cover Image URL (optional)</label><input placeholder="https://..." value={newAlbum.cover} onChange={e => setNewAlbum(p => ({ ...p, cover: e.target.value }))} className={inputCls} /></div>
                    <div className="flex gap-3 pt-2">
                      <button type="button" onClick={() => setShowAddAlbum(false)} disabled={addingAlbum} className="flex-1 py-2.5 rounded-xl border border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-300 hover:bg-gray-50 disabled:opacity-50">Cancel</button>
                      <button type="submit" disabled={addingAlbum} className="flex-1 py-2.5 rounded-xl bg-violet-600 text-white hover:bg-violet-700 disabled:opacity-60 flex items-center justify-center gap-2">
                        {addingAlbum ? <><Loader2 className="w-4 h-4 animate-spin" />Adding…</> : "Add Album"}
                      </button>
                    </div>
                  </form>
                </Modal>
              </div>
            )}

            {/* ══ USERS ════════════════════════════════════════════════════ */}
            {tab === "users" && (
              <div>
                <div className="flex justify-between items-center mb-4">
                  <p className="text-gray-500 dark:text-gray-400">{users.length} registered users</p>
                  <button onClick={refreshUsers} className="px-4 py-2 text-sm rounded-xl bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors">Refresh</button>
                </div>
                <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
                          <th className="text-left px-4 py-3 text-gray-500">Name</th>
                          <th className="text-left px-4 py-3 text-gray-500 hidden sm:table-cell">Email</th>
                          <th className="text-left px-4 py-3 text-gray-500 hidden md:table-cell">Joined</th>
                          <th className="text-left px-4 py-3 text-gray-500">Status</th>
                          <th className="text-left px-4 py-3 text-gray-500 hidden lg:table-cell">Premium</th>
                          <th className="px-4 py-3 text-right text-gray-500">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {users.map(u => (
                          <tr key={u.email} className="border-b border-gray-50 dark:border-gray-700/50 hover:bg-gray-50 dark:hover:bg-gray-700/30">
                            <td className="px-4 py-3 text-gray-900 dark:text-white font-medium">{u.name}</td>
                            <td className="px-4 py-3 text-gray-500 hidden sm:table-cell">{u.email}</td>
                            <td className="px-4 py-3 text-gray-500 hidden md:table-cell">
                              {u.createdAt ? new Date(u.createdAt).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }) : "—"}
                            </td>
                            <td className="px-4 py-3">
                              {u.blocked
                                ? <span className="px-2.5 py-0.5 rounded-full text-xs bg-red-50 dark:bg-red-900/30 text-red-600">Blocked</span>
                                : u.verified
                                  ? <span className="px-2.5 py-0.5 rounded-full text-xs bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600">Active</span>
                                  : <span className="px-2.5 py-0.5 rounded-full text-xs bg-amber-50 dark:bg-amber-900/30 text-amber-600">Unverified</span>
                              }
                            </td>
                            <td className="px-4 py-3 hidden lg:table-cell">
                              <button
                                onClick={() => { togglePremium(u.email); refreshUsers(); toast.success(u.isPremium ? `${u.name} premium removed` : `${u.name} granted premium`); }}
                                className={`flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-semibold transition-colors ${u.isPremium ? "bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 hover:bg-amber-200" : "bg-gray-100 dark:bg-gray-700 text-gray-500 hover:bg-gray-200 dark:hover:bg-gray-600"}`}
                              >
                                <Crown className="w-3 h-3" />
                                {u.isPremium ? "Premium" : "Free"}
                              </button>
                            </td>
                            <td className="px-4 py-3 text-right">
                              <div className="flex items-center justify-end gap-1">
                                <button onClick={() => { toggleBlockUser(u.email); refreshUsers(); toast.success(u.blocked ? `${u.name} unblocked` : `${u.name} blocked`); }}
                                  title={u.blocked ? "Unblock" : "Block"}
                                  className={`p-1.5 rounded-lg transition-colors ${u.blocked ? "text-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-900/20" : "text-amber-500 hover:bg-amber-50 dark:hover:bg-amber-900/20"}`}>
                                  {u.blocked ? <Shield className="w-4 h-4" /> : <ShieldOff className="w-4 h-4" />}
                                </button>
                                <button onClick={() => { if (!confirm(`Delete ${u.name}?`)) return; deleteUser(u.email); refreshUsers(); toast.success(`${u.name} deleted`); }}
                                  title="Delete" className="p-1.5 rounded-lg text-red-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors">
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  {users.length === 0 && <div className="text-center py-12 text-gray-400"><Users className="w-10 h-10 mx-auto mb-2 opacity-50" /><p>No users yet.</p></div>}
                </div>

                {/* ── AI Generation Plan Management ── */}
                <div className="mt-6 bg-white dark:bg-gray-800 rounded-2xl border border-violet-200 dark:border-violet-800/50 overflow-hidden">
                  <div className="px-5 py-4 border-b border-violet-100 dark:border-violet-800/30 bg-violet-50 dark:bg-violet-900/20 flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-violet-500" />
                    <h3 className="font-semibold text-violet-800 dark:text-violet-300">AI Music Generation Plans</h3>
                  </div>
                  <div className="p-5 space-y-3">
                    {users.filter(u => u.verified && !u.blocked).map(u => (
                      <div key={u.email} className="flex items-center justify-between p-3 rounded-xl bg-gray-50 dark:bg-gray-700">
                        <div>
                          <p className="font-medium text-sm text-gray-900 dark:text-white">{u.name}</p>
                          <p className="text-xs text-gray-500">{u.email}</p>
                        </div>
                        <select
                          defaultValue="free"
                          onChange={async (e) => {
                            const res = await fetch("/api/generate/upgrade", {
                              method: "POST",
                              headers: { "Content-Type": "application/json" },
                              body: JSON.stringify({ email: u.email, plan: e.target.value, adminSecret: "flickwave-admin-2025" }),
                            });
                            const data = await res.json();
                            if (res.ok) toast.success(`${u.name} upgraded to ${e.target.value} plan`);
                            else toast.error(data.error || "Failed to upgrade");
                          }}
                          className="text-xs px-3 py-1.5 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300"
                        >
                          <option value="free">Free (3 gen, 5s)</option>
                          <option value="basic">Basic (20 gen, 30s)</option>
                          <option value="premium">Premium (200 gen, 60s)</option>
                        </select>
                      </div>
                    ))}
                  </div>
                </div>

                {/* ── Premium User Management ── */}
                <div className="mt-6 bg-white dark:bg-gray-800 rounded-2xl border border-amber-200 dark:border-amber-800/50 overflow-hidden">
                  <div className="px-5 py-4 border-b border-amber-100 dark:border-amber-800/30 bg-amber-50 dark:bg-amber-900/20 flex items-center gap-2">
                    <Crown className="w-5 h-5 text-amber-500" />
                    <h3 className="font-semibold text-amber-800 dark:text-amber-300">Premium Access Control</h3>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
                          <th className="text-left px-4 py-3 text-gray-500">User</th>
                          <th className="text-left px-4 py-3 text-gray-500 hidden sm:table-cell">Email</th>
                          <th className="text-left px-4 py-3 text-gray-500">Status</th>
                          <th className="px-4 py-3 text-right text-gray-500">Toggle Premium</th>
                        </tr>
                      </thead>
                      <tbody>
                        {users.filter(u => u.verified && !u.blocked).map(u => (
                          <tr key={u.email} className="border-b border-gray-50 dark:border-gray-700/50 hover:bg-gray-50 dark:hover:bg-gray-700/30">
                            <td className="px-4 py-3 font-medium text-gray-900 dark:text-white">{u.name}</td>
                            <td className="px-4 py-3 text-gray-500 dark:text-gray-400 hidden sm:table-cell">{u.email}</td>
                            <td className="px-4 py-3">
                              {u.isPremium
                                ? <span className="flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-400 w-fit"><Crown className="w-3 h-3" /> Premium</span>
                                : <span className="px-2.5 py-0.5 rounded-full text-xs bg-gray-100 dark:bg-gray-700 text-gray-500">Free</span>
                              }
                            </td>
                            <td className="px-4 py-3 text-right">
                              <button
                                onClick={() => {
                                  togglePremium(u.email);
                                  refreshUsers();
                                  toast.success(u.isPremium ? `${u.name} downgraded to free` : `${u.name} upgraded to Premium ⭐`);
                                }}
                                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                                  u.isPremium
                                    ? "bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-600"
                                    : "bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 hover:bg-amber-200 dark:hover:bg-amber-800/40"
                                }`}
                              >
                                {u.isPremium ? "Remove Premium" : "Grant Premium ⭐"}
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  {users.filter(u => u.verified && !u.blocked).length === 0 && (
                    <div className="text-center py-8 text-gray-400 text-sm">No verified users yet.</div>
                  )}
                </div>
              </div>
            )}

            {/* ══ MESSAGES ═════════════════════════════════════════════════ */}
            {tab === "messages" && (
              <div>
                <div className="flex justify-between items-center mb-4">
                  <p className="text-gray-500 dark:text-gray-400">
                    {messages.length} message{messages.length !== 1 ? "s" : ""}
                    {unreadCount > 0 && (
                      <span className="ml-2 px-2 py-0.5 rounded-full text-xs bg-violet-100 dark:bg-violet-900/40 text-violet-600 dark:text-violet-400">
                        {unreadCount} unread
                      </span>
                    )}
                  </p>
                  <button onClick={refreshMessages} className="px-4 py-2 text-sm rounded-xl bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors">Refresh</button>
                </div>

                {messages.length === 0 ? (
                  <div className="text-center py-20 text-gray-400 dark:text-gray-500">
                    <Inbox className="w-14 h-14 mx-auto mb-3 opacity-30" />
                    <p className="text-lg font-medium text-gray-500 dark:text-gray-400">No messages yet</p>
                    <p className="text-sm mt-1">Support messages submitted by users will appear here.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {messages.map(msg => (
                      <div key={msg.id}
                        className={`rounded-2xl border transition-colors ${
                          msg.read
                            ? "bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700"
                            : "bg-violet-50 dark:bg-violet-900/20 border-violet-200 dark:border-violet-700"
                        }`}>
                        {/* Message header */}
                        <div className="p-5">
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex items-start gap-3 min-w-0">
                              {/* Avatar */}
                              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-fuchsia-500 flex items-center justify-center flex-shrink-0 text-white font-bold text-sm">
                                {msg.name.charAt(0).toUpperCase()}
                              </div>
                              <div className="min-w-0">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <p className="font-semibold text-gray-900 dark:text-white">{msg.name}</p>
                                  {!msg.read && <span className="px-2 py-0.5 rounded-full text-xs bg-violet-600 text-white font-medium">New</span>}
                                  {msg.replied && <span className="px-2 py-0.5 rounded-full text-xs bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 font-medium">Replied</span>}
                                </div>
                                {/* Email clearly shown */}
                                <p className="text-sm text-violet-600 dark:text-violet-400 font-medium">{msg.email}</p>
                                <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
                                  {new Date(msg.createdAt).toLocaleString("en-GB", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}
                                </p>
                              </div>
                            </div>
                            {/* Actions */}
                            <div className="flex items-center gap-1 flex-shrink-0">
                              {!msg.read && (
                                <button onClick={() => markRead(msg.id)} title="Mark as read"
                                  className="p-1.5 rounded-lg text-violet-500 hover:bg-violet-100 dark:hover:bg-violet-900/30 transition-colors">
                                  <MailOpen className="w-4 h-4" />
                                </button>
                              )}
                              <button
                                onClick={() => {
                                  if (replyingTo === msg.id) { setReplyingTo(null); setReplyText(""); }
                                  else { markRead(msg.id); setReplyingTo(msg.id); setReplyText(""); }
                                }}
                                title="Reply"
                                className={`p-1.5 rounded-lg transition-colors ${
                                  replyingTo === msg.id
                                    ? "bg-violet-600 text-white"
                                    : "text-violet-500 hover:bg-violet-100 dark:hover:bg-violet-900/30"
                                }`}>
                                <Send className="w-4 h-4" />
                              </button>
                              <button onClick={() => { deleteMessage(msg.id); if (replyingTo === msg.id) { setReplyingTo(null); setReplyText(""); } }}
                                title="Delete"
                                className="p-1.5 rounded-lg text-red-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors">
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </div>

                          {/* Message body */}
                          <div className="mt-4 pl-13">
                            <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-4">
                              <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed whitespace-pre-wrap">{msg.message}</p>
                            </div>
                          </div>
                        </div>

                        {/* Inline reply box */}
                        {replyingTo === msg.id && (
                          <div className="border-t border-gray-100 dark:border-gray-700 px-5 pb-5 pt-4 bg-gray-50 dark:bg-gray-800/50 rounded-b-2xl">
                            <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-3">
                              Reply to {msg.name} · <span className="text-violet-500">{msg.email}</span>
                            </p>
                            <textarea
                              rows={4}
                              placeholder={`Write your reply to ${msg.name}…`}
                              value={replyText}
                              onChange={e => setReplyText(e.target.value)}
                              className="w-full px-4 py-3 rounded-xl bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 focus:border-violet-400 focus:ring-2 focus:ring-violet-100 dark:focus:ring-violet-900 outline-none text-gray-900 dark:text-white text-sm resize-none"
                              autoFocus
                            />
                            <div className="flex items-center justify-between mt-3">
                              <p className="text-xs text-gray-400">
                                This will be sent from your Gmail to {msg.email}
                              </p>
                              <div className="flex gap-2">
                                <button onClick={() => { setReplyingTo(null); setReplyText(""); }}
                                  className="px-4 py-2 rounded-xl text-sm border border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                                  Cancel
                                </button>
                                <button onClick={() => handleSendReply(msg)} disabled={sendingReply || !replyText.trim()}
                                  className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm bg-violet-600 text-white hover:bg-violet-700 disabled:opacity-50 transition-colors">
                                  {sendingReply
                                    ? <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Sending…</>
                                    : <><Send className="w-3.5 h-3.5" /> Send Reply</>
                                  }
                                </button>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* ══ STATS ════════════════════════════════════════════════════ */}
            {tab === "stats" && (
              <div className="space-y-6">
                <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-6">
                  <h3 className="text-lg text-gray-900 dark:text-white mb-4" style={{ fontWeight: 600 }}>Monthly Traffic & Plays</h3>
                  <ResponsiveContainer width="100%" height={280}>
                    <BarChart data={trafficData}>
                      <CartesianGrid strokeDasharray="3 3" stroke={dark ? "#374151" : "#f0f0f0"} />
                      <XAxis dataKey="month" tick={{ fill: dark ? "#9ca3af" : "#6b7280", fontSize: 12 }} />
                      <YAxis tick={{ fill: dark ? "#9ca3af" : "#6b7280", fontSize: 12 }} />
                      <Tooltip contentStyle={{ background: dark ? "#1f2937" : "#fff", border: "none", borderRadius: 12 }} />
                      <Bar dataKey="visits" fill="#8b5cf6" radius={[6,6,0,0]} name="Visits" />
                      <Bar dataKey="plays"  fill="#d946ef" radius={[6,6,0,0]} name="Plays"  />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-6">
                    <h3 className="text-lg text-gray-900 dark:text-white mb-4" style={{ fontWeight: 600 }}>Genre Distribution</h3>
                    <div className="flex flex-col items-center gap-4">
                      <ResponsiveContainer width={200} height={200}>
                        <PieChart><Pie data={genreData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} innerRadius={40}>{genreData.map((_,i) => <Cell key={i} fill={COLORS[i%COLORS.length]} />)}</Pie><Tooltip /></PieChart>
                      </ResponsiveContainer>
                      <div className="flex flex-wrap gap-3 justify-center">{genreData.map((g,i) => (<div key={g.name} className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: COLORS[i] }} /><span className="text-xs text-gray-600 dark:text-gray-400">{g.name} ({g.value}%)</span></div>))}</div>
                    </div>
                  </div>
                  <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-6">
                    <h3 className="text-lg text-gray-900 dark:text-white mb-4" style={{ fontWeight: 600 }}>User Growth</h3>
                    <ResponsiveContainer width="100%" height={230}>
                      <LineChart data={trafficData}>
                        <CartesianGrid strokeDasharray="3 3" stroke={dark ? "#374151" : "#f0f0f0"} />
                        <XAxis dataKey="month" tick={{ fill: dark ? "#9ca3af" : "#6b7280", fontSize: 12 }} />
                        <YAxis tick={{ fill: dark ? "#9ca3af" : "#6b7280", fontSize: 12 }} />
                        <Tooltip contentStyle={{ background: dark ? "#1f2937" : "#fff", border: "none", borderRadius: 12 }} />
                        <Line type="monotone" dataKey="visits" stroke="#8b5cf6" strokeWidth={2.5} dot={{ fill: "#8b5cf6", r: 4 }} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>
            )}

            {/* ══ SETTINGS ═════════════════════════════════════════════════ */}
            {tab === "settings" && (
              <div className="max-w-2xl space-y-6">

                {/* Change password */}
                <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-6">
                  <div className="flex items-center gap-2 mb-4">
                    <KeyRound className="w-5 h-5 text-violet-500" />
                    <h3 className="text-lg text-gray-900 dark:text-white" style={{ fontWeight: 600 }}>Change Your Password</h3>
                  </div>
                  <form onSubmit={handleChangePassword} className="space-y-4">
                    <div><label className="block text-sm text-gray-600 dark:text-gray-300 mb-1">Current Password</label><input type="password" placeholder="Current password" value={oldPass} onChange={e => setOldPass(e.target.value)} className={inputCls} /></div>
                    <div><label className="block text-sm text-gray-600 dark:text-gray-300 mb-1">New Password</label><input type="password" placeholder="New password (min 6 chars)" value={newPass} onChange={e => setNewPass(e.target.value)} className={inputCls} /></div>
                    <div><label className="block text-sm text-gray-600 dark:text-gray-300 mb-1">Confirm New Password</label><input type="password" placeholder="Confirm new password" value={confirmPass} onChange={e => setConfirmPass(e.target.value)} className={inputCls} /></div>
                    <button className="px-6 py-2.5 rounded-xl bg-violet-600 text-white hover:bg-violet-700 transition-colors text-sm font-medium">Update Password</button>
                  </form>
                </div>

                {/* Admin accounts */}
                <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <UserPlus className="w-5 h-5 text-violet-500" />
                      <h3 className="text-lg text-gray-900 dark:text-white" style={{ fontWeight: 600 }}>Admin Accounts</h3>
                    </div>
                    {currentAdmin.isSuperAdmin && (
                      <button onClick={() => setShowAddAdmin(true)} className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-violet-600 text-white text-sm hover:bg-violet-700 transition-colors">
                        <Plus className="w-3.5 h-3.5" /> Add Admin
                      </button>
                    )}
                  </div>
                  <div className="space-y-2">
                    {admins.map(a => (
                      <div key={a.email} className="flex items-center justify-between p-3 rounded-xl bg-gray-50 dark:bg-gray-700">
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="text-sm font-medium text-gray-900 dark:text-white">{a.name}</p>
                            {a.isSuperAdmin && <span className="px-2 py-0.5 rounded-full text-xs bg-violet-100 dark:bg-violet-900/40 text-violet-600">Super Admin</span>}
                            {a.email === currentAdmin.email && <span className="px-2 py-0.5 rounded-full text-xs bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600">You</span>}
                          </div>
                          <p className="text-xs text-gray-500 dark:text-gray-400">{a.email}</p>
                        </div>
                        {currentAdmin.isSuperAdmin && !a.isSuperAdmin && (
                          <button onClick={() => removeAdmin(a.email)} className="p-1.5 rounded-lg text-red-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                  {!currentAdmin.isSuperAdmin && (
                    <p className="text-xs text-gray-400 mt-3">Only the Super Admin can manage admin accounts.</p>
                  )}
                </div>

              </div>
            )}

          </>
        )}
      </div>

      {/* Add Admin Modal */}
      <Modal open={showAddAdmin} onClose={() => !addingAdmin && setShowAddAdmin(false)} title="Add New Admin">
        <form onSubmit={handleAddAdmin} className="space-y-4">
          <div><label className="block text-sm text-gray-600 dark:text-gray-300 mb-1">Full Name *</label><input placeholder="Admin name" value={newAdmin.name} onChange={e => setNewAdmin(p => ({ ...p, name: e.target.value }))} className={inputCls} /></div>
          <div><label className="block text-sm text-gray-600 dark:text-gray-300 mb-1">Email *</label><input type="email" placeholder="admin@example.com" value={newAdmin.email} onChange={e => setNewAdmin(p => ({ ...p, email: e.target.value }))} className={inputCls} /></div>
          <div><label className="block text-sm text-gray-600 dark:text-gray-300 mb-1">Password *</label><input type="password" placeholder="Min 6 characters" value={newAdmin.password} onChange={e => setNewAdmin(p => ({ ...p, password: e.target.value }))} className={inputCls} /></div>
          <p className="text-xs text-gray-400">This person will be able to sign in to the admin panel with these credentials.</p>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={() => setShowAddAdmin(false)} className="flex-1 py-2.5 rounded-xl border border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-300 hover:bg-gray-50">Cancel</button>
            <button type="submit" className="flex-1 py-2.5 rounded-xl bg-violet-600 text-white hover:bg-violet-700">Add Admin</button>
          </div>
        </form>
      </Modal>

    </div>
  );
}