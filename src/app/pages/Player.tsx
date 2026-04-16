import { usePlayer } from "../context/PlayerContext";
import { useData } from "../context/DataContext";
import { Play, Pause, SkipBack, SkipForward, Volume2, VolumeX, Shuffle, Repeat, ListMusic } from "lucide-react";
import { formatDuration } from "../data/mock";
import { motion } from "motion/react";
import { SongCard } from "../components/SongCard";

export function Player() {
  const { currentSong, isPlaying, togglePlay, next, prev, volume, setVolume, progress, setProgress, playSong } = usePlayer();
  const { getTrending, getArtist, getAlbum } = useData();
  const trending = getTrending();

  if (!currentSong) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center">
        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}>
          <div className="w-24 h-24 rounded-full bg-violet-100 dark:bg-violet-900/40 flex items-center justify-center mx-auto mb-6">
            <ListMusic className="w-10 h-10 text-violet-500" />
          </div>
          <h2 className="text-2xl text-gray-900 dark:text-white mb-2" style={{ fontWeight: 700 }}>No song playing</h2>
          <p className="text-gray-500 dark:text-gray-400 mb-8">Pick a song to start listening</p>
        </motion.div>
        <div className="max-w-2xl mx-auto">
          <h3 className="text-left text-lg text-gray-900 dark:text-white mb-4" style={{ fontWeight: 600 }}>Quick Picks</h3>
          {trending.slice(0, 6).map((s, i) => <SongCard key={s.id} song={s} index={i} queue={trending} />)}
        </div>
      </div>
    );
  }

  const artistName = getArtist(currentSong.artistId)?.name || "Unknown";
  const albumTitle = getAlbum(currentSong.albumId)?.title || "Unknown";

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="grid lg:grid-cols-[1fr_1.2fr] gap-12 items-start">
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="flex flex-col items-center">
          <motion.div
            animate={{ rotate: isPlaying ? 360 : 0 }}
            transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
            className="w-64 h-64 sm:w-80 sm:h-80 rounded-full overflow-hidden shadow-2xl shadow-violet-200 dark:shadow-violet-900/30 ring-8 ring-white dark:ring-gray-800 mb-8"
          >
            <img src={currentSong.cover} alt="" className="w-full h-full object-cover" />
          </motion.div>

          <h2 className="text-2xl text-gray-900 dark:text-white text-center mb-1" style={{ fontWeight: 700 }}>{currentSong.title}</h2>
          <p className="text-gray-500 dark:text-gray-400 mb-1">{artistName}</p>
          <p className="text-sm text-gray-400 dark:text-gray-500 mb-8">{albumTitle}</p>

          <div className="w-full max-w-sm mb-6">
            <input type="range" min={0} max={currentSong.duration} value={progress} onChange={e => setProgress(Number(e.target.value))} className="w-full accent-violet-500" />
            <div className="flex justify-between text-xs text-gray-400 mt-1">
              <span>{formatDuration(progress)}</span>
              <span>{formatDuration(currentSong.duration)}</span>
            </div>
          </div>

          <div className="flex items-center gap-4 mb-6">
            <button className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"><Shuffle className="w-4 h-4" /></button>
            <button onClick={prev} className="p-2 text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white"><SkipBack className="w-5 h-5" /></button>
            <button onClick={togglePlay} className="w-14 h-14 rounded-full bg-gradient-to-r from-violet-500 to-fuchsia-500 flex items-center justify-center text-white shadow-xl shadow-violet-200 dark:shadow-violet-900/40 hover:scale-105 transition-transform">
              {isPlaying ? <Pause className="w-6 h-6" /> : <Play className="w-6 h-6 ml-0.5" />}
            </button>
            <button onClick={next} className="p-2 text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white"><SkipForward className="w-5 h-5" /></button>
            <button className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"><Repeat className="w-4 h-4" /></button>
          </div>

          <div className="flex items-center gap-3">
            <button onClick={() => setVolume(volume > 0 ? 0 : 75)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
              {volume > 0 ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
            </button>
            <input type="range" min={0} max={100} value={volume} onChange={e => setVolume(Number(e.target.value))} className="w-32 accent-violet-500" />
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }}>
          <h3 className="text-lg text-gray-900 dark:text-white mb-4 flex items-center gap-2" style={{ fontWeight: 600 }}>
            <ListMusic className="w-5 h-5 text-violet-500" /> Up Next
          </h3>
          <div className="grid gap-1 max-h-[60vh] overflow-y-auto pr-2">
            {trending.map((s, i) => <SongCard key={s.id} song={s} index={i} queue={trending} />)}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
