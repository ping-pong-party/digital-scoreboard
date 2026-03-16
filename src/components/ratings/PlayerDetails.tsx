import { useState, useEffect, useRef } from 'react';

type ViewMode = 'overview' | 'opponents' | 'history';

interface PlayerDetailsProps {
  playerId: string;
  onClose: () => void;
}

interface OpponentStats {
  playerId: string;
  playerName: string;
  avatarUrl?: string;
  rank: number;
  gamesPlayed: number;
  percentOfGames: number;
  wins: number;
  losses: number;
  winRate: number;
  netScore: number;
  avgPtsPerMatch: number;
  nextImpact: number;
}

interface RecentMatch {
  date: number;
  opponentName: string;
  scoreA: number;
  scoreB: number;
  ratingChange: number;
  won: boolean;
}

interface PlayerDetailsData {
  playerId: string;
  playerName: string;
  avatarUrl?: string;
  rank: number;
  currentRating: number;
  totalMatches: number;
  totalOpponents: number;
  wins: number;
  losses: number;
  winRate: number;
  achievements: {
    champion: boolean;
    experience: boolean;
    activity: boolean;
    upset: boolean;
    consistency: boolean;
  };
  opponents: OpponentStats[];
  recentMatches: RecentMatch[];
}

export default function PlayerDetails({ playerId, onClose }: PlayerDetailsProps) {
  const [data, setData] = useState<PlayerDetailsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<ViewMode>('overview');
  const [highlightedOpponentIndex, setHighlightedOpponentIndex] = useState(0);
  const [selectedOpponentId, setSelectedOpponentId] = useState<string | null>(null);
  const opponentRefs = useRef<(HTMLTableRowElement | null)[]>([]);

  useEffect(() => {
    const fetchDetails = async () => {
      try {
        const response = await fetch(`/api/players/${playerId}/details`);
        if (!response.ok) throw new Error('Failed to fetch player details');
        const details = await response.json();
        setData(details);
      } catch (error) {
        console.error('Error fetching player details:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchDetails();
  }, [playerId]);

  // Scroll highlighted opponent into view
  useEffect(() => {
    if (viewMode === 'opponents' && opponentRefs.current[highlightedOpponentIndex]) {
      opponentRefs.current[highlightedOpponentIndex]?.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
      });
    }
  }, [highlightedOpponentIndex, viewMode]);

  // Keyboard controls
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }

      // ESC to close or go back
      if (e.key === 'Escape') {
        e.preventDefault();
        if (selectedOpponentId) {
          setSelectedOpponentId(null);
        } else {
          onClose();
        }
        return;
      }

      // Don't allow view switching when opponent matches are shown
      if (selectedOpponentId) return;

      // 1 to cycle views
      if (e.key === '1') {
        e.preventDefault();
        setViewMode((prev) => {
          const modes: ViewMode[] = ['overview', 'opponents', 'history'];
          const currentIndex = modes.indexOf(prev);
          return modes[(currentIndex + 1) % modes.length];
        });
        setHighlightedOpponentIndex(0);
      }

      // Navigation in opponents view
      if (viewMode === 'opponents' && data?.opponents) {
        if (e.key === 'ArrowDown') {
          e.preventDefault();
          setHighlightedOpponentIndex((prev) => Math.min(prev + 1, data.opponents.length - 1));
        } else if (e.key === 'ArrowUp') {
          e.preventDefault();
          setHighlightedOpponentIndex((prev) => Math.max(prev - 1, 0));
        } else if (e.key === 'Enter') {
          e.preventDefault();
          if (data.opponents[highlightedOpponentIndex]) {
            setSelectedOpponentId(data.opponents[highlightedOpponentIndex].playerId);
          }
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose, viewMode, highlightedOpponentIndex, data, selectedOpponentId]);

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="text-4xl font-bold text-white">Loading player details...</div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="text-center py-12">
        <div className="text-4xl font-bold text-red-500">Player not found</div>
        <button
          onClick={onClose}
          className="mt-6 px-6 py-3 bg-gray-700 hover:bg-gray-600 text-white rounded-lg"
        >
          Back to Leaderboard
        </button>
      </div>
    );
  }

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  // Get matches against selected opponent
  const getMatchesVsOpponent = () => {
    if (!selectedOpponentId || !data) return [];

    const opponentName = data.opponents.find(o => o.playerId === selectedOpponentId)?.playerName || 'Unknown';

    return data.recentMatches.filter(m => m.opponentName === opponentName);
  };

  const VIEW_TITLES = {
    overview: 'OVERVIEW',
    opponents: 'OPPONENTS',
    history: 'MATCH HISTORY',
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gray-900 px-6 py-4 rounded-lg">
        <div className="flex items-center justify-between mb-2">
          <h1 className="text-3xl font-bold text-yellow-400">
            {selectedOpponentId ? 'HEAD TO HEAD' : 'PLAYER DETAILS'}
          </h1>
          <div className="text-2xl text-cyan-400">
            {!selectedOpponentId && VIEW_TITLES[viewMode]}
          </div>
        </div>
        <div className="text-lg text-gray-400">
          <kbd className="bg-gray-700 px-2 py-1 rounded">ESC</kbd> {selectedOpponentId ? 'back' : 'close'} •{' '}
          {!selectedOpponentId && (
            <>
              <kbd className="bg-gray-700 px-2 py-1 rounded">1</kbd> cycle view •{' '}
            </>
          )}
          {viewMode === 'opponents' && !selectedOpponentId && (
            <>
              <kbd className="bg-gray-700 px-2 py-1 rounded">↑↓</kbd> navigate •{' '}
              <kbd className="bg-gray-700 px-2 py-1 rounded">Enter</kbd> view matches
            </>
          )}
        </div>
      </div>

      {/* Player Info - Always visible */}
      <div className="bg-gradient-to-r from-gray-800 to-gray-700 rounded-lg p-4 flex items-center gap-4">
        {data.avatarUrl ? (
          <img
            src={data.avatarUrl}
            alt={data.playerName}
            className="w-20 h-20 rounded-full border-4 border-cyan-500"
          />
        ) : (
          <div className="w-20 h-20 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-3xl font-bold border-4 border-cyan-500">
            {data.playerName.charAt(0).toUpperCase()}
          </div>
        )}

        <div className="flex-1">
          <div className="flex items-center gap-3">
            <span className="text-4xl font-black text-cyan-400">#{data.rank}</span>
            <span className="text-3xl font-bold text-white">{data.playerName}</span>
          </div>
          <div className="text-lg text-gray-400">
            {data.totalMatches} matches • {data.totalOpponents} opponents • Rating: {data.currentRating}
          </div>
        </div>
      </div>

      {/* Show matches vs selected opponent */}
      {selectedOpponentId && (() => {
        const matchesVsOpponent = getMatchesVsOpponent();
        const opponent = data.opponents.find(o => o.playerId === selectedOpponentId);

        return (
          <div className="bg-gray-800 rounded-lg p-6">
            <h2 className="text-3xl font-bold text-cyan-400 mb-4">
              vs {opponent?.playerName || 'Unknown'}
            </h2>
            <div className="mb-4 grid grid-cols-3 gap-4 text-center">
              <div className="bg-gray-900 rounded-lg p-4">
                <div className="text-3xl font-bold text-green-400">{opponent?.wins || 0}</div>
                <div className="text-gray-400">Wins</div>
              </div>
              <div className="bg-gray-900 rounded-lg p-4">
                <div className="text-3xl font-bold text-red-400">{opponent?.losses || 0}</div>
                <div className="text-gray-400">Losses</div>
              </div>
              <div className="bg-gray-900 rounded-lg p-4">
                <div className="text-3xl font-bold text-cyan-400">{opponent?.winRate.toFixed(0)}%</div>
                <div className="text-gray-400">Win Rate</div>
              </div>
            </div>

            <div className="space-y-2">
              <h3 className="text-xl font-bold text-gray-400 mb-3">Recent Matches</h3>
              {matchesVsOpponent.length > 0 ? (
                matchesVsOpponent.map((match, idx) => (
                  <div
                    key={idx}
                    className={`flex items-center justify-between p-3 rounded ${
                      match.won ? 'bg-green-900/30' : 'bg-red-900/30'
                    }`}
                  >
                    <div className="text-gray-400">{formatDate(match.date)}</div>
                    <div className="text-white font-semibold">
                      {match.scoreA}-{match.scoreB}
                    </div>
                    <div className={`font-bold ${
                      match.ratingChange > 0 ? 'text-green-400' : 'text-red-400'
                    }`}>
                      {match.ratingChange > 0 ? '+' : ''}{match.ratingChange}
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center text-gray-500 py-8">No recent matches found</div>
              )}
            </div>
          </div>
        );
      })()}

      {/* Overview View */}
      {!selectedOpponentId && viewMode === 'overview' && (
        <>
          {/* Achievements/Belts */}
          <div className="grid grid-cols-5 gap-3">
            <div className={`rounded-lg p-3 ${data.achievements.champion ? 'bg-gradient-to-br from-yellow-600 to-yellow-700' : 'bg-gray-800'}`}>
              <div className="text-2xl mb-1">👑</div>
              <div className={`font-bold ${data.achievements.champion ? 'text-yellow-200' : 'text-gray-500'}`}>Champion</div>
            </div>
            <div className={`rounded-lg p-3 ${data.achievements.experience ? 'bg-gradient-to-br from-purple-600 to-purple-700' : 'bg-gray-800'}`}>
              <div className="text-2xl mb-1">⭐</div>
              <div className={`font-bold ${data.achievements.experience ? 'text-purple-200' : 'text-gray-500'}`}>Experience</div>
            </div>
            <div className={`rounded-lg p-3 ${data.achievements.activity ? 'bg-gradient-to-br from-blue-600 to-blue-700' : 'bg-gray-800'}`}>
              <div className="text-2xl mb-1">🔴</div>
              <div className={`font-bold ${data.achievements.activity ? 'text-blue-200' : 'text-gray-500'}`}>Activity</div>
            </div>
            <div className={`rounded-lg p-3 ${data.achievements.upset ? 'bg-gradient-to-br from-red-600 to-red-700' : 'bg-gray-800'}`}>
              <div className="text-2xl mb-1">❌</div>
              <div className={`font-bold ${data.achievements.upset ? 'text-red-200' : 'text-gray-500'}`}>Upset</div>
            </div>
            <div className={`rounded-lg p-3 ${data.achievements.consistency ? 'bg-gradient-to-br from-green-600 to-green-700' : 'bg-gray-800'}`}>
              <div className="text-2xl mb-1">🎯</div>
              <div className={`font-bold ${data.achievements.consistency ? 'text-green-200' : 'text-gray-500'}`}>Consistency</div>
            </div>
          </div>

          {/* Current Rating */}
          <div className="bg-gray-800 rounded-lg p-8 text-center">
            <div className="text-8xl font-black text-cyan-400 mb-2">{data.currentRating}</div>
            <div className="text-2xl text-gray-400 mb-2">Current Rating</div>
            <div className="grid grid-cols-2 gap-4 mt-6">
              <div>
                <div className="text-4xl font-bold text-green-400">{data.wins}</div>
                <div className="text-gray-400">Wins</div>
              </div>
              <div>
                <div className="text-4xl font-bold text-red-400">{data.losses}</div>
                <div className="text-gray-400">Losses</div>
              </div>
            </div>
            <div className="text-4xl font-bold text-cyan-400 mt-4">Win Rate: {data.winRate.toFixed(1)}%</div>
          </div>
        </>
      )}

      {/* Opponents View */}
      {!selectedOpponentId && viewMode === 'opponents' && (
        <div className="bg-gray-800 rounded-lg p-6">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="sticky top-0 bg-gray-900 border-b-2 border-gray-700">
                <tr>
                  <th className="text-left py-3 px-4 text-gray-400">Name</th>
                  <th className="text-center py-3 px-4 text-gray-400">Rank</th>
                  <th className="text-center py-3 px-4 text-gray-400">Games</th>
                  <th className="text-center py-3 px-4 text-gray-400">Win Rate</th>
                  <th className="text-center py-3 px-4 text-gray-400">Net Score</th>
                  <th className="text-center py-3 px-4 text-gray-400">Avg Pts</th>
                  <th className="text-center py-3 px-4 text-gray-400">Impact</th>
                </tr>
              </thead>
              <tbody>
                {data.opponents.map((opp, index) => {
                  const isHighlighted = index === highlightedOpponentIndex;

                  return (
                  <tr
                    key={opp.playerId}
                    ref={(el) => {
                      opponentRefs.current[index] = el;
                    }}
                    className={`border-b border-gray-700/50 cursor-pointer transition-colors ${
                      isHighlighted ? 'bg-cyan-900/50 ring-2 ring-cyan-500' : 'hover:bg-gray-750'
                    }`}
                    onClick={() => setSelectedOpponentId(opp.playerId)}
                  >
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        {opp.avatarUrl ? (
                          <img src={opp.avatarUrl} alt={opp.playerName} className="w-10 h-10 rounded-full" />
                        ) : (
                          <div className="w-10 h-10 rounded-full bg-gray-700 flex items-center justify-center text-sm font-bold">
                            {opp.playerName.charAt(0).toUpperCase()}
                          </div>
                        )}
                        <span className="text-cyan-400 font-semibold">{opp.playerName}</span>
                      </div>
                    </td>
                    <td className="text-center py-3 px-4 text-white">#{opp.rank}</td>
                    <td className="text-center py-3 px-4 text-white">{opp.gamesPlayed}</td>
                    <td className="py-3 px-4">
                      <div className="relative h-6 bg-gray-700 rounded overflow-hidden">
                        <div className={`absolute inset-y-0 left-0 ${opp.winRate >= 50 ? 'bg-green-500' : 'bg-red-500'}`} style={{ width: `${opp.winRate}%` }} />
                        <div className="absolute inset-0 flex items-center justify-center text-xs font-bold text-white">
                          {opp.winRate.toFixed(0)}%
                        </div>
                      </div>
                    </td>
                    <td className={`text-center py-3 px-4 font-bold ${opp.netScore > 0 ? 'text-green-400' : opp.netScore < 0 ? 'text-red-400' : 'text-gray-400'}`}>
                      {opp.netScore > 0 ? '+' : ''}{opp.netScore}
                    </td>
                    <td className="text-center py-3 px-4 text-gray-400">{opp.avgPtsPerMatch.toFixed(1)}</td>
                    <td className={`text-center py-3 px-4 ${opp.nextImpact > 0 ? 'text-green-400' : 'text-red-400'}`}>
                      {opp.nextImpact > 0 ? '+' : ''}{opp.nextImpact}
                    </td>
                  </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* History View */}
      {!selectedOpponentId && viewMode === 'history' && (
        <div className="bg-gray-800 rounded-lg p-6">
          <h2 className="text-3xl font-bold text-cyan-400 mb-4">Latest Matches</h2>
          <div className="space-y-2">
            {data.recentMatches.map((match, idx) => (
              <div
                key={idx}
                className={`flex items-center justify-between p-3 rounded ${match.won ? 'bg-green-900/30' : 'bg-red-900/30'}`}
              >
                <div className="text-gray-400 w-24">{formatDate(match.date)}</div>
                <div className="text-white font-semibold flex-1">vs {match.opponentName}</div>
                <div className="text-white text-xl font-bold w-20 text-center">{match.scoreA}-{match.scoreB}</div>
                <div className={`font-bold w-16 text-right ${match.ratingChange > 0 ? 'text-green-400' : 'text-red-400'}`}>
                  {match.ratingChange > 0 ? '+' : ''}{match.ratingChange}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
