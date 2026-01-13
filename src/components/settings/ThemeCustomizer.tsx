import { useState, useEffect, useCallback, memo } from 'react';
import { motion } from 'framer-motion';
import { Palette, Check, RotateCcw, Sparkles } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface ColorPreset {
  id: string;
  name: string;
  primary: string;
  accent: string;
  description: string;
}

const COLOR_PRESETS: ColorPreset[] = [
  {
    id: 'default',
    name: 'Azul Profissional',
    primary: '221 83% 53%',
    accent: '160 84% 39%',
    description: 'Tema padrão elegante e profissional',
  },
  {
    id: 'emerald',
    name: 'Esmeralda',
    primary: '160 84% 39%',
    accent: '221 83% 53%',
    description: 'Verde vibrante para produtividade',
  },
  {
    id: 'purple',
    name: 'Roxo Real',
    primary: '280 67% 50%',
    accent: '330 81% 60%',
    description: 'Elegância e criatividade',
  },
  {
    id: 'orange',
    name: 'Laranja Energia',
    primary: '25 95% 53%',
    accent: '38 92% 50%',
    description: 'Energia e entusiasmo',
  },
  {
    id: 'rose',
    name: 'Rosa Moderno',
    primary: '346 77% 50%',
    accent: '280 67% 50%',
    description: 'Sofisticação contemporânea',
  },
  {
    id: 'teal',
    name: 'Teal Sereno',
    primary: '174 72% 40%',
    accent: '199 89% 48%',
    description: 'Calma e confiança',
  },
];

const STORAGE_KEY = 'relateiq-custom-theme';

interface CustomTheme {
  presetId: string;
  primary: string;
  accent: string;
  saturation: number;
  brightness: number;
}

function getDefaultTheme(): CustomTheme {
  return {
    presetId: 'default',
    primary: '221 83% 53%',
    accent: '160 84% 39%',
    saturation: 100,
    brightness: 100,
  };
}

function loadSavedTheme(): CustomTheme {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      return JSON.parse(saved);
    }
  } catch {
    // Ignore parse errors
  }
  return getDefaultTheme();
}

function applyThemeToDocument(theme: CustomTheme): void {
  const root = document.documentElement;
  
  // Parse HSL values
  const [primaryH, primaryS, primaryL] = theme.primary.split(' ').map(v => parseFloat(v));
  const [accentH, accentS, accentL] = theme.accent.split(' ').map(v => parseFloat(v));
  
  // Apply saturation and brightness adjustments
  const satMod = theme.saturation / 100;
  const brightMod = theme.brightness / 100;
  
  const adjustedPrimary = `${primaryH} ${Math.min(100, primaryS * satMod)}% ${Math.min(100, primaryL * brightMod)}%`;
  const adjustedAccent = `${accentH} ${Math.min(100, accentS * satMod)}% ${Math.min(100, accentL * brightMod)}%`;
  
  root.style.setProperty('--primary', adjustedPrimary);
  root.style.setProperty('--accent', adjustedAccent);
  root.style.setProperty('--ring', adjustedPrimary);
  root.style.setProperty('--sidebar-primary', adjustedPrimary);
  
  // Update primary glow
  const glowH = (primaryH + 29) % 360;
  root.style.setProperty('--primary-glow', `${glowH} ${Math.min(100, primaryS * satMod)}% ${Math.min(100, (primaryL + 7) * brightMod)}%`);
}

// Componente de preview de cor
const ColorSwatch = memo(function ColorSwatch({ 
  color, 
  label, 
  isSelected 
}: { 
  color: string; 
  label: string; 
  isSelected: boolean;
}) {
  return (
    <div 
      className={cn(
        'relative w-12 h-12 rounded-full border-2 transition-all duration-200',
        isSelected ? 'border-foreground scale-110 shadow-lg' : 'border-border hover:scale-105'
      )}
      style={{ backgroundColor: `hsl(${color})` }}
      title={label}
    >
      {isSelected && (
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="absolute inset-0 flex items-center justify-center"
        >
          <Check className="w-5 h-5 text-white drop-shadow-md" />
        </motion.div>
      )}
    </div>
  );
});

export function ThemeCustomizer() {
  const [theme, setTheme] = useState<CustomTheme>(loadSavedTheme);
  const [hasChanges, setHasChanges] = useState(false);

  // Aplicar tema ao carregar
  useEffect(() => {
    applyThemeToDocument(theme);
  }, [theme]);

  const handlePresetSelect = useCallback((preset: ColorPreset) => {
    setTheme(prev => ({
      ...prev,
      presetId: preset.id,
      primary: preset.primary,
      accent: preset.accent,
    }));
    setHasChanges(true);
  }, []);

  const handleSaturationChange = useCallback((value: number[]) => {
    setTheme(prev => ({ ...prev, saturation: value[0] }));
    setHasChanges(true);
  }, []);

  const handleBrightnessChange = useCallback((value: number[]) => {
    setTheme(prev => ({ ...prev, brightness: value[0] }));
    setHasChanges(true);
  }, []);

  const handleSave = useCallback(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(theme));
    setHasChanges(false);
    toast.success('Tema salvo com sucesso!');
  }, [theme]);

  const handleReset = useCallback(() => {
    const defaultTheme = getDefaultTheme();
    setTheme(defaultTheme);
    localStorage.removeItem(STORAGE_KEY);
    setHasChanges(false);
    toast.info('Tema restaurado para o padrão');
  }, []);

  const selectedPreset = COLOR_PRESETS.find(p => p.id === theme.presetId);

  return (
    <Card className="border-border/50 shadow-lg">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-primary" />
          Personalização de Cores
        </CardTitle>
        <CardDescription>
          Escolha um tema de cores que combine com você
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Presets de Cores */}
        <div className="space-y-4">
          <Label>Paletas de Cores</Label>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {COLOR_PRESETS.map((preset) => (
              <motion.button
                key={preset.id}
                onClick={() => handlePresetSelect(preset)}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className={cn(
                  'p-4 rounded-xl border-2 transition-all duration-200 text-left',
                  theme.presetId === preset.id
                    ? 'border-primary bg-primary/10 shadow-md'
                    : 'border-border hover:border-primary/50 hover:bg-muted/50'
                )}
              >
                <div className="flex items-center gap-3 mb-2">
                  <ColorSwatch
                    color={preset.primary}
                    label="Primary"
                    isSelected={false}
                  />
                  <ColorSwatch
                    color={preset.accent}
                    label="Accent"
                    isSelected={false}
                  />
                </div>
                <p className="font-medium text-sm">{preset.name}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {preset.description}
                </p>
                {theme.presetId === preset.id && (
                  <div className="mt-2 flex items-center gap-1 text-xs text-primary">
                    <Check className="w-3 h-3" />
                    Selecionado
                  </div>
                )}
              </motion.button>
            ))}
          </div>
        </div>

        {/* Ajustes Finos */}
        <div className="space-y-6 pt-4 border-t border-border/50">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label>Saturação</Label>
              <span className="text-sm text-muted-foreground">{theme.saturation}%</span>
            </div>
            <Slider
              value={[theme.saturation]}
              onValueChange={handleSaturationChange}
              min={50}
              max={150}
              step={5}
              className="w-full"
            />
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label>Brilho</Label>
              <span className="text-sm text-muted-foreground">{theme.brightness}%</span>
            </div>
            <Slider
              value={[theme.brightness]}
              onValueChange={handleBrightnessChange}
              min={70}
              max={130}
              step={5}
              className="w-full"
            />
          </div>
        </div>

        {/* Preview */}
        {selectedPreset && (
          <div className="p-4 rounded-lg border border-border/50 bg-muted/30">
            <p className="text-sm font-medium mb-3">Preview</p>
            <div className="flex items-center gap-3">
              <Button size="sm">Botão Primário</Button>
              <Button size="sm" variant="secondary">Secundário</Button>
              <Button size="sm" variant="outline">Outline</Button>
            </div>
          </div>
        )}

        {/* Ações */}
        <div className="flex items-center justify-between pt-4 border-t border-border/50">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleReset}
            className="gap-2"
          >
            <RotateCcw className="w-4 h-4" />
            Restaurar Padrão
          </Button>
          <Button
            onClick={handleSave}
            disabled={!hasChanges}
            className="gap-2"
          >
            <Palette className="w-4 h-4" />
            Salvar Tema
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

// Inicializar tema ao carregar a aplicação
export function initializeCustomTheme(): void {
  const theme = loadSavedTheme();
  applyThemeToDocument(theme);
}

export default ThemeCustomizer;
