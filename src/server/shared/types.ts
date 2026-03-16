// Shared types for the application

export type PlayerId = string & { readonly __brand: 'PlayerId' };
export type MatchId = string & { readonly __brand: 'MatchId' };

export interface Player {
  id: PlayerId;
  name: string;
  email?: string;
  rating: number;
  createdAt: number;
}

export interface Match {
  id: MatchId;
  playerA?: {
    id: PlayerId;
    name?: string;
    avatarUrl?: string;
    ratingBefore: number;
    ratingAfter?: number;
  };
  playerB?: {
    id: PlayerId;
    name?: string;
    avatarUrl?: string;
    ratingBefore: number;
    ratingAfter?: number;
  };
  scoreA: number;
  scoreB: number;
  status: 'IN_PROGRESS' | 'COMPLETED';
  startedAt: number;
  completedAt?: number;
  rated?: boolean;
}

export function toPlayerId(s: string): PlayerId {
  return s as PlayerId;
}

export function toMatchId(s: string): MatchId {
  return s as MatchId;
}
