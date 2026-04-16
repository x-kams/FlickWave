import { RouterProvider } from "react-router";
import { router } from "./routes";
import { PlayerProvider } from "./context/PlayerContext";
import { AuthProvider } from "./context/AuthContext";
import { ThemeProvider } from "./context/ThemeContext";
import { DataProvider } from "./context/DataContext";
import { Toaster } from "sonner";

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <DataProvider>
          <PlayerProvider>
            <RouterProvider router={router} />
            <Toaster position="top-right" richColors />
          </PlayerProvider>
        </DataProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}
