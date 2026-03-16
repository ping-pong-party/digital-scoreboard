// GET /api/players/:id/details - Get comprehensive player details
import type { APIRoute } from 'astro';
import { getPlayerDetails } from '../../../../server/features/players/player-details.domain';

export const GET: APIRoute = async ({ params }) => {
  try {
    const { id } = params;

    if (!id) {
      return new Response(JSON.stringify({ error: 'Player ID is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const details = await getPlayerDetails(id);

    if (!details) {
      return new Response(JSON.stringify({ error: 'Player not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify(details), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error fetching player details:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to fetch player details' }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
};
