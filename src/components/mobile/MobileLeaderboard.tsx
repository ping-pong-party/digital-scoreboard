import { useState, useEffect } from 'react';

interface LeaderboardEntry {
  playerId: string;
  playerName: string;
  avatarUrl?: string;
  currentRating: number;
  ratingChange: number;
  matchesPlayed: number;
}

type LeaderboardType = 'today' | 'week' | 'month' | 'ratings';

const LEADERBOARD_TITLES = {
  today: 'Today',
  week: 'This Week',
  month: 'This Month',
  ratings: 'All Time',
};

export default function MobileLeaderboard() {
  const [type, setType] = useState<LeaderboardType>('ratings');
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchLeaderboard = async () => {
    try {
      const response = await fetch(`/api/leaderboard/${type}`);
      if (!response.ok) throw new Error('Failed to fetch leaderboard');
      const data = await response.json();
      setLeaderboard(data.leaderboard);
    } catch (error) {
      console.error('Error fetching leaderboard:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeaderboard();
    const interval = setInterval(fetchLeaderboard, 30000);
    return () => clearInterval(interval);
  }, [type]);

  const getMedalIcon = (rank: number) => {
    if (rank === 1) return '🥇';
    if (rank === 2) return '🥈';
    if (rank === 3) return '🥉';
    return `#${rank}`;
  };

  const playedPlayers = leaderboard.filter((p) => p.matchesPlayed > 0);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-xl font-bold text-cyan-400">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 flex flex-col">
      {/* Header */}
      <div className="bg-gray-800 px-4 py-3 border-b border-gray-700">
        <h1 className="text-xl font-bold text-cyan-400 mb-3">Leaderboard</h1>

        {/* Type Selector */}
        <div className="flex gap-2 overflow-x-auto pb-2">
          {(Object.keys(LEADERBOARD_TITLES) as LeaderboardType[]).map((t) => (
            <button
              key={t}
              onClick={() => setType(t)}
              className={`px-4 py-2 rounded-lg text-sm font-semibold whitespace-nowrap transition-colors ${
                type === t
                  ? 'bg-cyan-500 text-white'
                  : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              }`}
            >
              {LEADERBOARD_TITLES[t]}
            </button>
          ))}
        </div>
      </div>

      {/* Leaderboard List */}
      <div className="flex-1 overflow-y-auto px-4 py-4">
        <div className="space-y-2">
          {playedPlayers.map((entry, index) => {
            const rank = index + 1;

            return (
              <div
                key={entry.playerId}
                className={`bg-gray-800 rounded-lg p-4 flex items-center gap-3 ${
                  rank <= 3 ? 'border-2 border-yellow-500/30' : ''
                }`}
              >
                {/* Rank */}
                <div className="text-2xl font-black w-12 text-center">
                  {getMedalIcon(rank)}
                </div>

                {/* Avatar */}
                {entry.avatarUrl ? (
                  <img
                    src={entry.avatarUrl}
                    alt={entry.playerName}
                    className="w-12 h-12 rounded-full"
                  />
                ) : (
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center text-white text-lg font-bold">
                    {entry.playerName.charAt(0).toUpperCase()}
                  </div>
                )}

                {/* Player Info */}
                <div className="flex-1">
                  <div className={`font-bold ${rank <= 3 ? 'text-yellow-400' : 'text-white'}`}>
                    {entry.playerName}
                  </div>
                  <div className="text-sm text-gray-400">
                    {entry.matchesPlayed} {entry.matchesPlayed === 1 ? 'match' : 'matches'}
                  </div>
                </div>

                {/* Rating */}
                <div className="text-right">
                  <div className="text-xl font-bold text-cyan-400">{entry.currentRating}</div>
                  {type !== 'ratings' && entry.ratingChange !== 0 && (
                    <div
                      className={`text-sm font-semibold ${
                        entry.ratingChange > 0 ? 'text-green-400' : 'text-red-400'
                      }`}
                    >
                      {entry.ratingChange > 0 ? '+' : ''}
                      {entry.ratingChange}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Pull to Refresh Hint */}
      <div className="bg-gray-800 px-4 py-2 text-center text-xs text-gray-500 border-t border-gray-700">
        Pull down to refresh • Auto-refresh every 30s
      </div>
    </div>
  );
}
