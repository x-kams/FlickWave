import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from "react";

// ── Types ──────────────────────────────────────────────────────────────────────
interface User {
  name: string;
  email: string;
  verified: boolean;
}

export interface StoredUser {
  name: string;
  email: string;
  password: string;
  verified: boolean;
  blocked: boolean;
  isPremium: boolean;
  createdAt: string;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  pendingEmail: string | null;
  pendingOtp: string | null;
  login: (email: string, password: string) => { success: boolean; error?: string };
  signup: (name: string, email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  verifyOtp: (code: string) => { success: boolean; error?: string };
  resendOtp: () => Promise<void>;
  logout: () => void;
  // Forgot password
  sendResetOtp: (email: string) => Promise<{ success: boolean; error?: string }>;
  verifyResetOtp: (code: string) => { success: boolean; error?: string };
  resetPassword: (newPassword: string) => { success: boolean; error?: string };
  // Admin
  getAllUsers: () => StoredUser[];
  deleteUser: (email: string) => void;
  toggleBlockUser: (email: string) => void;
  togglePremiumUser: (email: string) => void;
  togglePremium: (email: string) => void;
  // User profile
  changePassword: (currentPassword: string, newPassword: string) => { success: boolean; error?: string };
  updateProfile:  (name: string) => { success: boolean; error?: string };
  deleteAccount:  () => { success: boolean; error?: string };
  getFullUser:    () => StoredUser | null;
}

const AuthContext = createContext<AuthContextType | null>(null);

// ── Keys ───────────────────────────────────────────────────────────────────────
const USERS_KEY     = "fw_users";
const LOGGED_IN_KEY = "fw_logged_in_user";

const DEFAULT_DEMO: StoredUser = {
  name: "Demo User", email: "demo@flickwave.com", password: "demo123",
  verified: true, blocked: false, isPremium: false, createdAt: new Date().toISOString(),
};

// ── localStorage helpers ───────────────────────────────────────────────────────
function loadUsers(): StoredUser[] {
  try {
    const list: StoredUser[] = JSON.parse(localStorage.getItem(USERS_KEY) || "[]");
    if (!list.some(u => u.email === "demo@flickwave.com")) list.push(DEFAULT_DEMO);
    return list;
  } catch { return [DEFAULT_DEMO]; }
}

function saveUsers(users: StoredUser[]): void {
  try { localStorage.setItem(USERS_KEY, JSON.stringify(users)); } catch { /**/ }
}

function loadLoggedInUser(): User | null {
  try { return JSON.parse(localStorage.getItem(LOGGED_IN_KEY) || "null"); }
  catch { return null; }
}

function saveLoggedInUser(u: User | null): void {
  try {
    if (u) localStorage.setItem(LOGGED_IN_KEY, JSON.stringify(u));
    else   localStorage.removeItem(LOGGED_IN_KEY);
  } catch { /**/ }
}

// ── OTP ────────────────────────────────────────────────────────────────────────
function generateOtp(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

async function sendEmailOtp(
  toEmail: string, userName: string, otp: string,
  purpose: "verification" | "reset" = "verification"
): Promise<void> {
  const res = await fetch("/api/email/send-otp", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ toEmail, userName, otp, purpose }),
  });
  if (!res.ok) {
    const d = await res.json().catch(() => ({}));
    throw new Error(d.error || "Email send failed");
  }
}

// ── Provider ───────────────────────────────────────────────────────────────────
export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser]                 = useState<User | null>(loadLoggedInUser);
  const [pendingEmail, setPendingEmail] = useState<string | null>(null);
  const [pendingOtp, setPendingOtp]     = useState<string | null>(null);
  // Reset flow state — separate from signup/verify flow
  const [resetEmail, setResetEmail]     = useState<string | null>(null);
  const [resetOtp, setResetOtp]         = useState<string | null>(null);
  const [resetVerified, setResetVerified] = useState(false);

  // ── Guard: force logout if admin deleted/blocked this user ─────────────────
  useEffect(() => {
    if (!user) return;
    const interval = setInterval(() => {
      const users  = loadUsers();
      const stored = users.find(u => u.email.toLowerCase() === user.email.toLowerCase());
      // Deleted or blocked → force logout
      if (!stored || stored.blocked) {
        setUser(null);
        saveLoggedInUser(null);
      }
    }, 3000); // check every 3 seconds
    return () => clearInterval(interval);
  }, [user]);

  // ── initOtp: generate, store in state, fire email ─────────────────────────
  const initOtp = useCallback(async (
    email: string, name: string,
    purpose: "verification" | "reset" = "verification"
  ) => {
    const otp = generateOtp();
    if (purpose === "reset") {
      setResetOtp(otp);
      setResetEmail(email);
    } else {
      setPendingOtp(otp);
      setPendingEmail(email);
    }
    try { await sendEmailOtp(email, name, otp, purpose); }
    catch (e) { console.warn("OTP email failed:", e); }
  }, []);

  // ── login ──────────────────────────────────────────────────────────────────
  const login = useCallback((email: string, password: string) => {
    const users = loadUsers();
    const found = users.find(u => u.email.toLowerCase() === email.toLowerCase());
    if (!found)          return { success: false, error: "No account found with this email. Please sign up first." };
    if (found.blocked)   return { success: false, error: "This account has been blocked. Please contact support." };
    if (found.password !== password) return { success: false, error: "Incorrect password. Please try again." };
    if (!found.verified) {
      const otp = generateOtp();
      setPendingOtp(otp);
      setPendingEmail(found.email);
      sendEmailOtp(found.email, found.name, otp, "verification").catch(console.warn);
      return { success: false, error: "UNVERIFIED" };
    }
    const loggedIn: User = { name: found.name, email: found.email, verified: true };
    setUser(loggedIn);
    saveLoggedInUser(loggedIn);
    return { success: true };
  }, []);

  // ── signup ─────────────────────────────────────────────────────────────────
  const signup = useCallback(async (name: string, email: string, password: string) => {
    const users    = loadUsers();
    const existing = users.find(u => u.email.toLowerCase() === email.toLowerCase());
    if (existing) {
      if (!existing.verified) {
        await initOtp(existing.email, existing.name, "verification");
        return { success: true };
      }
      return { success: false, error: "An account with this email already exists. Please sign in." };
    }
    users.push({ name, email, password, verified: false, blocked: false, isPremium: false, createdAt: new Date().toISOString() });
    saveUsers(users);
    await initOtp(email, name, "verification");
    return { success: true };
  }, [initOtp]);

  // ── verifyOtp (signup flow) ────────────────────────────────────────────────
  const verifyOtp = useCallback((code: string) => {
    if (!pendingOtp || !pendingEmail) return { success: false, error: "No pending verification. Please sign up again." };
    if (code !== pendingOtp)          return { success: false, error: "Invalid code. Please try again." };
    const users = loadUsers();
    const found = users.find(u => u.email.toLowerCase() === pendingEmail.toLowerCase());
    if (found) {
      found.verified = true;
      saveUsers(users);
      const loggedIn: User = { name: found.name, email: found.email, verified: true };
      setUser(loggedIn);
      saveLoggedInUser(loggedIn);
    }
    setPendingOtp(null);
    setPendingEmail(null);
    return { success: true };
  }, [pendingOtp, pendingEmail]);

  // ── resendOtp ──────────────────────────────────────────────────────────────
  const resendOtp = useCallback(async () => {
    if (!pendingEmail) return;
    const found = loadUsers().find(u => u.email.toLowerCase() === pendingEmail.toLowerCase());
    if (!found) return;
    await initOtp(pendingEmail, found.name, "verification");
  }, [pendingEmail, initOtp]);

  // ── logout ─────────────────────────────────────────────────────────────────
  const logout = useCallback(() => {
    setUser(null);
    saveLoggedInUser(null);
    setPendingEmail(null);
    setPendingOtp(null);
  }, []);

  // ── Forgot password — step 1: send reset OTP ──────────────────────────────
  const sendResetOtp = useCallback(async (email: string) => {
    const users = loadUsers();
    const found = users.find(u => u.email.toLowerCase() === email.toLowerCase());
    if (!found)        return { success: false, error: "No account found with this email." };
    if (found.blocked) return { success: false, error: "This account has been blocked." };
    await initOtp(found.email, found.name, "reset");
    return { success: true };
  }, [initOtp]);

  // ── Forgot password — step 2: verify reset OTP ────────────────────────────
  const verifyResetOtp = useCallback((code: string) => {
    if (!resetOtp || !resetEmail) return { success: false, error: "No reset request found. Please start again." };
    if (code !== resetOtp)        return { success: false, error: "Invalid code. Please try again." };
    setResetVerified(true);
    setResetOtp(null);
    return { success: true };
  }, [resetOtp, resetEmail]);

  // ── Forgot password — step 3: set new password ────────────────────────────
  const resetPassword = useCallback((newPassword: string) => {
    if (!resetVerified || !resetEmail) return { success: false, error: "Please verify your email first." };
    if (newPassword.length < 6)        return { success: false, error: "Password must be at least 6 characters." };
    const users = loadUsers();
    const found = users.find(u => u.email.toLowerCase() === resetEmail.toLowerCase());
    if (!found) return { success: false, error: "Account not found." };
    found.password = newPassword;
    saveUsers(users);
    setResetEmail(null);
    setResetVerified(false);
    return { success: true };
  }, [resetVerified, resetEmail]);

  // ── Admin ──────────────────────────────────────────────────────────────────
  const getAllUsers = useCallback((): StoredUser[] => loadUsers(), []);

  const deleteUser = useCallback((email: string) => {
    saveUsers(loadUsers().filter(u => u.email.toLowerCase() !== email.toLowerCase()));
  }, []);

  const togglePremium = useCallback((email: string) => {
    const users = loadUsers();
    const found = users.find(u => u.email.toLowerCase() === email.toLowerCase());
    if (found) {
      found.isPremium = !found.isPremium;
      saveUsers(users);
      // Sync with backend premium store
      fetch("/api/premium/set", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: found.email, isPremium: found.isPremium }),
      }).catch(() => {});
    }
  }, []);

  const togglePremiumUser = useCallback((email: string) => {
    const users = loadUsers();
    const found = users.find(u => u.email.toLowerCase() === email.toLowerCase());
    if (found) {
      found.isPremium = !found.isPremium;
      saveUsers(users);
      // Sync with backend premium store
      fetch("/api/premium/set", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: found.email, isPremium: found.isPremium }),
      }).catch(() => {});
    }
  }, []);

  const toggleBlockUser = useCallback((email: string) => {
    const users = loadUsers();
    const found = users.find(u => u.email.toLowerCase() === email.toLowerCase());
    if (found) { found.blocked = !found.blocked; saveUsers(users); }
  }, []);

  // ── changePassword ─────────────────────────────────────────────────────────
  const changePassword = useCallback((currentPassword: string, newPassword: string) => {
    if (!user) return { success: false, error: "Not logged in" };
    if (newPassword.length < 6) return { success: false, error: "Password must be at least 6 characters" };
    const users = loadUsers();
    const found = users.find(u => u.email.toLowerCase() === user.email.toLowerCase());
    if (!found) return { success: false, error: "Account not found" };
    if (found.password !== currentPassword) return { success: false, error: "Current password is incorrect" };
    found.password = newPassword;
    saveUsers(users);
    return { success: true };
  }, [user]);

  // ── updateProfile ────────────────────────────────────────────────────────────
  const updateProfile = useCallback((name: string) => {
    if (!user) return { success: false, error: "Not logged in" };
    if (!name.trim()) return { success: false, error: "Name cannot be empty" };
    const users = loadUsers();
    const found = users.find(u => u.email.toLowerCase() === user.email.toLowerCase());
    if (!found) return { success: false, error: "Account not found" };
    found.name = name.trim();
    saveUsers(users);
    const updated = { ...user, name: name.trim() };
    setUser(updated);
    saveLoggedInUser(updated);
    return { success: true };
  }, [user]);

  // ── deleteAccount ─────────────────────────────────────────────────────────────
  const deleteAccount = useCallback(() => {
    if (!user) return { success: false, error: "Not logged in" };
    const users = loadUsers().filter(u => u.email.toLowerCase() !== user.email.toLowerCase());
    saveUsers(users);
    setUser(null);
    saveLoggedInUser(null);
    return { success: true };
  }, [user]);

  // ── getFullUser ───────────────────────────────────────────────────────────────
  const getFullUser = useCallback((): StoredUser | null => {
    if (!user) return null;
    return loadUsers().find(u => u.email.toLowerCase() === user.email.toLowerCase()) ?? null;
  }, [user]);

  return (
    <AuthContext.Provider value={{
      user,
      isAuthenticated: !!user && user.verified,
      pendingEmail,
      pendingOtp,
      login, signup, verifyOtp, resendOtp, logout,
      sendResetOtp, verifyResetOtp, resetPassword,
      getAllUsers, deleteUser, toggleBlockUser, togglePremiumUser, togglePremium,
      changePassword, updateProfile, deleteAccount, getFullUser,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}