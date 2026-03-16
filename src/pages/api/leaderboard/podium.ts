// GET /api/leaderboard/podium - Get podium for last 3 months
import type { APIRoute } from 'astro';
import { getMonthlyPodium } from '../../../server/features/ratings/leaderboard.domain';

export const GET: APIRoute = async () => {
  try {
    // Get podium for last 3 months (1, 2, 3 months ago)
    const [month1, month2, month3] = await Promise.all([
      getMonthlyPodium(1),
      getMonthlyPodium(2),
      getMonthlyPodium(3),
    ]);

    return new Response(
      JSON.stringify({
        podiums: [month1, month2, month3],
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Error fetching podium:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to fetch podium' }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
};
