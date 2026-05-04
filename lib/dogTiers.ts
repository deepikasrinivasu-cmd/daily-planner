export type DogTier = {
  minCoins: number
  rank: string
  helmet: string
  bg: string
  textColor: string
  desc: string
}

export const DOG_TIERS: DogTier[] = [
  { minCoins: 0,   rank: 'Earthling Pup',   helmet: '🌍', bg: '#E8F5E9', textColor: '#2E7D32', desc: 'Just starting the mission!' },
  { minCoins: 30,  rank: 'Space Cadet',     helmet: '🪖', bg: '#E3F2FD', textColor: '#1565C0', desc: 'Training for liftoff!' },
  { minCoins: 80,  rank: 'Astronaut Shizu', helmet: '👨‍🚀', bg: '#EDE7F6', textColor: '#4527A0', desc: 'Houston, we have a good boy!' },
  { minCoins: 150, rank: 'Moon Explorer',   helmet: '🌕', bg: '#FFFDE7', textColor: '#F57F17', desc: 'One small step for pup!' },
  { minCoins: 300, rank: 'Mars Pioneer',    helmet: '🔴', bg: '#FBE9E7', textColor: '#BF360C', desc: "The red planet's top dog!" },
  { minCoins: 500, rank: 'Galaxy Commander',helmet: '🌌', bg: '#FCE4EC', textColor: '#880E4F', desc: 'Exploring the unknown!' },
  { minCoins: 750, rank: 'Cosmic Legend',   helmet: '🏆', bg: '#FFF8E1', textColor: '#E65100', desc: 'Greatest space explorer EVER!' },
]

export function getDogTier(coins: number): DogTier {
  return [...DOG_TIERS].reverse().find((t) => coins >= t.minCoins) ?? DOG_TIERS[0]
}

export function getNextTier(coins: number): DogTier | null {
  return DOG_TIERS.find((t) => t.minCoins > coins) ?? null
}
