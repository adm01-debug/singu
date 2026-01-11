import { createContext, useContext, useState, useCallback, useEffect, ReactNode } from 'react';

interface A11ySettings {
  reducedMotion: boolean;
  highContrast: boolean;
  fontSize: 'normal' | 'large' | 'extra-large';
  screenReaderMode: boolean;
  focusIndicator: 'default' | 'enhanced';
}

interface A11yContextType {
  settings: A11ySettings;
  updateSetting: <K extends keyof A11ySettings>(key: K, value: A11ySettings[K]) => void;
  resetSettings: () => void;
  announceToScreenReader: (message: string, priority?: 'polite' | 'assertive') => void;
}

const defaultSettings: A11ySettings = {
  reducedMotion: false,
  highContrast: false,
  fontSize: 'normal',
  screenReaderMode: false,
  focusIndicator: 'default',
};

const A11Y_STORAGE_KEY = 'relateiq_a11y_settings';

const A11yContext = createContext<A11yContextType | null>(null);

export function A11yProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<A11ySettings>(() => {
    // Check system preferences
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const prefersHighContrast = window.matchMedia('(prefers-contrast: more)').matches;
    
    // Load stored settings
    try {
      const stored = localStorage.getItem(A11Y_STORAGE_KEY);
      if (stored) {
        return { ...defaultSettings, ...JSON.parse(stored) };
      }
    } catch (e) {
      console.error('Error loading a11y settings:', e);
    }
    
    return {
      ...defaultSettings,
      reducedMotion: prefersReducedMotion,
      highContrast: prefersHighContrast,
    };
  });

  // Apply settings to document
  useEffect(() => {
    const root = document.documentElement;
    
    // Reduced motion
    if (settings.reducedMotion) {
      root.classList.add('reduce-motion');
    } else {
      root.classList.remove('reduce-motion');
    }
    
    // High contrast
    if (settings.highContrast) {
      root.classList.add('high-contrast');
    } else {
      root.classList.remove('high-contrast');
    }
    
    // Font size
    root.classList.remove('font-large', 'font-extra-large');
    if (settings.fontSize === 'large') {
      root.classList.add('font-large');
    } else if (settings.fontSize === 'extra-large') {
      root.classList.add('font-extra-large');
    }
    
    // Focus indicator
    if (settings.focusIndicator === 'enhanced') {
      root.classList.add('enhanced-focus');
    } else {
      root.classList.remove('enhanced-focus');
    }
    
    // Screen reader mode
    if (settings.screenReaderMode) {
      root.setAttribute('data-screen-reader', 'true');
    } else {
      root.removeAttribute('data-screen-reader');
    }
    
    // Save settings
    localStorage.setItem(A11Y_STORAGE_KEY, JSON.stringify(settings));
  }, [settings]);

  // Listen for system preference changes
  useEffect(() => {
    const motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    const contrastQuery = window.matchMedia('(prefers-contrast: more)');

    const handleMotionChange = (e: MediaQueryListEvent) => {
      setSettings(prev => ({ ...prev, reducedMotion: e.matches }));
    };

    const handleContrastChange = (e: MediaQueryListEvent) => {
      setSettings(prev => ({ ...prev, highContrast: e.matches }));
    };

    motionQuery.addEventListener('change', handleMotionChange);
    contrastQuery.addEventListener('change', handleContrastChange);

    return () => {
      motionQuery.removeEventListener('change', handleMotionChange);
      contrastQuery.removeEventListener('change', handleContrastChange);
    };
  }, []);

  const updateSetting = useCallback(<K extends keyof A11ySettings>(
    key: K, 
    value: A11ySettings[K]
  ) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  }, []);

  const resetSettings = useCallback(() => {
    setSettings(defaultSettings);
  }, []);

  const announceToScreenReader = useCallback((
    message: string, 
    priority: 'polite' | 'assertive' = 'polite'
  ) => {
    const announcement = document.createElement('div');
    announcement.setAttribute('role', 'status');
    announcement.setAttribute('aria-live', priority);
    announcement.setAttribute('aria-atomic', 'true');
    announcement.className = 'sr-only';
    announcement.textContent = message;
    
    document.body.appendChild(announcement);
    
    // Remove after announcement
    setTimeout(() => {
      document.body.removeChild(announcement);
    }, 1000);
  }, []);

  return (
    <A11yContext.Provider value={{ 
      settings, 
      updateSetting, 
      resetSettings,
      announceToScreenReader 
    }}>
      {children}
    </A11yContext.Provider>
  );
}

export function useA11y() {
  const context = useContext(A11yContext);
  if (!context) {
    throw new Error('useA11y must be used within an A11yProvider');
  }
  return context;
}

// Hook for reduced motion preference
export function useReducedMotion() {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(() => {
    if (typeof window === 'undefined') return false;
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  });

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    const handler = (e: MediaQueryListEvent) => setPrefersReducedMotion(e.matches);
    
    mediaQuery.addEventListener('change', handler);
    return () => mediaQuery.removeEventListener('change', handler);
  }, []);

  return prefersReducedMotion;
}
