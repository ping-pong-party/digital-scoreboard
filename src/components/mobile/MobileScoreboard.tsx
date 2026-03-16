import { useState, useEffect } from 'react';
import type { Match } from '../../server/shared/types';

export default function MobileScoreboard() {
  const [match, setMatch] = useState<Match | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchMatch = async () => {
    try {
      const response = await fetch('/api/matches/ongoing');
      if (!response.ok) throw new Error('Failed to fetch match');
      const data = await response.json();
      setMatch(data.match);
    } catch (err) {
      console.error('Error fetching match:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMatch();
    const interval = setInterval(fetchMatch, 2000);
    return () => clearInterval(interval);
  }, []);

  const updateScore = async (scoreA: number, scoreB: number) => {
    try {
      const response = await fetch('/api/matches/score', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ scoreA, scoreB }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to update score');
      }

      await fetchMatch();

      // Haptic feedback on mobile
      if ('vibrate' in navigator) {
        navigator.vibrate(50);
      }
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to update score');
    }
  };

  const handleFinish = async () => {
    if (!confirm('Finish match and update ratings?')) return;

    try {
      const response = await fetch('/api/matches/finish', {
        method: 'POST',
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to finish match');
      }

      await fetchMatch();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to finish match');
    }
  };

  const handleCancel = async () => {
    if (!confirm('Cancel match without saving?')) return;

    try {
      const response = await fetch('/api/matches/cancel', {
        method: 'DELETE',
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to cancel match');
      }

      await fetchMatch();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to cancel match');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-2xl font-bold text-cyan-400">Loading...</div>
      </div>
    );
  }

  if (!match || match.status === 'COMPLETED') {
    return (
      <div className="min-h-screen bg-gray-900 p-4 flex flex-col items-center justify-center">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-cyan-400 mb-2">No Active Match</h1>
          <p className="text-gray-400">Start a new match from the main screen</p>
        </div>
        <a
          href="/"
          className="px-8 py-4 bg-cyan-500 hover:bg-cyan-600 text-white text-xl font-bold rounded-lg active:scale-95 transition-transform"
        >
          Go to Home
        </a>
      </div>
    );
  }

  const hasWinner =
    (match.scoreA >= 11 && match.scoreA - match.scoreB >= 2) ||
    (match.scoreB >= 11 && match.scoreB - match.scoreA >= 2);

  return (
    <div className="min-h-screen bg-gray-900 flex flex-col">
      {/* Header */}
      <div className="bg-gray-800 px-4 py-3 flex items-center justify-between border-b border-gray-700">
        <h1 className="text-xl font-bold text-cyan-400">Match in Progress</h1>
        <button
          onClick={handleCancel}
          className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-sm font-bold rounded active:scale-95 transition-transform"
        >
          Cancel
        </button>
      </div>

      {/* Scoreboard */}
      <div className="flex-1 flex flex-col">
        {/* Player A */}
        <div className="flex-1 flex flex-col items-center justify-center bg-gradient-to-br from-blue-900 to-blue-800 p-6 border-b-4 border-gray-900">
          <div className="text-center mb-4">
            {match.playerA?.avatarUrl && (
              <img
                src={match.playerA.avatarUrl}
                alt={match.playerA.name}
                className="w-20 h-20 rounded-full border-4 border-blue-400 mb-3 mx-auto"
              />
            )}
            <h2 className="text-2xl font-bold text-blue-300">
              {match.playerA?.name || 'Player A'}
            </h2>
            {match.playerA && (
              <p className="text-sm text-blue-400 mt-1">Rating: {match.playerA.ratingBefore}</p>
            )}
          </div>

          <div className="text-8xl font-black text-white mb-6">{match.scoreA}</div>

          <button
            onClick={() => updateScore(match.scoreA + 1, match.scoreB)}
            className="w-full max-w-xs py-6 bg-blue-500 hover:bg-blue-600 text-white text-2xl font-bold rounded-xl active:scale-95 transition-transform shadow-lg"
          >
            + Point
          </button>
        </div>

        {/* VS Divider */}
        <div className="bg-gray-900 py-3 flex items-center justify-center">
          <span className="text-3xl font-bold text-gray-500">VS</span>
        </div>

        {/* Player B */}
        <div className="flex-1 flex flex-col items-center justify-center bg-gradient-to-br from-purple-900 to-purple-800 p-6 border-t-4 border-gray-900">
          <button
            onClick={() => updateScore(match.scoreA, match.scoreB + 1)}
            className="w-full max-w-xs py-6 bg-purple-500 hover:bg-purple-600 text-white text-2xl font-bold rounded-xl active:scale-95 transition-transform shadow-lg mb-6"
          >
            + Point
          </button>

          <div className="text-8xl font-black text-white mb-6">{match.scoreB}</div>

          <div className="text-center">
            {match.playerB?.avatarUrl && (
              <img
                src={match.playerB.avatarUrl}
                alt={match.playerB.name}
                className="w-20 h-20 rounded-full border-4 border-purple-400 mb-3 mx-auto"
              />
            )}
            <h2 className="text-2xl font-bold text-purple-300">
              {match.playerB?.name || 'Player B'}
            </h2>
            {match.playerB && (
              <p className="text-sm text-purple-400 mt-1">Rating: {match.playerB.ratingBefore}</p>
            )}
          </div>
        </div>
      </div>

      {/* Finish Button */}
      {hasWinner && (
        <div className="bg-gray-800 p-4 border-t border-gray-700">
          <button
            onClick={handleFinish}
            className="w-full py-4 bg-green-500 hover:bg-green-600 text-white text-xl font-bold rounded-lg active:scale-95 transition-transform animate-pulse"
          >
            Finish Match
          </button>
        </div>
      )}
    </div>
  );
}
