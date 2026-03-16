// Matches API - GET all matches, POST create match
import type { APIRoute } from 'astro';
import { allMatches, createMatch, validateMatchCreation, validateNoOngoingMatch, ValidationError } from '../../../server/features/matches/matches.domain';
import { playerById } from '../../../server/features/players/players.domain';
import { generateId } from '../../../server/shared/utils';
import { now } from '../../../server/shared/utils';
import type { Match, MatchId } from '../../../server/shared/types';
import { validatePin, refreshPin } from '../../../server/features/auth/session.domain';

// GET /api/matches - Get all matches
export const GET: APIRoute = async () => {
  try {
    const { matches, totalCount } = await allMatches();

    return new Response(JSON.stringify({ matches, totalCount }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error fetching matches:', error);
    return new Response(JSON.stringify({ error: 'Failed to fetch matches' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};

// POST /api/matches - Create new match
export const POST: APIRoute = async ({ request }) => {
  try {
    const body = await request.json();
    const { playerA, playerB, tvPin } = body;

    // Validate TV PIN if provided (required for mobile clients)
    if (tvPin !== undefined) {
      if (!validatePin(tvPin)) {
        return new Response(
          JSON.stringify({
            error: 'Invalid or expired TV PIN. Please check the PIN displayed on the TV screen.',
            field: 'tvPin'
          }),
          {
            status: 401,
            headers: { 'Content-Type': 'application/json' },
          }
        );
      }
    }

    // Validate input
    const validated = validateMatchCreation(playerA, playerB);

    // Check no ongoing match
    const { matches } = await allMatches();
    validateNoOngoingMatch(matches);

    // Get player ratings
    let playerAData, playerBData;
    if (validated.playerA) {
      playerAData = await playerById(validated.playerA.id);
      if (!playerAData) {
        return new Response(JSON.stringify({ error: 'Player A not found' }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        });
      }
    }
    if (validated.playerB) {
      playerBData = await playerById(validated.playerB.id);
      if (!playerBData) {
        return new Response(JSON.stringify({ error: 'Player B not found' }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        });
      }
    }

    // Create match
    const match: Match = {
      id: generateId() as MatchId,
      playerA: playerAData ? {
        id: playerAData.id,
        ratingBefore: playerAData.rating,
      } : undefined,
      playerB: playerBData ? {
        id: playerBData.id,
        ratingBefore: playerBData.rating,
      } : undefined,
      scoreA: 0,
      scoreB: 0,
      status: 'IN_PROGRESS',
      startedAt: now(),
      rated: true,
    };

    await createMatch(match);

    // Refresh PIN after match is created (for security)
    refreshPin();

    return new Response(JSON.stringify(match), {
      status: 201,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    if (error instanceof ValidationError) {
      return new Response(JSON.stringify({ error: error.message, field: error.field }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    console.error('Error creating match:', error);
    return new Response(JSON.stringify({ error: 'Failed to create match' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
