export interface SkinPreset {
  id: string;
  name: string;
  emoji: string;
  description: string;
  colors: {
    light: {
      primary: string;
      accent: string;
      background: string;
      card: string;
      muted: string;
      border: string;
    };
    dark: {
      primary: string;
      accent: string;
      background: string;
      card: string;
      muted: string;
      border: string;
    };
  };
  /** Two gradient stops for the preview swatch */
  preview: [string, string];
}

export const PRESETS: SkinPreset[] = [
  {
    id: 'default',
    name: 'Padrão',
    emoji: '💜',
    description: 'Roxo vibrante original',
    preview: ['hsl(234 72% 58%)', 'hsl(172 50% 45%)'],
    colors: {
      light: {
        primary: '234 72% 58%',
        accent: '172 50% 45%',
        background: '220 20% 97%',
        card: '0 0% 100%',
        muted: '220 16% 94%',
        border: '220 13% 90%',
      },
      dark: {
        primary: '234 75% 65%',
        accent: '172 45% 48%',
        background: '224 28% 6%',
        card: '224 24% 10%',
        muted: '224 18% 14%',
        border: '224 16% 16%',
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
        card: '0 0% 100%',
        muted: '216 16% 94%',
        border: '216 13% 90%',
      },
      dark: {
        primary: '217 71% 60%',
        accent: '210 70% 55%',
        background: '220 28% 6%',
        card: '220 24% 10%',
        muted: '220 18% 14%',
        border: '220 16% 16%',
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
        card: '0 0% 100%',
        muted: '150 14% 94%',
        border: '150 12% 90%',
      },
      dark: {
        primary: '160 72% 45%',
        accent: '152 50% 52%',
        background: '160 28% 5%',
        card: '160 22% 9%',
        muted: '160 18% 13%',
        border: '160 14% 15%',
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
        card: '0 0% 100%',
        muted: '30 16% 94%',
        border: '30 13% 90%',
      },
      dark: {
        primary: '25 90% 58%',
        accent: '38 85% 55%',
        background: '20 28% 6%',
        card: '20 24% 10%',
        muted: '20 18% 14%',
        border: '20 16% 16%',
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
        card: '0 0% 100%',
        muted: '340 14% 94%',
        border: '340 12% 90%',
      },
      dark: {
        primary: '346 72% 58%',
        accent: '330 60% 62%',
        background: '340 25% 6%',
        card: '340 20% 10%',
        muted: '340 16% 14%',
        border: '340 14% 16%',
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
        card: '0 0% 100%',
        muted: '220 12% 94%',
        border: '220 10% 90%',
      },
      dark: {
        primary: '220 14% 62%',
        accent: '220 10% 58%',
        background: '220 18% 8%',
        card: '220 16% 12%',
        muted: '220 14% 16%',
        border: '220 12% 18%',
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
        card: '0 0% 100%',
        muted: '200 16% 94%',
        border: '200 13% 90%',
      },
      dark: {
        primary: '199 80% 55%',
        accent: '190 70% 48%',
        background: '200 30% 5%',
        card: '200 25% 9%',
        muted: '200 20% 13%',
        border: '200 16% 15%',
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
        card: '0 0% 100%',
        muted: '40 16% 94%',
        border: '40 13% 90%',
      },
      dark: {
        primary: '38 85% 55%',
        accent: '45 80% 58%',
        background: '35 25% 6%',
        card: '35 20% 10%',
        muted: '35 16% 14%',
        border: '35 14% 16%',
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
        card: '0 0% 100%',
        muted: '200 14% 94%',
        border: '200 12% 90%',
      },
      dark: {
        primary: '174 90% 48%',
        accent: '290 70% 62%',
        background: '210 30% 5%',
        card: '210 25% 9%',
        muted: '210 20% 13%',
        border: '210 16% 15%',
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
        card: '0 0% 100%',
        muted: '265 14% 94%',
        border: '265 12% 90%',
      },
      dark: {
        primary: '270 55% 65%',
        accent: '260 50% 68%',
        background: '265 25% 6%',
        card: '265 20% 10%',
        muted: '265 16% 14%',
        border: '265 14% 16%',
      },
    },
  },
];
