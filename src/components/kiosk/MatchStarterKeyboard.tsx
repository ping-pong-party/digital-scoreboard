import { useState, useEffect, useRef } from 'react';
import type { PlayerDTO } from '../../server/features/players/players.types';

interface MatchStarterKeyboardProps {
  onMatchStarted: () => void;
}

export default function MatchStarterKeyboard({ onMatchStarted }: MatchStarterKeyboardProps) {
  const [players, setPlayers] = useState<PlayerDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [highlightedIndex, setHighlightedIndex] = useState(0);
  const [selectedPlayerA, setSelectedPlayerA] = useState<string | null>(null);
  const [selectedPlayerB, setSelectedPlayerB] = useState<string | null>(null);
  const [starting, setStarting] = useState(false);
  const playerRefs = useRef<(HTMLDivElement | null)[]>([]);

  // Fetch players
  useEffect(() => {
    const fetchPlayers = async () => {
      try {
        const response = await fetch('/api/players');
        if (!response.ok) throw new Error('Failed to fetch players');
        const data = await response.json();
        setPlayers(data);
      } catch (error) {
        console.error('Error fetching players:', error);
        alert('Failed to load players');
      } finally {
        setLoading(false);
      }
    };

    fetchPlayers();
  }, []);

  // Scroll highlighted player into view
  useEffect(() => {
    if (playerRefs.current[highlightedIndex]) {
      playerRefs.current[highlightedIndex]?.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
      });
    }
  }, [highlightedIndex]);

  // Start match
  const handleStartMatch = async () => {
    if (!selectedPlayerA && !selectedPlayerB) {
      // Anonymous match
      if (!confirm('Start anonymous match? (No rating changes)')) {
        return;
      }
    }

    if (selectedPlayerA && selectedPlayerB && selectedPlayerA === selectedPlayerB) {
      alert('Player A and Player B must be different');
      return;
    }

    try {
      setStarting(true);

      const body: any = {};
      if (selectedPlayerA) {
        body.playerA = { id: selectedPlayerA };
      }
      if (selectedPlayerB) {
        body.playerB = { id: selectedPlayerB };
      }

      const response = await fetch('/api/matches', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to create match');
      }

      onMatchStarted();
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Failed to start match');
    } finally {
      setStarting(false);
    }
  };

  // Keyboard controls
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if typing in input
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }

      const cols = 3; // Grid columns
      const totalPlayers = players.length;

      if (e.key === 'ArrowRight') {
        e.preventDefault();
        setHighlightedIndex((prev) => Math.min(prev + 1, totalPlayers - 1));
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        setHighlightedIndex((prev) => Math.max(prev - 1, 0));
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        setHighlightedIndex((prev) => Math.min(prev + cols, totalPlayers - 1));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setHighlightedIndex((prev) => Math.max(prev - cols, 0));
      } else if (e.key === 'Enter') {
        e.preventDefault();
        if (totalPlayers === 0) return;

        const playerId = players[highlightedIndex]?.id;
        if (!playerId) return;

        // Select player
        if (!selectedPlayerA) {
          // First selection = Player A
          setSelectedPlayerA(playerId);
        } else if (!selectedPlayerB) {
          // Second selection = Player B
          if (playerId !== selectedPlayerA) {
            setSelectedPlayerB(playerId);
          } else {
            alert('Player A and B must be different');
          }
        } else {
          // Both already selected, do nothing (press S to start)
          alert('Both players selected. Press S to start or ESC to reset.');
        }
      } else if (e.key === 'Escape') {
        e.preventDefault();
        // Deselect in reverse order
        if (selectedPlayerB) {
          setSelectedPlayerB(null);
        } else if (selectedPlayerA) {
          setSelectedPlayerA(null);
        }
      } else if (e.key === 's' || e.key === 'S') {
        e.preventDefault();
        handleStartMatch();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [highlightedIndex, players, selectedPlayerA, selectedPlayerB]);

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="text-4xl font-bold text-white">Loading players...</div>
      </div>
    );
  }

  const getPlayerById = (id: string | null) => {
    if (!id) return null;
    return players.find((p) => p.id === id);
  };

  const playerAData = getPlayerById(selectedPlayerA);
  const playerBData = getPlayerById(selectedPlayerB);

  return (
    <div className="space-y-8">
      {/* Header with selected players */}
      <div className="bg-gray-800 rounded-3xl p-8 shadow-2xl">
        <h2 className="text-5xl font-black text-center mb-8 text-white">
          Select Players with Arrow Keys
        </h2>

        <div className="grid grid-cols-2 gap-8 mb-8">
          {/* Player A */}
          <div className="text-center">
            <h3 className="text-3xl font-bold text-blue-400 mb-4">Player A</h3>
            {playerAData ? (
              <div className="bg-blue-900/50 border-4 border-blue-500 rounded-lg p-6">
                <div className="flex items-center justify-center gap-4 mb-2">
                  {playerAData.avatarUrl && (
                    <img
                      src={playerAData.avatarUrl}
                      alt={playerAData.name}
                      className="w-20 h-20 rounded-full"
                    />
                  )}
                  <div>
                    <div className="text-3xl font-bold text-white">{playerAData.name}</div>
                    <div className="text-xl text-gray-400">Rating: {playerAData.rating}</div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-gray-700 rounded-lg p-6 h-32 flex items-center justify-center">
                <span className="text-3xl text-gray-500">Press Enter to Select</span>
              </div>
            )}
          </div>

          {/* Player B */}
          <div className="text-center">
            <h3 className="text-3xl font-bold text-purple-400 mb-4">Player B</h3>
            {playerBData ? (
              <div className="bg-purple-900/50 border-4 border-purple-500 rounded-lg p-6">
                <div className="flex items-center justify-center gap-4 mb-2">
                  {playerBData.avatarUrl && (
                    <img
                      src={playerBData.avatarUrl}
                      alt={playerBData.name}
                      className="w-20 h-20 rounded-full"
                    />
                  )}
                  <div>
                    <div className="text-3xl font-bold text-white">{playerBData.name}</div>
                    <div className="text-xl text-gray-400">Rating: {playerBData.rating}</div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-gray-700 rounded-lg p-6 h-32 flex items-center justify-center">
                <span className="text-3xl text-gray-500">
                  {selectedPlayerA ? 'Press Enter to Select' : 'Select Player A first'}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Start button (visual only, use S key) */}
        {(selectedPlayerA || selectedPlayerB) && (
          <div className="text-center">
            <button
              onClick={handleStartMatch}
              disabled={starting}
              className="px-12 py-6 bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600 disabled:from-gray-600 disabled:to-gray-700 text-white text-4xl font-black rounded-lg shadow-lg transition-all"
            >
              {starting ? 'Starting...' : 'Press S to Start Match'}
            </button>
          </div>
        )}
      </div>

      {/* Players Grid */}
      <div className="grid grid-cols-3 gap-6">
        {players.map((player, index) => {
          const isHighlighted = index === highlightedIndex;
          const isPlayerA = player.id === selectedPlayerA;
          const isPlayerB = player.id === selectedPlayerB;

          return (
            <div
              key={player.id}
              ref={(el) => {
                playerRefs.current[index] = el;
              }}
              className={`
                p-6 rounded-lg transition-all cursor-pointer
                ${
                  isHighlighted
                    ? 'bg-yellow-500/30 border-4 border-yellow-400 scale-105 shadow-2xl'
                    : 'bg-gray-800 border-2 border-gray-700'
                }
                ${isPlayerA ? 'ring-4 ring-blue-500' : ''}
                ${isPlayerB ? 'ring-4 ring-purple-500' : ''}
              `}
            >
              <div className="flex items-center gap-4">
                {/* Avatar */}
                {player.avatarUrl ? (
                  <img
                    src={player.avatarUrl}
                    alt={player.name}
                    className="w-16 h-16 rounded-full"
                  />
                ) : (
                  <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-2xl font-bold">
                    {player.name.charAt(0).toUpperCase()}
                  </div>
                )}

                {/* Player info */}
                <div className="flex-1">
                  <div className="text-2xl font-bold text-white truncate">{player.name}</div>
                  <div className="text-lg text-gray-400">Rating: {player.rating}</div>
                </div>

                {/* Selection badge */}
                {isPlayerA && (
                  <div className="text-4xl">🅰️</div>
                )}
                {isPlayerB && (
                  <div className="text-4xl">🅱️</div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* No players warning */}
      {players.length === 0 && (
        <div className="bg-yellow-900/30 border-2 border-yellow-500/50 rounded-lg p-6 text-center">
          <p className="text-2xl text-yellow-400 mb-4">
            ⚠️ No players found. You can still start an anonymous match!
          </p>
          <p className="text-xl text-gray-400">
            Press <kbd className="bg-gray-700 px-4 py-2 rounded">S</kbd> to start anonymous match
          </p>
        </div>
      )}

      {/* Keyboard hints */}
      <div className="bg-blue-900/30 border-2 border-blue-500/50 rounded-lg p-6">
        <h3 className="text-2xl font-bold text-blue-400 mb-4">⌨️ Keyboard Controls</h3>
        <div className="grid grid-cols-2 gap-4 text-xl text-gray-300">
          <div><kbd className="bg-gray-700 px-3 py-2 rounded">↑ ↓ ← →</kbd> Navigate players</div>
          <div><kbd className="bg-gray-700 px-3 py-2 rounded">Enter</kbd> Select player</div>
          <div><kbd className="bg-gray-700 px-3 py-2 rounded">ESC</kbd> Deselect player</div>
          <div><kbd className="bg-gray-700 px-3 py-2 rounded">S</kbd> Start match</div>
        </div>
      </div>
    </div>
  );
}
