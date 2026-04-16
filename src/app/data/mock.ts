// Mock data for FlickWave

export interface Artist {
  id: string;
  name: string;
  image: string;
  bio: string;
}

export interface Album {
  id: string;
  title: string;
  artistId: string;
  cover: string;
  year: number;
}

export interface Song {
  id: string;
  title: string;
  artistId: string;
  albumId: string;
  duration: number; // seconds
  playCount: number;
  cover: string;
   audioUrl?: string;
}

export const artists: Artist[] = [
  { id: "a1", name: "Luna Vega", image: "https://images.unsplash.com/photo-1763296378615-becd737bceb2?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxmZW1hbGUlMjBzaW5nZXIlMjBwZXJmb3JtaW5nJTIwc3RhZ2V8ZW58MXx8fHwxNzc1Mzg5NjcwfDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral", bio: "Indie-pop sensation known for ethereal vocals and atmospheric production." },
  { id: "a2", name: "Marcus Cole", image: "https://images.unsplash.com/photo-1719977507164-932fcb300317?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtYWxlJTIwbXVzaWNpYW4lMjBndWl0YXIlMjBwb3J0cmFpdHxlbnwxfHx8fDE3NzUzODk2NzB8MA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral", bio: "Blues-rock guitarist with a soulful modern edge." },
  { id: "a3", name: "DJ Prism", image: "https://images.unsplash.com/photo-1647160494152-4c8eb24a844b?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxESiUyMG1peGluZyUyMGVsZWN0cm9uaWMlMjBtdXNpY3xlbnwxfHx8fDE3NzUzODk2NzF8MA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral", bio: "Electronic music producer pushing boundaries of sound design." },
  { id: "a4", name: "Aria Chen", image: "https://images.unsplash.com/photo-1612563974988-7d77ff074b42?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxwaWFubyUyMGtleWJvYXJkJTIwaW5zdHJ1bWVudHxlbnwxfHx8fDE3NzUzNjE0MDZ8MA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral", bio: "Classical crossover pianist blending orchestral and contemporary styles." },
];

export const albums: Album[] = [
  { id: "al1", title: "Neon Dreams", artistId: "a1", cover: "https://images.unsplash.com/photo-1765830287239-43f592de98a8?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxuZW9uJTIwbGlnaHRzJTIwYWJzdHJhY3QlMjBncmFkaWVudHxlbnwxfHx8fDE3NzUzODk2NzJ8MA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral", year: 2025 },
  { id: "al2", title: "Ocean Tides", artistId: "a1", cover: "https://images.unsplash.com/photo-1672275292775-56d932da070f?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxzdW5zZXQlMjBvY2VhbiUyMHdhdmVzJTIwY2FsbXxlbnwxfHx8fDE3NzUzODk2NzJ8MA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral", year: 2024 },
  { id: "al3", title: "Soul Strings", artistId: "a2", cover: "https://images.unsplash.com/photo-1653579658400-5818b7e5b8e9?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx2aW55bCUyMHJlY29yZCUyMGFsYnVtJTIwY292ZXIlMjBhcnR8ZW58MXx8fHwxNzc1Mzg5NjcxfDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral", year: 2025 },
  { id: "al4", title: "Pulse", artistId: "a3", cover: "https://images.unsplash.com/photo-1663659327805-ee486187579d?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxhYnN0cmFjdCUyMGNvbG9yZnVsJTIwcGFpbnQlMjBzcGxhc2h8ZW58MXx8fHwxNzc1Mzg5NjczfDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral", year: 2026 },
  { id: "al5", title: "City Lights", artistId: "a3", cover: "https://images.unsplash.com/photo-1757843298369-6e5503c14bfd?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjaXR5JTIwc2t5bGluZSUyMG5pZ2h0JTIwbGlnaHRzfGVufDF8fHx8MTc3NTMzOTQzM3ww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral", year: 2025 },
  { id: "al6", title: "Resonance", artistId: "a4", cover: "https://images.unsplash.com/photo-1658010544238-a6f7f621bcc4?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtdXNpYyUyMHN0dWRpbyUyMHJlY29yZGluZ3xlbnwxfHx8fDE3NzUzNjQxNzd8MA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral", year: 2024 },
];

const songNames = [
  "Starlit Path", "Midnight Haze", "Golden Hour", "Velvet Sky", "Electric Bloom",
  "Whispered Echoes", "Crimson Tide", "Silver Lining", "Dawn Chorus", "Wild Hearts",
  "Fading Embers", "Crystal Waters", "Burning Bridges", "Lunar Phase", "Daydreamer",
  "Hollow Ground", "Painted Skies", "Storm Chaser", "Gentle Waves", "Firefly Dance",
  "Silent Thunder", "Broken Compass", "Amber Glow", "Frozen Lake",
];

export const songs: Song[] = songNames.map((title, i) => {
  const albumIndex = i % albums.length;
  const album = albums[albumIndex];
  return {
    id: `s${i + 1}`,
    title,
    artistId: album.artistId,
    albumId: album.id,
    duration: 180 + Math.floor(Math.random() * 120),
    playCount: Math.floor(Math.random() * 500000) + 10000,
    cover: album.cover,
  };
});

export function getArtist(id: string) { return artists.find(a => a.id === id); }
export function getAlbum(id: string) { return albums.find(a => a.id === id); }
export function getTrending() { return [...songs].sort((a, b) => b.playCount - a.playCount); }
export function formatDuration(s: number) {
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return `${m}:${sec.toString().padStart(2, "0")}`;
}
export function formatCount(n: number) {
  if (n >= 1000000) return (n / 1000000).toFixed(1) + "M";
  if (n >= 1000) return (n / 1000).toFixed(1) + "K";
  return n.toString();
}
