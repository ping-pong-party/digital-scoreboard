import { useState, useEffect, useCallback } from 'react';
import type { Match } from '../../server/shared/types';
import MatchStarterKeyboard from './MatchStarterKeyboard';
import ConfirmDialog from './ConfirmDialog';
import LeaderboardTable from './LeaderboardTable';
import MonthlyPodiums from './MonthlyPodiums';
import PlayerDetails from '../ratings/PlayerDetails';

type DialogType = 'cancel' | 'finish' | null;

export default function Scoreboard() {
  const [match, setMatch] = useState<Match | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showStarter, setShowStarter] = useState(false);
  const [showDialog, setShowDialog] = useState<DialogType>(null);
  const [selectedPlayerId, setSelectedPlayerId] = useState<string | null>(null);

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
  const handleFinishConfirm = async () => {
    setShowDialog(null);

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
      console.error('Failed to finish match:', err);
    }
  };

  // Cancel match
  const handleCancelConfirm = async () => {
    setShowDialog(null);

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
      console.error('Failed to cancel match:', err);
    }
  };

  // Keyboard controls
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if typing in input
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }

      // Don't interfere when player details is open
      if (selectedPlayerId) {
        return;
      }

      // ESC closes dialog if open
      if (e.key === 'Escape' && showDialog) {
        e.preventDefault();
        setShowDialog(null);
        return;
      }

      // Global navigation shortcuts (work anytime)
      if (e.key === 'p' || e.key === 'P') {
        e.preventDefault();
        window.location.href = '/players';
        return;
      } else if (e.key === 'r' || e.key === 'R') {
        e.preventDefault();
        window.location.href = '/ratings';
        return;
      } else if (e.key === 'm' || e.key === 'M') {
        e.preventDefault();
        window.location.href = '/matches';
        return;
      }

      // If no match or match is completed, N starts new match
      if ((!match || match.status === 'COMPLETED') && (e.key === 'n' || e.key === 'N')) {
        e.preventDefault();
        setShowStarter(true);
        return;
      }

      // Only allow scoring/cancel if match is in progress and no dialog is open
      if (!match || match.status !== 'IN_PROGRESS' || showDialog) return;

      if (e.key === 'ArrowLeft') {
        // Score for Player A
        e.preventDefault();
        updateScore(match.scoreA + 1, match.scoreB);
      } else if (e.key === 'ArrowRight') {
        // Score for Player B
        e.preventDefault();
        updateScore(match.scoreA, match.scoreB + 1);
      } else if (e.key === 'f' || e.key === 'F') {
        // Show finish dialog
        e.preventDefault();
        setShowDialog('finish');
      } else if (e.key === 'Escape') {
        // Show cancel dialog
        e.preventDefault();
        setShowDialog('cancel');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [match, showDialog, selectedPlayerId]);

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
    if (showStarter) {
      return (
        <MatchStarterKeyboard
          onMatchStarted={() => {
            setShowStarter(false);
            fetchMatch();
          }}
          onCancel={() => {
            setShowStarter(false);
          }}
        />
      );
    }

    // Show player details in full width if selected
    if (selectedPlayerId) {
      return (
        <div className="h-screen flex flex-col p-6 gap-6">
          <div className="flex-1 overflow-auto">
            <PlayerDetails
              playerId={selectedPlayerId}
              onClose={() => setSelectedPlayerId(null)}
            />
          </div>
        </div>
      );
    }

    // Show leaderboard + podiums when no match
    return (
      <div className="h-screen flex flex-col p-6 gap-6">
        <div className="flex-1 grid grid-cols-[2fr,1fr] gap-6 overflow-hidden">
          {/* Left: Leaderboard */}
          <LeaderboardTable onPlayerSelected={setSelectedPlayerId} />

          {/* Right: Monthly Podiums */}
          <div className="bg-gray-800 rounded-lg p-6 overflow-auto">
            <MonthlyPodiums />
          </div>
        </div>

        {/* Bottom: Keyboard shortcuts */}
        <div className="bg-gray-800 rounded-lg p-4">
          <div className="flex items-center justify-center gap-8 text-2xl text-gray-400">
            <div>
              <kbd className="bg-gray-700 px-3 py-2 rounded text-cyan-400 font-bold">N</kbd> New Match
            </div>
            <div className="text-gray-600">|</div>
            <div>
              <kbd className="bg-gray-700 px-3 py-2 rounded text-green-400 font-bold">P</kbd> Players
            </div>
            <div className="text-gray-600">|</div>
            <div>
              <kbd className="bg-gray-700 px-3 py-2 rounded text-yellow-400 font-bold">R</kbd> Ratings
            </div>
            <div className="text-gray-600">|</div>
            <div>
              <kbd className="bg-gray-700 px-3 py-2 rounded text-purple-400 font-bold">M</kbd> Matches
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Show match starter if requested
  if (showStarter) {
    return (
      <MatchStarterKeyboard
        onMatchStarted={() => {
          setShowStarter(false);
          fetchMatch();
        }}
        onCancel={() => {
          setShowStarter(false);
        }}
      />
    );
  }

  const hasWinner =
    (match.scoreA >= 11 && match.scoreA - match.scoreB >= 2) ||
    (match.scoreB >= 11 && match.scoreB - match.scoreA >= 2);

  const isCompleted = match.status === 'COMPLETED';

  return (
    <div className="space-y-8">
      {/* Match Completed Banner */}
      {isCompleted && (
        <div className="bg-green-900/50 border-2 border-green-500 rounded-lg p-6 text-center">
          <h2 className="text-4xl font-black text-green-400 mb-4">🏆 Match Completed!</h2>
          {match.playerA && match.playerB && (
            <div className="text-2xl text-white mb-4">
              <span className="text-blue-400">
                {match.playerA.name}: {match.playerA.ratingBefore} → {match.playerA.ratingAfter}
              </span>
              {' vs '}
              <span className="text-purple-400">
                {match.playerB.name}: {match.playerB.ratingBefore} → {match.playerB.ratingAfter}
              </span>
            </div>
          )}
          <button
            onClick={() => setShowStarter(true)}
            className="mt-4 px-8 py-4 bg-blue-500 hover:bg-blue-600 text-white text-2xl font-bold rounded-lg transition-colors shadow-lg"
          >
            Start New Match
          </button>
          <p className="text-xl text-gray-400 mt-4">
            Press <kbd className="bg-gray-700 px-3 py-2 rounded">N</kbd> to start new match
          </p>
        </div>
      )}

      {/* Scoreboard */}
      <div className={`bg-gray-800 rounded-3xl p-12 shadow-2xl ${isCompleted ? 'opacity-50' : ''}`}>
        <div className="grid grid-cols-3 gap-8 items-center">
          {/* Player A */}
          <div className="text-center">
            <div className="flex flex-col items-center gap-4 mb-4">
              {match.playerA?.avatarUrl && (
                <img
                  src={match.playerA.avatarUrl}
                  alt={match.playerA.name}
                  className="w-32 h-32 rounded-full border-4 border-blue-500"
                />
              )}
              <h2 className="text-5xl font-bold text-blue-400">
                {match.playerA?.name || 'Anonymous A'}
              </h2>
            </div>
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
                onClick={() => setShowDialog('finish')}
                className="mt-8 px-8 py-4 bg-green-500 hover:bg-green-600 text-white text-3xl font-bold rounded-lg transition-colors animate-pulse"
              >
                Finish Match
              </button>
            )}
          </div>

          {/* Player B */}
          <div className="text-center">
            <div className="flex flex-col items-center gap-4 mb-4">
              {match.playerB?.avatarUrl && (
                <img
                  src={match.playerB.avatarUrl}
                  alt={match.playerB.name}
                  className="w-32 h-32 rounded-full border-4 border-purple-500"
                />
              )}
              <h2 className="text-5xl font-bold text-purple-400">
                {match.playerB?.name || 'Anonymous B'}
              </h2>
            </div>
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
        {!isCompleted && (
          <>
            <p><kbd className="bg-gray-700 px-4 py-2 rounded">←</kbd> Point for Player A</p>
            <p><kbd className="bg-gray-700 px-4 py-2 rounded">→</kbd> Point for Player B</p>
            {hasWinner && <p><kbd className="bg-gray-700 px-4 py-2 rounded">F</kbd> Finish Match</p>}
            <p><kbd className="bg-gray-700 px-4 py-2 rounded">ESC</kbd> Cancel Match</p>
          </>
        )}
        {isCompleted && (
          <p><kbd className="bg-gray-700 px-4 py-2 rounded">N</kbd> Start New Match</p>
        )}
      </div>

      {/* Dialogs */}
      {showDialog === 'cancel' && (
        <ConfirmDialog
          title="⚠️ Cancel Match?"
          message="This will delete the match without saving. No ratings will be changed."
          confirmText="Yes, Cancel"
          cancelText="No, Go Back"
          variant="danger"
          onConfirm={handleCancelConfirm}
          onCancel={() => setShowDialog(null)}
        />
      )}

      {showDialog === 'finish' && (
        <ConfirmDialog
          title="🏆 Finish Match?"
          message="This will complete the match and update player ratings."
          confirmText="Finish Match"
          cancelText="Keep Playing"
          variant="success"
          onConfirm={handleFinishConfirm}
          onCancel={() => setShowDialog(null)}
        />
      )}
    </div>
  );
}
