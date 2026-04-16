import { usePlayer } from "../context/PlayerContext";
import { useData } from "../context/DataContext";
import { Play, Pause, SkipBack, SkipForward, Volume2, VolumeX } from "lucide-react";
import { formatDuration } from "../data/mock";
import { motion, AnimatePresence } from "motion/react";
import { Link } from "react-router";

export function PlayerBar() {
  const { currentSong, isPlaying, togglePlay, next, prev, volume, setVolume, progress, setProgress } = usePlayer();
  const { getArtist } = useData();

  // No interval here — PlayerContext handles progress via real <audio> timeupdate events.
  // The old interval + "progress >= duration → next()" logic caused instant blink for songs
  // with duration 0 (default for newly added songs).

  const artistName = currentSong ? (getArtist(currentSong.artistId)?.name ?? "Unknown") : "";
  const duration   = currentSong?.duration ?? 0;
  const pct        = duration > 0 ? (progress / duration) * 100 : 0;

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    setProgress(Number(e.target.value));
  };

  return (
    <AnimatePresence>
      {currentSong && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          className="fixed bottom-0 left-0 right-0 z-50 bg-white/90 dark:bg-gray-900/90 backdrop-blur-xl border-t border-gray-200 dark:border-gray-700 shadow-[0_-4px_20px_rgba(0,0,0,0.06)]"
        >
          {/* Seek bar */}
          <div className="relative h-1 bg-gray-100 dark:bg-gray-800 w-full group cursor-pointer">
            <div
              className="h-full bg-gradient-to-r from-violet-500 to-fuchsia-500 transition-all duration-500 ease-linear pointer-events-none"
              style={{ width: `${pct}%` }}
            />
            <input
              type="range"
              min={0}
              max={duration || 100}
              value={progress}
              onChange={handleSeek}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            />
          </div>

          <div className="max-w-7xl mx-auto px-4 py-2.5 flex items-center gap-4">
            {/* Song info */}
            <Link to="/player" className="flex items-center gap-3 min-w-0 flex-1 sm:flex-none sm:w-56">
              <img
                src={currentSong.cover || "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=80"}
                alt=""
                className="w-11 h-11 rounded-lg object-cover flex-shrink-0"
              />
              <div className="min-w-0">
                <p className="text-sm text-gray-900 dark:text-white truncate" style={{ fontWeight: 600 }}>
                  {currentSong.title}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{artistName}</p>
                {!currentSong.audioUrl && (
                  <p className="text-xs text-amber-500">No audio file</p>
                )}
              </div>
            </Link>

            {/* Controls */}
            <div className="flex items-center gap-2 sm:gap-3 mx-auto">
              <button onClick={prev} className="p-1.5 text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors">
                <SkipBack className="w-4 h-4" />
              </button>
              <button
                onClick={togglePlay}
                className="w-10 h-10 rounded-full bg-gradient-to-r from-violet-500 to-fuchsia-500 flex items-center justify-center text-white shadow-lg shadow-violet-200 dark:shadow-violet-900/30 hover:shadow-violet-300 transition-shadow"
              >
                {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 ml-0.5" />}
              </button>
              <button onClick={next} className="p-1.5 text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors">
                <SkipForward className="w-4 h-4" />
              </button>
            </div>

            {/* Volume + time */}
            <div className="hidden sm:flex items-center gap-3 w-56 justify-end">
              <span className="text-xs text-gray-400 tabular-nums">
                {formatDuration(progress)} / {formatDuration(duration)}
              </span>
              <button onClick={() => setVolume(volume > 0 ? 0 : 75)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
                {volume > 0 ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
              </button>
              <input
                type="range"
                min={0}
                max={100}
                value={volume}
                onChange={e => setVolume(Number(e.target.value))}
                className="w-20 accent-violet-500"
              />
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}