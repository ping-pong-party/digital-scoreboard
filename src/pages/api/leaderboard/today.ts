// GET /api/leaderboard/today - Get today's leaderboard
import type { APIRoute } from 'astro';
import { getTodayLeaderboard } from '../../../server/features/ratings/leaderboard.domain';

export const GET: APIRoute = async () => {
  try {
    const leaderboard = await getTodayLeaderboard();

    return new Response(JSON.stringify({ leaderboard }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error fetching today leaderboard:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to fetch today leaderboard' }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
};
