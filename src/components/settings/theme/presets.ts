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
        primary: '234 72% 58%',
        accent: '172 50% 45%',
        background: '220 20% 97%',
        foreground: '220 25% 12%',
        card: '0 0% 100%',
        'card-foreground': '220 25% 12%',
        muted: '220 16% 94%',
        'muted-foreground': '220 10% 40%',
        border: '220 13% 90%',
      },
      dark: {
        primary: '234 85% 65%',
        accent: '172 55% 48%',
        background: '225 25% 10%',
        foreground: '210 20% 96%',
        card: '224 22% 15%',
        'card-foreground': '210 20% 96%',
        muted: '224 18% 18%',
        'muted-foreground': '215 16% 65%',
        border: '224 16% 24%',
      },
    },
  },
  {
    id: 'corporate',
    name: 'Corporativo',
    emoji: '🏢',
    description: 'Azul profissional',
    preview: ['hsl(217 71% 53%)', 'hsl(210 78% 60%)'],
    colors: {
      light: {
        primary: '217 71% 53%',
        accent: '210 78% 60%',
        background: '216 20% 97%',
        foreground: '216 25% 12%',
        card: '0 0% 100%',
        'card-foreground': '216 25% 12%',
        muted: '216 16% 94%',
        'muted-foreground': '216 10% 40%',
        border: '216 13% 90%',
      },
      dark: {
        primary: '217 71% 60%',
        accent: '210 70% 55%',
        background: '220 25% 10%',
        foreground: '216 18% 94%',
        card: '220 22% 15%',
        'card-foreground': '216 18% 94%',
        muted: '220 18% 18%',
        'muted-foreground': '216 12% 65%',
        border: '220 16% 24%',
      },
    },
  },
  {
    id: 'emerald',
    name: 'Esmeralda',
    emoji: '🌿',
    description: 'Verde sofisticado',
    preview: ['hsl(160 84% 39%)', 'hsl(152 55% 50%)'],
    colors: {
      light: {
        primary: '160 84% 39%',
        accent: '152 55% 50%',
        background: '150 20% 97%',
        foreground: '150 25% 10%',
        card: '0 0% 100%',
        'card-foreground': '150 25% 10%',
        muted: '150 14% 94%',
        'muted-foreground': '150 10% 40%',
        border: '150 12% 90%',
      },
      dark: {
        primary: '160 72% 45%',
        accent: '152 50% 52%',
        background: '160 25% 9%',
        foreground: '150 18% 94%',
        card: '160 20% 14%',
        'card-foreground': '150 18% 94%',
        muted: '160 16% 17%',
        'muted-foreground': '150 12% 65%',
        border: '160 14% 22%',
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
        background: '30 20% 97%',
        foreground: '20 25% 12%',
        card: '0 0% 100%',
        'card-foreground': '20 25% 12%',
        muted: '30 16% 94%',
        'muted-foreground': '20 10% 40%',
        border: '30 13% 90%',
      },
      dark: {
        primary: '25 90% 58%',
        accent: '38 85% 55%',
        background: '20 25% 9%',
        foreground: '20 18% 94%',
        card: '20 22% 14%',
        'card-foreground': '20 18% 94%',
        muted: '20 18% 17%',
        'muted-foreground': '20 12% 65%',
        border: '20 16% 22%',
      },
    },
  },
  {
    id: 'rose',
    name: 'Rosé',
    emoji: '🌸',
    description: 'Elegante e moderno',
    preview: ['hsl(346 77% 50%)', 'hsl(330 65% 60%)'],
    colors: {
      light: {
        primary: '346 77% 50%',
        accent: '330 65% 60%',
        background: '340 20% 97%',
        foreground: '340 25% 12%',
        card: '0 0% 100%',
        'card-foreground': '340 25% 12%',
        muted: '340 14% 94%',
        'muted-foreground': '340 10% 40%',
        border: '340 12% 90%',
      },
      dark: {
        primary: '346 72% 58%',
        accent: '330 60% 62%',
        background: '340 22% 9%',
        foreground: '340 18% 94%',
        card: '340 18% 14%',
        'card-foreground': '340 18% 94%',
        muted: '340 14% 17%',
        'muted-foreground': '340 10% 65%',
        border: '340 14% 22%',
      },
    },
  },
  {
    id: 'minimal',
    name: 'Minimal',
    emoji: '⚪',
    description: 'Clean e neutro',
    preview: ['hsl(220 10% 50%)', 'hsl(220 8% 60%)'],
    colors: {
      light: {
        primary: '220 14% 46%',
        accent: '220 10% 55%',
        background: '220 20% 97%',
        foreground: '220 20% 12%',
        card: '0 0% 100%',
        'card-foreground': '220 20% 12%',
        muted: '220 12% 94%',
        'muted-foreground': '220 8% 40%',
        border: '220 10% 90%',
      },
      dark: {
        primary: '220 14% 62%',
        accent: '220 10% 58%',
        background: '220 18% 10%',
        foreground: '220 12% 94%',
        card: '220 16% 15%',
        'card-foreground': '220 12% 94%',
        muted: '220 14% 18%',
        'muted-foreground': '220 8% 65%',
        border: '220 12% 24%',
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
        background: '200 20% 97%',
        foreground: '200 25% 10%',
        card: '0 0% 100%',
        'card-foreground': '200 25% 10%',
        muted: '200 16% 94%',
        'muted-foreground': '200 10% 40%',
        border: '200 13% 90%',
      },
      dark: {
        primary: '199 80% 55%',
        accent: '190 70% 48%',
        background: '200 28% 9%',
        foreground: '200 18% 94%',
        card: '200 23% 14%',
        'card-foreground': '200 18% 94%',
        muted: '200 18% 17%',
        'muted-foreground': '200 12% 65%',
        border: '200 16% 22%',
      },
    },
  },
  {
    id: 'amber',
    name: 'Âmbar',
    emoji: '✨',
    description: 'Dourado e premium',
    preview: ['hsl(38 90% 50%)', 'hsl(45 85% 55%)'],
    colors: {
      light: {
        primary: '38 90% 50%',
        accent: '45 85% 55%',
        background: '40 20% 97%',
        foreground: '35 25% 12%',
        card: '0 0% 100%',
        'card-foreground': '35 25% 12%',
        muted: '40 16% 94%',
        'muted-foreground': '35 10% 40%',
        border: '40 13% 90%',
      },
      dark: {
        primary: '38 85% 55%',
        accent: '45 80% 58%',
        background: '35 22% 9%',
        foreground: '35 18% 94%',
        card: '35 18% 14%',
        'card-foreground': '35 18% 94%',
        muted: '35 14% 17%',
        'muted-foreground': '35 10% 65%',
        border: '35 14% 22%',
      },
    },
  },
  {
    id: 'cyber',
    name: 'Cyber',
    emoji: '🔮',
    description: 'Neon futurista',
    preview: ['hsl(174 100% 50%)', 'hsl(290 80% 60%)'],
    colors: {
      light: {
        primary: '174 80% 40%',
        accent: '290 60% 55%',
        background: '200 20% 97%',
        foreground: '200 25% 10%',
        card: '0 0% 100%',
        'card-foreground': '200 25% 10%',
        muted: '200 14% 94%',
        'muted-foreground': '200 10% 40%',
        border: '200 12% 90%',
      },
      dark: {
        primary: '174 90% 48%',
        accent: '290 70% 62%',
        background: '210 28% 9%',
        foreground: '200 18% 94%',
        card: '210 23% 14%',
        'card-foreground': '200 18% 94%',
        muted: '210 18% 17%',
        'muted-foreground': '200 12% 65%',
        border: '210 16% 22%',
      },
    },
  },
  {
    id: 'lavender',
    name: 'Lavanda',
    emoji: '🪻',
    description: 'Suave e calmante',
    preview: ['hsl(270 60% 62%)', 'hsl(260 50% 70%)'],
    colors: {
      light: {
        primary: '270 50% 55%',
        accent: '260 45% 62%',
        background: '265 20% 97%',
        foreground: '265 25% 12%',
        card: '0 0% 100%',
        'card-foreground': '265 25% 12%',
        muted: '265 14% 94%',
        'muted-foreground': '265 10% 40%',
        border: '265 12% 90%',
      },
      dark: {
        primary: '270 55% 65%',
        accent: '260 50% 68%',
        background: '265 22% 9%',
        foreground: '265 18% 94%',
        card: '265 18% 14%',
        'card-foreground': '265 18% 94%',
        muted: '265 14% 17%',
        'muted-foreground': '265 10% 65%',
        border: '265 14% 22%',
      },
    },
  },
];
