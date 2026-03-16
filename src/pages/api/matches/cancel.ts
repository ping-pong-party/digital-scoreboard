// DELETE /api/matches/cancel - Cancel (delete) the ongoing match
import type { APIRoute } from 'astro';
import { ongoingMatch, deleteMatch, validateMatchCanBeModified } from '../../../server/features/matches/matches.domain';

export const DELETE: APIRoute = async () => {
  try {
    const match = await ongoingMatch();

    if (!match) {
      return new Response(JSON.stringify({ error: 'No match in progress' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Validate match can be modified (is in progress)
    validateMatchCanBeModified(match);

    // Delete the match
    await deleteMatch(match.id);

    return new Response(JSON.stringify({ success: true, message: 'Match cancelled' }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error cancelling match:', error);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : 'Failed to cancel match'
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
};
