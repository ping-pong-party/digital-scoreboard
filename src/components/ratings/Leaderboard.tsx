import { useState, useEffect } from 'react';

interface LeaderboardEntry {
  id: string;
  name: string;
  email?: string;
  rating: number;
  avatarUrl?: string;
  rank: number;
  wins: number;
  losses: number;
  totalMatches: number;
  winRate: number;
}

interface LeaderboardProps {
  limit?: number;
}

export default function Leaderboard({ limit = 10 }: LeaderboardProps) {
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchLeaderboard = async () => {
      try {
        setLoading(true);
        const response = await fetch(`/api/ratings/leaderboard?limit=${limit}`);
        if (!response.ok) throw new Error('Failed to fetch leaderboard');
        const data = await response.json();
        setLeaderboard(data.leaderboard);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    };

    fetchLeaderboard();
  }, [limit]);

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="text-4xl font-bold text-gray-400">Loading leaderboard...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <div className="text-4xl font-bold text-red-500">Error: {error}</div>
      </div>
    );
  }

  if (leaderboard.length === 0) {
    return (
      <div className="text-center py-12 bg-gray-800 rounded-lg">
        <p className="text-2xl text-gray-400">No players yet. Add players to see the leaderboard!</p>
        <a
          href="/players"
          className="inline-block mt-6 px-6 py-3 bg-blue-500 hover:bg-blue-600 text-white font-bold rounded-lg transition-colors"
        >
          Add Players
        </a>
      </div>
    );
  }

  // Get medal emoji for top 3
  const getMedal = (rank: number) => {
    if (rank === 1) return '🥇';
    if (rank === 2) return '🥈';
    if (rank === 3) return '🥉';
    return '';
  };

  // Get rank color
  const getRankColor = (rank: number) => {
    if (rank === 1) return 'text-yellow-400';
    if (rank === 2) return 'text-gray-300';
    if (rank === 3) return 'text-amber-600';
    return 'text-gray-500';
  };

  return (
    <div className="space-y-4">
      {leaderboard.map((entry) => (
        <div
          key={entry.id}
          className={`bg-gray-800 rounded-lg p-6 flex items-center justify-between transition-all hover:bg-gray-750 ${
            entry.rank <= 3 ? 'border-2 border-yellow-500/50' : ''
          }`}
        >
          {/* Rank and Avatar */}
          <div className="flex items-center gap-6 flex-1">
            {/* Rank */}
            <div className={`text-6xl font-black w-20 text-center ${getRankColor(entry.rank)}`}>
              {entry.rank <= 3 ? getMedal(entry.rank) : `#${entry.rank}`}
            </div>

            {/* Avatar */}
            {entry.avatarUrl ? (
              <img
                src={entry.avatarUrl}
                alt={entry.name}
                className="w-20 h-20 rounded-full"
              />
            ) : (
              <div className="w-20 h-20 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-3xl font-bold">
                {entry.name.charAt(0).toUpperCase()}
              </div>
            )}

            {/* Player Info */}
            <div className="flex-1">
              <h3 className="text-3xl font-bold text-white">{entry.name}</h3>
              {entry.email && (
                <p className="text-sm text-gray-500">{entry.email}</p>
              )}
            </div>
          </div>

          {/* Stats */}
          <div className="flex gap-8 items-center">
            {/* Rating */}
            <div className="text-center">
              <div className="text-5xl font-black text-blue-400">{entry.rating}</div>
              <div className="text-sm text-gray-400">ELO</div>
            </div>

            {/* Record */}
            <div className="text-center min-w-[120px]">
              <div className="text-2xl font-bold text-white">
                {entry.wins}W - {entry.losses}L
              </div>
              <div className="text-sm text-gray-400">
                {entry.winRate.toFixed(1)}% Win Rate
              </div>
            </div>

            {/* Total Matches */}
            <div className="text-center min-w-[100px]">
              <div className="text-2xl font-bold text-gray-300">{entry.totalMatches}</div>
              <div className="text-sm text-gray-400">Matches</div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
