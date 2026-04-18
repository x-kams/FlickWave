import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Music2, Sparkles, Crown, Download, Play, Pause,
  RotateCcw, ChevronRight, Check, Loader2,
  Volume2, Zap, Trash2,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { toast } from "sonner";

// ── 10 Sample Tracks (royalty-free SoundHelix) ─────────────────────────────────
const SAMPLE_TRACKS = [
  { id: "s01", title: "Chill Lo-fi Beat",      audioUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3"  },
  { id: "s02", title: "Electronic Pulse",       audioUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3"  },
  { id: "s03", title: "Acoustic Sunrise",       audioUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3"  },
  { id: "s04", title: "Jazz Night",             audioUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-4.mp3"  },
  { id: "s05", title: "Epic Orchestral",        audioUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-5.mp3"  },
  { id: "s06", title: "Dark Ambience",          audioUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-6.mp3"  },
  { id: "s07", title: "Hip-hop Groove",         audioUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-7.mp3"  },
  { id: "s08", title: "Mysterious Pop",         audioUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-8.mp3"  },
  { id: "s09", title: "Rock Anthem",            audioUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-9.mp3"  },
  { id: "s10", title: "R&B Vibes",              audioUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-10.mp3" },
];

// ── Types ──────────────────────────────────────────────────────────────────────
interface Answers {
  mood:        string;
  genre:       string;
  tempo:       string;
  instruments: string;
  useCase:     string;
  vocals:      string;
  duration:    number;
}

interface LocalTrack {
  id:          string;
  audioUrl:    string;
  sampleTitle: string;
  answers:     Answers;
  createdAt:   string;
}

// ── localStorage helpers ───────────────────────────────────────────────────────
const LS_KEY = "fw_generated_tracks";

function loadLocalTracks(): LocalTrack[] {
  try { return JSON.parse(localStorage.getItem(LS_KEY) || "[]"); }
  catch { return []; }
}

function saveLocalTracks(tracks: LocalTrack[]) {
  try { localStorage.setItem(LS_KEY, JSON.stringify(tracks)); }
  catch { /**/ }
}

// ── Question definitions ────────────────────────────────────────────────────────
const QUESTIONS = [
  {
    key: "mood", label: "What's the mood?", subtitle: "How should this music make you feel?",
    type: "chips", options: ["Happy","Sad","Chill","Energetic","Romantic","Dark","Uplifting","Mysterious"],
  },
  {
    key: "genre", label: "Choose a genre", subtitle: "Pick the style closest to what you want",
    type: "chips", options: ["Pop","Rock","Electronic","Jazz","Classical","Hip-hop","Ambient","Folk","R&B","Lo-fi"],
  },
  {
    key: "tempo", label: "How fast?", subtitle: "Select the energy level and rhythm speed",
    type: "chips", options: ["Very Slow","Slow","Medium","Fast","Very Fast"],
  },
  {
    key: "instruments", label: "Which instruments?", subtitle: "Type or pick your favourite instruments",
    type: "text", placeholder: "e.g. guitar, piano, drums, violin",
    options: ["Guitar","Piano","Drums","Violin","Synthesizer","Bass","Trumpet","Cello"],
  },
  {
    key: "useCase", label: "What's it for?", subtitle: "How will you use this track?",
    type: "chips", options: ["Relaxation","Workout","Focus / Study","Party","Sleep","Background Music","Video / Content","Meditation"],
  },
  {
    key: "vocals", label: "Vocals or instrumental?", subtitle: "Should the track include sung vocals?",
    type: "chips", options: ["Instrumental (no vocals)","Yes, include vocals"],
  },
  {
    key: "duration", label: "How long?", subtitle: "Choose preferred track duration",
    type: "duration", options: [],
  },
];

function getAnswerValue(answers: Partial<Answers>, key: string) {
  return (answers as Record<string, unknown>)[key] ?? "";
}

// ── Main Component ─────────────────────────────────────────────────────────────
export function Generate() {
  const { user } = useAuth();

  const [step, setStep]         = useState<"questions"|"generating"|"result"|"library">("questions");
  const [currentQ, setCurrentQ] = useState(0);
  const [answers, setAnswers]   = useState<Partial<Answers>>({});
  const [track, setTrack]       = useState<LocalTrack | null>(null);
  const [library, setLibrary]   = useState<LocalTrack[]>([]);
  const [playing, setPlaying]   = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [libPlayingId, setLibPlayingId] = useState<string | null>(null);

  const audioRef    = useRef<HTMLAudioElement | null>(null);
  const libAudioRef = useRef<HTMLAudioElement | null>(null);

  const email = user?.email ?? "";

  // Load library on mount
  useEffect(() => { setLibrary(loadLocalTracks()); }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      audioRef.current?.pause();
      libAudioRef.current?.pause();
    };
  }, []);

  // ── Answer handler ───────────────────────────────────────────────────────────
  const handleAnswer = (key: string, value: string | number) => {
    setAnswers(prev => ({ ...prev, [key]: value }));
  };

  const handleNext = () => {
    const q   = QUESTIONS[currentQ];
    const val = getAnswerValue(answers, q.key);
    const isOptional = q.key === "instruments" || q.key === "duration";

    if (!val && !isOptional) { toast.error("Please make a selection before continuing"); return; }
    if (currentQ < QUESTIONS.length - 1) { setCurrentQ(c => c + 1); }
    else { handleGenerate(); }
  };

  // ── Generate: pick random sample track ──────────────────────────────────────
  const handleGenerate = () => {
    if (!email) { toast.error("Please sign in first"); return; }

    setStep("generating");
    setPlaying(false);
    audioRef.current?.pause();
    audioRef.current = null;

    const delay = 1500 + Math.random() * 1000;

    setTimeout(() => {
      const sample = SAMPLE_TRACKS[Math.floor(Math.random() * SAMPLE_TRACKS.length)];

      const finalAnswers: Answers = {
        mood:        String(answers.mood        || "Happy"),
        genre:       String(answers.genre       || "Pop"),
        tempo:       String(answers.tempo       || "Medium"),
        instruments: String(answers.instruments || ""),
        useCase:     String(answers.useCase     || ""),
        vocals:      String(answers.vocals      || "no").includes("Yes") ? "yes" : "no",
        duration:    Number(answers.duration)   || 30,
      };

      const newTrack: LocalTrack = {
        id:          `${sample.id}_${Date.now()}`,
        audioUrl:    sample.audioUrl,
        sampleTitle: sample.title,
        answers:     finalAnswers,
        createdAt:   new Date().toISOString(),
      };

      const updated = [newTrack, ...loadLocalTracks()];
      saveLocalTracks(updated);
      setLibrary(updated);
      setTrack(newTrack);
      setStep("result");
      toast.success("🎵 Your music is ready!");
    }, delay);
  };

  // ── Result screen play/pause ─────────────────────────────────────────────────
  const handlePlayPause = () => {
    if (!track?.audioUrl) return;

    if (!audioRef.current) {
      audioRef.current = new Audio(track.audioUrl);
      audioRef.current.onended = () => setPlaying(false);
    }

    if (playing) { audioRef.current.pause(); setPlaying(false); }
    else { audioRef.current.play().then(() => setPlaying(true)).catch(() => toast.error("Cannot play audio")); }
  };

  // ── Download ─────────────────────────────────────────────────────────────────
  const handleDownload = async (audioUrl: string, label: string) => {
    setDownloading(true);
    try {
      const res  = await fetch(audioUrl);
      if (!res.ok) throw new Error("Fetch failed");
      const blob = await res.blob();
      const url  = URL.createObjectURL(blob);
      const a    = document.createElement("a");
      a.href     = url;
      a.download = `flickwave-${label}.mp3`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setTimeout(() => URL.revokeObjectURL(url), 10000);
      toast.success("Track saved to your device!");
    } catch {
      toast.error("Download failed. Please try again.");
    } finally {
      setDownloading(false);
    }
  };

  // ── Library play/pause ───────────────────────────────────────────────────────
  const handleLibPlay = (t: LocalTrack) => {
    if (libPlayingId === t.id) {
      libAudioRef.current?.pause();
      setLibPlayingId(null);
    } else {
      libAudioRef.current?.pause();
      const audio = new Audio(t.audioUrl);
      audio.onended = () => setLibPlayingId(null);
      audio.play().catch(() => toast.error("Cannot play audio"));
      libAudioRef.current = audio;
      setLibPlayingId(t.id);
    }
  };

  // ── Delete from library ──────────────────────────────────────────────────────
  const handleDelete = (id: string) => {
    if (libPlayingId === id) { libAudioRef.current?.pause(); setLibPlayingId(null); }
    const updated = library.filter(t => t.id !== id);
    setLibrary(updated);
    saveLocalTracks(updated);
    toast.success("Track deleted");
  };

  // ── Helpers ──────────────────────────────────────────────────────────────────
  const resetFlow = () => {
    setStep("questions"); setCurrentQ(0); setAnswers({}); setTrack(null); setPlaying(false);
    audioRef.current?.pause(); audioRef.current = null;
  };

  const openLibrary = () => { setLibrary(loadLocalTracks()); setStep("library"); };

  const q        = QUESTIONS[currentQ];
  const progress = ((currentQ + 1) / QUESTIONS.length) * 100;

  // ── Not signed in ────────────────────────────────────────────────────────────
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

      {/* ── Hero header ─────────────────────────────────────────────────────── */}
      <div className="bg-gradient-to-br from-violet-600 via-fuchsia-600 to-pink-600 text-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-10">
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Sparkles className="w-5 h-5 text-yellow-300" />
                <span className="text-sm font-medium text-white/80">AI-Powered</span>
              </div>
              <h1 className="text-3xl sm:text-4xl font-black mb-1">Music Generator</h1>
              <p className="text-white/70 text-sm">Answer 7 questions. Get a unique track instantly.</p>
            </div>
            <div className="hidden sm:flex flex-col items-end gap-1">
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/20 backdrop-blur text-sm font-semibold">
                <Zap className="w-4 h-4 text-yellow-300" />
                Instant Generation
              </div>
              <span className="text-xs text-white/60">{library.length} tracks in library</span>
            </div>
          </div>
        </div>
      </div>

      {/* ── Nav tabs ────────────────────────────────────────────────────────── */}
      <div className="sticky top-0 z-10 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 shadow-sm">
        <div className="max-w-4xl mx-auto px-4 flex gap-1 py-2">
          {[
            { id: "questions", label: "Generate",                         icon: Sparkles },
            { id: "library",   label: `My Tracks (${library.length})`,   icon: Music2   },
          ].map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => id === "library" ? openLibrary() : setStep("questions")}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                (step === id || (step === "result"    && id === "questions") || (step === "generating" && id === "questions"))
                  ? "bg-violet-600 text-white"
                  : "text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
              }`}
            >
              <Icon className="w-4 h-4" />
              {label}
            </button>
          ))}
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
        <AnimatePresence mode="wait">

          {/* ══ QUESTIONS ════════════════════════════════════════════════════ */}
          {step === "questions" && (
            <motion.div key="questions" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}>

              {/* Progress */}
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

                  {/* Chip options */}
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
                                ? "bg-violet-600 text-white border-violet-600 shadow-md"
                                : "bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-600 hover:border-violet-400"
                            }`}
                          >
                            {selected && <Check className="w-3.5 h-3.5 inline mr-1.5" />}{opt}
                          </button>
                        );
                      })}
                    </div>
                  )}

                  {/* Free text input */}
                  {q.type === "text" && (
                    <div className="mt-3">
                      <input
                        type="text"
                        value={String(getAnswerValue(answers, q.key))}
                        onChange={e => handleAnswer(q.key, e.target.value)}
                        placeholder={(q as { placeholder?: string }).placeholder}
                        className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-violet-500 text-sm"
                      />
                    </div>
                  )}

                  {/* Duration slider */}
                  {q.type === "duration" && (
                    <div>
                      <div className="flex items-center justify-between text-sm text-gray-600 dark:text-gray-300 mb-3">
                        <span>Duration</span>
                        <span className="font-bold text-violet-600 dark:text-violet-400">{Number(answers.duration) || 30}s</span>
                      </div>
                      <input
                        type="range" min={5} max={60} step={5}
                        value={Number(answers.duration) || 30}
                        onChange={e => handleAnswer("duration", Number(e.target.value))}
                        className="w-full accent-violet-500"
                      />
                      <div className="flex justify-between text-xs text-gray-400 mt-1">
                        <span>5s</span><span>60s</span>
                      </div>
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
                  {currentQ === QUESTIONS.length - 1
                    ? <><Sparkles className="w-4 h-4" /> Generate Music</>
                    : <>Next <ChevronRight className="w-4 h-4" /></>
                  }
                </button>
              </div>
            </motion.div>
          )}

          {/* ══ GENERATING ═══════════════════════════════════════════════════ */}
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
                AI is picking the perfect sound based on your preferences. Just a moment!
              </p>
              <div className="flex items-center justify-center gap-2 text-sm text-gray-400">
                <Loader2 className="w-4 h-4 animate-spin" />
                Generating unique track…
              </div>
            </motion.div>
          )}

          {/* ══ RESULT ═══════════════════════════════════════════════════════ */}
          {step === "result" && track && (
            <motion.div key="result" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
              <div className="space-y-6">

                {/* Player card */}
                <div className="bg-gradient-to-br from-violet-600 to-fuchsia-600 rounded-3xl p-6 sm:p-8 text-white shadow-xl">
                  <div className="flex items-center gap-2 mb-4">
                    <Sparkles className="w-4 h-4 text-yellow-300" />
                    <span className="text-sm text-white/80 font-medium">AI Generated · {track.answers.duration}s</span>
                  </div>

                  <h2 className="text-2xl font-black mb-1">{track.answers.mood} {track.answers.genre}</h2>
                  <p className="text-white/70 text-sm mb-6">{track.sampleTitle}</p>

                  {/* Audio controls */}
                  <div className="bg-white/10 backdrop-blur rounded-2xl p-4 mb-4">
                    <div className="flex items-center gap-4">
                      <button
                        onClick={handlePlayPause}
                        className="w-12 h-12 rounded-full bg-white text-violet-600 flex items-center justify-center shadow-lg hover:scale-105 transition-transform"
                      >
                        {playing ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 ml-0.5" />}
                      </button>
                      <div className="flex-1">
                        <div className="flex items-center gap-1 h-8">
                          {Array.from({ length: 40 }).map((_, i) => (
                            <div
                              key={i}
                              className={`flex-1 rounded-full transition-all duration-300 ${playing ? "bg-white animate-pulse" : "bg-white/40"}`}
                              style={{ height: `${20 + Math.sin(i * 0.8) * 15 + (i % 3) * 4}px` }}
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
                      onClick={() => handleDownload(track.audioUrl, `${track.answers.mood}-${track.answers.genre}-${track.id.slice(-6)}`)}
                      disabled={downloading}
                      className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-white/20 hover:bg-white/30 text-white font-medium text-sm transition-colors disabled:opacity-70"
                    >
                      {downloading
                        ? <><Loader2 className="w-4 h-4 animate-spin" /> Downloading…</>
                        : <><Download className="w-4 h-4" /> Save to Device</>
                      }
                    </button>
                    <button
                      onClick={resetFlow}
                      className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-white/20 hover:bg-white/30 text-white font-medium text-sm transition-colors"
                    >
                      <RotateCcw className="w-4 h-4" /> New Track
                    </button>
                  </div>
                </div>

                {/* Track details */}
                <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-5">
                  <h3 className="font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-violet-500" /> Track Details
                  </h3>
                  <div className="grid sm:grid-cols-3 gap-3 text-sm">
                    {[
                      { label: "Mood",  val: track.answers.mood  },
                      { label: "Genre", val: track.answers.genre },
                      { label: "Tempo", val: track.answers.tempo || "Medium" },
                    ].map(({ label, val }) => (
                      <div key={label} className="bg-gray-50 dark:bg-gray-700 rounded-xl p-3">
                        <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">{label}</p>
                        <p className="font-medium text-gray-900 dark:text-white">{val}</p>
                      </div>
                    ))}
                  </div>
                  {track.answers.instruments && (
                    <div className="mt-3 bg-gray-50 dark:bg-gray-700 rounded-xl p-3 text-sm">
                      <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Instruments</p>
                      <p className="font-medium text-gray-900 dark:text-white">{track.answers.instruments}</p>
                    </div>
                  )}
                  <p className="text-xs text-gray-400 mt-3 flex items-center gap-1">
                    <Crown className="w-3 h-3" /> Track saved to your library automatically
                  </p>
                </div>

                {/* Quick library preview */}
                {library.length > 1 && (
                  <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-5">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="font-semibold text-gray-900 dark:text-white text-sm">Recent Tracks</h3>
                      <button onClick={openLibrary} className="text-xs text-violet-600 dark:text-violet-400 hover:underline">View all →</button>
                    </div>
                    <div className="space-y-2">
                      {library.slice(0, 3).map(t => (
                        <div key={t.id} className="flex items-center gap-3 text-sm">
                          <div className="w-7 h-7 rounded-lg bg-violet-100 dark:bg-violet-900/40 flex items-center justify-center flex-shrink-0">
                            <Music2 className="w-3.5 h-3.5 text-violet-600 dark:text-violet-400" />
                          </div>
                          <span className="flex-1 text-gray-700 dark:text-gray-300 truncate">{t.answers.mood} {t.answers.genre}</span>
                          <span className="text-gray-400 text-xs">{t.answers.duration}s</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {/* ══ LIBRARY ══════════════════════════════════════════════════════ */}
          {step === "library" && (
            <motion.div key="library" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">My Generated Tracks</h2>
                <span className="text-sm text-gray-400">{library.length} track{library.length !== 1 ? "s" : ""}</span>
              </div>

              {library.length === 0 ? (
                <div className="text-center py-16 text-gray-400 dark:text-gray-600">
                  <Music2 className="w-12 h-12 mx-auto mb-3 opacity-40" />
                  <p className="font-medium">No tracks yet</p>
                  <p className="text-sm mt-1">Generate your first track!</p>
                  <button
                    onClick={() => setStep("questions")}
                    className="mt-4 px-5 py-2.5 rounded-xl bg-violet-600 text-white font-medium hover:bg-violet-700 transition-colors text-sm"
                  >
                    Generate Now
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  <AnimatePresence>
                    {library.map(t => {
                      const isLibPlaying = libPlayingId === t.id;
                      return (
                        <motion.div
                          key={t.id}
                          layout
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, x: -30, transition: { duration: 0.2 } }}
                          className="flex items-center gap-4 p-4 rounded-2xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:border-violet-200 dark:hover:border-violet-700 transition-colors"
                        >
                          {/* Play / Pause button */}
                          <button
                            onClick={() => handleLibPlay(t)}
                            className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 transition-colors ${
                              isLibPlaying
                                ? "bg-violet-600 text-white"
                                : "bg-violet-100 dark:bg-violet-900/40 text-violet-600 dark:text-violet-400 hover:bg-violet-200 dark:hover:bg-violet-900/60"
                            }`}
                          >
                            {isLibPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 ml-0.5" />}
                          </button>

                          {/* Track info */}
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-gray-900 dark:text-white truncate">
                              {t.answers.mood} {t.answers.genre}
                            </p>
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                              {t.sampleTitle} · {t.answers.duration}s · {new Date(t.createdAt).toLocaleDateString()}
                            </p>
                            {/* Animated sound bars when playing */}
                            {isLibPlaying && (
                              <div className="flex items-end gap-0.5 mt-1.5">
                                {[3, 5, 7, 5, 3, 6, 4].map((h, i) => (
                                  <div
                                    key={i}
                                    className="w-1 bg-violet-500 rounded-full animate-pulse"
                                    style={{ height: `${h}px`, animationDelay: `${i * 0.12}s` }}
                                  />
                                ))}
                              </div>
                            )}
                          </div>

                          {/* Action buttons */}
                          <div className="flex items-center gap-1 flex-shrink-0">
                            {/* Download */}
                            <button
                              onClick={() => handleDownload(t.audioUrl, `${t.answers.mood}-${t.answers.genre}-${t.id.slice(-6)}`)}
                              title="Download track"
                              className="p-2 rounded-xl text-gray-400 hover:text-violet-600 dark:hover:text-violet-400 hover:bg-violet-50 dark:hover:bg-violet-900/30 transition-colors"
                            >
                              <Download className="w-4 h-4" />
                            </button>

                            {/* Delete */}
                            <button
                              onClick={() => handleDelete(t.id)}
                              title="Delete track"
                              className="p-2 rounded-xl text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </motion.div>
                      );
                    })}
                  </AnimatePresence>
                </div>
              )}

              {library.length > 0 && (
                <p className="text-center text-xs text-gray-400 mt-6">
                  Tracks are saved locally on this device
                </p>
              )}
            </motion.div>
          )}

        </AnimatePresence>
      </div>
    </div>
  );
}
