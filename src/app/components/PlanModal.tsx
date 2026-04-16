import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { X, Check, Crown, Zap, Music2, Star } from "lucide-react";

// ── Plan definitions ──────────────────────────────────────────────────────────
export const PLANS = [
  {
    id:       "free",
    label:    "Free",
    price:    "$0",
    period:   "forever",
    Icon:     Music2,
    gradient: "from-gray-500 to-slate-600",
    border:   "border-gray-200 dark:border-gray-600",
    activeBg: "bg-gradient-to-r from-gray-500 to-slate-600",
    badge:    "",
    features: [
      { text: "3 AI music generations per month",       ok: true  },
      { text: "Up to 5 seconds per generated track",    ok: true  },
      { text: "Low quality audio output",               ok: true  },
      { text: "Access to full song library",            ok: true  },
      { text: "AI song recommendation engine",          ok: true  },
      { text: "Preview premium songs (5 sec limit)",    ok: true  },
      { text: "3 song downloads per day",               ok: true  },
      { text: "Download generated AI tracks",           ok: false },
      { text: "Full song streaming (no preview limit)", ok: false },
      { text: "30+ second generated tracks",            ok: false },
      { text: "Standard / High quality audio",          ok: false },
      { text: "Priority generation queue",              ok: false },
      { text: "Unlimited song downloads",               ok: false },
      { text: "Commercial use license",                 ok: false },
    ],
    cta: "Current Free Plan",
  },
  {
    id:       "basic",
    label:    "Basic",
    price:    "$4.99",
    period:   "per month",
    Icon:     Zap,
    gradient: "from-blue-500 to-violet-600",
    border:   "border-blue-200 dark:border-blue-700",
    activeBg: "bg-gradient-to-r from-blue-500 to-violet-600",
    badge:    "Most Popular",
    features: [
      { text: "20 AI music generations per month",      ok: true  },
      { text: "Up to 30 seconds per generated track",   ok: true  },
      { text: "Standard quality audio output",          ok: true  },
      { text: "Full song streaming (no limits)",        ok: true  },
      { text: "Download generated AI tracks",           ok: true  },
      { text: "Unlimited song downloads",               ok: true  },
      { text: "AI song recommendation engine",          ok: true  },
      { text: "Access to full song library",            ok: true  },
      { text: "3 AI music generations per month",       ok: false },
      { text: "High quality audio (320kbps)",           ok: false },
      { text: "60 second generated tracks",             ok: false },
      { text: "Priority generation queue",              ok: false },
      { text: "Commercial use license",                 ok: false },
      { text: "Dedicated support",                      ok: false },
    ],
    cta: "Upgrade to Basic",
  },
  {
    id:       "premium",
    label:    "Premium",
    price:    "$9.99",
    period:   "per month",
    Icon:     Crown,
    gradient: "from-amber-400 to-orange-500",
    border:   "border-amber-200 dark:border-amber-700",
    activeBg: "bg-gradient-to-r from-amber-400 to-orange-500",
    badge:    "Best Value",
    features: [
      { text: "200 AI music generations per month",     ok: true  },
      { text: "Up to 60 seconds per generated track",   ok: true  },
      { text: "High quality audio (320kbps)",           ok: true  },
      { text: "Full song streaming with no limits",     ok: true  },
      { text: "Download generated AI tracks",           ok: true  },
      { text: "Unlimited song downloads",               ok: true  },
      { text: "Priority generation queue",              ok: true  },
      { text: "AI song recommendation engine",          ok: true  },
      { text: "Commercial use license",                 ok: true  },
      { text: "Early access to new features",           ok: true  },
      { text: "Dedicated support channel",              ok: true  },
      { text: "Full song library access",               ok: true  },
      { text: "Export in multiple formats",             ok: true  },
      { text: "Collaboration features (coming soon)",   ok: true  },
    ],
    cta: "Upgrade to Premium",
  },
];

interface PlanModalProps {
  open:         boolean;
  onClose:      () => void;
  currentPlan?: string;
  defaultPlan?: string;
}

export function PlanModal({ open, onClose, currentPlan = "free", defaultPlan }: PlanModalProps) {
  const initIdx = PLANS.findIndex(p => p.id === (defaultPlan ?? currentPlan));
  const [activeIdx, setActiveIdx] = useState(initIdx < 0 ? 0 : initIdx);
  const plan = PLANS[activeIdx];
  const PlanIcon = plan.Icon;
  const isCurrent = plan.id === currentPlan;

  const comparison = [
    ["Generations/month",   "3",      "20",        "200"          ],
    ["Max duration",        "5s",     "30s",       "60s"          ],
    ["Audio quality",       "Low",    "Standard",  "High 320kbps" ],
    ["Full streaming",      "✗",      "✓",         "✓"            ],
    ["Download gen. track", "✗",      "✓",         "✓"            ],
    ["Song downloads",      "3/day",  "Unlimited", "Unlimited"    ],
    ["Priority queue",      "✗",      "✗",         "✓"            ],
  ];

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[200] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-sm"
          onClick={onClose}
        >
          <motion.div
            initial={{ y: 80, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 80, opacity: 0 }}
            transition={{ type: "spring", damping: 28, stiffness: 280 }}
            onClick={e => e.stopPropagation()}
            className="bg-white dark:bg-gray-900 w-full sm:max-w-xl rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-hidden flex flex-col"
            style={{ maxHeight: "92vh" }}
          >
            {/* ── Gradient header ── */}
            <div className={`bg-gradient-to-br ${plan.gradient} px-6 pt-6 pb-5 text-white relative flex-shrink-0`}>
              <button
                onClick={onClose}
                className="absolute top-4 right-4 w-8 h-8 rounded-xl bg-white/20 hover:bg-white/30 flex items-center justify-center transition-colors"
              >
                <X className="w-4 h-4" />
              </button>

              <div className="flex items-center gap-3 mb-4">
                <div className="w-11 h-11 rounded-2xl bg-white/20 flex items-center justify-center flex-shrink-0">
                  <PlanIcon className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="text-white/60 text-xs font-medium uppercase tracking-widest">FlickWave</p>
                  <h2 className="text-xl font-black leading-tight">{plan.label} Plan</h2>
                </div>
                {plan.badge && (
                  <span className="ml-auto flex items-center gap-1 px-2.5 py-1 rounded-full bg-white/20 text-white text-xs font-bold">
                    <Star className="w-3 h-3" /> {plan.badge}
                  </span>
                )}
              </div>

              <div className="flex items-end gap-1.5">
                <span className="text-4xl font-black">{plan.price}</span>
                <span className="text-white/60 text-sm mb-1">/{plan.period}</span>
              </div>
            </div>

            {/* ── Plan selector ── */}
            <div className="flex gap-2 px-5 py-3 border-b border-gray-100 dark:border-gray-800 flex-shrink-0">
              {PLANS.map((p, i) => {
                const Icon = p.Icon;
                return (
                  <button
                    key={p.id}
                    onClick={() => setActiveIdx(i)}
                    className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-semibold transition-all ${
                      activeIdx === i
                        ? `${p.activeBg} text-white shadow-md`
                        : "bg-gray-50 dark:bg-gray-800 text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700"
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    {p.label}
                    {p.id === currentPlan && (
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                    )}
                  </button>
                );
              })}
            </div>

            {/* ── Scrollable body ── */}
            <div className="overflow-y-auto flex-1 px-5 py-4">

              {/* Feature checklist */}
              <p className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-3">
                What's included
              </p>
              <div className="space-y-2 mb-6">
                {plan.features.map((f, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.03 }}
                    className="flex items-center gap-2.5"
                  >
                    <div className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 ${
                      f.ok
                        ? "bg-emerald-100 dark:bg-emerald-900/40"
                        : "bg-gray-100 dark:bg-gray-800"
                    }`}>
                      {f.ok
                        ? <Check className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                        : <X className="w-3 h-3 text-gray-300 dark:text-gray-600" />
                      }
                    </div>
                    <span className={`text-sm ${
                      f.ok
                        ? "text-gray-800 dark:text-gray-200"
                        : "text-gray-350 dark:text-gray-600 line-through"
                    }`}>
                      {f.text}
                    </span>
                  </motion.div>
                ))}
              </div>

              {/* Comparison table */}
              <div className="border border-gray-100 dark:border-gray-800 rounded-2xl overflow-hidden">
                <div className="px-4 py-2.5 bg-gray-50 dark:bg-gray-800">
                  <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">All Plans Compared</p>
                </div>
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-gray-100 dark:border-gray-800">
                      <th className="text-left px-4 py-2.5 text-gray-500 dark:text-gray-400 font-medium">Feature</th>
                      {PLANS.map(p => (
                        <th key={p.id} className={`py-2.5 text-center font-bold ${
                          p.id === plan.id
                            ? "text-violet-600 dark:text-violet-400"
                            : "text-gray-400 dark:text-gray-500"
                        }`}>
                          {p.label}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {comparison.map(([label, ...vals]) => (
                      <tr key={label} className="border-b border-gray-50 dark:border-gray-800/50 last:border-0">
                        <td className="px-4 py-2 text-gray-600 dark:text-gray-400">{label}</td>
                        {vals.map((v, i) => (
                          <td key={i} className={`py-2 text-center font-medium ${
                            PLANS[i].id === plan.id
                              ? "text-violet-700 dark:text-violet-300 bg-violet-50/50 dark:bg-violet-900/10"
                              : "text-gray-500 dark:text-gray-400"
                          } ${v === "✗" ? "text-red-400 dark:text-red-500" : v === "✓" ? "text-emerald-500" : ""}`}>
                            {v}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* ── CTA footer ── */}
            <div className="px-5 pb-6 pt-4 border-t border-gray-100 dark:border-gray-800 flex-shrink-0">
              {isCurrent ? (
                <div className="flex items-center justify-center gap-2 py-3 rounded-2xl bg-gray-50 dark:bg-gray-800 text-sm font-semibold text-gray-500 dark:text-gray-400">
                  <Check className="w-4 h-4 text-emerald-500" /> You are on this plan
                </div>
              ) : (
                <>
                  <button
                    onClick={onClose}
                    className={`w-full py-3.5 rounded-2xl text-sm font-bold transition-all bg-gradient-to-r ${plan.gradient} text-white shadow-lg hover:opacity-90 active:scale-[0.98]`}
                  >
                    {plan.cta}
                  </button>
                  <p className="text-center text-xs text-gray-400 dark:text-gray-500 mt-2.5">
                    Contact your admin to upgrade · Cancel anytime
                  </p>
                </>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}