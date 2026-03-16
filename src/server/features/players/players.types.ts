// Player type definitions and schemas
// Migrated from hackathon-2025-ping-pong-party/stacks/digital-scoreboard

import { z } from 'zod';
import type { Player } from './players.domain';

export const playerCreateSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Invalid email').optional().or(z.literal('')),
});

export const playerUpdateSchema = z.object({
  name: z.string().min(1, 'Name is required').optional(),
  email: z.string().email('Invalid email').optional().or(z.literal('')),
});

export type PlayerDTO = Player & { avatarUrl?: string };
export type PlayerCreateDTO = z.infer<typeof playerCreateSchema>;
export type PlayerUpdateDTO = z.infer<typeof playerUpdateSchema>;
