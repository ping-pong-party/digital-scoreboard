import { useState, useEffect, useCallback } from 'react';
import type { Match } from '../../server/shared/types';

export default function Scoreboard() {
  const [match, setMatch] = useState<Match | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch ongoing match
  const fetchMatch = useCallback(async () => {
    try {
      const response = await fetch('/api/matches/ongoing');
      if (!response.ok) throw new Error('Failed to fetch match');
      const data = await response.json();
      setMatch(data.match);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMatch();
    // Poll every 2 seconds for updates
    const interval = setInterval(fetchMatch, 2000);
    return () => clearInterval(interval);
  }, [fetchMatch]);

  // Update score
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
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to update score');
    }
  };

  // Finish match
  const finishMatch = async () => {
    if (!confirm('Finish this match?')) return;

    try {
      const response = await fetch('/api/matches/finish', {
        method: 'POST',
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to finish match');
      }

      await fetchMatch();
      alert('Match finished! Ratings updated.');
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to finish match');
    }
  };

  // Keyboard controls
  useEffect(() => {
    if (!match) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if typing in input
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }

      if (e.key === 'ArrowLeft') {
        // Score for Player A
        e.preventDefault();
        updateScore(match.scoreA + 1, match.scoreB);
      } else if (e.key === 'ArrowRight') {
        // Score for Player B
        e.preventDefault();
        updateScore(match.scoreA, match.scoreB + 1);
      } else if (e.key === 'f' || e.key === 'F') {
        // Finish match
        e.preventDefault();
        finishMatch();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [match]);

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="text-6xl font-bold text-white">Loading...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <div className="text-6xl font-bold text-red-500">Error: {error}</div>
      </div>
    );
  }

  if (!match) {
    return (
      <div className="text-center py-12">
        <div className="text-6xl font-bold text-white mb-8">No match in progress</div>
        <a
          href="/matches"
          className="inline-block px-8 py-4 bg-blue-500 hover:bg-blue-600 text-white text-2xl font-bold rounded-lg transition-colors"
        >
          Start a Match
        </a>
      </div>
    );
  }

  const hasWinner =
    (match.scoreA >= 11 && match.scoreA - match.scoreB >= 2) ||
    (match.scoreB >= 11 && match.scoreB - match.scoreA >= 2);

  return (
    <div className="space-y-8">
      {/* Scoreboard */}
      <div className="bg-gray-800 rounded-3xl p-12 shadow-2xl">
        <div className="grid grid-cols-3 gap-8 items-center">
          {/* Player A */}
          <div className="text-center">
            <h2 className="text-6xl font-bold mb-4 text-blue-400">
              {match.playerA ? 'Player A' : 'Anonymous A'}
            </h2>
            <div className="text-[12rem] font-black leading-none text-white">
              {match.scoreA}
            </div>
            {match.playerA && (
              <div className="text-3xl text-gray-400 mt-4">
                Rating: {match.playerA.ratingBefore}
              </div>
            )}
          </div>

          {/* VS */}
          <div className="text-center">
            <div className="text-8xl font-bold text-gray-500">VS</div>
            {hasWinner && (
              <button
                onClick={finishMatch}
                className="mt-8 px-8 py-4 bg-green-500 hover:bg-green-600 text-white text-3xl font-bold rounded-lg transition-colors animate-pulse"
              >
                Finish Match
              </button>
            )}
          </div>

          {/* Player B */}
          <div className="text-center">
            <h2 className="text-6xl font-bold mb-4 text-purple-400">
              {match.playerB ? 'Player B' : 'Anonymous B'}
            </h2>
            <div className="text-[12rem] font-black leading-none text-white">
              {match.scoreB}
            </div>
            {match.playerB && (
              <div className="text-3xl text-gray-400 mt-4">
                Rating: {match.playerB.ratingBefore}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="text-center text-gray-400 text-3xl space-y-2">
        <p><kbd className="bg-gray-700 px-4 py-2 rounded">←</kbd> Point for Player A</p>
        <p><kbd className="bg-gray-700 px-4 py-2 rounded">→</kbd> Point for Player B</p>
        <p><kbd className="bg-gray-700 px-4 py-2 rounded">F</kbd> Finish Match</p>
      </div>
    </div>
  );
}
