import { useData } from "../context/DataContext";
import { SongCard } from "../components/SongCard";
import { usePlayer } from "../context/PlayerContext";
import { useNavigate } from "react-router";
import { motion } from "motion/react";
import { TrendingUp, Disc3, Mic2, Play, Pause } from "lucide-react";
import { ImageWithFallback } from "../components/figma/ImageWithFallback";
import { formatCount } from "../data/mock";

export function Home() {
  const { artists, albums, getTrending, getArtist } = useData();
  const trending = getTrending();
  const { playSong, currentSong, isPlaying, togglePlay } = usePlayer();
  const navigate = useNavigate();

  const isPlayingTrending = trending.some(s => s.id === currentSong?.id) && isPlaying;

  const handlePlayTrending = () => {
    if (isPlayingTrending) { togglePlay(); return; }
    if (trending.length > 0) playSong(trending[0], trending);
  };

  return (
    <div>
      {/* ── Hero ────────────────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden bg-gradient-to-br from-violet-50 via-fuchsia-50 to-orange-50 dark:from-gray-900 dark:via-gray-900 dark:to-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <motion.div initial={{ opacity: 0, x: -30 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.6 }}>
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-violet-100 dark:bg-violet-900/40 text-violet-700 dark:text-violet-300 text-sm mb-6">
                <Disc3 className="w-3.5 h-3.5 animate-spin" style={{ animationDuration: "3s" }} />
                Now Streaming
              </div>
              <h1 className="text-4xl sm:text-5xl lg:text-6xl text-gray-900 dark:text-white mb-4" style={{ fontWeight: 800, lineHeight: 1.1 }}>
                Feel the <span className="bg-gradient-to-r from-violet-600 to-fuchsia-600 bg-clip-text text-transparent">rhythm</span> of every moment
              </h1>
              <p className="text-lg text-gray-600 dark:text-gray-300 mb-8 max-w-lg">
                Discover trending tracks, explore new artists, and let the music move you.
              </p>
              {trending.length > 0 && (
                <button
                  onClick={handlePlayTrending}
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white shadow-lg shadow-violet-200 dark:shadow-violet-900/40 hover:shadow-violet-300 transition-all hover:scale-105"
                >
                  {isPlayingTrending ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                  {isPlayingTrending ? "Pause" : "Play Trending"}
                </button>
              )}
            </motion.div>

            {/* Hero album grid — clickable */}
            <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.6, delay: 0.2 }} className="hidden lg:block">
              <div className="grid grid-cols-2 gap-4">
                {albums.slice(0, 4).map((album, i) => (
                  <motion.div
                    key={album.id}
                    whileHover={{ y: -6, scale: 1.03 }}
                    onClick={() => navigate(`/album/${album.id}`)}
                    className={`rounded-2xl overflow-hidden shadow-lg cursor-pointer group relative ${i % 2 === 1 ? "mt-6" : ""}`}
                  >
                    <ImageWithFallback src={album.cover} alt={album.title} className="w-full aspect-square object-cover group-hover:scale-110 transition-transform duration-500" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-3">
                      <p className="text-white text-sm font-semibold truncate">{album.title}</p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ── Trending ─────────────────────────────────────────────────────────── */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex items-center gap-2 mb-6">
          <TrendingUp className="w-5 h-5 text-violet-500" />
          <h2 className="text-2xl text-gray-900 dark:text-white" style={{ fontWeight: 700 }}>Trending Now</h2>
        </div>
        {trending.length === 0 ? (
          <p className="text-gray-500 dark:text-gray-400 text-center py-8">No songs available yet.</p>
        ) : (
          <div className="grid gap-1">
            {trending.slice(0, 12).map((song, i) => (
              <SongCard key={song.id} song={song} index={i} queue={trending} />
            ))}
          </div>
        )}
      </section>

      {/* ── Featured Artists ──────────────────────────────────────────────────── */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex items-center gap-2 mb-6">
          <Mic2 className="w-5 h-5 text-fuchsia-500" />
          <h2 className="text-2xl text-gray-900 dark:text-white" style={{ fontWeight: 700 }}>Featured Artists</h2>
        </div>
        {artists.length === 0 ? (
          <p className="text-gray-500 dark:text-gray-400 text-center py-8">No artists yet.</p>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-6">
            {artists.map((artist, i) => (
              <motion.div
                key={artist.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                whileHover={{ y: -6 }}
                onClick={() => navigate(`/artist/${artist.id}`)}
                className="text-center group cursor-pointer"
              >
                <div className="relative w-32 h-32 sm:w-40 sm:h-40 mx-auto mb-3">
                  {/* Glow ring on hover */}
                  <div className="absolute inset-0 rounded-full bg-gradient-to-br from-violet-400 to-fuchsia-400 opacity-0 group-hover:opacity-100 scale-105 transition-all duration-300 blur-md" />
                  <div className="relative w-full h-full rounded-full overflow-hidden ring-4 ring-violet-100 dark:ring-violet-900/50 group-hover:ring-violet-400 dark:group-hover:ring-violet-500 transition-all shadow-lg">
                    <ImageWithFallback
                      src={artist.image}
                      alt={artist.name}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                    />
                    {/* Overlay with play icon */}
                    <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <div className="w-10 h-10 rounded-full bg-white/90 flex items-center justify-center shadow-lg">
                        <Play className="w-4 h-4 text-gray-900 ml-0.5" />
                      </div>
                    </div>
                  </div>
                </div>
                <p className="text-gray-900 dark:text-white font-semibold group-hover:text-violet-600 dark:group-hover:text-violet-400 transition-colors">
                  {artist.name}
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400">Artist</p>
              </motion.div>
            ))}
          </div>
        )}
      </section>

      {/* ── Popular Albums ────────────────────────────────────────────────────── */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 pb-16">
        <div className="flex items-center gap-2 mb-6">
          <Disc3 className="w-5 h-5 text-orange-500" />
          <h2 className="text-2xl text-gray-900 dark:text-white" style={{ fontWeight: 700 }}>Popular Albums</h2>
        </div>
        {albums.length === 0 ? (
          <p className="text-gray-500 dark:text-gray-400 text-center py-8">No albums yet.</p>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
            {albums.map((album, i) => {
              const artist = getArtist(album.artistId);
              return (
                <motion.div
                  key={album.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.06 }}
                  whileHover={{ y: -6, scale: 1.03 }}
                  onClick={() => navigate(`/album/${album.id}`)}
                  className="cursor-pointer group"
                >
                  <div className="relative rounded-2xl overflow-hidden shadow-md group-hover:shadow-xl transition-all mb-2.5">
                    <ImageWithFallback
                      src={album.cover}
                      alt={album.title}
                      className="w-full aspect-square object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    {/* Play overlay */}
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center">
                      <div className="w-10 h-10 rounded-full bg-white/95 flex items-center justify-center opacity-0 group-hover:opacity-100 transform scale-75 group-hover:scale-100 transition-all shadow-lg">
                        <Play className="w-4 h-4 text-gray-900 ml-0.5" />
                      </div>
                    </div>
                    {/* Year badge */}
                    <div className="absolute top-2 left-2 px-1.5 py-0.5 rounded-md bg-black/50 text-white text-xs font-medium opacity-0 group-hover:opacity-100 transition-opacity">
                      {album.year}
                    </div>
                  </div>
                  <p className="text-sm text-gray-900 dark:text-white truncate font-semibold group-hover:text-violet-600 dark:group-hover:text-violet-400 transition-colors">
                    {album.title}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                    {artist?.name} · {album.year}
                  </p>
                </motion.div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}