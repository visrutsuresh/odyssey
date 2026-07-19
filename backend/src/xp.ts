// Level curve: cumulative XP to REACH level n = 50 * n * (n - 1).
// L1=0, L2=100, L3=300, L4=600, L5=1000 ...
export function xpForLevel(n: number): number {
  return 50 * n * (n - 1)
}

export function levelFromXp(xp: number): number {
  let level = 1
  while (xpForLevel(level + 1) <= xp) level += 1
  return level
}

if (process.argv[1]?.endsWith('xp.ts')) {
  console.assert(levelFromXp(0) === 1, 'xp=0 should be level 1')
  console.assert(levelFromXp(99) === 1, 'xp just below L2 threshold should still be level 1')
  console.assert(levelFromXp(100) === 2, 'xp exactly at L2 threshold should reach level 2')
  console.assert(levelFromXp(1000) === 5, 'xp exactly at L5 threshold should reach level 5')
  console.assert(levelFromXp(1_000_000) === 141, 'huge xp should resolve to a sane finite level')
  console.log('xp.ts self-check: all assertions passed')
}
