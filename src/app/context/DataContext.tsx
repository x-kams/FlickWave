import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from "react";
import { type Song, type Artist, type Album } from "../data/mock";

const API = (import.meta.env.VITE_API_URL || "/api").replace(/\/+$/, "");

interface DataContextType {
  songs: Song[];
  artists: Artist[];
  albums: Album[];
  loading: boolean;
  addSong: (formData: FormData) => Promise<void>;
  deleteSong: (id: string) => Promise<void>;
  addArtist: (artist: Omit<Artist, "id">) => Promise<void>;
  deleteArtist: (id: string) => Promise<void>;
  addAlbum: (album: Omit<Album, "id">) => Promise<void>;
  deleteAlbum: (id: string) => Promise<void>;
  getArtist: (id: string) => Artist | undefined;
  getAlbum: (id: string) => Album | undefined;
  getTrending: () => Song[];
  getArtistSongs: (artistId: string) => Song[];
  getAlbumSongs: (albumId: string) => Song[];
  incrementPlay: (id: string) => void;
}

const DataContext = createContext<DataContextType | null>(null);

export function DataProvider({ children }: { children: ReactNode }) {
  const [songs, setSongs]     = useState<Song[]>([]);
  const [artists, setArtists] = useState<Artist[]>([]);
  const [albums, setAlbums]   = useState<Album[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchAll() {
      setLoading(true);
      try {
        const [sRes, arRes, alRes] = await Promise.all([
          fetch(`${API}/songs`),
          fetch(`${API}/artists`),
          fetch(`${API}/albums`),
        ]);
        const [s, ar, al] = await Promise.all([sRes.json(), arRes.json(), alRes.json()]);
        setSongs(Array.isArray(s) ? s : []);
        setArtists(Array.isArray(ar) ? ar : []);
        setAlbums(Array.isArray(al) ? al : []);
      } catch (err) {
        console.error("Backend se data nahi aaya:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchAll();
  }, []);

  const addSong = useCallback(async (formData: FormData) => {
    const res = await fetch(`${API}/songs`, { method: "POST", body: formData });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Song add nahi hua");
    setSongs((prev) => [data, ...prev]);
  }, []);

  const deleteSong = useCallback(async (id: string) => {
    const res = await fetch(`${API}/songs/${id}`, { method: "DELETE" });
    if (!res.ok) { const d = await res.json(); throw new Error(d.error || "Delete failed"); }
    setSongs((prev) => prev.filter((s) => s.id !== id));
  }, []);

  const incrementPlay = useCallback((id: string) => {
    fetch(`${API}/songs/${id}/play`, { method: "PATCH" }).catch(() => {});
    setSongs((prev) => prev.map((s) => (s.id === id ? { ...s, playCount: s.playCount + 1 } : s)));
  }, []);

  const addArtist = useCallback(async (artist: Omit<Artist, "id">) => {
    const res = await fetch(`${API}/artists`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(artist) });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Artist add nahi hua");
    setArtists((prev) => [data, ...prev]);
  }, []);

  const deleteArtist = useCallback(async (id: string) => {
    const res = await fetch(`${API}/artists/${id}`, { method: "DELETE" });
    if (!res.ok) { const d = await res.json().catch(() => ({})); throw new Error(d.error || "Delete failed"); }
    setArtists((prev) => prev.filter((a) => a.id !== id));
    setAlbums((prev) => prev.filter((al) => al.artistId !== id));
    setSongs((prev) => prev.filter((s) => s.artistId !== id));
  }, []);

  const addAlbum = useCallback(async (album: Omit<Album, "id">) => {
    const res = await fetch(`${API}/albums`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(album) });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Album add nahi hua");
    setAlbums((prev) => [data, ...prev]);
  }, []);

  const deleteAlbum = useCallback(async (id: string) => {
    const res = await fetch(`${API}/albums/${id}`, { method: "DELETE" });
    if (!res.ok) { const d = await res.json().catch(() => ({})); throw new Error(d.error || "Delete failed"); }
    setAlbums((prev) => prev.filter((a) => a.id !== id));
    setSongs((prev) => prev.filter((s) => s.albumId !== id));
  }, []);

  const getArtist = useCallback((id: string) => artists.find((a) => a.id === id), [artists]);
  const getAlbum  = useCallback((id: string) => albums.find((a) => a.id === id), [albums]);
  const getTrending = useCallback(() => [...songs].sort((a, b) => b.playCount - a.playCount), [songs]);
  const getArtistSongs = useCallback((artistId: string) => songs.filter((s) => s.artistId === artistId), [songs]);
  const getAlbumSongs  = useCallback((albumId: string)  => songs.filter((s) => s.albumId  === albumId),  [songs]);

  return (
    <DataContext.Provider value={{ songs, artists, albums, loading, addSong, deleteSong, incrementPlay, addArtist, deleteArtist, addAlbum, deleteAlbum, getArtist, getAlbum, getTrending, getArtistSongs, getAlbumSongs }}>
      {children}
    </DataContext.Provider>
  );
}

export function useData() {
  const ctx = useContext(DataContext);
  if (!ctx) throw new Error("useData must be used within DataProvider");
  return ctx;
}
