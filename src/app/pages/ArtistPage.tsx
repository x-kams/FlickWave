import { useParams, useNavigate } from "react-router";
import { motion } from "motion/react";
import { ArrowLeft, Play, Pause, Music2, Disc3, HeartIcon } from "lucide-react";
import { useData } from "../context/DataContext";
import { usePlayer } from "../context/PlayerContext";
import { SongCard } from "../components/SongCard";
import { formatCount } from "../data/mock";

export function ArtistPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { getArtist, getArtistSongs, albums } = useData();
  const { playSong, currentSong, isPlaying, togglePlay } = usePlayer();

  const artist = id ? getArtist(id) : undefined;
  const songs   = id ? getArtistSongs(id) : [];
  const artistAlbums = albums.filter(al => al.artistId === id);
  const totalPlays   = songs.reduce((sum, s) => sum + s.playCount, 0);

  if (!artist) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center text-center px-4">
        <Music2 className="w-16 h-16 text-gray-300 dark:text-gray-600 mb-4" />
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Artist not found</h2>
        <button onClick={() => navigate(-1)} className="mt-4 px-6 py-2 rounded-xl bg-violet-600 text-white hover:bg-violet-700 transition-colors">
          Go Back
        </button>
      </div>
    );
  }

  const isPlayingArtist = songs.some(s => s.id === currentSong?.id) && isPlaying;

  const handlePlayAll = () => {
    if (!songs.length) return;
    if (isPlayingArtist) { togglePlay(); return; }
    const sorted = [...songs].sort((a, b) => b.playCount - a.playCount);
    playSong(sorted[0], sorted);
  };

  return (
    <div className="min-h-screen dark:bg-gray-950">
      {/* ── Hero ── */}
      <div className="relative overflow-hidden">
        {/* Blurred background from artist image */}
        <div
          className="absolute inset-0 scale-110 blur-2xl opacity-40 dark:opacity-20"
          style={{ backgroundImage: `url(${artist.image})`, backgroundSize: "cover", backgroundPosition: "center" }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-white/60 to-white dark:via-gray-950/80 dark:to-gray-950" />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 pb-12">
          {/* Back */}
          <button onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 hover:text-violet-600 dark:hover:text-violet-400 transition-colors mb-8">
            <ArrowLeft className="w-4 h-4" /> Back
          </button>

          <div className="flex flex-col sm:flex-row items-center sm:items-end gap-6">
            {/* Artist photo */}
            <motion.div
              initial={{ opacity: 0, scale: 0.85 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5 }}
              className="relative flex-shrink-0"
            >
              <img
                src={artist.image}
                alt={artist.name}
                className="w-44 h-44 sm:w-52 sm:h-52 rounded-full object-cover shadow-2xl ring-4 ring-white dark:ring-gray-800"
              />
              {/* Pulsing ring when playing */}
              {isPlayingArtist && (
                <span className="absolute inset-0 rounded-full ring-4 ring-violet-500 animate-ping opacity-30" />
              )}
            </motion.div>

            {/* Info */}
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="text-center sm:text-left"
            >
              <p className="text-xs font-semibold text-violet-600 dark:text-violet-400 uppercase tracking-widest mb-1">Artist</p>
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-gray-900 dark:text-white mb-3 leading-tight">
                {artist.name}
              </h1>
              <p className="text-gray-600 dark:text-gray-400 max-w-lg mb-4 leading-relaxed">{artist.bio}</p>
              <div className="flex items-center justify-center sm:justify-start gap-4 text-sm text-gray-500 dark:text-gray-400">
                <span className="flex items-center gap-1.5"><Disc3 className="w-4 h-4 text-orange-400" /> {artistAlbums.length} albums</span>
                <span className="w-1 h-1 rounded-full bg-gray-300 dark:bg-gray-600" />
                <span className="flex items-center gap-1.5"><Music2 className="w-4 h-4 text-violet-400" /> {songs.length} songs</span>
                <span className="w-1 h-1 rounded-full bg-gray-300 dark:bg-gray-600" />
                <span className="flex items-center gap-1.5"><HeartIcon className="w-4 h-4 text-pink-400" /> {formatCount(totalPlays)} plays</span>
              </div>
            </motion.div>
          </div>

          {/* Play button */}
          {songs.length > 0 && (
            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }} className="mt-8">
              <button
                onClick={handlePlayAll}
                className="flex items-center gap-3 px-8 py-3.5 rounded-2xl bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white font-semibold shadow-lg shadow-violet-200 dark:shadow-violet-900/40 hover:shadow-violet-300 hover:scale-[1.03] transition-all"
              >
                {isPlayingArtist
                  ? <><Pause className="w-5 h-5" /> Pause</>
                  : <><Play className="w-5 h-5" /> Play All</>
                }
              </button>
            </motion.div>
          )}
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-20 space-y-14">

        {/* ── Albums ── */}
        {artistAlbums.length > 0 && (
          <section>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-5 flex items-center gap-2">
              <Disc3 className="w-5 h-5 text-orange-400" /> Albums
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
              {artistAlbums.map((album, i) => (
                <motion.div
                  key={album.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.07 }}
                  whileHover={{ y: -6, scale: 1.02 }}
                  onClick={() => navigate(`/album/${album.id}`)}
                  className="group cursor-pointer"
                >
                  <div className="rounded-2xl overflow-hidden shadow-md group-hover:shadow-xl transition-all mb-2.5 relative">
                    <img src={album.cover} alt={album.title} className="w-full aspect-square object-cover group-hover:scale-105 transition-transform duration-500" />
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                      <div className="w-10 h-10 rounded-full bg-white/90 flex items-center justify-center opacity-0 group-hover:opacity-100 transform scale-75 group-hover:scale-100 transition-all shadow-lg">
                        <Play className="w-4 h-4 text-gray-900 ml-0.5" />
                      </div>
                    </div>
                  </div>
                  <p className="font-semibold text-sm text-gray-900 dark:text-white truncate">{album.title}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">{album.year}</p>
                </motion.div>
              ))}
            </div>
          </section>
        )}

        {/* ── Popular Songs ── */}
        {songs.length > 0 && (
          <section>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-5 flex items-center gap-2">
              <Music2 className="w-5 h-5 text-violet-400" /> Popular Songs
            </h2>
            <div className="space-y-1">
              {[...songs].sort((a, b) => b.playCount - a.playCount).map((song, i) => (
                <SongCard key={song.id} song={song} index={i} queue={songs} />
              ))}
            </div>
          </section>
        )}

        {songs.length === 0 && artistAlbums.length === 0 && (
          <div className="text-center py-16 text-gray-400 dark:text-gray-600">
            <Music2 className="w-12 h-12 mx-auto mb-3 opacity-40" />
            <p>No songs or albums yet for this artist.</p>
          </div>
        )}
      </div>
    </div>
  );
}