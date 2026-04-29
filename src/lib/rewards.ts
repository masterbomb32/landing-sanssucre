export interface Reward {
  id: string;
  title: string;
  description: string;
  emoji: string;
}

// Opening-day reward menu.
export const REWARDS: Reward[] = [
  {
    id: "reward-1",
    title: "Signature Cupcake",
    description: "Choose any classic cupcake from our opening collection.",
    emoji: "🧁",
  },
  {
    id: "reward-2",
    title: "Mini Macaron Box",
    description: "A trio of hand-piped French macarons to take home.",
    emoji: "🍬",
  },
  {
    id: "reward-3",
    title: "Petit Chocolate",
    description: "A small handcrafted chocolate bonbon, made in-house.",
    emoji: "🍫",
  },
];

export const getReward = (id: string) => REWARDS.find((r) => r.id === id);