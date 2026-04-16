import { useState, useMemo } from "react";
import { Search as SearchIcon } from "lucide-react";
import { useData } from "../context/DataContext";
import { SongCard } from "../components/SongCard";
import { motion } from "motion/react";
import { ImageWithFallback } from "../components/figma/ImageWithFallback";

export function Search() {
  const [query, setQuery] = useState("");
  const { songs, artists } = useData();

  const filteredSongs = useMemo(() => {
    if (!query.trim()) return [];
    const q = query.toLowerCase();
    return songs.filter(s => {
      const artist = artists.find(a => a.id === s.artistId);
      return s.title.toLowerCase().includes(q) || artist?.name.toLowerCase().includes(q);
    });
  }, [query, songs, artists]);

  const filteredArtists = useMemo(() => {
    if (!query.trim()) return [];
    const q = query.toLowerCase();
    return artists.filter(a => a.name.toLowerCase().includes(q));
  }, [query, artists]);

  const genres = ["Pop", "Rock", "Electronic", "Jazz", "Hip-Hop", "Classical", "R&B", "Indie"];
  const genreColors = [
    "from-rose-400 to-pink-500", "from-orange-400 to-red-500",
    "from-violet-400 to-purple-500", "from-amber-400 to-yellow-500",
    "from-emerald-400 to-teal-500", "from-blue-400 to-indigo-500",
    "from-fuchsia-400 to-pink-500", "from-cyan-400 to-sky-500",
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="max-w-2xl mx-auto mb-10">
        <div className="relative">
          <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search songs, artists..."
            value={query}
            onChange={e => setQuery(e.target.value)}
            className="w-full pl-12 pr-4 py-4 rounded-2xl bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 focus:border-violet-400 focus:ring-2 focus:ring-violet-100 dark:focus:ring-violet-900 outline-none transition-all text-gray-900 dark:text-white"
          />
        </div>
      </motion.div>

      {!query.trim() ? (
        <>
          <h2 className="text-2xl text-gray-900 dark:text-white mb-6" style={{ fontWeight: 700 }}>Browse Genres</h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-12">
            {genres.map((genre, i) => (
              <motion.div key={genre} initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: i * 0.05 }} whileHover={{ scale: 1.03 }} onClick={() => setQuery(genre)} className={`bg-gradient-to-br ${genreColors[i]} rounded-2xl p-6 cursor-pointer shadow-md hover:shadow-lg transition-shadow`}>
                <span className="text-white text-lg" style={{ fontWeight: 700 }}>{genre}</span>
              </motion.div>
            ))}
          </div>

          <h2 className="text-2xl text-gray-900 dark:text-white mb-6" style={{ fontWeight: 700 }}>All Artists</h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-6">
            {artists.map((artist) => (
              <div key={artist.id} onClick={() => setQuery(artist.name)} className="text-center cursor-pointer group">
                <div className="w-28 h-28 mx-auto rounded-full overflow-hidden mb-2 ring-3 ring-gray-100 dark:ring-gray-700 group-hover:ring-violet-300 dark:group-hover:ring-violet-600 transition-all">
                  <ImageWithFallback src={artist.image} alt={artist.name} className="w-full h-full object-cover" />
                </div>
                <p className="text-gray-900 dark:text-white" style={{ fontWeight: 600 }}>{artist.name}</p>
              </div>
            ))}
          </div>
        </>
      ) : (
        <>
          {filteredArtists.length > 0 && (
            <div className="mb-8">
              <h3 className="text-lg text-gray-900 dark:text-white mb-4" style={{ fontWeight: 600 }}>Artists</h3>
              <div className="flex gap-6 overflow-x-auto pb-2">
                {filteredArtists.map(a => (
                  <div key={a.id} className="text-center flex-shrink-0">
                    <div className="w-24 h-24 rounded-full overflow-hidden mb-2 ring-3 ring-violet-200 dark:ring-violet-700">
                      <ImageWithFallback src={a.image} alt={a.name} className="w-full h-full object-cover" />
                    </div>
                    <p className="text-sm text-gray-900 dark:text-white" style={{ fontWeight: 600 }}>{a.name}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
          <h3 className="text-lg text-gray-900 dark:text-white mb-4" style={{ fontWeight: 600 }}>
            {filteredSongs.length > 0 ? `Songs (${filteredSongs.length})` : "No songs found"}
          </h3>
          <div className="grid gap-1">
            {filteredSongs.map((song, i) => (
              <SongCard key={song.id} song={song} index={i} queue={filteredSongs} />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
