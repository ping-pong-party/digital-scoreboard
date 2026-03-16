// POST /api/matches/finish - Finish current match and calculate ELO
import type { APIRoute } from 'astro';
import {
  ongoingMatch,
  updateMatch,
  validateCanFinish,
  winnerOf,
  ValidationError,
} from '../../../server/features/matches/matches.domain';
import { calculateRatingsForMatch } from '../../../server/features/ratings/ratings.domain';
import { updatePlayerRating } from '../../../server/features/players/players.domain';
import { now } from '../../../server/shared/utils';

export const POST: APIRoute = async () => {
  try {
    // Get ongoing match
    const match = await ongoingMatch();
    validateCanFinish(match!);

    // Determine winner
    const winner = winnerOf(match!.scoreA, match!.scoreB);
    if (!winner) {
      return new Response(JSON.stringify({ error: 'No winner determined' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Calculate new ratings if both players are assigned
    if (match!.playerA && match!.playerB) {
      const eloResult = calculateRatingsForMatch(
        match!.playerA.ratingBefore,
        match!.playerB.ratingBefore,
        winner
      );

      // Update match with new ratings
      match!.playerA.ratingAfter = eloResult.newRatingA;
      match!.playerB.ratingAfter = eloResult.newRatingB;

      // Update player ratings in database
      await updatePlayerRating(match!.playerA.id, eloResult.newRatingA);
      await updatePlayerRating(match!.playerB.id, eloResult.newRatingB);
    }

    // Mark match as completed
    match!.status = 'COMPLETED';
    match!.completedAt = now();

    await updateMatch(match!);

    return new Response(JSON.stringify({ match }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    if (error instanceof ValidationError) {
      return new Response(JSON.stringify({ error: error.message }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    console.error('Error finishing match:', error);
    return new Response(JSON.stringify({ error: 'Failed to finish match' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
