export interface Reward {
  id: string;
  title: string;
  description: string;
  emoji: string;
}

// Placeholder rewards — easy to edit later.
export const REWARDS: Reward[] = [
  {
    id: "reward-1",
    title: "Reward 1",
    description: "A delightful welcome treat (placeholder — edit in src/lib/rewards.ts).",
    emoji: "🍰",
  },
  {
    id: "reward-2",
    title: "Reward 2",
    description: "Another sweet surprise (placeholder — edit in src/lib/rewards.ts).",
    emoji: "🥐",
  },
  {
    id: "reward-3",
    title: "Reward 3",
    description: "A signature handcrafted gift (placeholder — edit in src/lib/rewards.ts).",
    emoji: "🍫",
  },
];

export const getReward = (id: string) => REWARDS.find((r) => r.id === id);