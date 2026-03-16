// Player API endpoints - GET, PUT, DELETE by ID
// Migrated from Express routes to Astro endpoints

import type { APIRoute } from 'astro';
import {
  playerById,
  updatePlayer,
  deletePlayer,
  getGravatarUrl,
} from '../../../server/features/players/players.domain';
import { validatePlayerUpdate, validateCanDeletePlayer, ValidationError } from '../../../server/features/players/players.validation';
import { allMatches } from '../../../server/features/matches/matches.domain';
import type { PlayerDTO } from '../../../server/features/players/players.types';

// GET /api/players/:id - Get player by ID
export const GET: APIRoute = async ({ params }) => {
  try {
    const { id } = params;
    if (!id) {
      return new Response(JSON.stringify({ error: 'Player ID is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const player = await playerById(id);
    if (!player) {
      return new Response(JSON.stringify({ error: 'Player not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const playerWithAvatar: PlayerDTO = {
      ...player,
      avatarUrl: getGravatarUrl(player.email),
    };

    return new Response(JSON.stringify(playerWithAvatar), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error fetching player:', error);
    return new Response(JSON.stringify({ error: 'Failed to fetch player' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};

// PUT /api/players/:id - Update player
export const PUT: APIRoute = async ({ params, request }) => {
  try {
    const { id } = params;
    if (!id) {
      return new Response(JSON.stringify({ error: 'Player ID is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const body = await request.json();
    const { name, email } = body;

    // Validate input
    const validated = validatePlayerUpdate(name, email);

    // Update player
    const player = await updatePlayer(id, {
      name: validated.name,
      email: validated.email || undefined,
    });

    if (!player) {
      return new Response(JSON.stringify({ error: 'Player not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const playerWithAvatar: PlayerDTO = {
      ...player,
      avatarUrl: getGravatarUrl(player.email),
    };

    return new Response(JSON.stringify(playerWithAvatar), {
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

    console.error('Error updating player:', error);
    return new Response(JSON.stringify({ error: 'Failed to update player' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};

// DELETE /api/players/:id - Delete player
export const DELETE: APIRoute = async ({ params }) => {
  try {
    const { id } = params;
    if (!id) {
      return new Response(JSON.stringify({ error: 'Player ID is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Check if player exists
    const player = await playerById(id);
    if (!player) {
      return new Response(JSON.stringify({ error: 'Player not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Validate that player can be deleted (no matches)
    const { matches } = await allMatches();
    validateCanDeletePlayer(id, matches);

    // Delete player
    await deletePlayer(id);

    return new Response(JSON.stringify({ success: true }), {
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

    console.error('Error deleting player:', error);
    return new Response(JSON.stringify({ error: 'Failed to delete player' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
