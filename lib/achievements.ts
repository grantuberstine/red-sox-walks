import type { PitcherStats } from "./types";

export type Achievement = {
  id: string;
  label: string;
  emoji: string;
  description: string;
};

export const ACHIEVEMENTS: Achievement[] = [
  { id: "first-walk", label: "Free Pass", emoji: "🆓", description: "Issued first walk of the season" },
  { id: "five-walks", label: "Generous", emoji: "🎁", description: "5 walks issued" },
  { id: "ten-walks", label: "Wild Card", emoji: "🎲", description: "10 walks issued" },
  { id: "fifteen-walks", label: "Walk Factory", emoji: "🏭", description: "15 walks issued" },
  { id: "first-four-pitch", label: "Auto-Walk", emoji: "🚶", description: "First 4-pitch walk" },
  { id: "three-four-pitch", label: "Hat Trick", emoji: "🎩", description: "3 4-pitch walks" },
  { id: "first-oh-two", label: "Choke Up", emoji: "😬", description: "Walked a batter after going up 0-2" },
  { id: "three-oh-two", label: "0-2 Specialist", emoji: "🎯", description: "3 walks after going 0-2" },
  { id: "first-leadoff", label: "Setting the Table", emoji: "🍽️", description: "First leadoff walk" },
  { id: "five-leadoff", label: "Welcome Wagon", emoji: "🛻", description: "5 leadoff walks" },
  { id: "first-two-out", label: "Extender", emoji: "🪢", description: "First 2-out walk" },
  { id: "five-two-out", label: "Inning Stretcher", emoji: "🤸", description: "5 two-out walks" },
  { id: "all-four", label: "Bingo", emoji: "🎰", description: "Hit every walk category at least once" },
];

const BY_ID = new Map(ACHIEVEMENTS.map((a) => [a.id, a]));

export function computeAchievements(p: PitcherStats): string[] {
  const earned: string[] = [];
  if (p.totalWalks >= 1) earned.push("first-walk");
  if (p.totalWalks >= 5) earned.push("five-walks");
  if (p.totalWalks >= 10) earned.push("ten-walks");
  if (p.totalWalks >= 15) earned.push("fifteen-walks");
  if (p.fourPitchWalks >= 1) earned.push("first-four-pitch");
  if (p.fourPitchWalks >= 3) earned.push("three-four-pitch");
  if (p.ohTwoWalks >= 1) earned.push("first-oh-two");
  if (p.ohTwoWalks >= 3) earned.push("three-oh-two");
  if (p.leadoffWalks >= 1) earned.push("first-leadoff");
  if (p.leadoffWalks >= 5) earned.push("five-leadoff");
  if (p.twoOutWalks >= 1) earned.push("first-two-out");
  if (p.twoOutWalks >= 5) earned.push("five-two-out");
  if (
    p.fourPitchWalks > 0 &&
    p.ohTwoWalks > 0 &&
    p.leadoffWalks > 0 &&
    p.twoOutWalks > 0
  ) {
    earned.push("all-four");
  }
  return earned;
}

export function achievementById(id: string): Achievement | undefined {
  return BY_ID.get(id);
}

export function headshotUrl(pitcherId: number): string {
  return `https://midfield.mlbstatic.com/v1/people/${pitcherId}/spots/120`;
}
