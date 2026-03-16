import { useState, useEffect, useRef } from 'react';

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
  today: 'TODAY',
  week: 'THIS WEEK',
  month: 'THIS MONTH',
  ratings: 'RATINGS',
};

interface LeaderboardTableProps {
  onPlayerSelected?: (playerId: string) => void;
}

export default function LeaderboardTable({ onPlayerSelected }: LeaderboardTableProps) {
  const [type, setType] = useState<LeaderboardType>('ratings');
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [periodLabel, setPeriodLabel] = useState('');
  const [highlightedIndex, setHighlightedIndex] = useState(0);
  const rowRefs = useRef<(HTMLTableRowElement | null)[]>([]);

  const fetchLeaderboard = async () => {
    try {
      const response = await fetch(`/api/leaderboard/${type}`);
      if (!response.ok) throw new Error('Failed to fetch leaderboard');
      const data = await response.json();
      setLeaderboard(data.leaderboard);

      // Set period label (Week 12, March, etc.)
      if (type === 'week' && data.weekNumber) {
        setPeriodLabel(`Week ${data.weekNumber}`);
      } else if (type === 'month' && data.monthName) {
        setPeriodLabel(data.monthName);
      } else {
        setPeriodLabel('');
      }
    } catch (error) {
      console.error('Error fetching leaderboard:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeaderboard();
    const interval = setInterval(fetchLeaderboard, 30000); // Refresh every 30s
    return () => clearInterval(interval);
  }, [type]);

  // Scroll highlighted row into view
  useEffect(() => {
    if (rowRefs.current[highlightedIndex]) {
      rowRefs.current[highlightedIndex]?.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
      });
    }
  }, [highlightedIndex]);

  // Reset highlighted index when leaderboard changes
  useEffect(() => {
    setHighlightedIndex(0);
  }, [leaderboard]);

  // Keyboard controls
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }

      const playedPlayers = leaderboard.filter((p) => p.matchesPlayed > 0);

      if (e.key === '1') {
        e.preventDefault();
        setType((prev) => {
          const types: LeaderboardType[] = ['today', 'week', 'month', 'ratings'];
          const currentIndex = types.indexOf(prev);
          return types[(currentIndex + 1) % types.length];
        });
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        setHighlightedIndex((prev) => Math.min(prev + 1, playedPlayers.length - 1));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setHighlightedIndex((prev) => Math.max(prev - 1, 0));
      } else if (e.key === 'Enter') {
        e.preventDefault();
        if (playedPlayers[highlightedIndex]) {
          onPlayerSelected?.(playedPlayers[highlightedIndex].playerId);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [highlightedIndex, leaderboard, onPlayerSelected, type]);

  const getMedalIcon = (rank: number) => {
    if (rank === 1) return '🥇';
    if (rank === 2) return '🥈';
    if (rank === 3) return '🥉';
    return '';
  };

  // Split players into those who played and those who didn't
  const playedPlayers = leaderboard.filter((p) => p.matchesPlayed > 0);
  const notPlayedPlayers = leaderboard.filter((p) => p.matchesPlayed === 0);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-4xl text-cyan-400">Loading...</div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-gray-800 rounded-lg p-6">
      {/* Header */}
      <div className="mb-4">
        <div className="flex items-center gap-3 mb-2">
          <h2 className="text-3xl font-bold text-cyan-400">LEADERBOARD •</h2>
          <h2 className="text-3xl font-bold text-white">{LEADERBOARD_TITLES[type]}</h2>
          <button
            onClick={() => fetchLeaderboard()}
            className="ml-auto text-2xl text-gray-400 hover:text-cyan-400 transition-colors"
          >
            ↻
          </button>
        </div>
        <p className="text-lg text-gray-500">
          <kbd className="bg-gray-700 px-2 py-1 rounded text-cyan-400">1</kbd> cycle sorting •{' '}
          <kbd className="bg-gray-700 px-2 py-1 rounded text-cyan-400">↑↓</kbd> navigate •{' '}
          <kbd className="bg-gray-700 px-2 py-1 rounded text-cyan-400">Enter</kbd> view details
        </p>
      </div>

      {/* Table */}
      <div className="flex-1 overflow-auto">
        <table className="w-full">
          <thead className="sticky top-0 bg-gray-900 border-b-2 border-gray-700">
            <tr>
              <th className="text-left py-3 px-4 text-xl text-gray-400 font-semibold">#</th>
              <th className="text-left py-3 px-4 text-xl text-gray-400 font-semibold">Player</th>
              {type !== 'ratings' && (
                <th className="text-right py-3 px-4 text-xl text-gray-400 font-semibold">{periodLabel}</th>
              )}
              <th className="text-right py-3 px-4 text-xl text-gray-400 font-semibold">Rating</th>
            </tr>
          </thead>
          <tbody>
            {playedPlayers.map((entry, index) => {
              const rank = index + 1;
              const medal = getMedalIcon(rank);
              const isHighlighted = index === highlightedIndex;

              return (
                <tr
                  key={entry.playerId}
                  ref={(el) => {
                    rowRefs.current[index] = el;
                  }}
                  className={`border-b border-gray-700 transition-colors cursor-pointer ${
                    isHighlighted
                      ? 'bg-cyan-900/50 ring-2 ring-cyan-500'
                      : 'hover:bg-gray-750'
                  }`}
                  onClick={() => onPlayerSelected?.(entry.playerId)}
                >
                  <td className="py-3 px-4 text-2xl">
                    {rank} {medal}
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-3">
                      {entry.avatarUrl ? (
                        <img
                          src={entry.avatarUrl}
                          alt={entry.playerName}
                          className="w-12 h-12 rounded-full"
                        />
                      ) : (
                        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center text-white text-xl font-bold">
                          {entry.playerName.charAt(0).toUpperCase()}
                        </div>
                      )}
                      <span className={`text-2xl font-semibold ${rank <= 3 ? 'text-yellow-400' : 'text-cyan-400'}`}>
                        {entry.playerName}
                      </span>
                    </div>
                  </td>
                  {type !== 'ratings' && (
                    <td className="py-3 px-4 text-right">
                      <span
                        className={`text-2xl font-bold ${
                          entry.ratingChange > 0
                            ? 'text-green-400'
                            : entry.ratingChange < 0
                            ? 'text-red-400'
                            : 'text-gray-400'
                        }`}
                      >
                        {entry.ratingChange > 0 ? '+' : ''}
                        {entry.ratingChange}
                      </span>
                    </td>
                  )}
                  <td className="py-3 px-4 text-right text-2xl text-white font-semibold">
                    {entry.currentRating}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {/* Not played this period */}
        {notPlayedPlayers.length > 0 && type !== 'ratings' && (
          <div className="mt-6 px-4 py-3 bg-gray-900/50 rounded text-gray-500 text-lg">
            <span className="font-semibold">Not played {periodLabel}:</span>{' '}
            {notPlayedPlayers.map((p) => p.playerName).join(', ')}
          </div>
        )}
      </div>
    </div>
  );
}
