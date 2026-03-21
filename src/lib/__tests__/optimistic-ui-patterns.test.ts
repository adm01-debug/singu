/**
 * Testes de padrões Optimistic UI — verifica a lógica de rollback
 * e feedback instantâneo usada nos hooks CRUD do sistema.
 */
import { describe, it, expect } from 'vitest';

// Simula o padrão optimistic usado em useCompanies, useInteractions, etc.
function optimisticUpdate<T extends { id: string }>(
  items: T[],
  id: string,
  updates: Partial<T>
): T[] {
  return items.map(item =>
    item.id === id ? { ...item, ...updates } : item
  );
}

function optimisticDelete<T extends { id: string }>(
  items: T[],
  id: string
): T[] {
  return items.filter(item => item.id !== id);
}

function rollback<T>(previousState: T[]): T[] {
  return [...previousState];
}

// --- Test Data ---
interface TestItem {
  id: string;
  name: string;
  status: string;
  score: number;
}

const sampleItems: TestItem[] = [
  { id: '1', name: 'Alpha', status: 'active', score: 80 },
  { id: '2', name: 'Beta', status: 'active', score: 60 },
  { id: '3', name: 'Gamma', status: 'inactive', score: 40 },
  { id: '4', name: 'Delta', status: 'active', score: 90 },
  { id: '5', name: 'Epsilon', status: 'inactive', score: 20 },
];

describe('Optimistic UI Patterns', () => {
  describe('optimisticUpdate', () => {
    it('should update the correct item', () => {
      const result = optimisticUpdate(sampleItems, '2', { name: 'Beta Updated' });
      expect(result.find(i => i.id === '2')?.name).toBe('Beta Updated');
      expect(result.length).toBe(5);
    });

    it('should not modify other items', () => {
      const result = optimisticUpdate(sampleItems, '3', { status: 'archived' });
      expect(result.find(i => i.id === '1')?.status).toBe('active');
      expect(result.find(i => i.id === '2')?.status).toBe('active');
      expect(result.find(i => i.id === '3')?.status).toBe('archived');
    });

    it('should handle non-existent ID gracefully', () => {
      const result = optimisticUpdate(sampleItems, 'nonexistent', { name: 'X' });
      expect(result).toEqual(sampleItems);
    });

    it('should merge partial updates correctly', () => {
      const result = optimisticUpdate(sampleItems, '1', { score: 95, status: 'premium' });
      const item = result.find(i => i.id === '1');
      expect(item?.score).toBe(95);
      expect(item?.status).toBe('premium');
      expect(item?.name).toBe('Alpha');
    });

    it('should handle empty updates', () => {
      const result = optimisticUpdate(sampleItems, '1', {});
      expect(result.find(i => i.id === '1')).toEqual(sampleItems[0]);
    });

    it('should handle updates on empty array', () => {
      const result = optimisticUpdate([], '1', { name: 'X' });
      expect(result).toEqual([]);
    });

    it('should preserve array order', () => {
      const result = optimisticUpdate(sampleItems, '3', { name: 'Z' });
      expect(result.map(i => i.id)).toEqual(['1', '2', '3', '4', '5']);
    });
  });

  describe('optimisticDelete', () => {
    it('should remove the correct item', () => {
      const result = optimisticDelete(sampleItems, '3');
      expect(result.length).toBe(4);
      expect(result.find(i => i.id === '3')).toBeUndefined();
    });

    it('should not modify other items', () => {
      const result = optimisticDelete(sampleItems, '1');
      expect(result.map(i => i.id)).toEqual(['2', '3', '4', '5']);
    });

    it('should handle non-existent ID gracefully', () => {
      const result = optimisticDelete(sampleItems, 'nonexistent');
      expect(result.length).toBe(5);
    });

    it('should handle empty array', () => {
      const result = optimisticDelete([], '1');
      expect(result).toEqual([]);
    });

    it('should handle single-item array', () => {
      const result = optimisticDelete([sampleItems[0]], '1');
      expect(result).toEqual([]);
    });

    it('should handle deleting last item', () => {
      const result = optimisticDelete(sampleItems, '5');
      expect(result.length).toBe(4);
      expect(result[result.length - 1].id).toBe('4');
    });
  });

  describe('rollback', () => {
    it('should restore original state after failed update', () => {
      const original = [...sampleItems];
      const updated = optimisticUpdate(sampleItems, '1', { name: 'WRONG' });
      expect(updated.find(i => i.id === '1')?.name).toBe('WRONG');

      const rolledBack = rollback(original);
      expect(rolledBack.find(i => i.id === '1')?.name).toBe('Alpha');
    });

    it('should restore original state after failed delete', () => {
      const original = [...sampleItems];
      const deleted = optimisticDelete(sampleItems, '2');
      expect(deleted.length).toBe(4);

      const rolledBack = rollback(original);
      expect(rolledBack.length).toBe(5);
      expect(rolledBack.find(i => i.id === '2')?.name).toBe('Beta');
    });

    it('should not mutate the original reference', () => {
      const original = [...sampleItems];
      const rolledBack = rollback(original);
      rolledBack[0] = { ...rolledBack[0], name: 'Mutated' };
      expect(original[0].name).toBe('Alpha');
    });

    it('should handle rollback of empty state', () => {
      const rolledBack = rollback([]);
      expect(rolledBack).toEqual([]);
    });
  });

  describe('Sequential Operations', () => {
    it('should handle multiple sequential updates', () => {
      let state = [...sampleItems];
      state = optimisticUpdate(state, '1', { score: 100 });
      state = optimisticUpdate(state, '2', { score: 100 });
      state = optimisticUpdate(state, '3', { score: 100 });
      
      expect(state.filter(i => i.score === 100).length).toBe(3);
      expect(state.find(i => i.id === '4')?.score).toBe(90);
    });

    it('should handle update then delete', () => {
      let state = [...sampleItems];
      state = optimisticUpdate(state, '1', { name: 'Updated' });
      state = optimisticDelete(state, '1');
      
      expect(state.length).toBe(4);
      expect(state.find(i => i.id === '1')).toBeUndefined();
    });

    it('should handle delete then rollback to correct state', () => {
      const original = [...sampleItems];
      let state = optimisticDelete(sampleItems, '2');
      state = optimisticDelete(state, '3');
      expect(state.length).toBe(3);

      state = rollback(original);
      expect(state.length).toBe(5);
    });
  });

  describe('Edge Cases', () => {
    it('should handle items with same properties but different IDs', () => {
      const duplicateItems: TestItem[] = [
        { id: 'a', name: 'Same', status: 'active', score: 50 },
        { id: 'b', name: 'Same', status: 'active', score: 50 },
      ];
      const result = optimisticUpdate(duplicateItems, 'a', { score: 99 });
      expect(result.find(i => i.id === 'a')?.score).toBe(99);
      expect(result.find(i => i.id === 'b')?.score).toBe(50);
    });

    it('should handle large dataset (1000 items)', () => {
      const largeDataset: TestItem[] = Array.from({ length: 1000 }, (_, i) => ({
        id: String(i),
        name: `Item ${i}`,
        status: 'active',
        score: i,
      }));

      const result = optimisticUpdate(largeDataset, '500', { name: 'Updated 500' });
      expect(result.find(i => i.id === '500')?.name).toBe('Updated 500');
      expect(result.length).toBe(1000);

      const deleted = optimisticDelete(largeDataset, '999');
      expect(deleted.length).toBe(999);
    });

    it('should handle special characters in values', () => {
      const result = optimisticUpdate(sampleItems, '1', {
        name: 'Ação & Manutenção — "Teste"'
      });
      expect(result.find(i => i.id === '1')?.name).toBe('Ação & Manutenção — "Teste"');
    });
  });
});
