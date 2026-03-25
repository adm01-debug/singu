import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { ThemeCustomizer } from '../ThemeCustomizer';

vi.mock('sonner', () => ({ toast: Object.assign(vi.fn(), { success: vi.fn(), error: vi.fn(), warning: vi.fn(), info: vi.fn() }) }));
vi.mock('framer-motion', () => ({
  motion: new Proxy({}, { get: (_, tag) => ({ children, ...props }: any) => { const Tag = tag as any; return <Tag {...props}>{children}</Tag>; } }),
  AnimatePresence: ({ children }: any) => <>{children}</>,
}));
vi.mock('@/lib/utils', () => ({
  cn: (...args: any[]) => args.filter(Boolean).join(' '),
}));

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: vi.fn((key: string) => store[key] || null),
    setItem: vi.fn((key: string, value: string) => { store[key] = value; }),
    removeItem: vi.fn((key: string) => { delete store[key]; }),
    clear: vi.fn(() => { store = {}; }),
  };
})();
Object.defineProperty(window, 'localStorage', { value: localStorageMock });

describe('ThemeCustomizer', () => {
  beforeEach(() => {
    localStorageMock.clear();
    vi.clearAllMocks();
  });

  it('renders the card title', () => {
    render(<ThemeCustomizer />);
    expect(screen.getByText('Personalização de Cores')).toBeInTheDocument();
  });

  it('renders the card description', () => {
    render(<ThemeCustomizer />);
    expect(screen.getByText('Escolha um tema de cores que combine com você')).toBeInTheDocument();
  });

  it('renders color presets', () => {
    render(<ThemeCustomizer />);
    expect(screen.getByText('Azul Profissional')).toBeInTheDocument();
    expect(screen.getByText('Esmeralda')).toBeInTheDocument();
    expect(screen.getByText('Roxo Real')).toBeInTheDocument();
    expect(screen.getByText('Laranja Energia')).toBeInTheDocument();
    expect(screen.getByText('Rosa Moderno')).toBeInTheDocument();
    expect(screen.getByText('Teal Sereno')).toBeInTheDocument();
  });

  it('renders preset descriptions', () => {
    render(<ThemeCustomizer />);
    expect(screen.getByText('Tema padrão elegante e profissional')).toBeInTheDocument();
    expect(screen.getByText('Verde vibrante para produtividade')).toBeInTheDocument();
  });

  it('renders Paletas de Cores label', () => {
    render(<ThemeCustomizer />);
    expect(screen.getByText('Paletas de Cores')).toBeInTheDocument();
  });

  it('renders Saturação slider label', () => {
    render(<ThemeCustomizer />);
    expect(screen.getByText('Saturação')).toBeInTheDocument();
  });

  it('renders Brilho slider label', () => {
    render(<ThemeCustomizer />);
    expect(screen.getByText('Brilho')).toBeInTheDocument();
  });

  it('renders saturation and brightness values', () => {
    render(<ThemeCustomizer />);
    expect(screen.getByText('100%')).toBeInTheDocument();
  });

  it('renders Preview section', () => {
    render(<ThemeCustomizer />);
    expect(screen.getByText('Preview')).toBeInTheDocument();
  });

  it('renders preview buttons', () => {
    render(<ThemeCustomizer />);
    expect(screen.getByText('Botão Primário')).toBeInTheDocument();
    expect(screen.getByText('Secundário')).toBeInTheDocument();
    expect(screen.getByText('Outline')).toBeInTheDocument();
  });

  it('renders save button (disabled by default)', () => {
    render(<ThemeCustomizer />);
    const saveButton = screen.getByText('Salvar Tema').closest('button');
    expect(saveButton).toBeDisabled();
  });

  it('renders restore default button', () => {
    render(<ThemeCustomizer />);
    expect(screen.getByText('Restaurar Padrão')).toBeInTheDocument();
  });

  it('marks selected preset', () => {
    render(<ThemeCustomizer />);
    expect(screen.getByText('Selecionado')).toBeInTheDocument();
  });

  it('enables save button after changing preset', () => {
    render(<ThemeCustomizer />);
    fireEvent.click(screen.getByText('Esmeralda'));
    const saveButton = screen.getByText('Salvar Tema').closest('button');
    expect(saveButton).not.toBeDisabled();
  });
});
