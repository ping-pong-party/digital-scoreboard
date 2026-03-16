import { useState, useEffect } from 'react';
import MobileScoreboard from './MobileScoreboard';
import MobileMatchStarter from './MobileMatchStarter';
import MobileLeaderboard from './MobileLeaderboard';

type View = 'home' | 'match' | 'leaderboard';

export default function MobileHome() {
  const [view, setView] = useState<View>('home');
  const [hasActiveMatch, setHasActiveMatch] = useState(false);
  const [loading, setLoading] = useState(true);

  const checkActiveMatch = async () => {
    try {
      const response = await fetch('/api/matches/ongoing');
      if (!response.ok) throw new Error('Failed to fetch match');
      const data = await response.json();
      setHasActiveMatch(data.match && data.match.status === 'IN_PROGRESS');
    } catch (error) {
      console.error('Error checking active match:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkActiveMatch();
    const interval = setInterval(checkActiveMatch, 5000);
    return () => clearInterval(interval);
  }, []);

  if (view === 'match') {
    return <MobileScoreboard />;
  }

  if (view === 'leaderboard') {
    return (
      <div className="relative">
        <MobileLeaderboard />
        <button
          onClick={() => setView('home')}
          className="fixed bottom-6 right-6 w-14 h-14 bg-cyan-500 hover:bg-cyan-600 text-white rounded-full shadow-lg flex items-center justify-center text-2xl active:scale-95 transition-transform z-50"
        >
          ←
        </button>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-2xl font-bold text-cyan-400">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 flex flex-col">
      {/* Header */}
      <div className="bg-gray-800 px-4 py-6 text-center border-b border-gray-700">
        <h1 className="text-3xl font-black text-cyan-400 mb-1">Ping Pong Party</h1>
        <p className="text-sm text-gray-400">Digital Scoreboard</p>
      </div>

      {/* Active Match Alert */}
      {hasActiveMatch && (
        <div className="bg-green-900/30 border-b-2 border-green-500 px-4 py-4">
          <div className="flex items-center gap-3">
            <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
            <div className="flex-1">
              <div className="font-bold text-green-400">Match in Progress</div>
              <div className="text-sm text-gray-300">A match is currently active</div>
            </div>
            <button
              onClick={() => setView('match')}
              className="px-4 py-2 bg-green-500 hover:bg-green-600 text-white font-bold rounded-lg active:scale-95 transition-transform"
            >
              View
            </button>
          </div>
        </div>
      )}

      {/* Main Actions */}
      <div className="flex-1 flex flex-col gap-4 p-6">
        {/* Start New Match */}
        <button
          onClick={() => {
            if (hasActiveMatch) {
              if (confirm('A match is already in progress. Start a new one?')) {
                // Cancel current match first
                fetch('/api/matches/cancel', { method: 'DELETE' })
                  .then(() => {
                    setView('match');
                    checkActiveMatch();
                  });
              }
            } else {
              setView('match');
            }
          }}
          className="flex-1 min-h-[120px] bg-gradient-to-br from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 rounded-2xl p-6 flex flex-col items-center justify-center text-white active:scale-98 transition-transform shadow-xl"
        >
          <div className="text-5xl mb-3">🏓</div>
          <div className="text-2xl font-black mb-1">Start Match</div>
          <div className="text-sm opacity-80">Begin scoring a new game</div>
        </button>

        {/* View Leaderboard */}
        <button
          onClick={() => setView('leaderboard')}
          className="flex-1 min-h-[120px] bg-gradient-to-br from-yellow-500 to-orange-600 hover:from-yellow-600 hover:to-orange-700 rounded-2xl p-6 flex flex-col items-center justify-center text-white active:scale-98 transition-transform shadow-xl"
        >
          <div className="text-5xl mb-3">🏆</div>
          <div className="text-2xl font-black mb-1">Leaderboard</div>
          <div className="text-sm opacity-80">View rankings and stats</div>
        </button>

        {/* Quick Links */}
        <div className="grid grid-cols-2 gap-3">
          <a
            href="/players"
            className="bg-gray-800 hover:bg-gray-700 rounded-xl p-4 flex flex-col items-center justify-center text-white active:scale-98 transition-all border-2 border-gray-700"
          >
            <div className="text-3xl mb-2">👥</div>
            <div className="text-sm font-bold">Players</div>
          </a>
          <a
            href="/matches"
            className="bg-gray-800 hover:bg-gray-700 rounded-xl p-4 flex flex-col items-center justify-center text-white active:scale-98 transition-all border-2 border-gray-700"
          >
            <div className="text-3xl mb-2">📊</div>
            <div className="text-sm font-bold">Matches</div>
          </a>
        </div>
      </div>

      {/* PWA Install Prompt */}
      <div className="bg-gray-800 px-4 py-3 text-center text-xs text-gray-500 border-t border-gray-700">
        Tip: Add to home screen for quick access
      </div>
    </div>
  );
}
