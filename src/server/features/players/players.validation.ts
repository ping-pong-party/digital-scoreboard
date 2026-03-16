// Player-specific validation logic
// Migrated from hackathon-2025-ping-pong-party/stacks/digital-scoreboard

import { z } from 'zod';
import { playerCreateSchema, playerUpdateSchema } from './players.types';

// Client-side validation utilities
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

// Player-specific validations
export function validatePlayerCreation(name: string, email?: string) {
  return validateInput(playerCreateSchema, { name: name.trim(), email: email?.trim() || undefined });
}

export function validatePlayerUpdate(name?: string, email?: string) {
  return validateInput(playerUpdateSchema, {
    name: name?.trim(),
    email: email?.trim() || undefined,
  });
}

// Player business rule validations
export function validateCanDeletePlayer(playerId: string, matches: any[]): void {
  const hasMatches = matches.some((m) => m.playerA?.id === playerId || m.playerB?.id === playerId);
  if (hasMatches) {
    throw new ValidationError('Cannot delete player who has played matches');
  }
}

// UI state validation helpers
export function canDeletePlayer(playerId: string, matches: any[]): boolean {
  try {
    validateCanDeletePlayer(playerId, matches);
    return true;
  } catch {
    return false;
  }
}
