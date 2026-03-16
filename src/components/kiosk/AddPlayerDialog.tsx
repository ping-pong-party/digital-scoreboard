import { useState, useEffect, useRef } from 'react';

interface AddPlayerDialogProps {
  onPlayerAdded: (playerId: string) => void;
  onCancel: () => void;
}

export default function AddPlayerDialog({ onPlayerAdded, onCancel }: AddPlayerDialogProps) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [adding, setAdding] = useState(false);
  const nameInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // Auto-focus name input
    nameInputRef.current?.focus();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      alert('Player name is required');
      return;
    }

    try {
      setAdding(true);

      const response = await fetch('/api/players', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim() || undefined,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to add player');
      }

      const newPlayer = await response.json();
      onPlayerAdded(newPlayer.id);
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Failed to add player');
      setAdding(false);
    }
  };

  // ESC to cancel
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !adding) {
        e.preventDefault();
        onCancel();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onCancel, adding]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
      <div className="bg-gray-900 rounded-3xl p-12 shadow-2xl border-4 border-cyan-500 max-w-3xl mx-8 w-full">
        {/* Title */}
        <h2 className="text-6xl font-black mb-8 text-center bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">
          Add New Player
        </h2>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Name input */}
          <div>
            <label htmlFor="name" className="block text-3xl font-bold text-white mb-3">
              Name <span className="text-red-400">*</span>
            </label>
            <input
              ref={nameInputRef}
              type="text"
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-6 py-4 text-3xl bg-gray-800 border-2 border-gray-700 rounded-lg text-white focus:border-cyan-500 focus:outline-none"
              placeholder="Enter player name"
              disabled={adding}
            />
          </div>

          {/* Email input */}
          <div>
            <label htmlFor="email" className="block text-3xl font-bold text-white mb-3">
              Email <span className="text-gray-500">(optional)</span>
            </label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-6 py-4 text-3xl bg-gray-800 border-2 border-gray-700 rounded-lg text-white focus:border-cyan-500 focus:outline-none"
              placeholder="email@example.com"
              disabled={adding}
            />
            <p className="text-lg text-gray-500 mt-2">Email is used for Gravatar avatar</p>
          </div>

          {/* Buttons */}
          <div className="grid grid-cols-2 gap-6 mt-8">
            <button
              type="button"
              onClick={onCancel}
              disabled={adding}
              className="px-12 py-6 bg-gray-700 hover:bg-gray-600 disabled:bg-gray-800 text-white text-3xl font-bold rounded-xl transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={adding || !name.trim()}
              className="px-12 py-6 bg-gradient-to-r from-cyan-500 to-blue-600 hover:brightness-110 disabled:from-gray-600 disabled:to-gray-700 text-white text-3xl font-bold rounded-xl transition-all"
            >
              {adding ? 'Adding...' : 'Add Player'}
            </button>
          </div>
        </form>

        {/* Keyboard hint */}
        <div className="mt-6 text-center text-gray-500 text-xl">
          <kbd className="bg-gray-800 px-3 py-2 rounded">ESC</kbd> to cancel
        </div>
      </div>
    </div>
  );
}
