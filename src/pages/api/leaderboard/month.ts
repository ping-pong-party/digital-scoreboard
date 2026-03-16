// GET /api/leaderboard/month - Get this month's leaderboard
import type { APIRoute } from 'astro';
import { getMonthLeaderboard } from '../../../server/features/ratings/leaderboard.domain';

export const GET: APIRoute = async () => {
  try {
    const leaderboard = await getMonthLeaderboard();
    const monthName = new Date().toLocaleString('en-US', { month: 'long' });

    return new Response(JSON.stringify({ leaderboard, monthName }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error fetching month leaderboard:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to fetch month leaderboard' }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
};
