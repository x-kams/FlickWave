import { Outlet } from "react-router";
import { Navbar } from "./Navbar";
import { Footer } from "./Footer";
import { PlayerBar } from "./PlayerBar";
import { usePlayer } from "../context/PlayerContext";

export function Layout() {
  const { currentSong } = usePlayer();
  return (
    <div className="flex flex-col min-h-screen bg-white dark:bg-gray-950 transition-colors">
      <Navbar />
      <main className={`flex-1 ${currentSong ? "pb-20" : ""}`}>
        <Outlet />
      </main>
      <Footer />
      <PlayerBar />
    </div>
  );
}
