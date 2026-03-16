/**
 * Session management for TV PIN authentication
 * Generates and validates PINs to prevent remote match creation abuse
 */

interface SessionState {
  currentPin: string;
  generatedAt: number;
  expiresAt: number;
}

let session: SessionState = {
  currentPin: generatePin(),
  generatedAt: Date.now(),
  expiresAt: Date.now() + 5 * 60 * 1000, // 5 minutes
};

function generatePin(): string {
  return Math.floor(1000 + Math.random() * 9000).toString();
}

/**
 * Get current active PIN
 */
export function getCurrentPin(): string {
  // Check if PIN has expired
  if (Date.now() > session.expiresAt) {
    refreshPin();
  }
  return session.currentPin;
}

/**
 * Validate if provided PIN matches current session PIN
 */
export function validatePin(pin: string): boolean {
  // Check if PIN has expired
  if (Date.now() > session.expiresAt) {
    return false;
  }

  return pin === session.currentPin;
}

/**
 * Generate new PIN and reset expiry
 * Called when PIN expires or when match starts
 */
export function refreshPin(): string {
  session = {
    currentPin: generatePin(),
    generatedAt: Date.now(),
    expiresAt: Date.now() + 5 * 60 * 1000, // 5 minutes
  };
  console.log(`New TV PIN generated: ${session.currentPin}`);
  return session.currentPin;
}

/**
 * Get PIN expiry timestamp
 */
export function getPinExpiry(): number {
  return session.expiresAt;
}

/**
 * Get time remaining until PIN expires (in seconds)
 */
export function getPinTimeRemaining(): number {
  const remaining = Math.max(0, session.expiresAt - Date.now());
  return Math.floor(remaining / 1000);
}
