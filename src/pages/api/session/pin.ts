import type { APIRoute } from 'astro';
import { getCurrentPin, getPinExpiry, getPinTimeRemaining } from '../../../server/features/auth/session.domain';

/**
 * GET /api/session/pin
 * Returns current TV session PIN and expiry info
 */
export const GET: APIRoute = async () => {
  try {
    const pin = getCurrentPin();
    const expiresAt = getPinExpiry();
    const timeRemaining = getPinTimeRemaining();

    return new Response(
      JSON.stringify({
        pin,
        expiresAt,
        timeRemaining,
      }),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );
  } catch (error) {
    console.error('Error getting session PIN:', error);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : 'Failed to get session PIN',
      }),
      {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );
  }
};
