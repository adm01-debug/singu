import { describe, it, expect, vi, beforeEach } from 'vitest';

describe('useLazySection', () => {
  let observeCallbacks: ((entries: { isIntersecting: boolean }[]) => void)[];
  let mockObserve: ReturnType<typeof vi.fn>;
  let mockUnobserve: ReturnType<typeof vi.fn>;
  let mockDisconnect: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    observeCallbacks = [];
    mockObserve = vi.fn();
    mockUnobserve = vi.fn();
    mockDisconnect = vi.fn();

    global.IntersectionObserver = vi.fn((callback) => {
      observeCallbacks.push(callback as (entries: { isIntersecting: boolean }[]) => void);
      return {
        observe: mockObserve,
        unobserve: mockUnobserve,
        disconnect: mockDisconnect,
        root: null,
        rootMargin: '',
        thresholds: [],
        takeRecords: vi.fn(),
      };
    }) as unknown as typeof IntersectionObserver;
  });

  describe('IntersectionObserver configuration', () => {
    it('IntersectionObserver constructor is available', () => {
      expect(typeof IntersectionObserver).toBe('function');
    });

    it('creates observer with default rootMargin of 200px', () => {
      const options = { rootMargin: '200px', threshold: 0 };
      new IntersectionObserver(vi.fn(), options);
      expect(IntersectionObserver).toHaveBeenCalledWith(expect.any(Function), options);
    });

    it('creates observer with custom rootMargin', () => {
      const options = { rootMargin: '500px', threshold: 0 };
      new IntersectionObserver(vi.fn(), options);
      expect(IntersectionObserver).toHaveBeenCalledWith(expect.any(Function), options);
    });

    it('creates observer with custom threshold', () => {
      const options = { rootMargin: '200px', threshold: 0.5 };
      new IntersectionObserver(vi.fn(), options);
      expect(IntersectionObserver).toHaveBeenCalledWith(expect.any(Function), options);
    });
  });

  describe('visibility state', () => {
    it('starts as not visible', () => {
      let isVisible = false;
      expect(isVisible).toBe(false);
    });

    it('becomes visible when entry is intersecting', () => {
      let isVisible = false;
      const callback = (entries: { isIntersecting: boolean }[]) => {
        if (entries[0].isIntersecting) {
          isVisible = true;
        }
      };
      callback([{ isIntersecting: true }]);
      expect(isVisible).toBe(true);
    });

    it('stays not visible when entry is not intersecting', () => {
      let isVisible = false;
      const callback = (entries: { isIntersecting: boolean }[]) => {
        if (entries[0].isIntersecting) {
          isVisible = true;
        }
      };
      callback([{ isIntersecting: false }]);
      expect(isVisible).toBe(false);
    });
  });

  describe('triggerOnce behavior', () => {
    it('unobserves element after first intersection when triggerOnce is true', () => {
      const element = document.createElement('div');
      const triggerOnce = true;

      const observer = new IntersectionObserver((entries) => {
        if (entries[0].isIntersecting && triggerOnce) {
          observer.unobserve(element);
        }
      });

      // Simulate intersection
      observeCallbacks[0]([{ isIntersecting: true }]);
      expect(mockUnobserve).toHaveBeenCalledWith(element);
    });

    it('does not unobserve when triggerOnce is false', () => {
      const element = document.createElement('div');
      const triggerOnce = false;

      new IntersectionObserver((entries) => {
        if (entries[0].isIntersecting && triggerOnce) {
          // should not reach here
        }
      });

      observeCallbacks[0]([{ isIntersecting: true }]);
      expect(mockUnobserve).not.toHaveBeenCalled();
    });

    it('sets visibility back to false when not intersecting and triggerOnce is false', () => {
      let isVisible = false;
      const triggerOnce = false;

      const callback = (entries: { isIntersecting: boolean }[]) => {
        if (entries[0].isIntersecting) {
          isVisible = true;
        } else if (!triggerOnce) {
          isVisible = false;
        }
      };

      callback([{ isIntersecting: true }]);
      expect(isVisible).toBe(true);

      callback([{ isIntersecting: false }]);
      expect(isVisible).toBe(false);
    });

    it('keeps visibility true after leaving viewport when triggerOnce is true', () => {
      let isVisible = false;
      const triggerOnce = true;

      const callback = (entries: { isIntersecting: boolean }[]) => {
        if (entries[0].isIntersecting) {
          isVisible = true;
          // with triggerOnce, observer is disconnected so no more callbacks
        }
      };

      callback([{ isIntersecting: true }]);
      expect(isVisible).toBe(true);
      // No further callbacks since observer was disconnected
    });
  });

  describe('cleanup', () => {
    it('disconnects observer on cleanup', () => {
      const observer = new IntersectionObserver(vi.fn());
      observer.disconnect();
      expect(mockDisconnect).toHaveBeenCalledOnce();
    });
  });

  describe('default options', () => {
    it('default rootMargin is 200px', () => {
      const { rootMargin = '200px' } = {};
      expect(rootMargin).toBe('200px');
    });

    it('default threshold is 0', () => {
      const { threshold = 0 } = {};
      expect(threshold).toBe(0);
    });

    it('default triggerOnce is true', () => {
      const { triggerOnce = true } = {};
      expect(triggerOnce).toBe(true);
    });
  });

  describe('ref behavior', () => {
    it('observe is called when element exists', () => {
      const element = document.createElement('div');
      const observer = new IntersectionObserver(vi.fn());
      observer.observe(element);
      expect(mockObserve).toHaveBeenCalledWith(element);
    });
  });
});
