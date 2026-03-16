import { useState, useEffect } from 'react';
import type { PlayerDTO } from '../../server/features/players/players.types';

interface MatchStarterProps {
  onMatchStarted: () => void;
}

export default function MatchStarter({ onMatchStarted }: MatchStarterProps) {
  const [players, setPlayers] = useState<PlayerDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPlayerA, setSelectedPlayerA] = useState<string | null>(null);
  const [selectedPlayerB, setSelectedPlayerB] = useState<string | null>(null);
  const [starting, setStarting] = useState(false);

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

  // Start match
  const handleStartMatch = async () => {
    if (!selectedPlayerA && !selectedPlayerB) {
      alert('Select at least one player or start an anonymous match');
      return;
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

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if typing in input
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }

      if (e.key === 's' || e.key === 'S') {
        e.preventDefault();
        handleStartMatch();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedPlayerA, selectedPlayerB]);

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="text-4xl font-bold text-white">Loading players...</div>
      </div>
    );
  }

  const getPlayerById = (id: string) => players.find((p) => p.id === id);
  const playerAData = selectedPlayerA ? getPlayerById(selectedPlayerA) : null;
  const playerBData = selectedPlayerB ? getPlayerById(selectedPlayerB) : null;

  return (
    <div className="space-y-8">
      <div className="bg-gray-800 rounded-3xl p-12 shadow-2xl">
        <h2 className="text-5xl font-black text-center mb-12 text-white">
          Start New Match
        </h2>

        <div className="grid md:grid-cols-2 gap-8 mb-12">
          {/* Player A Selection */}
          <div>
            <h3 className="text-3xl font-bold text-blue-400 mb-6">Player A</h3>

            {/* Selected Player Display */}
            <div className="bg-gray-700 rounded-lg p-6 mb-4 min-h-[120px] flex items-center justify-center">
              {playerAData ? (
                <div className="flex items-center gap-4">
                  {playerAData.avatarUrl ? (
                    <img
                      src={playerAData.avatarUrl}
                      alt={playerAData.name}
                      className="w-16 h-16 rounded-full"
                    />
                  ) : (
                    <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-2xl font-bold">
                      {playerAData.name.charAt(0).toUpperCase()}
                    </div>
                  )}
                  <div>
                    <div className="text-2xl font-bold text-white">{playerAData.name}</div>
                    <div className="text-lg text-gray-400">Rating: {playerAData.rating}</div>
                  </div>
                </div>
              ) : (
                <div className="text-2xl text-gray-500">Anonymous</div>
              )}
            </div>

            {/* Player Selection Dropdown */}
            <select
              value={selectedPlayerA || ''}
              onChange={(e) => setSelectedPlayerA(e.target.value || null)}
              className="w-full px-4 py-3 bg-gray-700 text-white rounded-lg text-xl border-2 border-gray-600 focus:border-blue-500 outline-none"
            >
              <option value="">Anonymous</option>
              {players.map((player) => (
                <option key={player.id} value={player.id}>
                  {player.name} ({player.rating})
                </option>
              ))}
            </select>
          </div>

          {/* Player B Selection */}
          <div>
            <h3 className="text-3xl font-bold text-purple-400 mb-6">Player B</h3>

            {/* Selected Player Display */}
            <div className="bg-gray-700 rounded-lg p-6 mb-4 min-h-[120px] flex items-center justify-center">
              {playerBData ? (
                <div className="flex items-center gap-4">
                  {playerBData.avatarUrl ? (
                    <img
                      src={playerBData.avatarUrl}
                      alt={playerBData.name}
                      className="w-16 h-16 rounded-full"
                    />
                  ) : (
                    <div className="w-16 h-16 rounded-full bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center text-white text-2xl font-bold">
                      {playerBData.name.charAt(0).toUpperCase()}
                    </div>
                  )}
                  <div>
                    <div className="text-2xl font-bold text-white">{playerBData.name}</div>
                    <div className="text-lg text-gray-400">Rating: {playerBData.rating}</div>
                  </div>
                </div>
              ) : (
                <div className="text-2xl text-gray-500">Anonymous</div>
              )}
            </div>

            {/* Player Selection Dropdown */}
            <select
              value={selectedPlayerB || ''}
              onChange={(e) => setSelectedPlayerB(e.target.value || null)}
              className="w-full px-4 py-3 bg-gray-700 text-white rounded-lg text-xl border-2 border-gray-600 focus:border-purple-500 outline-none"
            >
              <option value="">Anonymous</option>
              {players.map((player) => (
                <option key={player.id} value={player.id}>
                  {player.name} ({player.rating})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Start Button */}
        <div className="text-center">
          <button
            onClick={handleStartMatch}
            disabled={starting}
            className="px-12 py-6 bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600 disabled:from-gray-600 disabled:to-gray-700 text-white text-4xl font-black rounded-lg shadow-lg transition-all transform hover:scale-105 disabled:scale-100"
          >
            {starting ? 'Starting...' : 'Start Match'}
          </button>
        </div>

        {/* Keyboard Hint */}
        <div className="text-center mt-8">
          <p className="text-2xl text-gray-400">
            Press <kbd className="bg-gray-700 px-4 py-2 rounded">S</kbd> to start
          </p>
        </div>
      </div>

      {/* Quick Info */}
      <div className="bg-blue-900/30 border-2 border-blue-500/50 rounded-lg p-6">
        <h3 className="text-2xl font-bold text-blue-400 mb-4">ℹ️ Match Types</h3>
        <ul className="space-y-2 text-xl text-gray-300">
          <li><strong>Rated Match:</strong> Both players selected - affects ELO ratings</li>
          <li><strong>Anonymous Match:</strong> One or both anonymous - no rating change</li>
          <li><strong>Practice:</strong> Same as anonymous, just for fun</li>
        </ul>
      </div>

      {/* No Players Warning */}
      {players.length === 0 && (
        <div className="bg-yellow-900/30 border-2 border-yellow-500/50 rounded-lg p-6 text-center">
          <p className="text-2xl text-yellow-400 mb-4">
            ⚠️ No players found. You can still start an anonymous match!
          </p>
          <a
            href="/players"
            className="inline-block px-6 py-3 bg-yellow-500 hover:bg-yellow-600 text-black font-bold rounded-lg transition-colors"
          >
            Add Players
          </a>
        </div>
      )}
    </div>
  );
}
