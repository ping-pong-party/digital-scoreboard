import { useState, useEffect } from 'react';
import type { Match } from '../../server/shared/types';

interface Player {
  id: string;
  name: string;
  email?: string;
  rating: number;
  avatarUrl?: string;
}

interface MatchWithPlayers extends Match {
  playerAData?: Player;
  playerBData?: Player;
}

export default function MatchHistory() {
  const [matches, setMatches] = useState<MatchWithPlayers[]>([]);
  const [players, setPlayers] = useState<Player[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'completed' | 'in_progress'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Fetch matches and players
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);

        const [matchesRes, playersRes] = await Promise.all([
          fetch('/api/matches'),
          fetch('/api/players'),
        ]);

        if (!matchesRes.ok || !playersRes.ok) {
          throw new Error('Failed to fetch data');
        }

        const matchesData = await matchesRes.json();
        const playersData = await playersRes.json();

        setPlayers(playersData);

        // Enrich matches with player data
        const enrichedMatches: MatchWithPlayers[] = matchesData.matches.map((match: Match) => {
          const playerAData = match.playerA
            ? playersData.find((p: Player) => p.id === match.playerA!.id)
            : undefined;
          const playerBData = match.playerB
            ? playersData.find((p: Player) => p.id === match.playerB!.id)
            : undefined;

          return {
            ...match,
            playerAData,
            playerBData,
          };
        });

        setMatches(enrichedMatches);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Filter and search
  const filteredMatches = matches.filter((match) => {
    // Status filter
    if (filter === 'completed' && match.status !== 'COMPLETED') return false;
    if (filter === 'in_progress' && match.status !== 'IN_PROGRESS') return false;

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      const playerAName = match.playerAData?.name.toLowerCase() || 'anonymous';
      const playerBName = match.playerBData?.name.toLowerCase() || 'anonymous';
      return playerAName.includes(query) || playerBName.includes(query);
    }

    return true;
  });

  // Format date
  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return 'Today ' + date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    } else if (date.toDateString() === yesterday.toDateString()) {
      return 'Yesterday ' + date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    } else {
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    }
  };

  // Get winner
  const getWinner = (match: Match): 'A' | 'B' | null => {
    if (match.scoreA >= 11 && match.scoreA - match.scoreB >= 2) return 'A';
    if (match.scoreB >= 11 && match.scoreB - match.scoreA >= 2) return 'B';
    return null;
  };

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="text-4xl font-bold text-gray-400">Loading matches...</div>
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

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="bg-gray-800 rounded-lg p-6">
        <div className="grid md:grid-cols-2 gap-4">
          {/* Status Filter */}
          <div>
            <label className="block text-white font-bold mb-2">Filter by Status</label>
            <div className="flex gap-2">
              <button
                onClick={() => setFilter('all')}
                className={`px-4 py-2 rounded-lg font-bold transition-colors ${
                  filter === 'all'
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-700 text-gray-400 hover:bg-gray-600'
                }`}
              >
                All ({matches.length})
              </button>
              <button
                onClick={() => setFilter('completed')}
                className={`px-4 py-2 rounded-lg font-bold transition-colors ${
                  filter === 'completed'
                    ? 'bg-green-500 text-white'
                    : 'bg-gray-700 text-gray-400 hover:bg-gray-600'
                }`}
              >
                Completed ({matches.filter((m) => m.status === 'COMPLETED').length})
              </button>
              <button
                onClick={() => setFilter('in_progress')}
                className={`px-4 py-2 rounded-lg font-bold transition-colors ${
                  filter === 'in_progress'
                    ? 'bg-yellow-500 text-white'
                    : 'bg-gray-700 text-gray-400 hover:bg-gray-600'
                }`}
              >
                In Progress ({matches.filter((m) => m.status === 'IN_PROGRESS').length})
              </button>
            </div>
          </div>

          {/* Search */}
          <div>
            <label className="block text-white font-bold mb-2">Search by Player</label>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search player name..."
              className="w-full px-4 py-2 rounded-lg bg-gray-700 text-white border-2 border-gray-600 focus:border-blue-500 outline-none"
            />
          </div>
        </div>
      </div>

      {/* Results Count */}
      <div className="text-gray-400 text-xl">
        Showing {filteredMatches.length} of {matches.length} matches
      </div>

      {/* Matches List */}
      {filteredMatches.length === 0 ? (
        <div className="text-center py-12 bg-gray-800 rounded-lg">
          <p className="text-2xl text-gray-400">No matches found</p>
          <a
            href="/kiosk"
            className="inline-block mt-6 px-6 py-3 bg-blue-500 hover:bg-blue-600 text-white font-bold rounded-lg transition-colors"
          >
            Start a Match
          </a>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredMatches.map((match) => {
            const winner = getWinner(match);
            const isCompleted = match.status === 'COMPLETED';

            return (
              <div
                key={match.id}
                className={`bg-gray-800 rounded-lg p-6 ${
                  !isCompleted ? 'border-2 border-yellow-500/50' : ''
                }`}
              >
                {/* Match Header */}
                <div className="flex justify-between items-center mb-4">
                  <div className="text-gray-400 text-lg">
                    {formatDate(match.completedAt || match.startedAt)}
                  </div>
                  <div className="flex gap-2 items-center">
                    {!isCompleted && (
                      <span className="px-3 py-1 bg-yellow-500/20 text-yellow-500 rounded-full text-sm font-bold">
                        In Progress
                      </span>
                    )}
                    {!match.rated && isCompleted && (
                      <span className="px-3 py-1 bg-gray-600 text-gray-400 rounded-full text-sm font-bold">
                        Unrated
                      </span>
                    )}
                  </div>
                </div>

                {/* Match Score */}
                <div className="grid grid-cols-3 gap-4 items-center">
                  {/* Player A */}
                  <div className={`text-right ${winner === 'A' ? 'opacity-100' : 'opacity-60'}`}>
                    <div className="flex items-center justify-end gap-3 mb-2">
                      {match.playerAData?.avatarUrl && (
                        <img
                          src={match.playerAData.avatarUrl}
                          alt={match.playerAData.name}
                          className="w-12 h-12 rounded-full"
                        />
                      )}
                      <div>
                        <div className="text-2xl font-bold text-white">
                          {match.playerAData?.name || 'Anonymous A'}
                        </div>
                        {match.playerA && (
                          <div className="text-sm text-gray-400">
                            {match.playerA.ratingBefore}
                            {match.playerA.ratingAfter !== undefined && (
                              <span
                                className={
                                  match.playerA.ratingAfter > match.playerA.ratingBefore
                                    ? 'text-green-400'
                                    : 'text-red-400'
                                }
                              >
                                {' '}
                                → {match.playerA.ratingAfter} (
                                {match.playerA.ratingAfter > match.playerA.ratingBefore ? '+' : ''}
                                {match.playerA.ratingAfter - match.playerA.ratingBefore})
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Score */}
                  <div className="text-center">
                    <div className="text-6xl font-black text-white">
                      {match.scoreA} - {match.scoreB}
                    </div>
                    {winner && isCompleted && (
                      <div className="text-yellow-400 font-bold mt-2">
                        {winner === 'A'
                          ? match.playerAData?.name || 'Player A'
                          : match.playerBData?.name || 'Player B'}{' '}
                        wins!
                      </div>
                    )}
                  </div>

                  {/* Player B */}
                  <div className={`text-left ${winner === 'B' ? 'opacity-100' : 'opacity-60'}`}>
                    <div className="flex items-center gap-3 mb-2">
                      <div>
                        <div className="text-2xl font-bold text-white">
                          {match.playerBData?.name || 'Anonymous B'}
                        </div>
                        {match.playerB && (
                          <div className="text-sm text-gray-400">
                            {match.playerB.ratingBefore}
                            {match.playerB.ratingAfter !== undefined && (
                              <span
                                className={
                                  match.playerB.ratingAfter > match.playerB.ratingBefore
                                    ? 'text-green-400'
                                    : 'text-red-400'
                                }
                              >
                                {' '}
                                → {match.playerB.ratingAfter} (
                                {match.playerB.ratingAfter > match.playerB.ratingBefore ? '+' : ''}
                                {match.playerB.ratingAfter - match.playerB.ratingBefore})
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                      {match.playerBData?.avatarUrl && (
                        <img
                          src={match.playerBData.avatarUrl}
                          alt={match.playerBData.name}
                          className="w-12 h-12 rounded-full"
                        />
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
