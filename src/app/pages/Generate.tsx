import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Music2, Sparkles, Crown, Download, Play, Pause,
  RotateCcw, ChevronRight, Check, Loader2, AlertCircle,
  Volume2,Star, Zap,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { PlanModal } from "../components/PlanModal";
import { toast } from "sonner";

// ── Types ─────────────────────────────────────────────────────────────────────
interface Answers {
  mood:        string;
  genre:       string;
  tempo:       string;
  instruments: string;
  useCase:     string;
  vocals:      string;
  duration:    number;
}

interface GeneratedTrack {
  id:         string;
  status:     "pending" | "processing" | "done" | "failed";
  audioUrl:   string;
  errorMsg:   string;
  durationSec:number;
  quality:    string;
  plan:       string;
  prompt: {
    description: string;
    bpm:         string;
    instruments: string;
    style_tags:  string[];
  };
  answers:    Answers;
  createdAt:  string;
}

interface UsageInfo {
  plan:        string;
  label:       string;
  used:        number;
  limit:       number;
  remaining:   number;
  maxDuration: number;
  canDownload: boolean;
  quality:     string;
}

const PLAN_INFO = {
  free:    { color: "text-gray-600 dark:text-gray-300",    bg: "bg-gray-100 dark:bg-gray-700",    icon: "🎵", desc: "3 generations · 5s · No download" },
  basic:   { color: "text-blue-600 dark:text-blue-400",    bg: "bg-blue-50 dark:bg-blue-900/30",  icon: "⚡", desc: "20/month · 30s · Download included" },
  premium: { color: "text-amber-600 dark:text-amber-400",  bg: "bg-amber-50 dark:bg-amber-900/30", icon: "👑", desc: "200/month · 60s · High quality" },
};

// ── Question definitions ───────────────────────────────────────────────────────
const QUESTIONS = [
  {
    key: "mood",
    label: "What's the mood?",
    subtitle: "How should this music make you feel?",
    type: "chips",
    options: ["Happy", "Sad", "Chill", "Energetic", "Romantic", "Dark", "Uplifting", "Mysterious"],
  },
  {
    key: "genre",
    label: "Choose a genre",
    subtitle: "Pick the style closest to what you want",
    type: "chips",
    options: ["Pop", "Rock", "Electronic", "Jazz", "Classical", "Hip-hop", "Ambient", "Folk", "R&B", "Lo-fi"],
  },
  {
    key: "tempo",
    label: "How fast?",
    subtitle: "Select the energy level and rhythm speed",
    type: "chips",
    options: ["Very Slow", "Slow", "Medium", "Fast", "Very Fast"],
  },
  {
    key: "instruments",
    label: "Which instruments?",
    subtitle: "Type or pick your favourite instruments",
    type: "text",
    placeholder: "e.g. guitar, piano, drums, violin",
    options: ["Guitar", "Piano", "Drums", "Violin", "Synthesizer", "Bass", "Trumpet", "Cello"],
  },
  {
    key: "useCase",
    label: "What's it for?",
    subtitle: "How will you use this track?",
    type: "chips",
    options: ["Relaxation", "Workout", "Focus / Study", "Party", "Sleep", "Background Music", "Video / Content", "Meditation"],
  },
  {
    key: "vocals",
    label: "Vocals or instrumental?",
    subtitle: "Should the track include sung vocals?",
    type: "chips",
    options: ["Instrumental (no vocals)", "Yes, include vocals"],
  },
  {
    key: "duration",
    label: "How long?",
    subtitle: "Duration depends on your plan",
    type: "duration",
    options: [],
  },
];

// ── Helper ────────────────────────────────────────────────────────────────────
function getAnswerValue(answers: Partial<Answers>, key: string) {
  return (answers as Record<string, unknown>)[key] ?? "";
}

// ── Main Component ─────────────────────────────────────────────────────────────
export function Generate() {
  const { user } = useAuth();

  const [step, setStep]           = useState<"questions" | "generating" | "result" | "library">("questions");
  const [currentQ, setCurrentQ]   = useState(0);
  const [answers, setAnswers]     = useState<Partial<Answers>>({});
  const [usage, setUsage]         = useState<UsageInfo | null>(null);
  const [jobId, setJobId]         = useState<string | null>(null);
  const [track, setTrack]         = useState<GeneratedTrack | null>(null);
  const [library, setLibrary]     = useState<GeneratedTrack[]>([]);
  const [playing, setPlaying]     = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState(0);
  const [planModalOpen, setPlanModalOpen] = useState(false);
  const [planModalDefault, setPlanModalDefault] = useState<string | undefined>(undefined);
  const [loadingLibrary, setLoadingLibrary] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const pollRef  = useRef<ReturnType<typeof setInterval> | null>(null);

  const email = user?.email ?? "";

  // ── Load usage on mount ────────────────────────────────────────────────────
  useEffect(() => {
    if (!email) return;
    fetch(`/api/generate/usage?email=${encodeURIComponent(email)}`)
      .then(r => r.json())
      .then(setUsage)
      .catch(() => {});
  }, [email]);

  // ── Poll job status ────────────────────────────────────────────────────────
  useEffect(() => {
    if (!jobId) return;
    pollRef.current = setInterval(async () => {
      try {
        const res  = await fetch(`/api/generate/status/${jobId}`);
        const data: GeneratedTrack = await res.json();
        setTrack(data);
        if (data.status === "done" || data.status === "failed") {
          clearInterval(pollRef.current!);
          setStep("result");
          if (data.status === "done") {
            toast.success("🎵 Your music is ready!");
            // Refresh usage
            fetch(`/api/generate/usage?email=${encodeURIComponent(email)}`)
              .then(r => r.json()).then(setUsage).catch(() => {});
          } else {
            toast.error("Generation failed. Your quota has been refunded.");
          }
        }
      } catch { /* ignore polling errors */ }
    }, 3000);
    return () => clearInterval(pollRef.current!);
  }, [jobId, email]);

  // ── Answer a question ──────────────────────────────────────────────────────
  const handleAnswer = (key: string, value: string | number) => {
    setAnswers(prev => ({ ...prev, [key]: value }));
  };

  const handleNext = () => {
    const q = QUESTIONS[currentQ];
    const val = getAnswerValue(answers, q.key);
    if (!val && q.key !== "instruments") {
      toast.error("Please make a selection before continuing");
      return;
    }
    if (currentQ < QUESTIONS.length - 1) {
      setCurrentQ(c => c + 1);
    } else {
      handleGenerate();
    }
  };

  // ── Submit generation ──────────────────────────────────────────────────────
  const handleGenerate = async () => {
    if (!email) { toast.error("Please sign in first"); return; }
    if (!usage || usage.remaining <= 0) {
      toast.error("You've reached your generation limit. Please upgrade your plan.");
      return;
    }

    const finalAnswers: Answers = {
      mood:        String(answers.mood        || ""),
      genre:       String(answers.genre       || ""),
      tempo:       String(answers.tempo       || ""),
      instruments: String(answers.instruments || ""),
      useCase:     String(answers.useCase     || ""),
      vocals:      String(answers.vocals      || "no").includes("Yes") ? "yes" : "no",
      duration:    Number(answers.duration    || usage.maxDuration),
    };

    setStep("generating");
    setTrack(null);

    try {
      const res  = await fetch("/api/generate/music", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ email, answers: finalAnswers }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "Generation failed");
        setStep("questions");
        return;
      }
      setJobId(data.jobId);
    } catch {
      toast.error("Network error. Please try again.");
      setStep("questions");
    }
  };

  // ── Play / pause ───────────────────────────────────────────────────────────
  const handlePlayPause = () => {
    if (!track?.audioUrl) return;
    if (!audioRef.current) audioRef.current = new Audio(track.audioUrl);

    if (playing) {
      audioRef.current.pause();
      setPlaying(false);
    } else {
      audioRef.current.play().then(() => setPlaying(true)).catch(() => toast.error("Cannot play audio"));
    }
    audioRef.current.onended = () => setPlaying(false);
  };

  // ── Download with progress ───────────────────────────────────────────────────
  const handleDownload = async () => {
    if (!track?.audioUrl) return;
    if (!usage?.canDownload) {
      setPlanModalDefault("basic");
      setPlanModalOpen(true);
      return;
    }
    setDownloading(true);
    setDownloadProgress(0);
    try {
      const res = await fetch(track.audioUrl);
      if (!res.ok) throw new Error("Failed to fetch audio");

      // Stream with progress tracking
      const contentLength = Number(res.headers.get("Content-Length") || 0);
      const reader = res.body?.getReader();
      const chunks: Uint8Array[] = [];
      let received = 0;

      if (reader && contentLength > 0) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          chunks.push(value);
          received += value.length;
          setDownloadProgress(Math.round((received / contentLength) * 100));
        }
      } else {
        // Fallback: no Content-Length header
        const blob = await res.blob();
        chunks.push(new Uint8Array(await blob.arrayBuffer()));
        setDownloadProgress(100);
      }

      const blob = await res.blob();
      const url     = URL.createObjectURL(blob);
      const a       = document.createElement("a");
      const safeTitle = (track.answers?.mood && track.answers?.genre)
        ? `${track.answers.mood}-${track.answers.genre}`
        : `flickwave-track`;
      a.href        = url;
      a.download    = `${safeTitle}-${track.id.slice(-6)}.mp3`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setTimeout(() => URL.revokeObjectURL(url), 10000);
      toast.success("Track saved to your device!");
    } catch (err) {
      console.error("Download failed:", err);
      toast.error("Download failed. Please try again.");
    } finally {
      setDownloading(false);
      setDownloadProgress(0);
    }
  };

  // ── Load library ───────────────────────────────────────────────────────────
  const loadLibrary = async () => {
    if (!email) return;
    setLoadingLibrary(true);
    try {
      const res  = await fetch(`/api/generate/tracks?email=${encodeURIComponent(email)}`);
      const data = await res.json();
      setLibrary(Array.isArray(data) ? data : []);
      setStep("library");
    } catch {
      toast.error("Failed to load library");
    } finally {
      setLoadingLibrary(false);
    }
  };

  const resetFlow = () => {
    setStep("questions");
    setCurrentQ(0);
    setAnswers({});
    setJobId(null);
    setTrack(null);
    setPlaying(false);
    if (audioRef.current) { audioRef.current.pause(); audioRef.current = null; }
  };

  // ── UI Helpers ─────────────────────────────────────────────────────────────
  const q         = QUESTIONS[currentQ];
  const progress  = ((currentQ + 1) / QUESTIONS.length) * 100;
  const planInfo  = PLAN_INFO[usage?.plan as keyof typeof PLAN_INFO] ?? PLAN_INFO.free;

  if (!user) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center text-center px-4">
        <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-violet-500 to-fuchsia-500 flex items-center justify-center mx-auto mb-6 shadow-xl shadow-violet-200 dark:shadow-violet-900/40">
          <Music2 className="w-10 h-10 text-white" />
        </div>
        <h1 className="text-3xl font-black text-gray-900 dark:text-white mb-3">AI Music Generator</h1>
        <p className="text-gray-500 dark:text-gray-400 mb-8 max-w-md">Sign in to generate custom music tracks with AI in seconds.</p>
        <a href="/login" className="px-8 py-3 rounded-2xl bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white font-semibold hover:shadow-lg transition-all">
          Sign In to Generate
        </a>
      </div>
    );
  }

  return (
    <div className="min-h-screen dark:bg-gray-950 pb-28">

      {/* ── Hero header ── */}
      <div className="bg-gradient-to-br from-violet-600 via-fuchsia-600 to-pink-600 text-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-10">
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Sparkles className="w-5 h-5 text-yellow-300" />
                <span className="text-sm font-medium text-white/80">AI-Powered</span>
              </div>
              <h1 className="text-3xl sm:text-4xl font-black mb-1">Music Generator</h1>
              <p className="text-white/70 text-sm">Answer 7 questions. Get a unique track in under 2 minutes.</p>
            </div>

            {/* Plan badge */}
            {usage && (
              <div className={`hidden sm:flex flex-col items-end gap-1`}>
                <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/20 backdrop-blur text-sm font-semibold`}>
                  {usage.plan === "premium" ? <Crown className="w-4 h-4 text-amber-300" /> : usage.plan === "basic" ? <Zap className="w-4 h-4 text-blue-300" /> : <Music2 className="w-4 h-4" />}
                  {usage.label} Plan
                </div>
                <span className="text-xs text-white/60">
                  {usage.remaining === Infinity ? "Unlimited" : `${usage.remaining} generations left`}
                </span>
              </div>
            )}
          </div>

          {/* Usage bar */}
          {usage && (
            <div className="mt-6 bg-white/10 rounded-2xl p-4">
              <div className="flex items-center justify-between mb-2 text-sm">
                <span className="text-white/80">Monthly generations</span>
                <span className="font-bold">{usage.used} / {usage.limit}</span>
              </div>
              <div className="h-2 bg-white/20 rounded-full overflow-hidden">
                <div
                  className="h-full bg-white rounded-full transition-all"
                  style={{ width: `${Math.min((usage.used / usage.limit) * 100, 100)}%` }}
                />
              </div>
              <div className="flex items-center gap-4 mt-3 text-xs text-white/70">
                <span>Max {usage.maxDuration}s duration</span>
                <span>·</span>
                <span>{usage.canDownload ? "Download ✓" : "No download"}</span>
                <span>·</span>
                <span>{usage.quality} quality</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── Nav tabs ── */}
      <div className="sticky top-0 z-10 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 shadow-sm">
        <div className="max-w-4xl mx-auto px-4 flex gap-1 py-2">
          {[
            { id: "questions", label: "Generate", icon: Sparkles },
            { id: "library",   label: "My Tracks",  icon: Music2 },
          ].map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => id === "library" ? loadLibrary() : setStep("questions")}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                (step === id || (step === "result" && id === "questions") || (step === "generating" && id === "questions"))
                  ? "bg-violet-600 text-white"
                  : "text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
              }`}
            >
              <Icon className="w-4 h-4" />
              {label}
              {id === "library" && loadingLibrary && <Loader2 className="w-3 h-3 animate-spin" />}
            </button>
          ))}
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
        <AnimatePresence mode="wait">

          {/* ══ QUESTIONS ══════════════════════════════════════════════════════ */}
          {step === "questions" && (
            <motion.div key="questions" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}>

              {/* Progress bar */}
              <div className="mb-8">
                <div className="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400 mb-2">
                  <span>Question {currentQ + 1} of {QUESTIONS.length}</span>
                  <span>{Math.round(progress)}% complete</span>
                </div>
                <div className="h-2 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                  <motion.div
                    className="h-full bg-gradient-to-r from-violet-500 to-fuchsia-500 rounded-full"
                    initial={{ width: 0 }}
                    animate={{ width: `${progress}%` }}
                    transition={{ duration: 0.4 }}
                  />
                </div>
              </div>

              {/* Question card */}
              <AnimatePresence mode="wait">
                <motion.div
                  key={currentQ}
                  initial={{ opacity: 0, x: 30 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -30 }}
                  transition={{ duration: 0.25 }}
                  className="bg-white dark:bg-gray-800 rounded-3xl border border-gray-200 dark:border-gray-700 p-6 sm:p-8 shadow-sm"
                >
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">{q.label}</h2>
                  <p className="text-gray-500 dark:text-gray-400 mb-6">{q.subtitle}</p>

                  {/* Chip / option selector */}
                  {(q.type === "chips" || q.type === "text") && (
                    <div className="flex flex-wrap gap-3 mb-4">
                      {q.options.map(opt => {
                        const selected = getAnswerValue(answers, q.key) === opt;
                        return (
                          <button
                            key={opt}
                            onClick={() => handleAnswer(q.key, opt)}
                            className={`px-4 py-2 rounded-xl text-sm font-medium border transition-all ${
                              selected
                                ? "bg-violet-600 text-white border-violet-600 shadow-md shadow-violet-200 dark:shadow-violet-900/40"
                                : "bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-600 hover:border-violet-400"
                            }`}
                          >
                            {selected && <Check className="w-3.5 h-3.5 inline mr-1.5" />}{opt}
                          </button>
                        );
                      })}
                    </div>
                  )}

                  {/* Free text input for instruments */}
                  {q.type === "text" && (
                    <div className="mt-3">
                      <input
                        value={String(answers.instruments || "")}
                        onChange={e => handleAnswer("instruments", e.target.value)}
                        placeholder={q.placeholder}
                        className="w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 focus:border-violet-400 focus:ring-2 focus:ring-violet-100 dark:focus:ring-violet-900 outline-none text-gray-900 dark:text-white"
                      />
                    </div>
                  )}

                  {/* Duration slider */}
                  {q.type === "duration" && usage && (
                    <div>
                      <div className="flex items-center justify-between text-sm text-gray-600 dark:text-gray-300 mb-3">
                        <span>Duration</span>
                        <span className="font-bold text-violet-600 dark:text-violet-400">
                          {Number(answers.duration) || usage.maxDuration}s
                        </span>
                      </div>
                      <input
                        type="range"
                        min={5}
                        max={usage.maxDuration}
                        step={5}
                        value={Number(answers.duration) || usage.maxDuration}
                        onChange={e => handleAnswer("duration", Number(e.target.value))}
                        className="w-full accent-violet-500"
                      />
                      <div className="flex justify-between text-xs text-gray-400 mt-1">
                        <span>5s</span>
                        <span>{usage.maxDuration}s (your plan max)</span>
                      </div>
                      {usage.plan === "free" && (
                        <p className="mt-3 text-xs text-amber-600 dark:text-amber-400 flex items-center gap-1.5">
                          <Crown className="w-3.5 h-3.5" />
                          Upgrade to Basic (30s) or Premium (60s) for longer tracks
                        </p>
                      )}
                    </div>
                  )}
                </motion.div>
              </AnimatePresence>

              {/* Navigation */}
              <div className="flex items-center justify-between mt-6">
                <button
                  onClick={() => currentQ > 0 && setCurrentQ(c => c - 1)}
                  disabled={currentQ === 0}
                  className="px-5 py-2.5 rounded-xl border border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-300 disabled:opacity-30 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors text-sm font-medium"
                >
                  ← Back
                </button>
                <button
                  onClick={handleNext}
                  className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white font-semibold shadow-md hover:shadow-lg transition-all"
                >
                  {currentQ === QUESTIONS.length - 1 ? (
                    <><Sparkles className="w-4 h-4" /> Generate Music</>
                  ) : (
                    <>Next <ChevronRight className="w-4 h-4" /></>
                  )}
                </button>
              </div>
            </motion.div>
          )}

          {/* ══ GENERATING ═════════════════════════════════════════════════════ */}
          {step === "generating" && (
            <motion.div key="generating" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}
              className="text-center py-20">
              <div className="relative w-28 h-28 mx-auto mb-8">
                <div className="absolute inset-0 rounded-full bg-gradient-to-br from-violet-500 to-fuchsia-500 animate-pulse" />
                <div className="absolute inset-2 rounded-full bg-white dark:bg-gray-950 flex items-center justify-center">
                  <Music2 className="w-10 h-10 text-violet-500 animate-bounce" />
                </div>
              </div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">Composing your track…</h2>
              <p className="text-gray-500 dark:text-gray-400 max-w-sm mx-auto mb-8">
                Claude is building the music prompt. The AI model is generating your audio. This takes 30–90 seconds.
              </p>
              <div className="flex items-center justify-center gap-2 text-sm text-gray-400">
                <Loader2 className="w-4 h-4 animate-spin" />
                Checking status every 3 seconds…
              </div>
            </motion.div>
          )}

          {/* ══ RESULT ═════════════════════════════════════════════════════════ */}
          {step === "result" && track && (
            <motion.div key="result" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>

              {track.status === "failed" ? (
                <div className="text-center py-16">
                  <AlertCircle className="w-14 h-14 text-red-400 mx-auto mb-4" />
                  <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Generation failed</h2>
                  <p className="text-gray-500 text-sm mb-6">{track.errorMsg || "An unknown error occurred. Your quota has been refunded."}</p>
                  <button onClick={resetFlow} className="px-6 py-2.5 rounded-xl bg-violet-600 text-white font-semibold hover:bg-violet-700 transition-colors">
                    Try Again
                  </button>
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Player card */}
                  <div className="bg-gradient-to-br from-violet-600 to-fuchsia-600 rounded-3xl p-6 sm:p-8 text-white shadow-xl">
                    <div className="flex items-center gap-2 mb-4">
                      <Sparkles className="w-4 h-4 text-yellow-300" />
                      <span className="text-sm text-white/80 font-medium">AI Generated · {track.durationSec}s · {track.quality} quality</span>
                    </div>

                    <h2 className="text-2xl font-black mb-1">{answers.mood} {answers.genre}</h2>
                    <p className="text-white/70 text-sm mb-6">{track.prompt.description}</p>

                    {/* Audio waveform visual + controls */}
                    <div className="bg-white/10 backdrop-blur rounded-2xl p-4 mb-4">
                      <div className="flex items-center gap-4">
                        <button
                          onClick={handlePlayPause}
                          disabled={!track.audioUrl}
                          className="w-12 h-12 rounded-full bg-white text-violet-600 flex items-center justify-center shadow-lg hover:scale-105 transition-transform disabled:opacity-50"
                        >
                          {playing ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 ml-0.5" />}
                        </button>
                        <div className="flex-1">
                          <div className="flex items-center gap-1 h-8">
                            {Array.from({ length: 40 }).map((_, i) => (
                              <div key={i}
                                className="flex-1 bg-white/40 rounded-full"
                                style={{ height: `${20 + Math.sin(i * 0.8) * 15 + Math.random() * 10}px` }}
                              />
                            ))}
                          </div>
                        </div>
                        <Volume2 className="w-4 h-4 text-white/70" />
                      </div>
                    </div>

                    {/* Action buttons */}
                    <div className="flex gap-3">
                      <button
                        onClick={handleDownload}
                        disabled={downloading}
                        className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-white/20 hover:bg-white/30 text-white font-medium text-sm transition-colors disabled:opacity-70 relative overflow-hidden"
                      >
                        {/* Progress fill */}
                        {downloading && downloadProgress > 0 && (
                          <div
                            className="absolute inset-0 bg-white/20 transition-all duration-300"
                            style={{ width: `${downloadProgress}%` }}
                          />
                        )}
                        <span className="relative flex items-center gap-2">
                          {downloading
                            ? <><Loader2 className="w-4 h-4 animate-spin" />{downloadProgress > 0 ? `${downloadProgress}%` : "Preparing…"}</>
                            : <><Download className="w-4 h-4" />{usage?.canDownload ? "Save to Device" : "🔒 Unlock Download"}</>
                          }
                        </span>
                      </button>
                      <button
                        onClick={resetFlow}
                        className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-white/20 hover:bg-white/30 text-white font-medium text-sm transition-colors"
                      >
                        <RotateCcw className="w-4 h-4" /> New Track
                      </button>
                    </div>
                  </div>

                  {/* Prompt details */}
                  <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-5">
                    <h3 className="font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-violet-500" /> AI Music Prompt Used
                    </h3>
                    <div className="grid sm:grid-cols-2 gap-3 text-sm">
                      <div className="bg-gray-50 dark:bg-gray-700 rounded-xl p-3">
                        <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">BPM</p>
                        <p className="font-medium text-gray-900 dark:text-white">{track.prompt.bpm}</p>
                      </div>
                      <div className="bg-gray-50 dark:bg-gray-700 rounded-xl p-3">
                        <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Instruments</p>
                        <p className="font-medium text-gray-900 dark:text-white">{track.prompt.instruments}</p>
                      </div>
                    </div>
                    {track.prompt.style_tags?.length > 0 && (
                      <div className="flex flex-wrap gap-2 mt-3">
                        {track.prompt.style_tags.map(tag => (
                          <span key={tag} className="px-2.5 py-1 rounded-lg bg-violet-50 dark:bg-violet-900/30 text-violet-600 dark:text-violet-400 text-xs font-medium">
                            #{tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Plan cards — always shown, clickable */}
                  <div>
                    <p className="text-sm font-semibold text-gray-500 dark:text-gray-400 mb-3">Compare plans</p>
                    <div className="grid grid-cols-3 gap-2">
                      {[
                        { id: "free",    label: "Free",    icon: "🎵", gens: "3/mo",   dur: "5s",  dl: false, active: "from-gray-400 to-gray-500" },
                        { id: "basic",   label: "Basic",   icon: "⚡", gens: "20/mo",  dur: "30s", dl: true,  active: "from-blue-500 to-violet-600" },
                        { id: "premium", label: "Premium", icon: "👑", gens: "200/mo", dur: "60s", dl: true,  active: "from-amber-400 to-orange-500" },
                      ].map(p => {
                        const isCurrent = usage?.plan === p.id;
                        return (
                          <button
                            key={p.id}
                            onClick={() => { setPlanModalDefault(p.id); setPlanModalOpen(true); }}
                            className={`relative rounded-2xl p-3 text-left border transition-all hover:scale-[1.03] active:scale-[0.98] ${
                              isCurrent
                                ? "border-transparent ring-2 ring-violet-500 dark:ring-violet-400"
                                : "border-gray-200 dark:border-gray-700 hover:border-violet-300 dark:hover:border-violet-600"
                            } bg-white dark:bg-gray-800`}
                          >
                            {isCurrent && (
                              <span className="absolute -top-2 left-1/2 -translate-x-1/2 px-2 py-0.5 rounded-full bg-violet-600 text-white text-[10px] font-bold whitespace-nowrap">
                                Your Plan
                              </span>
                            )}
                            <span className="text-xl block mb-1">{p.icon}</span>
                            <p className="font-bold text-xs text-gray-900 dark:text-white">{p.label}</p>
                            <p className="text-[10px] text-gray-500 dark:text-gray-400">{p.gens}</p>
                            <p className="text-[10px] text-gray-500 dark:text-gray-400">Up to {p.dur}</p>
                            <p className={`text-[10px] font-medium mt-0.5 ${p.dl ? "text-emerald-500" : "text-red-400"}`}>
                              {p.dl ? "Download ✓" : "No DL"}
                            </p>
                            <p className="text-[10px] text-violet-600 dark:text-violet-400 mt-1 font-medium">See details →</p>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}
            </motion.div>
          )}

          {/* ══ LIBRARY ════════════════════════════════════════════════════════ */}
          {step === "library" && (
            <motion.div key="library" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">My Generated Tracks</h2>
                <button onClick={loadLibrary} className="text-sm text-violet-600 dark:text-violet-400 hover:underline">Refresh</button>
              </div>

              {library.length === 0 ? (
                <div className="text-center py-16 text-gray-400 dark:text-gray-600">
                  <Music2 className="w-12 h-12 mx-auto mb-3 opacity-40" />
                  <p className="font-medium">No tracks yet</p>
                  <p className="text-sm mt-1">Generate your first track!</p>
                  <button onClick={() => setStep("questions")} className="mt-4 px-5 py-2.5 rounded-xl bg-violet-600 text-white font-medium hover:bg-violet-700 transition-colors text-sm">
                    Generate Now
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  {library.map(t => (
                    <div key={t.id} className="flex items-center gap-4 p-4 rounded-2xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:border-violet-200 dark:hover:border-violet-700 transition-colors">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
                        t.status === "done"    ? "bg-violet-100 dark:bg-violet-900/40 text-violet-600 dark:text-violet-400" :
                        t.status === "failed"  ? "bg-red-100 dark:bg-red-900/30 text-red-500" :
                        "bg-gray-100 dark:bg-gray-700 text-gray-400"
                      }`}>
                        {t.status === "done"    ? <Music2 className="w-5 h-5" />      :
                         t.status === "failed"  ? <AlertCircle className="w-5 h-5" /> :
                         <Loader2 className="w-5 h-5 animate-spin" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-gray-900 dark:text-white truncate">
                          {t.answers.mood} {t.answers.genre}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {t.durationSec}s · {t.quality} · {new Date(t.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        {t.status === "done" && t.audioUrl && (
                          <a href={t.audioUrl} target="_blank" rel="noreferrer" download
                            className="p-2 rounded-xl text-violet-500 hover:bg-violet-50 dark:hover:bg-violet-900/30 transition-colors">
                            <Download className="w-4 h-4" />
                          </a>
                        )}
                        <span className={`px-2.5 py-1 rounded-lg text-xs font-medium ${
                          t.status === "done"    ? "bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400" :
                          t.status === "failed"  ? "bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400" :
                          "bg-gray-100 dark:bg-gray-700 text-gray-500"
                        }`}>
                          {t.status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </motion.div>
          )}

        </AnimatePresence>
      </div>
      {/* ── Plan Modal ── */}
      {usage && (
        <PlanModal
          open={planModalOpen}
          onClose={() => { setPlanModalOpen(false); setPlanModalDefault(undefined); }}
          currentPlan={usage.plan}
          defaultPlan={planModalDefault}
        />
      )}
    </div>
  );
}