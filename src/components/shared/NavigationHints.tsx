import { useEffect } from 'react';

export default function NavigationHints() {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if typing in input
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }

      // Navigation shortcuts
      if (e.key === 'Escape' || e.key === 'h' || e.key === 'H') {
        e.preventDefault();
        window.location.href = '/';
      } else if (e.key === 'p' || e.key === 'P') {
        e.preventDefault();
        window.location.href = '/players';
      } else if (e.key === 'r' || e.key === 'R') {
        e.preventDefault();
        window.location.href = '/ratings';
      } else if (e.key === 'm' || e.key === 'M') {
        e.preventDefault();
        window.location.href = '/matches';
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <div className="mt-12 bg-gray-800 rounded-lg p-6">
      <div className="flex items-center justify-center gap-8 text-2xl text-gray-400">
        <div>
          <kbd className="bg-gray-700 px-3 py-2 rounded text-cyan-400 font-bold">ESC</kbd> or{' '}
          <kbd className="bg-gray-700 px-3 py-2 rounded text-cyan-400 font-bold">H</kbd> Home
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
  );
}
