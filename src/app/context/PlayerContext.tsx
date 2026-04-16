import {
  createContext, useContext, useState, useCallback,
  useEffect, useRef, type ReactNode,
} from "react";
import { type Song } from "../data/mock";

interface PlayerState {
  currentSong: Song | null;
  isPlaying: boolean;
  queue: Song[];
  currentIndex: number;
  volume: number;
  progress: number;
}

interface PlayerContextType extends PlayerState {
  playSong: (song: Song, queue?: Song[]) => void;
  playQueue: (queue: Song[], index: number) => void;
  togglePlay: () => void;
  next: () => void;
  prev: () => void;
  setVolume: (v: number) => void;
  setProgress: (p: number) => void;
}

const PlayerContext = createContext<PlayerContextType | null>(null);

export function PlayerProvider({ children }: { children: ReactNode }) {
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const [state, setState] = useState<PlayerState>({
    currentSong:  null,
    isPlaying:    false,
    queue:        [],
    currentIndex: -1,
    volume:       75,
    progress:     0,
  });

  // Create the Audio element once on mount
  useEffect(() => {
    const audio = new Audio();
    audio.preload = "auto";
    audioRef.current = audio;

    const onTimeUpdate = () => {
      setState(prev => ({ ...prev, progress: Math.floor(audio.currentTime) }));
    };

    const onLoadedMetadata = () => {
      setState(prev => {
        if (!prev.currentSong) return prev;
        // Update duration from actual audio file
        return {
          ...prev,
          currentSong: { ...prev.currentSong, duration: Math.floor(audio.duration) || prev.currentSong.duration },
        };
      });
    };

    const onEnded = () => {
      setState(prev => {
        if (prev.queue.length === 0) return { ...prev, isPlaying: false };
        const nextIdx = (prev.currentIndex + 1) % prev.queue.length;
        const nextSong = prev.queue[nextIdx];
        if (nextSong?.audioUrl) {
          audio.src = nextSong.audioUrl;
          audio.play().catch(() => {});
          return { ...prev, currentSong: nextSong, currentIndex: nextIdx, progress: 0, isPlaying: true };
        }
        return { ...prev, currentSong: nextSong, currentIndex: nextIdx, progress: 0, isPlaying: false };
      });
    };

    const onError = () => {
      setState(prev => ({ ...prev, isPlaying: false }));
    };

    audio.addEventListener("timeupdate",      onTimeUpdate);
    audio.addEventListener("loadedmetadata",  onLoadedMetadata);
    audio.addEventListener("ended",           onEnded);
    audio.addEventListener("error",           onError);

    return () => {
      audio.removeEventListener("timeupdate",     onTimeUpdate);
      audio.removeEventListener("loadedmetadata", onLoadedMetadata);
      audio.removeEventListener("ended",          onEnded);
      audio.removeEventListener("error",          onError);
      audio.pause();
      audio.src = "";
    };
  }, []);

  // Sync volume whenever it changes
  useEffect(() => {
    if (audioRef.current) audioRef.current.volume = state.volume / 100;
  }, [state.volume]);

  // ── playSong ───────────────────────────────────────────────────────────────
  const playSong = useCallback((song: Song, queue?: Song[]) => {
    const q   = queue ?? [song];
    const idx = q.findIndex(s => s.id === song.id);

    setState(prev => ({
      ...prev,
      currentSong:  song,
      queue:        q,
      currentIndex: idx >= 0 ? idx : 0,
      progress:     0,
      isPlaying:    !!song.audioUrl,
    }));

    const audio = audioRef.current;
    if (!audio) return;

    if (song.audioUrl) {
      audio.src = song.audioUrl;
      audio.currentTime = 0;
      audio.play().catch(() => setState(prev => ({ ...prev, isPlaying: false })));
    } else {
      audio.pause();
      audio.src = "";
    }
  }, []);

  // ── playQueue ──────────────────────────────────────────────────────────────
  const playQueue = useCallback((queue: Song[], index: number) => {
    playSong(queue[index], queue);
  }, [playSong]);

  // ── togglePlay ─────────────────────────────────────────────────────────────
  const togglePlay = useCallback(() => {
    const audio = audioRef.current;
    if (!audio || !state.currentSong?.audioUrl) return;

    if (state.isPlaying) {
      audio.pause();
      setState(prev => ({ ...prev, isPlaying: false }));
    } else {
      audio.play().catch(() => setState(prev => ({ ...prev, isPlaying: false })));
      setState(prev => ({ ...prev, isPlaying: true }));
    }
  }, [state.isPlaying, state.currentSong]);

  // ── next ───────────────────────────────────────────────────────────────────
  const next = useCallback(() => {
    setState(prev => {
      if (!prev.queue.length) return prev;
      const nextIdx  = (prev.currentIndex + 1) % prev.queue.length;
      const nextSong = prev.queue[nextIdx];
      const audio    = audioRef.current;
      if (audio && nextSong?.audioUrl) {
        audio.src = nextSong.audioUrl;
        audio.currentTime = 0;
        audio.play().catch(() => {});
        return { ...prev, currentSong: nextSong, currentIndex: nextIdx, progress: 0, isPlaying: true };
      }
      return { ...prev, currentSong: nextSong, currentIndex: nextIdx, progress: 0, isPlaying: false };
    });
  }, []);

  // ── prev ───────────────────────────────────────────────────────────────────
  const prev = useCallback(() => {
    setState(prev => {
      if (!prev.queue.length) return prev;
      const prevIdx  = prev.currentIndex <= 0 ? prev.queue.length - 1 : prev.currentIndex - 1;
      const prevSong = prev.queue[prevIdx];
      const audio    = audioRef.current;
      if (audio && prevSong?.audioUrl) {
        audio.src = prevSong.audioUrl;
        audio.currentTime = 0;
        audio.play().catch(() => {});
        return { ...prev, currentSong: prevSong, currentIndex: prevIdx, progress: 0, isPlaying: true };
      }
      return { ...prev, currentSong: prevSong, currentIndex: prevIdx, progress: 0, isPlaying: false };
    });
  }, []);

  // ── setVolume ──────────────────────────────────────────────────────────────
  const setVolume = useCallback((v: number) => {
    setState(prev => ({ ...prev, volume: v }));
  }, []);

  // ── setProgress (seek) ────────────────────────────────────────────────────
  const setProgress = useCallback((p: number) => {
    const audio = audioRef.current;
    if (audio && state.currentSong?.audioUrl && isFinite(p)) {
      audio.currentTime = p;
    }
    setState(prev => ({ ...prev, progress: p }));
  }, [state.currentSong]);

  return (
    <PlayerContext.Provider value={{ ...state, playSong, playQueue, togglePlay, next, prev, setVolume, setProgress }}>
      {children}
    </PlayerContext.Provider>
  );
}

export function usePlayer() {
  const ctx = useContext(PlayerContext);
  if (!ctx) throw new Error("usePlayer must be used within PlayerProvider");
  return ctx;
}