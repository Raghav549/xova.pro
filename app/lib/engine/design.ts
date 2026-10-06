import type { Theme } from './types';

export const THEMES: Theme[] = [
  {
    id: 'nebula',
    name: 'Nebula',
    mode: 'dark',
    bg: '#05060f',
    bgAlt: '#0a0c1c',
    surface: 'rgba(255,255,255,0.04)',
    border: 'rgba(255,255,255,0.10)',
    text: '#f4f6ff',
    muted: 'rgba(244,246,255,0.62)',
    accent: '#7c5cff',
    accent2: '#22d3ee',
    accent3: '#ff5fa2',
    radius: '18px',
    fontHeading: "'Sora', 'Inter', system-ui, sans-serif",
    fontBody: "'Inter', system-ui, sans-serif",
    mono: "'JetBrains Mono', ui-monospace, SFMono-Regular, Menlo, monospace",
  },
  {
    id: 'aurora',
    name: 'Aurora',
    mode: 'dark',
    bg: '#030711',
    bgAlt: '#061120',
    surface: 'rgba(120,220,255,0.06)',
    border: 'rgba(140,220,255,0.16)',
    text: '#eaf6ff',
    muted: 'rgba(234,246,255,0.6)',
    accent: '#22d3ee',
    accent2: '#34d399',
    accent3: '#a78bfa',
    radius: '20px',
    fontHeading: "'Sora', 'Inter', system-ui, sans-serif",
    fontBody: "'Inter', system-ui, sans-serif",
    mono: "'JetBrains Mono', ui-monospace, monospace",
  },
  {
    id: 'ember',
    name: 'Ember',
    mode: 'dark',
    bg: '#0d0705',
    bgAlt: '#180c07',
    surface: 'rgba(255,180,120,0.07)',
    border: 'rgba(255,170,110,0.18)',
    text: '#fff5ec',
    muted: 'rgba(255,245,236,0.62)',
    accent: '#ff7a18',
    accent2: '#ffd166',
    accent3: '#ef476f',
    radius: '16px',
    fontHeading: "'Sora', 'Inter', system-ui, sans-serif",
    fontBody: "'Inter', system-ui, sans-serif",
    mono: "'JetBrains Mono', ui-monospace, monospace",
  },
  {
    id: 'porcelain',
    name: 'Porcelain',
    mode: 'light',
    bg: '#f7f8fc',
    bgAlt: '#ffffff',
    surface: 'rgba(15,18,45,0.03)',
    border: 'rgba(15,18,45,0.10)',
    text: '#0d1030',
    muted: 'rgba(13,16,48,0.62)',
    accent: '#4f46e5',
    accent2: '#0ea5e9',
    accent3: '#db2777',
    radius: '16px',
    fontHeading: "'Sora', 'Inter', system-ui, sans-serif",
    fontBody: "'Inter', system-ui, sans-serif",
    mono: "'JetBrains Mono', ui-monospace, monospace",
  },
  {
    id: 'carbon',
    name: 'Carbon',
    mode: 'dark',
    bg: '#0a0a0a',
    bgAlt: '#111214',
    surface: 'rgba(255,255,255,0.035)',
    border: 'rgba(255,255,255,0.09)',
    text: '#fafafa',
    muted: 'rgba(250,250,250,0.6)',
    accent: '#facc15',
    accent2: '#38bdf8',
    accent3: '#f472b6',
    radius: '14px',
    fontHeading: "'Sora', 'Inter', system-ui, sans-serif",
    fontBody: "'Inter', system-ui, sans-serif",
    mono: "'JetBrains Mono', ui-monospace, monospace",
  },
  {
    id: 'botanic',
    name: 'Botanic',
    mode: 'light',
    bg: '#f6fbf7',
    bgAlt: '#ffffff',
    surface: 'rgba(6,60,40,0.04)',
    border: 'rgba(6,60,40,0.12)',
    text: '#07251a',
    muted: 'rgba(7,37,26,0.62)',
    accent: '#059669',
    accent2: '#0891b2',
    accent3: '#84cc16',
    radius: '22px',
    fontHeading: "'Sora', 'Inter', system-ui, sans-serif",
    fontBody: "'Inter', system-ui, sans-serif",
    mono: "'JetBrains Mono', ui-monospace, monospace",
  },
];

const THEME_HINTS: Array<{ theme: string; words: string[] }> = [
  { theme: 'ember', words: ['fire', 'ember', 'warm', 'restaurant', 'food', 'energy', 'sunset', 'coffee', 'spice'] },
  { theme: 'aurora', words: ['ocean', 'water', 'green', 'eco', 'climate', 'health', 'calm', 'science', 'bio'] },
  {
    theme: 'porcelain',
    words: ['minimal', 'clean', 'light', 'white', 'editorial', 'legal', 'finance', 'bank', 'docs'],
  },
  { theme: 'carbon', words: ['studio', 'brutal', 'bold', 'industrial', 'sports', 'car', 'gym', 'music'] },
  { theme: 'botanic', words: ['plant', 'garden', 'nature', 'wellness', 'yoga', 'organic', 'farm', 'travel'] },
  { theme: 'nebula', words: ['ai', 'saas', 'startup', 'space', 'future', 'cyber', 'neon', 'crypto', '3d', 'physics'] },
];

export function pickTheme(prompt: string): Theme {
  const p = prompt.toLowerCase();
  let best = 'nebula';
  let bestScore = 0;

  for (const hint of THEME_HINTS) {
    const score = hint.words.reduce((acc, word) => (p.includes(word) ? acc + 1 : acc), 0);

    if (score > bestScore) {
      bestScore = score;
      best = hint.theme;
    }
  }

  return THEMES.find((theme) => theme.id === best) ?? THEMES[0];
}

export function themeVars(theme: Theme): string {
  return [
    `--bg:${theme.bg}`,
    `--bg-alt:${theme.bgAlt}`,
    `--surface:${theme.surface}`,
    `--border:${theme.border}`,
    `--text:${theme.text}`,
    `--muted:${theme.muted}`,
    `--accent:${theme.accent}`,
    `--accent-2:${theme.accent2}`,
    `--accent-3:${theme.accent3}`,
    `--radius:${theme.radius}`,
    `--font-heading:${theme.fontHeading}`,
    `--font-body:${theme.fontBody}`,
    `--mono:${theme.mono}`,
  ].join(';');
}

const STOP_WORDS = new Set([
  'build',
  'create',
  'make',
  'a',
  'an',
  'the',
  'for',
  'with',
  'and',
  'using',
  'use',
  'my',
  'me',
  'i',
  'website',
  'site',
  'app',
  'application',
  'please',
  'want',
  'need',
  'that',
  'this',
  'to',
  'of',
  'in',
  'on',
  'it',
  'would',
  'like',
  'some',
  'very',
  'really',
  'high',
  'quality',
  'real',
  'responsive',
  'beautiful',
]);

export function keywords(prompt: string): string[] {
  return Array.from(
    new Set(
      prompt
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, ' ')
        .split(/\s+/)
        .filter((word) => word.length > 2 && !STOP_WORDS.has(word)),
    ),
  );
}

export function titleCase(value: string): string {
  return value
    .split(/\s+/)
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

export function brandFromPrompt(prompt: string, fallback = 'Nova'): string {
  const quoted = /["'“”]([^"'“”]{2,24})["'“”]/.exec(prompt);

  if (quoted && quoted[1]) {
    return titleCase(quoted[1].trim());
  }

  const named = /\b(?:called|named|for)\s+([A-Z][A-Za-z0-9]{2,18})/.exec(prompt);

  if (named && named[1]) {
    return named[1];
  }

  const words = keywords(prompt).filter((word) => word.length > 3);

  if (words.length === 0) {
    return fallback;
  }

  const base = words[0].replace(/(ing|ers|er|s)$/, '');

  return titleCase(base.charAt(0).toUpperCase() + base.slice(1));
}

export function slugify(value: string): string {
  return (
    value
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '')
      .slice(0, 40) || 'xova-project'
  );
}
