// Player details - comprehensive stats and achievements
import { database } from '../../db/index';
import type { PlayerId } from '../../shared/types';
import { playerById, getGravatarUrl } from './players.domain';

export interface OpponentStats {
  playerId: PlayerId;
  playerName: string;
  avatarUrl?: string;
  rank: number;
  gamesPlayed: number;
  percentOfGames: number;
  wins: number;
  losses: number;
  winRate: number;
  netScore: number;
  avgPtsPerMatch: number;
  nextImpact: number;
}

export interface PlayerDetailsData {
  playerId: PlayerId;
  playerName: string;
  avatarUrl?: string;
  rank: number;
  currentRating: number;
  totalMatches: number;
  totalOpponents: number;
  wins: number;
  losses: number;
  winRate: number;
  achievements: {
    champion: boolean;
    experience: boolean;
    activity: boolean;
    upset: boolean;
    consistency: boolean;
  };
  opponents: OpponentStats[];
  recentMatches: {
    date: number;
    opponentName: string;
    scoreA: number;
    scoreB: number;
    ratingChange: number;
    won: boolean;
  }[];
}

export async function getPlayerDetails(playerId: string): Promise<PlayerDetailsData | null> {
  const db = await database();

  const player = await playerById(playerId);
  if (!player) return null;

  // Get all players to determine rank
  const allPlayersResult = db.exec('SELECT id, rating FROM players ORDER BY rating DESC');
  const allPlayers = allPlayersResult.length > 0 ? allPlayersResult[0].values : [];
  const rank = allPlayers.findIndex(p => p[0] === playerId) + 1;

  // Get all matches for this player
  const matchesResult = db.exec(
    `SELECT id, playerA_id, playerB_id, scoreA, scoreB, completedAt,
            playerA_ratingBefore, playerA_ratingAfter,
            playerB_ratingBefore, playerB_ratingAfter, status
     FROM matches
     WHERE (playerA_id = ? OR playerB_id = ?) AND status = 'COMPLETED'
     ORDER BY completedAt DESC`,
    [playerId, playerId]
  );

  const matches = matchesResult.length > 0 ? matchesResult[0].values : [];
  const totalMatches = matches.length;

  // Calculate wins/losses
  let wins = 0;
  let losses = 0;
  const opponentsMap = new Map<string, {
    id: string;
    gamesPlayed: number;
    wins: number;
    losses: number;
    totalScoreFor: number;
    totalScoreAgainst: number;
  }>();

  for (const match of matches) {
    const isPlayerA = match[1] === playerId;
    const opponentId = isPlayerA ? (match[2] as string) : (match[1] as string);
    const playerScore = isPlayerA ? (match[3] as number) : (match[4] as number);
    const opponentScore = isPlayerA ? (match[4] as number) : (match[3] as number);
    const won = playerScore > opponentScore;

    if (won) wins++;
    else losses++;

    // Track opponent stats
    if (!opponentsMap.has(opponentId)) {
      opponentsMap.set(opponentId, {
        id: opponentId,
        gamesPlayed: 0,
        wins: 0,
        losses: 0,
        totalScoreFor: 0,
        totalScoreAgainst: 0,
      });
    }

    const oppStats = opponentsMap.get(opponentId)!;
    oppStats.gamesPlayed++;
    if (won) oppStats.wins++;
    else oppStats.losses++;
    oppStats.totalScoreFor += playerScore;
    oppStats.totalScoreAgainst += opponentScore;
  }

  const winRate = totalMatches > 0 ? (wins / totalMatches) * 100 : 0;
  const totalOpponents = opponentsMap.size;

  // Build opponent stats
  const opponents: OpponentStats[] = [];
  for (const [oppId, stats] of opponentsMap.entries()) {
    const opponent = await playerById(oppId);
    if (!opponent) continue;

    const oppRank = allPlayers.findIndex(p => p[0] === oppId) + 1;
    const oppWinRate = stats.gamesPlayed > 0 ? (stats.wins / stats.gamesPlayed) * 100 : 0;
    const netScore = stats.totalScoreFor - stats.totalScoreAgainst;
    const avgPtsPerMatch = stats.totalScoreFor / stats.gamesPlayed;

    // Calculate next impact (simplified - would need ELO calculation)
    const nextImpact = Math.round((opponent.rating - player.rating) * 0.04);

    opponents.push({
      playerId: oppId as PlayerId,
      playerName: opponent.name,
      avatarUrl: getGravatarUrl(opponent.email),
      rank: oppRank,
      gamesPlayed: stats.gamesPlayed,
      percentOfGames: (stats.gamesPlayed / totalMatches) * 100,
      wins: stats.wins,
      losses: stats.losses,
      winRate: oppWinRate,
      netScore,
      avgPtsPerMatch,
      nextImpact,
    });
  }

  // Sort by games played descending
  opponents.sort((a, b) => b.gamesPlayed - a.gamesPlayed);

  // Recent matches (last 10)
  const recentMatches = [];
  for (let i = 0; i < Math.min(10, matches.length); i++) {
    const match = matches[i];
    const isPlayerA = match[1] === playerId;
    const opponentId = isPlayerA ? (match[2] as string) : (match[1] as string);
    const opponent = await playerById(opponentId);

    const scoreA = match[3] as number;
    const scoreB = match[4] as number;
    const won = isPlayerA ? scoreA > scoreB : scoreB > scoreA;

    const ratingBefore = isPlayerA ? (match[6] as number) : (match[8] as number);
    const ratingAfter = isPlayerA ? (match[7] as number | null) : (match[9] as number | null);
    const ratingChange = ratingAfter ? ratingAfter - ratingBefore : 0;

    recentMatches.push({
      date: match[5] as number,
      opponentName: opponent?.name || 'Unknown',
      scoreA,
      scoreB,
      ratingChange,
      won,
    });
  }

  // Calculate achievements (simplified)
  const highestRating = Math.max(...allPlayers.map(p => p[1] as number));
  const achievements = {
    champion: player.rating === highestRating,
    experience: false, // Would need to compare total matches with all players
    activity: false, // Would need to check last 21 days
    upset: false, // Would need to track upset victories
    consistency: false, // Would need to calculate performance variance
  };

  return {
    playerId: playerId as PlayerId,
    playerName: player.name,
    avatarUrl: getGravatarUrl(player.email),
    rank,
    currentRating: player.rating,
    totalMatches,
    totalOpponents,
    wins,
    losses,
    winRate,
    achievements,
    opponents,
    recentMatches,
  };
}
