/* Deterministic PRNG utilities shared by the offline render scenes.
   Pure functions of a seed so every render of a given scene is reproducible
   (byte-for-byte on the same GPU/driver). Mirrors mulberry32 + a string hash.

   Used CPU-side (scene setup, Ammo initial conditions). GPU-side randomness in
   the TSL compute passes uses three's `hash(instanceIndex)` which is likewise
   deterministic per particle index. */

export function hashStringToSeed(str) {
  // xfnv1a — small, stable string → uint32 seed.
  let h = 2166136261 >>> 0;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

export function mulberry32(seed) {
  let a = seed >>> 0;
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/* Convenience: a seeded RNG bundle with helpers used by the scenes. */
export function makePRNG(seed) {
  const rand =
    typeof seed === 'string' ? mulberry32(hashStringToSeed(seed)) : mulberry32(seed >>> 0);
  return {
    next: rand,
    range: (a, b) => a + rand() * (b - a),
    int: (a, b) => Math.floor(a + rand() * (b - a + 1)),
    sign: () => (rand() < 0.5 ? -1 : 1),
  };
}
