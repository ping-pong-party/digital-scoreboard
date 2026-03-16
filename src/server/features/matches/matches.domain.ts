// Match-specific business logic and validation
// Based on the existing implementation from hackathon-2025-ping-pong-party

import { database, saveDb } from '../../db/index';
import type { Match, MatchId } from '../../shared/types';
import { now } from '../../shared/utils';

export type MatchStatus = 'IN_PROGRESS' | 'COMPLETED';

// Match business logic
export function hasWinner(scoreA: number, scoreB: number): boolean {
  return (scoreA >= 11 && scoreA - scoreB >= 2) || (scoreB >= 11 && scoreB - scoreA >= 2);
}

export function winnerOf(scoreA: number, scoreB: number): 'A' | 'B' | null {
  if (scoreA >= 11 && scoreA - scoreB >= 2) return 'A';
  if (scoreB >= 11 && scoreB - scoreA >= 2) return 'B';
  return null;
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
  return {
    id: row[0] as MatchId,
    playerA: row[1] ? {
      id: row[1] as any,
      ratingBefore: row[2] as number,
      ratingAfter: (row[3] as number | null) || undefined,
    } : undefined,
    playerB: row[4] ? {
      id: row[4] as any,
      ratingBefore: row[5] as number,
      ratingAfter: (row[6] as number | null) || undefined,
    } : undefined,
    scoreA: row[7] as number,
    scoreB: row[8] as number,
    status: row[9] as MatchStatus,
    startedAt: row[10] as number,
    completedAt: (row[11] as number | null) || undefined,
    rated: (row[13] as number) !== 0,
  };
}
