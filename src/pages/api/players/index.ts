// Players API endpoints - GET all, POST create
// Migrated from Express routes to Astro endpoints

import type { APIRoute } from 'astro';
import { allPlayers, createPlayer, getGravatarUrl } from '../../../server/features/players/players.domain';
import { validatePlayerCreation, ValidationError } from '../../../server/features/players/players.validation';
import type { PlayerDTO } from '../../../server/features/players/players.types';

// GET /api/players - Get all players
export const GET: APIRoute = async () => {
  try {
    const players = await allPlayers();

    // Add Gravatar URLs to player DTOs
    const playersWithAvatars: PlayerDTO[] = players.map(player => ({
      ...player,
      avatarUrl: getGravatarUrl(player.email),
    }));

    return new Response(JSON.stringify(playersWithAvatars), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  } catch (error) {
    console.error('Error fetching players:', error);
    return new Response(JSON.stringify({ error: 'Failed to fetch players' }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }
};

// POST /api/players - Create new player
export const POST: APIRoute = async ({ request }) => {
  try {
    const body = await request.json();
    const { name, email } = body;

    // Validate input
    const validated = validatePlayerCreation(name, email);

    // Create player
    const player = await createPlayer(validated.name, validated.email || undefined);

    // Add Gravatar URL
    const playerWithAvatar: PlayerDTO = {
      ...player,
      avatarUrl: getGravatarUrl(player.email),
    };

    return new Response(JSON.stringify(playerWithAvatar), {
      status: 201,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  } catch (error) {
    if (error instanceof ValidationError) {
      return new Response(JSON.stringify({ error: error.message, field: error.field }), {
        status: 400,
        headers: {
          'Content-Type': 'application/json',
        },
      });
    }

    console.error('Error creating player:', error);
    return new Response(JSON.stringify({ error: 'Failed to create player' }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }
};
