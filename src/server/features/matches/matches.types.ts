// Match type definitions and schemas
// Migrated from hackathon-2025-ping-pong-party/stacks/digital-scoreboard

import { z } from 'zod';
import type { Match, MatchStatus } from './matches.domain';

const playerInMatchSchema = z.object({
  id: z.string(),
  ratingBefore: z.number(),
  ratingAfter: z.number().optional(),
});

// Schema for client input (only requires id)
const playerInputSchema = z.object({
  id: z.string(),
});

export const matchCreateSchema = z
  .object({
    playerA: playerInputSchema.optional(),
    playerB: playerInputSchema.optional(),
  })
  .refine((v) => !(v.playerA && v.playerB && v.playerA.id === v.playerB.id), {
    message: 'Player A and B must be different',
  });

export const matchUpdateScoreSchema = z.object({
  scoreA: z.number().int().min(0),
  scoreB: z.number().int().min(0),
});

export const matchAssignPlayersSchema = z
  .object({
    playerA: playerInputSchema.optional(),
    playerB: playerInputSchema.optional(),
  })
  .refine((v) => !(v.playerA && v.playerB && v.playerA.id === v.playerB.id), {
    message: 'Player A and B must be different',
  });

export const matchStatusSchema = z.enum(['IN_PROGRESS', 'COMPLETED']);

export type MatchDTO = Match;
export type MatchStatusDTO = MatchStatus;
