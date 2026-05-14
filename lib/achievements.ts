import type { PitcherStats } from "./types";

// Achievement system was removed in v58/v60. The PitcherStats.achievements
// field is kept on the type for backwards compatibility with existing Blob
// state, but always populated empty. headshotUrl lives here historically;
// every component that needs it imports from this file.

export function computeAchievements(_p: PitcherStats): string[] {
  return [];
}

export function headshotUrl(pitcherId: number): string {
  // spots/240 (vs 120) has photos for newer prospects; spots/120 returns a
  // generic silhouette for IDs that don't yet have a small-size thumbnail.
  // Next/Image downscales for delivery, so the served bytes stay small.
  return `https://midfield.mlbstatic.com/v1/people/${pitcherId}/spots/240`;
}
