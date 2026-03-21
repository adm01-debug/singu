import { describe, it, expect, vi, beforeEach } from 'vitest';
import { reducer } from '../use-toast';

interface ToasterToast {
  id: string;
  title?: string;
  description?: string;
  open?: boolean;
  [key: string]: unknown;
}

interface State {
  toasts: ToasterToast[];
}

describe('use-toast', () => {
  describe('reducer', () => {
    describe('ADD_TOAST', () => {
      it('adds toast to empty state', () => {
        const state: State = { toasts: [] };
        const newToast = { id: '1', title: 'Test', open: true };
        const result = reducer(state, { type: 'ADD_TOAST', toast: newToast as ToasterToast });
        expect(result.toasts).toHaveLength(1);
        expect(result.toasts[0].id).toBe('1');
      });

      it('prepends new toast to beginning', () => {
        const state: State = { toasts: [{ id: '1', title: 'First' } as ToasterToast] };
        const newToast = { id: '2', title: 'Second', open: true };
        const result = reducer(state, { type: 'ADD_TOAST', toast: newToast as ToasterToast });
        expect(result.toasts[0].id).toBe('2');
      });

      it('enforces TOAST_LIMIT of 1', () => {
        const state: State = { toasts: [{ id: '1', title: 'First' } as ToasterToast] };
        const newToast = { id: '2', title: 'Second', open: true };
        const result = reducer(state, { type: 'ADD_TOAST', toast: newToast as ToasterToast });
        expect(result.toasts).toHaveLength(1);
        expect(result.toasts[0].id).toBe('2');
      });

      it('drops oldest toast when limit exceeded', () => {
        const state: State = { toasts: [{ id: '1', title: 'Old' } as ToasterToast] };
        const result = reducer(state, { type: 'ADD_TOAST', toast: { id: '2', title: 'New' } as ToasterToast });
        expect(result.toasts.find(t => t.id === '1')).toBeUndefined();
      });
    });

    describe('UPDATE_TOAST', () => {
      it('updates existing toast by id', () => {
        const state: State = { toasts: [{ id: '1', title: 'Original' } as ToasterToast] };
        const result = reducer(state, { type: 'UPDATE_TOAST', toast: { id: '1', title: 'Updated' } });
        expect(result.toasts[0].title).toBe('Updated');
      });

      it('does not modify other toasts', () => {
        const state: State = {
          toasts: [
            { id: '1', title: 'First' } as ToasterToast,
          ],
        };
        const result = reducer(state, { type: 'UPDATE_TOAST', toast: { id: '999', title: 'X' } });
        expect(result.toasts[0].title).toBe('First');
      });

      it('merges partial updates', () => {
        const state: State = {
          toasts: [{ id: '1', title: 'Test', description: 'Desc' } as ToasterToast],
        };
        const result = reducer(state, { type: 'UPDATE_TOAST', toast: { id: '1', title: 'New Title' } });
        expect(result.toasts[0].title).toBe('New Title');
        expect(result.toasts[0].description).toBe('Desc');
      });

      it('handles empty toasts array', () => {
        const state: State = { toasts: [] };
        const result = reducer(state, { type: 'UPDATE_TOAST', toast: { id: '1', title: 'X' } });
        expect(result.toasts).toHaveLength(0);
      });
    });

    describe('DISMISS_TOAST', () => {
      it('sets open to false for specific toast', () => {
        const state: State = { toasts: [{ id: '1', title: 'Test', open: true } as ToasterToast] };
        const result = reducer(state, { type: 'DISMISS_TOAST', toastId: '1' });
        expect(result.toasts[0].open).toBe(false);
      });

      it('dismisses all toasts when no toastId', () => {
        const state: State = {
          toasts: [
            { id: '1', open: true } as ToasterToast,
          ],
        };
        const result = reducer(state, { type: 'DISMISS_TOAST' });
        result.toasts.forEach(t => {
          expect(t.open).toBe(false);
        });
      });

      it('does not affect non-matching toasts', () => {
        const state: State = {
          toasts: [{ id: '1', open: true } as ToasterToast],
        };
        const result = reducer(state, { type: 'DISMISS_TOAST', toastId: '999' });
        expect(result.toasts[0].open).toBe(true);
      });
    });

    describe('REMOVE_TOAST', () => {
      it('removes specific toast by id', () => {
        const state: State = { toasts: [{ id: '1', title: 'Test' } as ToasterToast] };
        const result = reducer(state, { type: 'REMOVE_TOAST', toastId: '1' });
        expect(result.toasts).toHaveLength(0);
      });

      it('removes all toasts when toastId is undefined', () => {
        const state: State = {
          toasts: [
            { id: '1' } as ToasterToast,
          ],
        };
        const result = reducer(state, { type: 'REMOVE_TOAST', toastId: undefined });
        expect(result.toasts).toHaveLength(0);
      });

      it('does not remove non-matching toasts', () => {
        const state: State = { toasts: [{ id: '1' } as ToasterToast] };
        const result = reducer(state, { type: 'REMOVE_TOAST', toastId: '999' });
        expect(result.toasts).toHaveLength(1);
      });

      it('handles removal from empty array', () => {
        const state: State = { toasts: [] };
        const result = reducer(state, { type: 'REMOVE_TOAST', toastId: '1' });
        expect(result.toasts).toHaveLength(0);
      });
    });
  });

  describe('genId logic', () => {
    it('generates sequential string IDs', () => {
      let count = 0;
      const genId = () => {
        count = (count + 1) % Number.MAX_SAFE_INTEGER;
        return count.toString();
      };
      expect(genId()).toBe('1');
      expect(genId()).toBe('2');
      expect(genId()).toBe('3');
    });

    it('wraps around at MAX_SAFE_INTEGER', () => {
      let count = Number.MAX_SAFE_INTEGER - 1;
      count = (count + 1) % Number.MAX_SAFE_INTEGER;
      expect(count).toBe(0);
    });
  });

  describe('actionTypes', () => {
    it('defines ADD_TOAST action type', () => {
      expect('ADD_TOAST').toBe('ADD_TOAST');
    });

    it('defines UPDATE_TOAST action type', () => {
      expect('UPDATE_TOAST').toBe('UPDATE_TOAST');
    });

    it('defines DISMISS_TOAST action type', () => {
      expect('DISMISS_TOAST').toBe('DISMISS_TOAST');
    });

    it('defines REMOVE_TOAST action type', () => {
      expect('REMOVE_TOAST').toBe('REMOVE_TOAST');
    });
  });

  describe('immutability', () => {
    it('ADD_TOAST returns new state object', () => {
      const state: State = { toasts: [] };
      const result = reducer(state, { type: 'ADD_TOAST', toast: { id: '1' } as ToasterToast });
      expect(result).not.toBe(state);
    });

    it('UPDATE_TOAST returns new state object', () => {
      const state: State = { toasts: [{ id: '1' } as ToasterToast] };
      const result = reducer(state, { type: 'UPDATE_TOAST', toast: { id: '1', title: 'X' } });
      expect(result).not.toBe(state);
    });

    it('DISMISS_TOAST returns new state object', () => {
      const state: State = { toasts: [{ id: '1', open: true } as ToasterToast] };
      const result = reducer(state, { type: 'DISMISS_TOAST', toastId: '1' });
      expect(result).not.toBe(state);
    });

    it('REMOVE_TOAST returns new state object', () => {
      const state: State = { toasts: [{ id: '1' } as ToasterToast] };
      const result = reducer(state, { type: 'REMOVE_TOAST', toastId: '1' });
      expect(result).not.toBe(state);
    });
  });
});
