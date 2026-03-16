// GET /api/leaderboard/ratings - Get overall rating leaderboard
import type { APIRoute } from 'astro';
import { getRatingLeaderboard } from '../../../server/features/ratings/leaderboard.domain';

export const GET: APIRoute = async () => {
  try {
    const leaderboard = await getRatingLeaderboard();

    return new Response(JSON.stringify({ leaderboard }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error fetching rating leaderboard:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to fetch rating leaderboard' }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
};
