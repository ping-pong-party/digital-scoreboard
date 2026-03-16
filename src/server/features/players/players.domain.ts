// Player domain types and repository functions
// Migrated from hackathon-2025-ping-pong-party/stacks/digital-scoreboard

import crypto from 'crypto';
import { database, saveDb } from '../../db/index';
import { now, generateId } from '../../shared/utils';
import type { PlayerId } from '../../shared/types';

export interface Player {
  id: PlayerId;
  name: string;
  email?: string;
  rating: number;
  createdAt: number;
}

export const toPlayerId = (s: string) => s as PlayerId;

// Repository functions for cross-feature access

export async function playerById(id: string): Promise<Player | null> {
  const db = await database();

  const result = db.exec('SELECT id, name, email, rating, createdAt FROM players WHERE id = ?', [id]);
  if (result.length === 0 || result[0].values.length === 0) {
    return null;
  }

  const row = result[0].values[0];
  const player: Player = {
    id: toPlayerId(row[0] as string),
    name: row[1] as string,
    rating: row[3] as number,
    createdAt: row[4] as number,
  };
  if (row[2] != null) {
    player.email = row[2] as string;
  }
  return player;
}

export async function allPlayers(): Promise<Player[]> {
  const db = await database();

  const result = db.exec('SELECT id, name, email, rating, createdAt FROM players ORDER BY name');
  if (result.length === 0) {
    return [];
  }

  return result[0].values.map((row: any[]) => {
    const player: Player = {
      id: toPlayerId(row[0]),
      name: row[1],
      rating: row[3],
      createdAt: row[4],
    };
    if (row[2] != null) {
      player.email = row[2];
    }
    return player;
  });
}

export async function playersByIds(ids: string[]): Promise<Player[]> {
  if (ids.length === 0) return [];

  const db = await database();

  const placeholders = ids.map(() => '?').join(',');
  const result = db.exec(
    `SELECT id, name, email, rating, createdAt FROM players WHERE id IN (${placeholders})`,
    ids
  );

  if (result.length === 0) {
    return [];
  }

  return result[0].values.map((row: any[]) => {
    const player: Player = {
      id: toPlayerId(row[0]),
      name: row[1],
      rating: row[3],
      createdAt: row[4],
    };
    if (row[2] != null) {
      player.email = row[2];
    }
    return player;
  });
}

export async function createPlayer(name: string, email?: string): Promise<Player> {
  const db = await database();

  const id = generateId();
  const createdAt = now();
  const rating = 1000; // New players start at 1000 ELO

  const stmt = db.prepare(`
    INSERT INTO players (id, name, email, rating, createdAt)
    VALUES (?, ?, ?, ?, ?)
  `);

  stmt.run([id, name, email || null, rating, createdAt]);

  saveDb();

  const player: Player = {
    id: toPlayerId(id),
    name,
    rating,
    createdAt,
  };
  if (email) {
    player.email = email;
  }
  return player;
}

export async function updatePlayer(id: string, updates: { name?: string; email?: string }): Promise<Player | null> {
  const db = await database();

  // Check if player exists
  const existing = await playerById(id);
  if (!existing) {
    return null;
  }

  // Build update query dynamically
  const updates_list: string[] = [];
  const values: any[] = [];

  if (updates.name !== undefined) {
    updates_list.push('name = ?');
    values.push(updates.name);
  }

  if (updates.email !== undefined) {
    updates_list.push('email = ?');
    values.push(updates.email || null);
  }

  if (updates_list.length === 0) {
    return existing; // No updates
  }

  values.push(id); // For WHERE clause

  const stmt = db.prepare(`UPDATE players SET ${updates_list.join(', ')} WHERE id = ?`);
  stmt.run(values);

  saveDb();

  return await playerById(id);
}

export async function deletePlayer(id: string): Promise<boolean> {
  const db = await database();

  const stmt = db.prepare('DELETE FROM players WHERE id = ?');
  stmt.run([id]);

  saveDb();

  return true;
}

export async function updatePlayerRating(id: string, newRating: number): Promise<void> {
  const db = await database();

  const stmt = db.prepare('UPDATE players SET rating = ? WHERE id = ?');
  stmt.run([newRating, id]);

  saveDb();
}

// Gravatar support
export function getGravatarUrl(email: string | undefined, size: number = 80): string | undefined {
  if (!email) return undefined;

  // MD5 hash for Gravatar
  const hash = crypto.createHash('md5').update(email.trim().toLowerCase()).digest('hex');
  return `https://www.gravatar.com/avatar/${hash}?s=${size}&d=identicon`;
}
