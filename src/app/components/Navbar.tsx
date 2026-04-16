import { Link, useLocation } from "react-router";
import { Home, Search, Music,Music2,Settings, Menu, X, LogIn, User, LogOut, Sparkles, Crown } from "lucide-react";
import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { useAuth } from "../context/AuthContext";
import { ThemeToggle } from "./ThemeToggle";

const navLinks = [
  { to: "/",         label: "Home",     icon: Home     },
  { to: "/search",   label: "Search",   icon: Search   },
  { to: "/discover", label: "Discover", icon: Sparkles },
  { to: "/generate", label: "Generate", icon: Music2 },
  { to: "/settings", label: "Settings", icon: Settings },
  { to: "/player",   label: "Player",   icon: Music    },
];

export function Navbar() {
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const { user, isAuthenticated, logout, getAllUsers } = useAuth();
  const storedUsers = getAllUsers();
  const storedUser  = storedUsers.find(u => u.email === user?.email);
  const isPremium   = storedUser?.isPremium ?? false;

  return (
    <nav className="sticky top-0 z-50 bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl border-b border-gray-200/60 dark:border-gray-700/60">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <Link to="/" className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-violet-500 to-fuchsia-500 flex items-center justify-center">
              <Music className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl bg-gradient-to-r from-violet-600 to-fuchsia-600 bg-clip-text text-transparent" style={{ fontWeight: 700 }}>
              FlickWave
            </span>
          </Link>

          {/* Desktop nav */}
          <div className="hidden md:flex items-center gap-1">
            {navLinks.map(({ to, label, icon: Icon }) => {
              const active = location.pathname === to;
              return (
                <Link
                  key={to}
                  to={to}
                  className={`relative flex items-center gap-2 px-4 py-2 rounded-xl transition-all ${
                    active
                      ? "text-violet-700 dark:text-violet-400 bg-violet-50 dark:bg-violet-900/30"
                      : "text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-gray-800"
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{label}</span>
                </Link>
              );
            })}

            <ThemeToggle className="ml-1" />

            {isAuthenticated ? (
              <div className="flex items-center gap-2 ml-2">
                <span className={`text-sm flex items-center gap-1.5 px-3 py-1.5 rounded-xl ${isPremium ? "bg-amber-50 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400" : "bg-violet-50 dark:bg-violet-900/30 text-gray-600 dark:text-gray-300"}`}>
                  {isPremium ? <Crown className="w-3.5 h-3.5" /> : <User className="w-3.5 h-3.5" />}
                  {user?.name}
                  {isPremium && <span className="text-xs font-semibold">PRO</span>}
                </span>
                <button onClick={logout} className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                  <LogOut className="w-3.5 h-3.5" /> Logout
                </button>
              </div>
            ) : (
              <Link to="/login" className="ml-2 flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white text-sm hover:opacity-90 transition-opacity">
                <LogIn className="w-3.5 h-3.5" /> Sign In
              </Link>
            )}
          </div>

          {/* Mobile */}
          <div className="md:hidden flex items-center gap-2">
            <ThemeToggle />
            <button className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300" onClick={() => setMobileOpen(!mobileOpen)}>
              {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="md:hidden overflow-hidden border-t border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-900"
          >
            <div className="px-4 py-3 space-y-1">
              {navLinks.map(({ to, label, icon: Icon }) => (
                <Link
                  key={to}
                  to={to}
                  onClick={() => setMobileOpen(false)}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-xl ${
                    location.pathname === to
                      ? "text-violet-700 dark:text-violet-400 bg-violet-50 dark:bg-violet-900/30"
                      : "text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800"
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {label}
                </Link>
              ))}
              {isAuthenticated ? (
                <>
                  <div className="flex items-center gap-2 px-3 py-2.5 text-sm text-gray-600 dark:text-gray-300">
                    <User className="w-4 h-4" /> {user?.name}
                  </div>
                  <button onClick={() => { logout(); setMobileOpen(false); }} className="flex items-center gap-2 px-3 py-2.5 text-gray-500 dark:text-gray-400 w-full rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800">
                    <LogOut className="w-4 h-4" /> Logout
                  </button>
                </>
              ) : (
                <Link to="/login" onClick={() => setMobileOpen(false)} className="flex items-center gap-2 px-3 py-2.5 text-violet-600 dark:text-violet-400 rounded-xl hover:bg-violet-50 dark:hover:bg-violet-900/30">
                  <LogIn className="w-4 h-4" /> Sign In
                </Link>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}