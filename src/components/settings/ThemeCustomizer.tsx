import { Palette, RotateCcw, Download, Upload, Sun, Moon, Monitor } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useTheme } from '@/components/theme/ThemeProvider';
import { PRESETS } from './theme/presets';
import { useThemePreset } from './theme/useThemePreset';
import { PresetCard } from './theme/PresetCard';
import { BorderRadiusControl } from './theme/BorderRadiusControl';
import { cn } from '@/lib/utils';

export function ThemeCustomizer() {
  const { theme, setTheme } = useTheme();
  const {
    activePreset,
    borderRadius,
    applyPreset,
    handleBorderRadiusChange,
    resetTheme,
    exportTheme,
    importTheme,
  } = useThemePreset();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h3 className="flex items-center gap-2 text-lg font-semibold">
            <Palette className="w-5 h-5 text-primary" />
            Personalizar Tema
          </h3>
          <p className="text-sm text-muted-foreground">Escolha um preset ou customize as cores</p>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={importTheme}>
            <Upload className="w-4 h-4 mr-1.5" /> Importar
          </Button>
          <Button variant="outline" size="sm" onClick={exportTheme}>
            <Download className="w-4 h-4 mr-1.5" /> Exportar
          </Button>
          <Button variant="ghost" size="sm" onClick={resetTheme}>
            <RotateCcw className="w-4 h-4 mr-1.5" /> Reset
          </Button>
        </div>
      </div>

      {/* Mode Toggle */}
      <Card className="border-border/50">
        <CardContent className="pt-5">
          <p className="text-sm font-medium mb-3">Modo de Cor</p>
          <div className="flex gap-2">
            <Button
              variant={theme === 'light' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setTheme('light')}
            >
              <Sun className="w-4 h-4 mr-1.5" /> Claro
            </Button>
            <Button
              variant={theme === 'dark' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setTheme('dark')}
            >
              <Moon className="w-4 h-4 mr-1.5" /> Escuro
            </Button>
            <Button
              variant={theme === 'system' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setTheme('system')}
            >
              <Monitor className="w-4 h-4 mr-1.5" /> Sistema
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Presets Grid */}
      <div className="space-y-3">
        <p className="text-sm text-muted-foreground">{PRESETS.length} skins disponíveis</p>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
          {PRESETS.map((preset) => (
            <PresetCard
              key={preset.id}
              preset={preset}
              isActive={activePreset.id === preset.id}
              onSelect={applyPreset}
            />
          ))}
        </div>
      </div>

      {/* Border Radius */}
      <BorderRadiusControl value={borderRadius} onChange={handleBorderRadiusChange} />
    </div>
  );
}

/** @deprecated Use initializeSkin from theme/useThemePreset instead */
export function initializeCustomTheme(): void {
  // noop — replaced by initializeSkin
}

export default ThemeCustomizer;
