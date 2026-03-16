// GET /api/matches/ongoing - Get current ongoing match
import type { APIRoute } from 'astro';
import { ongoingMatch } from '../../../server/features/matches/matches.domain';

export const GET: APIRoute = async () => {
  try {
    const match = await ongoingMatch();

    if (!match) {
      return new Response(JSON.stringify({ match: null }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ match }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error fetching ongoing match:', error);
    return new Response(JSON.stringify({ error: 'Failed to fetch ongoing match' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
