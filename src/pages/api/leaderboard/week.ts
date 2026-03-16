// GET /api/leaderboard/week - Get this week's leaderboard
import type { APIRoute } from 'astro';
import { getWeekLeaderboard, getWeekNumber } from '../../../server/features/ratings/leaderboard.domain';

export const GET: APIRoute = async () => {
  try {
    const leaderboard = await getWeekLeaderboard();
    const weekNumber = getWeekNumber();

    return new Response(JSON.stringify({ leaderboard, weekNumber }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error fetching week leaderboard:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to fetch week leaderboard' }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
};
