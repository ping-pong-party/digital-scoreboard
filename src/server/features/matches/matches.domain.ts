// Match-specific business logic and validation
// Based on the existing implementation from hackathon-2025-ping-pong-party

import { z } from 'zod';
import { database, saveDb } from '../../db/index';
import type { Match as SharedMatch, MatchId } from '../../shared/types';
import { now } from '../../shared/utils';
import { matchCreateSchema, matchUpdateScoreSchema, matchAssignPlayersSchema } from './matches.types';
import { playerById, getGravatarUrl } from '../players/players.domain';

export type MatchStatus = 'IN_PROGRESS' | 'COMPLETED';
export type Match = SharedMatch;

// Validation error
export class ValidationError extends Error {
  constructor(message: string, public field?: string) {
    super(message);
    this.name = 'ValidationError';
  }
}

// Generic validation helper
export function validateInput<T>(schema: z.ZodSchema<T>, data: unknown): T {
  const result = schema.safeParse(data);
  if (!result.success) {
    const firstError = result.error.errors[0];
    if (firstError) {
      throw new ValidationError(firstError.message, firstError.path.join('.'));
    } else {
      throw new ValidationError('Validation failed');
    }
  }
  return result.data;
}

// Match business logic
export function hasWinner(scoreA: number, scoreB: number): boolean {
  return (scoreA >= 11 && scoreA - scoreB >= 2) || (scoreB >= 11 && scoreB - scoreA >= 2);
}

export function winnerOf(scoreA: number, scoreB: number): 'A' | 'B' | null {
  if (scoreA >= 11 && scoreA - scoreB >= 2) return 'A';
  if (scoreB >= 11 && scoreB - scoreA >= 2) return 'B';
  return null;
}

// Match-specific validations
export function validateMatchCreation(playerA?: any, playerB?: any) {
  return validateInput(matchCreateSchema, { playerA, playerB });
}

export function validateScoreUpdate(scoreA: number, scoreB: number) {
  return validateInput(matchUpdateScoreSchema, { scoreA, scoreB });
}

export function validatePlayerAssignment(playerA?: any, playerB?: any) {
  return validateInput(matchAssignPlayersSchema, { playerA, playerB });
}

// Match business rule validations
export function validateNoOngoingMatch(matches: Match[]): void {
  const ongoing = matches.find((m) => m.status === 'IN_PROGRESS');
  if (ongoing) {
    throw new ValidationError('Another match is already in progress');
  }
}

export function validateMatchCanBeModified(match: Match | null): void {
  if (!match) {
    throw new ValidationError('Match not found');
  }
  if (match.status !== 'IN_PROGRESS') {
    throw new ValidationError('Match is not in progress');
  }
}

export function validateCanFinish(match: Match): void {
  validateMatchCanBeModified(match);
  if (!hasWinner(match.scoreA, match.scoreB)) {
    throw new ValidationError('Match does not have a winner yet');
  }
}

// Database operations
export async function createMatch(match: Match): Promise<void> {
  const db = await database();

  const stmt = db.prepare(`
    INSERT INTO matches (
      id, playerA_id, playerA_ratingBefore, playerA_ratingAfter,
      playerB_id, playerB_ratingBefore, playerB_ratingAfter,
      scoreA, scoreB, status, startedAt, completedAt, createdAt, rated
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  stmt.run([
    match.id,
    match.playerA?.id || null,
    match.playerA?.ratingBefore || null,
    match.playerA?.ratingAfter || null,
    match.playerB?.id || null,
    match.playerB?.ratingBefore || null,
    match.playerB?.ratingAfter || null,
    match.scoreA,
    match.scoreB,
    match.status,
    match.startedAt,
    match.completedAt || null,
    now(),
    match.rated !== false ? 1 : 0,
  ]);

  saveDb();
}

export async function updateMatch(match: Match): Promise<void> {
  const db = await database();

  const stmt = db.prepare(`
    UPDATE matches SET
      playerA_id = ?, playerA_ratingBefore = ?, playerA_ratingAfter = ?,
      playerB_id = ?, playerB_ratingBefore = ?, playerB_ratingAfter = ?,
      scoreA = ?, scoreB = ?, status = ?, startedAt = ?, completedAt = ?, rated = ?
    WHERE id = ?
  `);

  stmt.run([
    match.playerA?.id || null,
    match.playerA?.ratingBefore || null,
    match.playerA?.ratingAfter || null,
    match.playerB?.id || null,
    match.playerB?.ratingBefore || null,
    match.playerB?.ratingAfter || null,
    match.scoreA,
    match.scoreB,
    match.status,
    match.startedAt,
    match.completedAt || null,
    match.rated !== false ? 1 : 0,
    match.id,
  ]);

  saveDb();
}

export async function ongoingMatch(): Promise<Match | null> {
  const db = await database();

  const result = db.exec(
    'SELECT * FROM matches WHERE status = ? ORDER BY startedAt DESC LIMIT 1',
    ['IN_PROGRESS']
  );

  if (result.length === 0 || result[0].values.length === 0) {
    return null;
  }

  const row = result[0].values[0];

  // Fetch player data if players exist
  let playerAData = undefined;
  let playerBData = undefined;

  if (row[1]) {
    const player = await playerById(row[1] as string);
    if (player) {
      playerAData = {
        id: row[1] as any,
        name: player.name,
        avatarUrl: getGravatarUrl(player.email),
        ratingBefore: row[2] as number,
        ratingAfter: (row[3] as number | null) || undefined,
      };
    }
  }

  if (row[4]) {
    const player = await playerById(row[4] as string);
    if (player) {
      playerBData = {
        id: row[4] as any,
        name: player.name,
        avatarUrl: getGravatarUrl(player.email),
        ratingBefore: row[5] as number,
        ratingAfter: (row[6] as number | null) || undefined,
      };
    }
  }

  return {
    id: row[0] as MatchId,
    playerA: playerAData,
    playerB: playerBData,
    scoreA: row[7] as number,
    scoreB: row[8] as number,
    status: row[9] as MatchStatus,
    startedAt: row[10] as number,
    completedAt: (row[11] as number | null) || undefined,
    rated: (row[13] as number) !== 0,
  };
}

export async function deleteMatch(matchId: string): Promise<void> {
  const db = await database();

  const stmt = db.prepare('DELETE FROM matches WHERE id = ?');
  stmt.run([matchId]);

  saveDb();
}

export async function allMatches(): Promise<{ matches: Match[]; totalCount: number }> {
  const db = await database();

  // Get total count
  const countResult = db.exec('SELECT COUNT(*) as count FROM matches');
  const totalCount = countResult.length > 0 ? (countResult[0].values[0][0] as number) : 0;

  // Get all matches
  const result = db.exec('SELECT * FROM matches ORDER BY startedAt DESC');

  const matches: Match[] = [];
  if (result.length > 0) {
    for (const row of result[0].values) {
      // Fetch player data if players exist
      let playerAData = undefined;
      let playerBData = undefined;

      if (row[1]) {
        const player = await playerById(row[1] as string);
        if (player) {
          playerAData = {
            id: row[1] as any,
            name: player.name,
            avatarUrl: getGravatarUrl(player.email),
            ratingBefore: row[2] as number,
            ratingAfter: (row[3] as number | null) || undefined,
          };
        }
      }

      if (row[4]) {
        const player = await playerById(row[4] as string);
        if (player) {
          playerBData = {
            id: row[4] as any,
            name: player.name,
            avatarUrl: getGravatarUrl(player.email),
            ratingBefore: row[5] as number,
            ratingAfter: (row[6] as number | null) || undefined,
          };
        }
      }

      matches.push({
        id: row[0] as MatchId,
        playerA: playerAData,
        playerB: playerBData,
        scoreA: row[7] as number,
        scoreB: row[8] as number,
        status: row[9] as MatchStatus,
        startedAt: row[10] as number,
        completedAt: (row[11] as number | null) || undefined,
        rated: (row[13] as number) !== 0,
      });
    }
  }

  return { matches, totalCount };
}
