import { useParams, useNavigate } from "react-router";
import { motion } from "motion/react";
import { ArrowLeft, Play, Pause, Music2, Clock } from "lucide-react";
import { useData } from "../context/DataContext";
import { usePlayer } from "../context/PlayerContext";
import { SongCard } from "../components/SongCard";
import { formatDuration, formatCount } from "../data/mock";

export function AlbumPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { getAlbum, getArtist, getAlbumSongs } = useData();
  const { playSong, currentSong, isPlaying, togglePlay } = usePlayer();

  const album  = id ? getAlbum(id) : undefined;
  const songs  = id ? getAlbumSongs(id) : [];
  const artist = album ? getArtist(album.artistId) : undefined;
  const totalDuration = songs.reduce((sum, s) => sum + (s.duration || 0), 0);
  const totalPlays    = songs.reduce((sum, s) => sum + s.playCount, 0);

  if (!album) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center text-center px-4">
        <Music2 className="w-16 h-16 text-gray-300 dark:text-gray-600 mb-4" />
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Album not found</h2>
        <button onClick={() => navigate(-1)} className="mt-4 px-6 py-2 rounded-xl bg-violet-600 text-white hover:bg-violet-700 transition-colors">
          Go Back
        </button>
      </div>
    );
  }

  const isPlayingAlbum = songs.some(s => s.id === currentSong?.id) && isPlaying;

  const handlePlayAll = () => {
    if (!songs.length) return;
    if (isPlayingAlbum) { togglePlay(); return; }
    playSong(songs[0], songs);
  };

  return (
    <div className="min-h-screen dark:bg-gray-950">
      {/* ── Hero ── */}
      <div className="relative overflow-hidden">
        {/* Blurred album cover as background */}
        <div
          className="absolute inset-0 scale-110 blur-3xl opacity-50 dark:opacity-25"
          style={{ backgroundImage: `url(${album.cover})`, backgroundSize: "cover", backgroundPosition: "center" }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-white/40 via-white/70 to-white dark:from-transparent dark:via-gray-950/70 dark:to-gray-950" />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 pb-12">
          {/* Back */}
          <button onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 hover:text-violet-600 dark:hover:text-violet-400 transition-colors mb-8">
            <ArrowLeft className="w-4 h-4" /> Back
          </button>

          <div className="flex flex-col sm:flex-row items-center sm:items-end gap-8">
            {/* Album cover */}
            <motion.div
              initial={{ opacity: 0, scale: 0.85, rotate: -2 }}
              animate={{ opacity: 1, scale: 1, rotate: 0 }}
              transition={{ duration: 0.5, type: "spring", stiffness: 150 }}
              className="flex-shrink-0 relative"
            >
              <img
                src={album.cover}
                alt={album.title}
                className="w-48 h-48 sm:w-56 sm:h-56 rounded-2xl object-cover shadow-2xl"
              />
              {isPlayingAlbum && (
                <div className="absolute -inset-1 rounded-2xl ring-2 ring-violet-500 animate-pulse" />
              )}
            </motion.div>

            {/* Info */}
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="text-center sm:text-left"
            >
              <p className="text-xs font-semibold text-orange-500 uppercase tracking-widest mb-1">Album · {album.year}</p>
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-gray-900 dark:text-white mb-3 leading-tight">
                {album.title}
              </h1>

              {/* Artist chip */}
              {artist && (
                <button
                  onClick={() => navigate(`/artist/${artist.id}`)}
                  className="inline-flex items-center gap-2.5 mb-4 group"
                >
                  <img src={artist.image} alt={artist.name} className="w-7 h-7 rounded-full object-cover ring-2 ring-white dark:ring-gray-700" />
                  <span className="text-sm font-semibold text-gray-700 dark:text-gray-300 group-hover:text-violet-600 dark:group-hover:text-violet-400 transition-colors">
                    {artist.name}
                  </span>
                </button>
              )}

              <div className="flex items-center justify-center sm:justify-start gap-4 text-sm text-gray-500 dark:text-gray-400">
                <span>{songs.length} songs</span>
                <span className="w-1 h-1 rounded-full bg-gray-300 dark:bg-gray-600" />
                <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" /> {formatDuration(totalDuration)}</span>
                <span className="w-1 h-1 rounded-full bg-gray-300 dark:bg-gray-600" />
                <span>{formatCount(totalPlays)} plays</span>
              </div>
            </motion.div>
          </div>

          {/* Play button */}
          {songs.length > 0 && (
            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="mt-8">
              <button
                onClick={handlePlayAll}
                className="flex items-center gap-3 px-8 py-3.5 rounded-2xl bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white font-semibold shadow-lg shadow-violet-200 dark:shadow-violet-900/40 hover:shadow-violet-300 hover:scale-[1.03] transition-all"
              >
                {isPlayingAlbum
                  ? <><Pause className="w-5 h-5" /> Pause Album</>
                  : <><Play className="w-5 h-5" /> Play Album</>
                }
              </button>
            </motion.div>
          )}
        </div>
      </div>

      {/* ── Track list ── */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-20">
        {songs.length > 0 ? (
          <div className="space-y-1">
            {songs.map((song, i) => (
              <SongCard key={song.id} song={song} index={i} queue={songs} />
            ))}
          </div>
        ) : (
          <div className="text-center py-20 text-gray-400 dark:text-gray-600">
            <Music2 className="w-12 h-12 mx-auto mb-3 opacity-40" />
            <p>No songs in this album yet.</p>
          </div>
        )}
      </div>
    </div>
  );
}