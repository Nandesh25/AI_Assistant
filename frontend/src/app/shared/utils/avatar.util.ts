/** Deterministic gradient + initials helpers for avatars. */
const GRADIENTS: [string, string][] = [
  ['#6366f1', '#8b5cf6'], // indigo → violet
  ['#0ea5e9', '#2563eb'], // sky → blue
  ['#10b981', '#059669'], // emerald
  ['#f59e0b', '#ea580c'], // amber → orange
  ['#ec4899', '#db2777'], // pink
  ['#14b8a6', '#0d9488'], // teal
  ['#f43f5e', '#e11d48'], // rose
  ['#8b5cf6', '#6d28d9'], // violet
];

function hash(value: string): number {
  let h = 0;
  for (let i = 0; i < value.length; i++) {
    h = (h << 5) - h + value.charCodeAt(i);
    h |= 0;
  }
  return Math.abs(h);
}

export function gradientFor(value: string): string {
  const [from, to] = GRADIENTS[hash(value) % GRADIENTS.length];
  return `linear-gradient(135deg, ${from}, ${to})`;
}

export function initialsFor(value: string): string {
  const parts = value.trim().split(/[\s_.-]+/).filter(Boolean);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}
