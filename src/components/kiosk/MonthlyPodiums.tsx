import { useState, useEffect } from 'react';

interface PodiumEntry {
  playerId: string;
  playerName: string;
  avatarUrl?: string;
  rating: number;
  ratingGain: number;
}

interface MonthPodium {
  month: string;
  year: number;
  podium: PodiumEntry[];
}

export default function MonthlyPodiums() {
  const [podiums, setPodiums] = useState<MonthPodium[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchPodiums = async () => {
    try {
      const response = await fetch('/api/leaderboard/podium');
      if (!response.ok) throw new Error('Failed to fetch podiums');
      const data = await response.json();
      setPodiums(data.podiums);
    } catch (error) {
      console.error('Error fetching podiums:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPodiums();
    const interval = setInterval(fetchPodiums, 60000); // Refresh every minute
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-4xl text-cyan-400">Loading...</div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-8 h-full overflow-auto py-6">
      {podiums.map((monthData, idx) => {
        const first = monthData.podium[0];
        const second = monthData.podium[1];
        const third = monthData.podium[2];

        return (
          <div key={idx} className="flex flex-col items-center">
            {/* Podium */}
            <div className="flex items-end justify-center gap-2 mb-4">
              {/* 2nd place */}
              {second && (
                <div className="flex flex-col items-center">
                  <div className="relative mb-2">
                    <img
                      src={second.avatarUrl || '/default-avatar.png'}
                      alt={second.playerName}
                      className="w-20 h-20 rounded-full border-4 border-gray-400"
                    />
                  </div>
                  <div className="bg-gray-600 rounded-lg px-4 py-3 min-w-[110px] text-center">
                    <div className="text-white font-bold text-lg">{second.playerName}</div>
                    <div className="text-gray-300 text-sm">{second.ratingGain} pts</div>
                  </div>
                  <div className="mt-2 bg-gray-400 text-gray-900 px-4 py-2 rounded font-bold text-xl">
                    2nd
                  </div>
                </div>
              )}

              {/* 1st place */}
              {first && (
                <div className="flex flex-col items-center -mt-6">
                  <div className="text-4xl mb-1">👑</div>
                  <div className="relative mb-2">
                    <img
                      src={first.avatarUrl || '/default-avatar.png'}
                      alt={first.playerName}
                      className="w-24 h-24 rounded-full border-4 border-yellow-400"
                    />
                  </div>
                  <div className="bg-gradient-to-br from-yellow-500 to-yellow-600 rounded-lg px-4 py-3 min-w-[120px] text-center">
                    <div className="text-gray-900 font-bold text-xl">{first.playerName}</div>
                    <div className="text-gray-800 text-sm font-semibold">{first.ratingGain} pts</div>
                  </div>
                  <div className="mt-2 bg-yellow-400 text-gray-900 px-4 py-2 rounded font-bold text-xl">
                    1st
                  </div>
                </div>
              )}

              {/* 3rd place */}
              {third && (
                <div className="flex flex-col items-center">
                  <div className="relative mb-2">
                    <img
                      src={third.avatarUrl || '/default-avatar.png'}
                      alt={third.playerName}
                      className="w-20 h-20 rounded-full border-4 border-orange-500"
                    />
                  </div>
                  <div className="bg-gradient-to-br from-orange-600 to-orange-700 rounded-lg px-4 py-3 min-w-[110px] text-center">
                    <div className="text-white font-bold text-lg">{third.playerName}</div>
                    <div className="text-orange-200 text-sm">{third.ratingGain} pts</div>
                  </div>
                  <div className="mt-2 bg-orange-500 text-white px-4 py-2 rounded font-bold text-xl">
                    3rd
                  </div>
                </div>
              )}
            </div>

            {/* Month label */}
            <div className="text-center mt-2">
              <div className="inline-flex items-center gap-2 bg-gradient-to-r from-cyan-600 to-blue-700 px-6 py-2 rounded-full">
                <span className="text-yellow-400">★</span>
                <span className="text-white font-bold text-xl uppercase">
                  {monthData.month}
                </span>
                <span className="text-yellow-400">★</span>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
