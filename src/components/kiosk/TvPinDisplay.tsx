import { useState, useEffect } from 'react';

/**
 * TV PIN Display Component
 * Shows current session PIN for mobile authentication
 */
export default function TvPinDisplay() {
  const [pin, setPin] = useState<string>('----');
  const [timeRemaining, setTimeRemaining] = useState<number>(0);

  const fetchPin = async () => {
    try {
      const response = await fetch('/api/session/pin');
      if (!response.ok) throw new Error('Failed to fetch PIN');
      const data = await response.json();
      setPin(data.pin);
      setTimeRemaining(data.timeRemaining);
    } catch (error) {
      console.error('Error fetching PIN:', error);
    }
  };

  useEffect(() => {
    fetchPin();
    // Refresh PIN every 10 seconds to show countdown
    const interval = setInterval(fetchPin, 10000);
    return () => clearInterval(interval);
  }, []);

  // Countdown timer
  useEffect(() => {
    if (timeRemaining <= 0) return;

    const timer = setInterval(() => {
      setTimeRemaining((prev) => Math.max(0, prev - 1));
    }, 1000);

    return () => clearInterval(timer);
  }, [timeRemaining]);

  const minutes = Math.floor(timeRemaining / 60);
  const seconds = timeRemaining % 60;

  return (
    <div className="bg-gradient-to-r from-cyan-900 to-blue-900 rounded-xl p-6 border-2 border-cyan-500">
      <div className="text-center">
        <div className="text-lg text-cyan-300 font-semibold mb-2">
          Mobile PIN Code
        </div>
        <div className="text-7xl font-black text-white mb-3 tracking-wider font-mono">
          {pin}
        </div>
        <div className="text-sm text-cyan-400">
          Valid for {minutes}:{seconds.toString().padStart(2, '0')}
        </div>
        <div className="text-xs text-gray-400 mt-2">
          Enter this PIN in the mobile app to start a match
        </div>
      </div>
    </div>
  );
}
