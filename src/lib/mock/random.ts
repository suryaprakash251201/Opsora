export function mulberry32(seed: number) {
  let state = seed;

  return function next() {
    state |= 0;
    state = (state + 0x6d2b79f5) | 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export interface Random {
  next: () => number;
  between: (min: number, max: number) => number;
  int: (min: number, max: number) => number;
  pick: <T>(items: readonly T[]) => T;
  walk: (
    length: number,
    start: number,
    volatility: number,
    min?: number,
    max?: number,
  ) => number[];
}

export function createRandom(seed: number): Random {
  const next = mulberry32(seed);

  const between = (min: number, max: number) => min + next() * (max - min);

  return {
    next,
    between,
    int: (min, max) => Math.floor(between(min, max + 1)),
    pick: (items) => items[Math.floor(next() * items.length)],
    walk: (length, start, volatility, min = 0, max = 100) => {
      const values: number[] = [];
      let current = start;
      for (let index = 0; index < length; index += 1) {
        current = Math.min(
          max,
          Math.max(min, current + (next() - 0.5) * volatility),
        );
        values.push(Number(current.toFixed(2)));
      }
      return values;
    },
  };
}

/** Smooth oscillation, useful to make polled values feel alive without jumping. */
export function oscillate(
  base: number,
  amplitude: number,
  periodMs: number,
  phase = 0,
  now = Date.now(),
): number {
  return base + amplitude * Math.sin((now / periodMs) * Math.PI * 2 + phase);
}

export function round(value: number, digits = 1): number {
  const factor = 10 ** digits;
  return Math.round(value * factor) / factor;
}

export function minutesAgo(minutes: number, now = Date.now()): string {
  return new Date(now - minutes * 60_000).toISOString();
}

export function hoursAgo(hours: number, now = Date.now()): string {
  return minutesAgo(hours * 60, now);
}

export function daysAgo(days: number, now = Date.now()): string {
  return minutesAgo(days * 60 * 24, now);
}
