import { Play, Pause } from "lucide-react";
import { type Song, formatDuration, formatCount } from "../data/mock";
import { usePlayer } from "../context/PlayerContext";
import { useData } from "../context/DataContext";
import { motion } from "motion/react";

export function SongCard({ song, index, queue }: { song: Song; index: number; queue?: Song[] }) {
  const { playSong, currentSong, isPlaying, togglePlay } = usePlayer();
  const { getArtist } = useData();
  const isActive = currentSong?.id === song.id;

  const handleClick = () => {
    if (isActive) togglePlay();
    else playSong(song, queue);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.03, duration: 0.3 }}
      onClick={handleClick}
      className={`group flex items-center gap-3 p-3 rounded-2xl cursor-pointer transition-all hover:bg-violet-50/60 dark:hover:bg-violet-900/20 ${
        isActive ? "bg-violet-50 dark:bg-violet-900/30 ring-1 ring-violet-200 dark:ring-violet-700" : ""
      }`}
    >
      <div className="relative w-12 h-12 rounded-xl overflow-hidden flex-shrink-0">
        <img src={song.cover} alt="" className="w-full h-full object-cover" />
        <div className={`absolute inset-0 bg-black/30 flex items-center justify-center transition-opacity ${isActive ? "opacity-100" : "opacity-0 group-hover:opacity-100"}`}>
          {isActive && isPlaying ? <Pause className="w-4 h-4 text-white" /> : <Play className="w-4 h-4 text-white ml-0.5" />}
        </div>
      </div>
      <div className="min-w-0 flex-1">
        <p className={`text-sm truncate ${isActive ? "text-violet-700 dark:text-violet-400" : "text-gray-900 dark:text-white"}`} style={{ fontWeight: 500 }}>{song.title}</p>
        <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{getArtist(song.artistId)?.name || "Unknown"}</p>
      </div>
      <div className="hidden sm:flex flex-col items-end gap-0.5">
        <span className="text-xs text-gray-400 dark:text-gray-500">{formatDuration(song.duration)}</span>
        <span className="text-xs text-gray-400 dark:text-gray-500">{formatCount(song.playCount)} plays</span>
      </div>
    </motion.div>
  );
}
