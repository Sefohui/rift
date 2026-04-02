export interface Theme {
  id: string;
  name: string;
  vars: Record<string, string>;
}

export const themes: Theme[] = [
  // ── Void ──────────────────────────────────────────
  // Dark navy base, electric cyan glow. Sharp, cyberpunk feel.
  {
    id: 'void',
    name: 'Void',
    vars: {
      '--bg-primary':       '#10101e',
      '--bg-secondary':     '#16162c',
      '--bg-tertiary':      '#1e1e38',
      '--bg-split-even':    '#131324',
      '--bg-split-odd':     '#10101e',
      '--bg-split-active':  '#162030',
      '--text-primary':     '#e8eaf6',
      '--text-secondary':   '#6068a0',
      '--text-accent':      '#00d4ff',
      '--text-timer':       '#ffffff',
      '--text-ahead':       '#00ff9d',
      '--text-behind':      '#ff2d55',
      '--text-best':        '#ffe600',
      '--text-skipped':     '#3a3d50',
      '--border-color':     '#22223a',
      '--btn-primary-bg':   '#00d4ff',
      '--btn-primary-text': '#07070f',
      '--btn-danger-bg':    '#ff2d55',
      '--btn-danger-text':  '#ffffff',
      '--graph-current':    '#00d4ff',
      '--graph-pb':         '#ffe600',
      '--graph-grid':       '#1a1a2e',
      '--scrollbar-thumb':  '#28284a',
      '--glow-primary':     '#00d4ff',
      '--glow-primary-40':  'rgba(0, 212, 255, 0.40)',
      '--glow-primary-20':  'rgba(0, 212, 255, 0.20)',
      '--glow-primary-10':  'rgba(0, 212, 255, 0.10)',
      '--glow-ahead':       'rgba(0, 255, 157, 0.50)',
      '--glow-behind':      'rgba(255, 45, 85,  0.50)',
      '--glow-gold':        'rgba(255, 230, 0,  0.50)',
      '--header-gradient':  'linear-gradient(180deg, #1a1a30 0%, #10101e 100%)',
      '--split-active-bg':  'linear-gradient(90deg, rgba(0,212,255,0.10) 0%, transparent 100%)',
    },
  },

  // ── Ember ─────────────────────────────────────────
  // Dark warm brown base, fire-orange glow. Warm and intense.
  {
    id: 'ember',
    name: 'Ember',
    vars: {
      '--bg-primary':       '#181008',
      '--bg-secondary':     '#201610',
      '--bg-tertiary':      '#2c1e12',
      '--bg-split-even':    '#1c1309',
      '--bg-split-odd':     '#181008',
      '--bg-split-active':  '#2a1c0e',
      '--text-primary':     '#f5e6d0',
      '--text-secondary':   '#806050',
      '--text-accent':      '#ff7c2a',
      '--text-timer':       '#fff4ea',
      '--text-ahead':       '#00d97e',
      '--text-behind':      '#ff3c3c',
      '--text-best':        '#ffcc00',
      '--text-skipped':     '#3d2e1f',
      '--border-color':     '#2e2010',
      '--btn-primary-bg':   '#ff7c2a',
      '--btn-primary-text': '#0a0704',
      '--btn-danger-bg':    '#c0392b',
      '--btn-danger-text':  '#ffffff',
      '--graph-current':    '#ff7c2a',
      '--graph-pb':         '#ffcc00',
      '--graph-grid':       '#1e160a',
      '--scrollbar-thumb':  '#3a2a18',
      '--glow-primary':     '#ff7c2a',
      '--glow-primary-40':  'rgba(255, 124, 42, 0.40)',
      '--glow-primary-20':  'rgba(255, 124, 42, 0.20)',
      '--glow-primary-10':  'rgba(255, 124, 42, 0.10)',
      '--glow-ahead':       'rgba(0, 217, 126, 0.50)',
      '--glow-behind':      'rgba(255, 60, 60, 0.50)',
      '--glow-gold':        'rgba(255, 204, 0, 0.50)',
      '--header-gradient':  'linear-gradient(180deg, #251a0e 0%, #181008 100%)',
      '--split-active-bg':  'linear-gradient(90deg, rgba(255,124,42,0.12) 0%, transparent 100%)',
    },
  },

  // ── Aurora ────────────────────────────────────────
  // Deep navy base, teal-mint glow. Cool, spacious, calm.
  {
    id: 'aurora',
    name: 'Aurora',
    vars: {
      '--bg-primary':       '#0a1a20',
      '--bg-secondary':     '#0e2230',
      '--bg-tertiary':      '#142e3e',
      '--bg-split-even':    '#0c1e28',
      '--bg-split-odd':     '#0a1a20',
      '--bg-split-active':  '#102a38',
      '--text-primary':     '#cde8e0',
      '--text-secondary':   '#4d8070',
      '--text-accent':      '#00e5b0',
      '--text-timer':       '#eafff8',
      '--text-ahead':       '#39d353',
      '--text-behind':      '#ff6b6b',
      '--text-best':        '#f7c948',
      '--text-skipped':     '#1f3d35',
      '--border-color':     '#183040',
      '--btn-primary-bg':   '#00e5b0',
      '--btn-primary-text': '#030d12',
      '--btn-danger-bg':    '#c0392b',
      '--btn-danger-text':  '#ffffff',
      '--graph-current':    '#00e5b0',
      '--graph-pb':         '#f7c948',
      '--graph-grid':       '#0e2030',
      '--scrollbar-thumb':  '#1e3848',
      '--glow-primary':     '#00e5b0',
      '--glow-primary-40':  'rgba(0, 229, 176, 0.40)',
      '--glow-primary-20':  'rgba(0, 229, 176, 0.20)',
      '--glow-primary-10':  'rgba(0, 229, 176, 0.10)',
      '--glow-ahead':       'rgba(57, 211, 83, 0.50)',
      '--glow-behind':      'rgba(255, 107, 107, 0.50)',
      '--glow-gold':        'rgba(247, 201, 72, 0.50)',
      '--header-gradient':  'linear-gradient(180deg, #122838 0%, #0a1a20 100%)',
      '--split-active-bg':  'linear-gradient(90deg, rgba(0,229,176,0.10) 0%, transparent 100%)',
    },
  },

  // ── Neon Rose ─────────────────────────────────────
  // Deep purple base, hot-pink glow. Vaporwave vibes.
  {
    id: 'neon-rose',
    name: 'Neon Rose',
    vars: {
      '--bg-primary':       '#130a1e',
      '--bg-secondary':     '#1a1028',
      '--bg-tertiary':      '#241636',
      '--bg-split-even':    '#170d22',
      '--bg-split-odd':     '#130a1e',
      '--bg-split-active':  '#22143a',
      '--text-primary':     '#f0e0ff',
      '--text-secondary':   '#7a50a0',
      '--text-accent':      '#ff2d8a',
      '--text-timer':       '#fff0fa',
      '--text-ahead':       '#69ff47',
      '--text-behind':      '#ff4466',
      '--text-best':        '#ffd700',
      '--text-skipped':     '#3a1e50',
      '--border-color':     '#2c1840',
      '--btn-primary-bg':   '#ff2d8a',
      '--btn-primary-text': '#08040e',
      '--btn-danger-bg':    '#8b0030',
      '--btn-danger-text':  '#ffffff',
      '--graph-current':    '#ff2d8a',
      '--graph-pb':         '#ffd700',
      '--graph-grid':       '#1e0e30',
      '--scrollbar-thumb':  '#341a50',
      '--glow-primary':     '#ff2d8a',
      '--glow-primary-40':  'rgba(255, 45, 138, 0.40)',
      '--glow-primary-20':  'rgba(255, 45, 138, 0.20)',
      '--glow-primary-10':  'rgba(255, 45, 138, 0.10)',
      '--glow-ahead':       'rgba(105, 255, 71, 0.50)',
      '--glow-behind':      'rgba(255, 68, 102, 0.50)',
      '--glow-gold':        'rgba(255, 215, 0, 0.50)',
      '--header-gradient':  'linear-gradient(180deg, #1e1232 0%, #130a1e 100%)',
      '--split-active-bg':  'linear-gradient(90deg, rgba(255,45,138,0.12) 0%, transparent 100%)',
    },
  },
];

export function applyTheme(themeId: string) {
  const theme = themes.find((t) => t.id === themeId) ?? themes[0];
  const root = document.documentElement;
  for (const [key, val] of Object.entries(theme.vars)) {
    root.style.setProperty(key, val);
  }
}
