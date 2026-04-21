/**
 * Pesos personalizáveis do Score de Prontidão (persistido em localStorage).
 */
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { DEFAULT_PRONTIDAO_WEIGHTS, type ProntidaoWeights } from '@/lib/prontidaoScore';

interface State {
  weights: ProntidaoWeights;
  setWeight: (key: keyof ProntidaoWeights, value: number) => void;
  reset: () => void;
}

const clamp = (n: number) => Math.max(0, Math.min(100, Math.round(n)));

export const useProntidaoWeightsStore = create<State>()(
  persist(
    (set) => ({
      weights: { ...DEFAULT_PRONTIDAO_WEIGHTS },
      setWeight: (key, value) =>
        set((s) => ({ weights: { ...s.weights, [key]: clamp(value) } })),
      reset: () => set({ weights: { ...DEFAULT_PRONTIDAO_WEIGHTS } }),
    }),
    { name: 'singu-prontidao-weights' },
  ),
);
