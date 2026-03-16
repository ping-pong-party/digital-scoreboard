// Leaderboard calculations for different time periods
import { database } from '../../db/index';
import type { PlayerId } from '../../shared/types';
import { playerById, getGravatarUrl } from '../players/players.domain';

export interface LeaderboardEntry {
  playerId: PlayerId;
  playerName: string;
  avatarUrl?: string;
  currentRating: number;
  ratingChange: number;
  matchesPlayed: number;
  wins: number;
  losses: number;
}

export interface PodiumEntry {
  playerId: PlayerId;
  playerName: string;
  avatarUrl?: string;
  rating: number;
  ratingGain: number;
}

// Get start of today (midnight)
function getStartOfToday(): number {
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  return now.getTime();
}

// Get start of this week (Monday)
function getStartOfWeek(): number {
  const now = new Date();
  const day = now.getDay();
  const diff = day === 0 ? -6 : 1 - day; // Adjust when day is Sunday
  now.setDate(now.getDate() + diff);
  now.setHours(0, 0, 0, 0);
  return now.getTime();
}

// Get start of this month
function getStartOfMonth(): number {
  const now = new Date();
  now.setDate(1);
  now.setHours(0, 0, 0, 0);
  return now.getTime();
}

// Get date range for a specific month (for podium)
function getMonthRange(monthsAgo: number): { start: number; end: number } {
  const now = new Date();
  const targetMonth = new Date(now.getFullYear(), now.getMonth() - monthsAgo, 1);
  const start = targetMonth.getTime();

  const nextMonth = new Date(now.getFullYear(), now.getMonth() - monthsAgo + 1, 1);
  const end = nextMonth.getTime();

  return { start, end };
}

// Calculate leaderboard for a time period
export async function getLeaderboard(periodStart: number): Promise<LeaderboardEntry[]> {
  const db = await database();

  // Get all players
  const playersResult = db.exec('SELECT id, name, email, rating FROM players');
  if (playersResult.length === 0) {
    return [];
  }

  const entries: LeaderboardEntry[] = [];

  for (const playerRow of playersResult[0].values) {
    const playerId = playerRow[0] as PlayerId;
    const playerName = playerRow[1] as string;
    const email = playerRow[2] as string | null;
    const currentRating = playerRow[3] as number;

    // Get rating at start of period (first match's ratingBefore if it exists)
    const firstMatchResult = db.exec(
      `SELECT playerA_id, playerA_ratingBefore, playerB_ratingBefore
       FROM matches
       WHERE (playerA_id = ? OR playerB_id = ?)
         AND completedAt >= ?
         AND status = 'COMPLETED'
       ORDER BY completedAt ASC
       LIMIT 1`,
      [playerId, playerId, periodStart]
    );

    let ratingAtPeriodStart = currentRating;
    if (firstMatchResult.length > 0 && firstMatchResult[0].values.length > 0) {
      const row = firstMatchResult[0].values[0];
      const isPlayerA = row[0] === playerId;
      ratingAtPeriodStart = isPlayerA ? (row[1] as number) : (row[2] as number);
    }

    // Get matches in period
    const matchesResult = db.exec(
      `SELECT playerA_id, playerB_id, scoreA, scoreB, status
       FROM matches
       WHERE (playerA_id = ? OR playerB_id = ?)
         AND completedAt IS NOT NULL
         AND completedAt >= ?
         AND status = 'COMPLETED'`,
      [playerId, playerId, periodStart]
    );

    let matchesPlayed = 0;
    let wins = 0;
    let losses = 0;

    if (matchesResult.length > 0) {
      for (const matchRow of matchesResult[0].values) {
        matchesPlayed++;
        const isPlayerA = matchRow[0] === playerId;
        const scoreA = matchRow[2] as number;
        const scoreB = matchRow[3] as number;

        const won = isPlayerA ? scoreA > scoreB : scoreB > scoreA;
        if (won) wins++;
        else losses++;
      }
    }

    const ratingChange = currentRating - ratingAtPeriodStart;

    entries.push({
      playerId,
      playerName,
      avatarUrl: getGravatarUrl(email || undefined),
      currentRating,
      ratingChange,
      matchesPlayed,
      wins,
      losses,
    });
  }

  return entries;
}

// Get today's leaderboard
export async function getTodayLeaderboard(): Promise<LeaderboardEntry[]> {
  const entries = await getLeaderboard(getStartOfToday());
  return entries.sort((a, b) => b.ratingChange - a.ratingChange);
}

// Get this week's leaderboard
export async function getWeekLeaderboard(): Promise<LeaderboardEntry[]> {
  const entries = await getLeaderboard(getStartOfWeek());
  return entries.sort((a, b) => b.ratingChange - a.ratingChange);
}

// Get this month's leaderboard
export async function getMonthLeaderboard(): Promise<LeaderboardEntry[]> {
  const entries = await getLeaderboard(getStartOfMonth());
  return entries.sort((a, b) => b.ratingChange - a.ratingChange);
}

// Get overall rating leaderboard
export async function getRatingLeaderboard(): Promise<LeaderboardEntry[]> {
  const entries = await getLeaderboard(0); // All time
  return entries.sort((a, b) => b.currentRating - a.currentRating);
}

// Get podium for a specific month (monthsAgo: 1 = last month, 2 = 2 months ago, etc.)
export async function getMonthlyPodium(monthsAgo: number): Promise<{ month: string; year: number; podium: PodiumEntry[] }> {
  const { start, end } = getMonthRange(monthsAgo);
  const entries = await getLeaderboard(start);

  // Get month name
  const monthDate = new Date(start);
  const monthName = monthDate.toLocaleString('en-US', { month: 'long' });
  const year = monthDate.getFullYear();

  // Sort by rating gain and take top 3
  const sorted = entries
    .filter(e => e.matchesPlayed > 0)
    .sort((a, b) => b.ratingChange - a.ratingChange)
    .slice(0, 3);

  const podium: PodiumEntry[] = sorted.map(e => ({
    playerId: e.playerId,
    playerName: e.playerName,
    avatarUrl: e.avatarUrl,
    rating: e.currentRating,
    ratingGain: e.ratingChange,
  }));

  return { month: monthName, year, podium };
}

// Get week number
export function getWeekNumber(date: Date = new Date()): number {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
}
