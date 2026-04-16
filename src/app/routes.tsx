import { createBrowserRouter } from "react-router";
import { Layout } from "./components/Layout";
import { AdminLayout } from "./components/AdminLayout";
import { Home } from "./pages/Home";
import { Search } from "./pages/Search";
import { Player } from "./pages/Player";
import { Support } from "./pages/Support";
import { About } from "./pages/About";
import { Privacy } from "./pages/Privacy";
import { Terms } from "./pages/Terms";
import { Login } from "./pages/Login";
import { Signup } from "./pages/Signup";
import { Verify } from "./pages/Verify";
import { ForgotPassword } from "./pages/ForgotPassword";
import { ArtistPage } from "./pages/ArtistPage";
import { AlbumPage } from "./pages/AlbumPage";
import  Recommend  from "./pages/Recommend";
import { Generate } from "./pages/Generate";
import { Settings } from "./pages/Settings";
import { Admin } from "./pages/Admin";
import { NotFound } from "./pages/NotFound";

export const router = createBrowserRouter([
  {
    path: "/",
    Component: Layout,
    children: [
      { index: true, Component: Home },
      { path: "search", Component: Search },
      { path: "player", Component: Player },
      { path: "support", Component: Support },
      { path: "about", Component: About },
      { path: "privacy", Component: Privacy },
      { path: "terms", Component: Terms },
      { path: "login", Component: Login },
      { path: "signup", Component: Signup },
      { path: "verify", Component: Verify },
      { path: "forgot-password", Component: ForgotPassword },
      { path: "artist/:id", Component: ArtistPage },
      { path: "album/:id", Component: AlbumPage },
      { path: "discover", Component: Recommend },
      { path: "generate", Component: Generate },
      { path: "settings", Component: Settings },
      { path: "*", Component: NotFound },
    ],
  },
  {
    path: "/admin",
    Component: AdminLayout,
    children: [
      { index: true, Component: Admin },
    ],
  },
]);