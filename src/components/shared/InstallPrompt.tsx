import { useState, useEffect } from 'react';

/**
 * PWA Install Prompt Component
 * Shows a prompt to install the app when on mobile and not installed
 */
export default function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showPrompt, setShowPrompt] = useState(false);

  useEffect(() => {
    // Listen for the beforeinstallprompt event
    const handleBeforeInstallPrompt = (e: Event) => {
      // Prevent the mini-infobar from appearing on mobile
      e.preventDefault();
      // Stash the event so it can be triggered later
      setDeferredPrompt(e);
      // Show the install prompt
      setShowPrompt(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;

    // Show the install prompt
    deferredPrompt.prompt();

    // Wait for the user to respond to the prompt
    const { outcome } = await deferredPrompt.userChoice;

    console.log(`User response to the install prompt: ${outcome}`);

    // Clear the deferredPrompt so it can be garbage collected
    setDeferredPrompt(null);
    setShowPrompt(false);
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    // Store dismissal in localStorage to not show again for a while
    localStorage.setItem('pwa-install-dismissed', Date.now().toString());
  };

  // Don't show if dismissed recently (within 7 days)
  useEffect(() => {
    const dismissed = localStorage.getItem('pwa-install-dismissed');
    if (dismissed) {
      const dismissedTime = parseInt(dismissed, 10);
      const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
      if (dismissedTime > sevenDaysAgo) {
        setShowPrompt(false);
      }
    }
  }, []);

  if (!showPrompt || !deferredPrompt) {
    return null;
  }

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-gradient-to-r from-cyan-600 to-blue-600 text-white p-4 shadow-2xl z-50 animate-slide-up">
      <div className="max-w-4xl mx-auto flex items-center gap-4">
        <div className="text-3xl">📱</div>
        <div className="flex-1">
          <div className="font-bold text-lg">Install Ping Pong Party</div>
          <div className="text-sm opacity-90">Add to your home screen for quick access</div>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleInstallClick}
            className="px-6 py-2 bg-white text-cyan-600 font-bold rounded-lg hover:bg-gray-100 active:scale-95 transition-transform"
          >
            Install
          </button>
          <button
            onClick={handleDismiss}
            className="px-4 py-2 text-white/80 hover:text-white"
          >
            ✕
          </button>
        </div>
      </div>
    </div>
  );
}
