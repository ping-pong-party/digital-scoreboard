import { useState, useEffect } from 'react';

interface Player {
  id: string;
  name: string;
  email?: string;
  rating: number;
  avatarUrl?: string;
}

interface MobileMatchStarterProps {
  onMatchStarted?: () => void;
  onCancel?: () => void;
}

export default function MobileMatchStarter({ onMatchStarted, onCancel }: MobileMatchStarterProps) {
  const [players, setPlayers] = useState<Player[]>([]);
  const [loading, setLoading] = useState(true);
  const [playerA, setPlayerA] = useState<string | null>(null);
  const [playerB, setPlayerB] = useState<string | null>(null);
  const [tvPin, setTvPin] = useState<string>('');
  const [starting, setStarting] = useState(false);

  useEffect(() => {
    const fetchPlayers = async () => {
      try {
        const response = await fetch('/api/players');
        if (!response.ok) throw new Error('Failed to fetch players');
        const data = await response.json();
        setPlayers(data.players || []);
      } catch (error) {
        console.error('Error fetching players:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchPlayers();
  }, []);

  const handleStartMatch = async () => {
    if (!playerA || !playerB) {
      alert('Please select both players');
      return;
    }

    if (playerA === playerB) {
      alert('Please select different players');
      return;
    }

    if (!tvPin || tvPin.length !== 4) {
      alert('Please enter the 4-digit TV PIN');
      return;
    }

    setStarting(true);

    try {
      const response = await fetch('/api/matches', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          playerA: { id: playerA },
          playerB: { id: playerB },
          tvPin: tvPin,
        }),
      });

      if (!response.ok) {
        const error = await response.json();

        // Handle PIN error specifically
        if (response.status === 401 && error.field === 'tvPin') {
          alert('❌ ' + error.error);
          setTvPin(''); // Clear PIN on error
          setStarting(false);
          return;
        }

        throw new Error(error.error || 'Failed to start match');
      }

      // Haptic feedback
      if ('vibrate' in navigator) {
        navigator.vibrate([100, 50, 100]);
      }

      onMatchStarted?.();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to start match');
      setStarting(false);
    }
  };

  const handlePlayerSelect = (playerId: string) => {
    if (!playerA) {
      setPlayerA(playerId);
    } else if (!playerB && playerId !== playerA) {
      setPlayerB(playerId);
    } else if (playerId === playerA) {
      setPlayerA(null);
    } else if (playerId === playerB) {
      setPlayerB(null);
    }

    // Haptic feedback
    if ('vibrate' in navigator) {
      navigator.vibrate(30);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-2xl font-bold text-cyan-400">Loading players...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 flex flex-col">
      {/* Header */}
      <div className="bg-gray-800 px-4 py-3 flex items-center justify-between border-b border-gray-700">
        <h1 className="text-xl font-bold text-cyan-400">Start New Match</h1>
        {onCancel && (
          <button
            onClick={onCancel}
            className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white text-sm font-bold rounded active:scale-95 transition-transform"
          >
            Cancel
          </button>
        )}
      </div>

      {/* Selection Status */}
      <div className="bg-gray-800 px-4 py-4 border-b border-gray-700">
        <div className="grid grid-cols-2 gap-3 mb-3">
          <div className={`p-3 rounded-lg border-2 ${playerA ? 'border-blue-500 bg-blue-900/30' : 'border-gray-600 bg-gray-700/30'}`}>
            <div className="text-xs text-gray-400 mb-1">Player A</div>
            <div className="text-sm font-semibold text-white truncate">
              {playerA ? players.find((p) => p.id === playerA)?.name : 'Not selected'}
            </div>
          </div>
          <div className={`p-3 rounded-lg border-2 ${playerB ? 'border-purple-500 bg-purple-900/30' : 'border-gray-600 bg-gray-700/30'}`}>
            <div className="text-xs text-gray-400 mb-1">Player B</div>
            <div className="text-sm font-semibold text-white truncate">
              {playerB ? players.find((p) => p.id === playerB)?.name : 'Not selected'}
            </div>
          </div>
        </div>

        {/* TV PIN Input */}
        <div className="p-3 rounded-lg border-2 border-cyan-500 bg-cyan-900/20">
          <label className="block text-xs text-cyan-400 mb-2 font-semibold">
            TV PIN Code (check TV screen)
          </label>
          <input
            type="text"
            inputMode="numeric"
            maxLength={4}
            value={tvPin}
            onChange={(e) => setTvPin(e.target.value.replace(/\D/g, ''))}
            placeholder="Enter 4-digit PIN"
            className="w-full bg-gray-900 border-2 border-cyan-600 rounded-lg px-4 py-3 text-2xl font-mono text-center text-white tracking-widest focus:outline-none focus:border-cyan-400"
          />
          <div className="text-xs text-gray-400 mt-2 text-center">
            Find the PIN on the TV screen to start the match
          </div>
        </div>
      </div>

      {/* Player List */}
      <div className="flex-1 overflow-y-auto px-4 py-4">
        <div className="space-y-2">
          {players.map((player) => {
            const isPlayerA = playerA === player.id;
            const isPlayerB = playerB === player.id;
            const isSelected = isPlayerA || isPlayerB;

            return (
              <button
                key={player.id}
                onClick={() => handlePlayerSelect(player.id)}
                className={`w-full p-4 rounded-lg flex items-center gap-3 transition-all active:scale-98 ${
                  isPlayerA
                    ? 'bg-blue-900 border-2 border-blue-500'
                    : isPlayerB
                    ? 'bg-purple-900 border-2 border-purple-500'
                    : 'bg-gray-800 border-2 border-transparent hover:border-gray-600'
                }`}
              >
                {player.avatarUrl ? (
                  <img
                    src={player.avatarUrl}
                    alt={player.name}
                    className={`w-12 h-12 rounded-full ${
                      isPlayerA
                        ? 'border-2 border-blue-400'
                        : isPlayerB
                        ? 'border-2 border-purple-400'
                        : ''
                    }`}
                  />
                ) : (
                  <div
                    className={`w-12 h-12 rounded-full bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center text-white text-lg font-bold ${
                      isPlayerA
                        ? 'border-2 border-blue-400'
                        : isPlayerB
                        ? 'border-2 border-purple-400'
                        : ''
                    }`}
                  >
                    {player.name.charAt(0).toUpperCase()}
                  </div>
                )}

                <div className="flex-1 text-left">
                  <div className={`font-bold ${isSelected ? 'text-white' : 'text-gray-300'}`}>
                    {player.name}
                  </div>
                  <div className="text-sm text-gray-400">Rating: {player.rating}</div>
                </div>

                {isSelected && (
                  <div className="text-2xl">
                    {isPlayerA ? '🔵' : '🟣'}
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Start Match Button */}
      {playerA && playerB && tvPin.length === 4 && (
        <div className="bg-gray-800 p-4 border-t border-gray-700">
          <button
            onClick={handleStartMatch}
            disabled={starting}
            className="w-full py-4 bg-green-500 hover:bg-green-600 disabled:bg-gray-600 text-white text-xl font-bold rounded-lg active:scale-95 transition-transform"
          >
            {starting ? 'Starting...' : 'Start Match'}
          </button>
        </div>
      )}
    </div>
  );
}
