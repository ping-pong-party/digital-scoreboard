// POST /api/matches/score - Update match score
import type { APIRoute } from 'astro';
import {
  ongoingMatch,
  updateMatch,
  validateScoreUpdate,
  validateMatchCanBeModified,
  ValidationError,
} from '../../../server/features/matches/matches.domain';

export const POST: APIRoute = async ({ request }) => {
  try {
    const body = await request.json();
    const { scoreA, scoreB } = body;

    // Validate scores
    const validated = validateScoreUpdate(scoreA, scoreB);

    // Get ongoing match
    const match = await ongoingMatch();
    validateMatchCanBeModified(match);

    // Update scores
    match!.scoreA = validated.scoreA;
    match!.scoreB = validated.scoreB;

    await updateMatch(match!);

    return new Response(JSON.stringify({ match }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    if (error instanceof ValidationError) {
      return new Response(JSON.stringify({ error: error.message, field: error.field }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    console.error('Error updating score:', error);
    return new Response(JSON.stringify({ error: 'Failed to update score' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
