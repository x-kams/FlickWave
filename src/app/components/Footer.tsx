import { Link } from "react-router";
import { Music, Heart } from "lucide-react";

export function Footer() {
  return (
    <footer className="bg-gradient-to-b from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-950 border-t border-gray-200 dark:border-gray-800 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-500 to-fuchsia-500 flex items-center justify-center">
                <Music className="w-4 h-4 text-white" />
              </div>
              <span className="text-lg bg-gradient-to-r from-violet-600 to-fuchsia-600 bg-clip-text text-transparent" style={{ fontWeight: 700 }}>FlickWave</span>
            </div>
            <p className="text-gray-500 dark:text-gray-400 text-sm">Your gateway to unlimited music streaming. Discover, play, and enjoy.</p>
          </div>
          <div>
            <h4 className="text-gray-900 dark:text-white mb-3">Company</h4>
            <ul className="space-y-2">
              <li><Link to="/about" className="text-gray-500 dark:text-gray-400 hover:text-violet-600 dark:hover:text-violet-400 transition-colors text-sm">About</Link></li>
              <li><Link to="/support" className="text-gray-500 dark:text-gray-400 hover:text-violet-600 dark:hover:text-violet-400 transition-colors text-sm">Support</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="text-gray-900 dark:text-white mb-3">Legal</h4>
            <ul className="space-y-2">
              <li><Link to="/privacy" className="text-gray-500 dark:text-gray-400 hover:text-violet-600 dark:hover:text-violet-400 transition-colors text-sm">Privacy Policy</Link></li>
              <li><Link to="/terms" className="text-gray-500 dark:text-gray-400 hover:text-violet-600 dark:hover:text-violet-400 transition-colors text-sm">Terms & Conditions</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="text-gray-900 dark:text-white mb-3">Explore</h4>
            <ul className="space-y-2">
              <li><Link to="/" className="text-gray-500 dark:text-gray-400 hover:text-violet-600 dark:hover:text-violet-400 transition-colors text-sm">Trending</Link></li>
              <li><Link to="/search" className="text-gray-500 dark:text-gray-400 hover:text-violet-600 dark:hover:text-violet-400 transition-colors text-sm">Search Music</Link></li>
              <li><Link to="/player" className="text-gray-500 dark:text-gray-400 hover:text-violet-600 dark:hover:text-violet-400 transition-colors text-sm">Player</Link></li>
            </ul>
          </div>
        </div>
        <div className="mt-10 pt-6 border-t border-gray-200 dark:border-gray-800 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-gray-400 dark:text-gray-500 text-sm">© 2026 FlickWave. All rights reserved.</p>
          <p className="text-gray-400 dark:text-gray-500 text-sm flex items-center gap-1">Made with <Heart className="w-3 h-3 text-rose-400 fill-rose-400" /> for music lovers</p>
        </div>
      </div>
    </footer>
  );
}
