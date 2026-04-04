import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import { PRESETS, type SkinPreset, type SkinColors } from './presets';

const STORAGE_KEY = 'singu-skin';

interface SkinState {
  presetId: string;
  borderRadius: number;
}

function getDefaults(): SkinState {
  return { presetId: 'default', borderRadius: 12 };
}

function loadState(): SkinState {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) return { ...getDefaults(), ...JSON.parse(saved) };
  } catch { /* ignore */ }
  return getDefaults();
}

function resolveMode(): 'light' | 'dark' {
  return document.documentElement.classList.contains('dark') ? 'dark' : 'light';
}

/** Apply ALL skin tokens to the DOM */
function applyPresetToDOM(preset: SkinPreset, radius: number) {
  const root = document.documentElement;
  const mode = resolveMode();
  const c: SkinColors = preset.colors[mode];

  // Core tokens
  root.style.setProperty('--primary', c.primary);
  root.style.setProperty('--accent', c.accent);
  root.style.setProperty('--background', c.background);
  root.style.setProperty('--foreground', c.foreground);
  root.style.setProperty('--card', c.card);
  root.style.setProperty('--card-foreground', c['card-foreground']);
  root.style.setProperty('--popover', c.card);
  root.style.setProperty('--popover-foreground', c['card-foreground']);
  root.style.setProperty('--muted', c.muted);
  root.style.setProperty('--muted-foreground', c['muted-foreground']);
  root.style.setProperty('--border', c.border);
  root.style.setProperty('--input', c.border);
  root.style.setProperty('--ring', c.primary);

  // Sidebar tokens
  root.style.setProperty('--sidebar-primary', c.primary);
  root.style.setProperty('--sidebar-ring', c.primary);

  // Gradient
  const h = parseFloat(c.primary.split(' ')[0]);
  const s = parseFloat(c.primary.split(' ')[1]);
  const l = parseFloat(c.primary.split(' ')[2]);
  root.style.setProperty(
    '--gradient-primary',
    `linear-gradient(135deg, hsl(${c.primary}), hsl(${h} ${s}% ${Math.max(l - 10, 20)}%))`
  );

  // Border radius
  root.style.setProperty('--radius', `${radius}px`);
}

export function useThemePreset() {
  const [state, setState] = useState<SkinState>(loadState);

  const activePreset = PRESETS.find(p => p.id === state.presetId) || PRESETS[0];

  useEffect(() => {
    applyPresetToDOM(activePreset, state.borderRadius);

    const observer = new MutationObserver(() => {
      applyPresetToDOM(activePreset, state.borderRadius);
    });
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    return () => observer.disconnect();
  }, [activePreset, state.borderRadius]);

  const persist = useCallback((next: SkinState) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  }, []);

  const applyPreset = useCallback((preset: SkinPreset) => {
    const next = { ...state, presetId: preset.id };
    setState(next);
    persist(next);
    toast.success(`Skin "${preset.name}" aplicada!`);
  }, [state, persist]);

  const handleBorderRadiusChange = useCallback((value: number[]) => {
    const next = { ...state, borderRadius: value[0] };
    setState(next);
    persist(next);
  }, [state, persist]);

  const resetTheme = useCallback(() => {
    const defaults = getDefaults();
    setState(defaults);
    localStorage.removeItem(STORAGE_KEY);
    const defaultPreset = PRESETS[0];
    applyPresetToDOM(defaultPreset, defaults.borderRadius);
    toast.info('Tema restaurado para o padrão');
  }, []);

  const exportTheme = useCallback(() => {
    const data = JSON.stringify({ presetId: state.presetId, borderRadius: state.borderRadius }, null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'singu-theme.json';
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Tema exportado!');
  }, [state]);

  const importTheme = useCallback(() => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (ev) => {
        try {
          const data = JSON.parse(ev.target?.result as string);
          if (data.presetId && PRESETS.find(p => p.id === data.presetId)) {
            const next: SkinState = {
              presetId: data.presetId,
              borderRadius: data.borderRadius ?? 12,
            };
            setState(next);
            persist(next);
            toast.success('Tema importado com sucesso!');
          } else {
            toast.error('Arquivo de tema inválido');
          }
        } catch {
          toast.error('Erro ao ler o arquivo');
        }
      };
      reader.readAsText(file);
    };
    input.click();
  }, [persist]);

  return {
    activePreset,
    borderRadius: state.borderRadius,
    applyPreset,
    handleBorderRadiusChange,
    resetTheme,
    exportTheme,
    importTheme,
  };
}

/** Call once at app bootstrap to restore saved skin */
export function initializeSkin(): void {
  const state = loadState();
  const preset = PRESETS.find(p => p.id === state.presetId) || PRESETS[0];
  applyPresetToDOM(preset, state.borderRadius);
}
