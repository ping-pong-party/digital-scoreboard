// ELO rating system domain logic
// Based on the existing implementation from hackathon-2025-ping-pong-party

const K_FACTOR = 32;

export interface EloResult {
  newRatingA: number;
  newRatingB: number;
  expectedA: number;
  expectedB: number;
}

export function expectedScore(ratingA: number, ratingB: number): { expectedA: number; expectedB: number } {
  const qa = Math.pow(10, ratingA / 400);
  const qb = Math.pow(10, ratingB / 400);
  const expectedA = qa / (qa + qb);
  const expectedB = qb / (qa + qb);
  return { expectedA, expectedB };
}

export function eloUpdate(
  ratingA: number,
  ratingB: number,
  scoreA: 0 | 0.5 | 1
): EloResult {
  const { expectedA, expectedB } = expectedScore(ratingA, ratingB);
  const newRatingA = Math.round(ratingA + K_FACTOR * (scoreA - expectedA));
  const scoreB = (1 - scoreA) as 0 | 0.5 | 1;
  const newRatingB = Math.round(ratingB + K_FACTOR * (scoreB - expectedB));
  return { newRatingA, newRatingB, expectedA, expectedB };
}

export function calculateRatingsForMatch(
  ratingA: number,
  ratingB: number,
  winner: 'A' | 'B'
): EloResult {
  const scoreA = winner === 'A' ? 1 : 0;
  return eloUpdate(ratingA, ratingB, scoreA as 0 | 1);
}
