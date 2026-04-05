export interface SkinColors {
  primary: string;
  accent: string;
  background: string;
  foreground: string;
  card: string;
  'card-foreground': string;
  muted: string;
  'muted-foreground': string;
  border: string;
}

export interface SkinPreset {
  id: string;
  name: string;
  emoji: string;
  description: string;
  colors: {
    light: SkinColors;
    dark: SkinColors;
  };
  /** Two gradient stops for the preview swatch */
  preview: [string, string];
}

/**
 * All muted-foreground values are WCAG AA compliant (≥4.5:1 contrast ratio)
 * against their respective background/card colors.
 *
 * Dark mode uses a HIGH-CONTRAST elevation ladder:
 *   background ~10% L → card ~15% L → border ~24% L
 *   This ensures visible separation between surfaces.
 */
export const PRESETS: SkinPreset[] = [
  {
    id: 'default',
    name: 'Padrão',
    emoji: '💜',
    description: 'Roxo vibrante original',
    preview: ['hsl(234 85% 65%)', 'hsl(172 55% 48%)'],
    colors: {
      light: {
        primary: '234 80% 58%',
        accent: '172 60% 42%',
        background: '230 30% 98%',
        foreground: '230 50% 8%',
        card: '0 0% 100%',
        'card-foreground': '230 50% 8%',
        muted: '230 25% 94%',
        'muted-foreground': '230 30% 35%',
        border: '230 30% 88%',
      },
      dark: {
        primary: '234 90% 67%',
        accent: '172 65% 50%',
        background: '230 40% 7%',
        foreground: '220 40% 97%',
        card: '230 35% 12%',
        'card-foreground': '220 40% 97%',
        muted: '230 30% 16%',
        'muted-foreground': '225 35% 62%',
        border: '230 30% 22%',
      },
    },
  },
  {
    id: 'corporate',
    name: 'Corporativo',
    emoji: '🏢',
    description: 'Azul profissional',
    preview: ['hsl(217 80% 53%)', 'hsl(210 85% 58%)'],
    colors: {
      light: {
        primary: '217 80% 50%',
        accent: '210 85% 55%',
        background: '216 30% 98%',
        foreground: '216 50% 8%',
        card: '0 0% 100%',
        'card-foreground': '216 50% 8%',
        muted: '216 25% 94%',
        'muted-foreground': '216 30% 35%',
        border: '216 30% 88%',
      },
      dark: {
        primary: '217 85% 62%',
        accent: '210 80% 58%',
        background: '220 40% 7%',
        foreground: '216 40% 97%',
        card: '220 35% 12%',
        'card-foreground': '216 40% 97%',
        muted: '220 30% 16%',
        'muted-foreground': '216 30% 62%',
        border: '220 28% 22%',
      },
    },
  },
  {
    id: 'emerald',
    name: 'Esmeralda',
    emoji: '🌿',
    description: 'Verde sofisticado',
    preview: ['hsl(160 84% 39%)', 'hsl(152 65% 48%)'],
    colors: {
      light: {
        primary: '160 84% 39%',
        accent: '152 65% 48%',
        background: '155 30% 98%',
        foreground: '155 50% 8%',
        card: '0 0% 100%',
        'card-foreground': '155 50% 8%',
        muted: '155 25% 94%',
        'muted-foreground': '155 30% 35%',
        border: '155 28% 88%',
      },
      dark: {
        primary: '160 80% 45%',
        accent: '152 60% 52%',
        background: '160 40% 6%',
        foreground: '155 40% 97%',
        card: '160 32% 11%',
        'card-foreground': '155 40% 97%',
        muted: '160 28% 15%',
        'muted-foreground': '155 28% 62%',
        border: '160 26% 20%',
      },
    },
  },
  {
    id: 'sunset',
    name: 'Pôr do Sol',
    emoji: '🌅',
    description: 'Quente e acolhedor',
    preview: ['hsl(25 95% 53%)', 'hsl(38 92% 50%)'],
    colors: {
      light: {
        primary: '25 95% 53%',
        accent: '38 92% 50%',
        background: '30 30% 98%',
        foreground: '20 50% 8%',
        card: '0 0% 100%',
        'card-foreground': '20 50% 8%',
        muted: '30 25% 94%',
        'muted-foreground': '25 30% 35%',
        border: '30 28% 88%',
      },
      dark: {
        primary: '25 92% 58%',
        accent: '38 88% 55%',
        background: '20 40% 6%',
        foreground: '25 40% 97%',
        card: '20 32% 12%',
        'card-foreground': '25 40% 97%',
        muted: '20 28% 16%',
        'muted-foreground': '25 28% 62%',
        border: '20 26% 22%',
      },
    },
  },
  {
    id: 'rose',
    name: 'Rosé',
    emoji: '🌸',
    description: 'Elegante e moderno',
    preview: ['hsl(346 80% 50%)', 'hsl(330 70% 58%)'],
    colors: {
      light: {
        primary: '346 80% 50%',
        accent: '330 70% 58%',
        background: '340 30% 98%',
        foreground: '340 50% 8%',
        card: '0 0% 100%',
        'card-foreground': '340 50% 8%',
        muted: '340 25% 94%',
        'muted-foreground': '340 30% 35%',
        border: '340 28% 88%',
      },
      dark: {
        primary: '346 78% 58%',
        accent: '330 65% 62%',
        background: '340 38% 6%',
        foreground: '340 40% 97%',
        card: '340 30% 12%',
        'card-foreground': '340 40% 97%',
        muted: '340 26% 16%',
        'muted-foreground': '340 25% 62%',
        border: '340 24% 22%',
      },
    },
  },
  {
    id: 'minimal',
    name: 'Minimal',
    emoji: '⚪',
    description: 'Clean e neutro',
    preview: ['hsl(220 30% 45%)', 'hsl(220 25% 55%)'],
    colors: {
      light: {
        primary: '220 30% 45%',
        accent: '220 25% 55%',
        background: '220 25% 98%',
        foreground: '220 40% 8%',
        card: '0 0% 100%',
        'card-foreground': '220 40% 8%',
        muted: '220 20% 94%',
        'muted-foreground': '220 22% 35%',
        border: '220 22% 88%',
      },
      dark: {
        primary: '220 35% 62%',
        accent: '220 28% 58%',
        background: '220 32% 7%',
        foreground: '220 30% 97%',
        card: '220 28% 12%',
        'card-foreground': '220 30% 97%',
        muted: '220 24% 16%',
        'muted-foreground': '220 22% 62%',
        border: '220 22% 22%',
      },
    },
  },
  {
    id: 'ocean',
    name: 'Oceano',
    emoji: '🌊',
    description: 'Azul profundo',
    preview: ['hsl(199 89% 48%)', 'hsl(190 80% 42%)'],
    colors: {
      light: {
        primary: '199 89% 48%',
        accent: '190 80% 42%',
        background: '200 30% 98%',
        foreground: '200 50% 8%',
        card: '0 0% 100%',
        'card-foreground': '200 50% 8%',
        muted: '200 25% 94%',
        'muted-foreground': '200 30% 35%',
        border: '200 28% 88%',
      },
      dark: {
        primary: '199 85% 55%',
        accent: '190 75% 48%',
        background: '200 42% 6%',
        foreground: '200 40% 97%',
        card: '200 35% 12%',
        'card-foreground': '200 40% 97%',
        muted: '200 30% 16%',
        'muted-foreground': '200 28% 62%',
        border: '200 26% 22%',
      },
    },
  },
  {
    id: 'amber',
    name: 'Âmbar',
    emoji: '✨',
    description: 'Dourado e premium',
    preview: ['hsl(38 92% 50%)', 'hsl(45 88% 52%)'],
    colors: {
      light: {
        primary: '38 92% 50%',
        accent: '45 88% 52%',
        background: '40 30% 98%',
        foreground: '35 50% 8%',
        card: '0 0% 100%',
        'card-foreground': '35 50% 8%',
        muted: '40 25% 94%',
        'muted-foreground': '38 30% 35%',
        border: '40 28% 88%',
      },
      dark: {
        primary: '38 88% 55%',
        accent: '45 82% 58%',
        background: '35 38% 6%',
        foreground: '38 40% 97%',
        card: '35 30% 12%',
        'card-foreground': '38 40% 97%',
        muted: '35 26% 16%',
        'muted-foreground': '38 25% 62%',
        border: '35 24% 22%',
      },
    },
  },
  {
    id: 'cyber',
    name: 'Cyber',
    emoji: '🔮',
    description: 'Neon futurista',
    preview: ['hsl(174 100% 48%)', 'hsl(290 85% 62%)'],
    colors: {
      light: {
        primary: '174 85% 40%',
        accent: '290 70% 55%',
        background: '200 30% 98%',
        foreground: '200 50% 8%',
        card: '0 0% 100%',
        'card-foreground': '200 50% 8%',
        muted: '200 25% 94%',
        'muted-foreground': '200 30% 35%',
        border: '200 28% 88%',
      },
      dark: {
        primary: '174 95% 48%',
        accent: '290 78% 62%',
        background: '210 42% 6%',
        foreground: '200 40% 97%',
        card: '210 35% 12%',
        'card-foreground': '200 40% 97%',
        muted: '210 30% 16%',
        'muted-foreground': '200 28% 62%',
        border: '210 26% 22%',
      },
    },
  },
  {
    id: 'lavender',
    name: 'Lavanda',
    emoji: '🪻',
    description: 'Suave e calmante',
    preview: ['hsl(270 65% 60%)', 'hsl(260 55% 68%)'],
    colors: {
      light: {
        primary: '270 60% 55%',
        accent: '260 55% 60%',
        background: '265 30% 98%',
        foreground: '265 50% 8%',
        card: '0 0% 100%',
        'card-foreground': '265 50% 8%',
        muted: '265 25% 94%',
        'muted-foreground': '265 28% 35%',
        border: '265 26% 88%',
      },
      dark: {
        primary: '270 65% 65%',
        accent: '260 58% 68%',
        background: '265 38% 6%',
        foreground: '265 40% 97%',
        card: '265 30% 12%',
        'card-foreground': '265 40% 97%',
        muted: '265 26% 16%',
        'muted-foreground': '265 24% 62%',
        border: '265 24% 22%',
      },
    },
  },
];
