// Shared utility functions

export function now(): number {
  return Date.now();
}

export function generateId(): string {
  return Math.random().toString(36).substring(2, 15) +
         Math.random().toString(36).substring(2, 15);
}
