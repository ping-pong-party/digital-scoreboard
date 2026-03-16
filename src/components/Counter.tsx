import { useState } from 'react';

interface CounterProps {
  initialCount?: number;
  label?: string;
}

export default function Counter({ initialCount = 0, label = 'Count' }: CounterProps) {
  const [count, setCount] = useState(initialCount);

  return (
    <div className="p-6 bg-white dark:bg-gray-800 rounded-lg shadow-lg">
      <h3 className="text-2xl font-bold mb-4">{label}</h3>
      <div className="text-6xl font-black mb-6 text-blue-600 dark:text-blue-400">
        {count}
      </div>
      <div className="flex gap-4">
        <button
          onClick={() => setCount(count - 1)}
          className="px-6 py-3 bg-red-500 hover:bg-red-600 text-white font-bold rounded-lg transition-colors"
        >
          Decrease
        </button>
        <button
          onClick={() => setCount(count + 1)}
          className="px-6 py-3 bg-green-500 hover:bg-green-600 text-white font-bold rounded-lg transition-colors"
        >
          Increase
        </button>
        <button
          onClick={() => setCount(initialCount)}
          className="px-6 py-3 bg-gray-500 hover:bg-gray-600 text-white font-bold rounded-lg transition-colors"
        >
          Reset
        </button>
      </div>
    </div>
  );
}
