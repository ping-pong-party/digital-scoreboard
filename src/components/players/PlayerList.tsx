import { useState, useEffect } from 'react';
import type { PlayerDTO } from '../../server/features/players/players.types';

export default function PlayerList() {
  const [players, setPlayers] = useState<PlayerDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newPlayerName, setNewPlayerName] = useState('');
  const [newPlayerEmail, setNewPlayerEmail] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Fetch players
  const fetchPlayers = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/players');
      if (!response.ok) {
        throw new Error('Failed to fetch players');
      }
      const data = await response.json();
      setPlayers(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPlayers();
  }, []);

  // Add new player
  const handleAddPlayer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPlayerName.trim()) return;

    try {
      setSubmitting(true);
      const response = await fetch('/api/players', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newPlayerName.trim(),
          email: newPlayerEmail.trim() || undefined,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to create player');
      }

      // Reset form and refresh list
      setNewPlayerName('');
      setNewPlayerEmail('');
      setShowAddForm(false);
      await fetchPlayers();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to create player');
    } finally {
      setSubmitting(false);
    }
  };

  // Delete player
  const handleDeletePlayer = async (id: string, name: string) => {
    if (!confirm(`Delete player "${name}"?`)) return;

    try {
      const response = await fetch(`/api/players/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to delete player');
      }

      await fetchPlayers();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to delete player');
    }
  };

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="text-4xl font-bold text-gray-400">Loading players...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <div className="text-4xl font-bold text-red-500">Error: {error}</div>
        <button
          onClick={fetchPlayers}
          className="mt-4 px-6 py-3 bg-blue-500 hover:bg-blue-600 text-white font-bold rounded-lg"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h2 className="text-4xl font-black text-white">Players ({players.length})</h2>
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="px-6 py-3 bg-green-500 hover:bg-green-600 text-white font-bold rounded-lg transition-colors"
        >
          {showAddForm ? 'Cancel' : '+ Add Player'}
        </button>
      </div>

      {/* Add Player Form */}
      {showAddForm && (
        <form onSubmit={handleAddPlayer} className="bg-gray-800 p-6 rounded-lg space-y-4">
          <h3 className="text-2xl font-bold text-white">Add New Player</h3>
          <div>
            <label className="block text-white font-bold mb-2">Name *</label>
            <input
              type="text"
              value={newPlayerName}
              onChange={(e) => setNewPlayerName(e.target.value)}
              placeholder="Player name"
              className="w-full px-4 py-3 rounded-lg bg-gray-700 text-white border-2 border-gray-600 focus:border-blue-500 outline-none"
              required
            />
          </div>
          <div>
            <label className="block text-white font-bold mb-2">Email (for Gravatar)</label>
            <input
              type="email"
              value={newPlayerEmail}
              onChange={(e) => setNewPlayerEmail(e.target.value)}
              placeholder="player@example.com"
              className="w-full px-4 py-3 rounded-lg bg-gray-700 text-white border-2 border-gray-600 focus:border-blue-500 outline-none"
            />
          </div>
          <button
            type="submit"
            disabled={submitting}
            className="w-full px-6 py-3 bg-blue-500 hover:bg-blue-600 disabled:bg-gray-600 text-white font-bold rounded-lg transition-colors"
          >
            {submitting ? 'Creating...' : 'Create Player'}
          </button>
        </form>
      )}

      {/* Players List */}
      {players.length === 0 ? (
        <div className="text-center py-12 bg-gray-800 rounded-lg">
          <p className="text-2xl text-gray-400">No players yet. Add one to get started!</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {players.map((player) => (
            <div
              key={player.id}
              className="bg-gray-800 p-6 rounded-lg flex items-center justify-between hover:bg-gray-750 transition-colors"
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

                {/* Player Info */}
                <div>
                  <h3 className="text-2xl font-bold text-white">{player.name}</h3>
                  <p className="text-gray-400">
                    Rating: <span className="font-bold text-blue-400">{player.rating}</span>
                  </p>
                  {player.email && (
                    <p className="text-sm text-gray-500">{player.email}</p>
                  )}
                </div>
              </div>

              {/* Actions */}
              <button
                onClick={() => handleDeletePlayer(player.id, player.name)}
                className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white font-bold rounded-lg transition-colors"
              >
                Delete
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
