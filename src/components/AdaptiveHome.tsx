import { useState, useEffect } from 'react';
import { getDeviceType } from '../utils/device';
import Scoreboard from './kiosk/Scoreboard';
import MobileHome from './mobile/MobileHome';
import InstallPrompt from './shared/InstallPrompt';

/**
 * Adaptive home component that renders different UIs based on device type
 * - Mobile/Tablet: Touch-optimized mobile interface
 * - Desktop/TV: Keyboard-optimized kiosk interface
 */
export default function AdaptiveHome() {
  const [deviceType, setDeviceType] = useState<'mobile' | 'tablet' | 'desktop' | 'tv'>('desktop');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setDeviceType(getDeviceType());
    setMounted(true);
  }, []);

  // Show loading state during hydration to prevent flash
  if (!mounted) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-2xl font-bold text-cyan-400">Loading...</div>
      </div>
    );
  }

  // Mobile and tablet get mobile interface
  if (deviceType === 'mobile' || deviceType === 'tablet') {
    return (
      <>
        <MobileHome />
        <InstallPrompt />
      </>
    );
  }

  // Desktop and TV get kiosk interface
  return <Scoreboard />;
}
