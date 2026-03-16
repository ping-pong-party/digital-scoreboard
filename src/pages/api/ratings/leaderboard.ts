// GET /api/ratings/leaderboard - Get top players by rating
import type { APIRoute } from 'astro';
import { allPlayers, getGravatarUrl } from '../../../server/features/players/players.domain';
import { allMatches } from '../../../server/features/matches/matches.domain';
import type { PlayerDTO } from '../../../server/features/players/players.types';

interface LeaderboardEntry extends PlayerDTO {
  rank: number;
  wins: number;
  losses: number;
  totalMatches: number;
  winRate: number;
}

export const GET: APIRoute = async ({ url }) => {
  try {
    const limit = parseInt(url.searchParams.get('limit') || '10');
    const players = await allPlayers();
    const { matches } = await allMatches();

    // Calculate stats for each player
    const leaderboard: LeaderboardEntry[] = players.map((player) => {
      // Count wins and losses
      let wins = 0;
      let losses = 0;

      matches.forEach((match) => {
        if (match.status !== 'COMPLETED') return;
        if (!match.playerA || !match.playerB) return;

        const isPlayerA = match.playerA.id === player.id;
        const isPlayerB = match.playerB.id === player.id;

        if (!isPlayerA && !isPlayerB) return;

        // Determine winner
        const scoreA = match.scoreA;
        const scoreB = match.scoreB;
        const playerAWon = scoreA > scoreB;

        if (isPlayerA && playerAWon) wins++;
        else if (isPlayerA && !playerAWon) losses++;
        else if (isPlayerB && !playerAWon) wins++;
        else if (isPlayerB && playerAWon) losses++;
      });

      const totalMatches = wins + losses;
      const winRate = totalMatches > 0 ? (wins / totalMatches) * 100 : 0;

      return {
        ...player,
        avatarUrl: getGravatarUrl(player.email),
        rank: 0, // Will be set after sorting
        wins,
        losses,
        totalMatches,
        winRate,
      };
    });

    // Sort by rating (descending)
    leaderboard.sort((a, b) => b.rating - a.rating);

    // Assign ranks
    leaderboard.forEach((entry, index) => {
      entry.rank = index + 1;
    });

    // Apply limit
    const limitedLeaderboard = leaderboard.slice(0, limit);

    return new Response(JSON.stringify({ leaderboard: limitedLeaderboard, total: players.length }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error fetching leaderboard:', error);
    return new Response(JSON.stringify({ error: 'Failed to fetch leaderboard' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
