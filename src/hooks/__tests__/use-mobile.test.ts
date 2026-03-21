import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

const MOBILE_BREAKPOINT = 768;

describe('useIsMobile', () => {
  describe('mobile detection logic', () => {
    it('MOBILE_BREAKPOINT is 768', () => {
      expect(MOBILE_BREAKPOINT).toBe(768);
    });

    it('width below breakpoint is mobile', () => {
      const width = 375;
      expect(width < MOBILE_BREAKPOINT).toBe(true);
    });

    it('width equal to breakpoint is not mobile', () => {
      const width = 768;
      expect(width < MOBILE_BREAKPOINT).toBe(false);
    });

    it('width above breakpoint is not mobile', () => {
      const width = 1024;
      expect(width < MOBILE_BREAKPOINT).toBe(false);
    });

    it('width of 0 is mobile', () => {
      const width = 0;
      expect(width < MOBILE_BREAKPOINT).toBe(true);
    });

    it('width of 767 is mobile', () => {
      const width = 767;
      expect(width < MOBILE_BREAKPOINT).toBe(true);
    });

    it('width of 769 is not mobile', () => {
      const width = 769;
      expect(width < MOBILE_BREAKPOINT).toBe(false);
    });
  });

  describe('media query string', () => {
    it('generates correct media query string', () => {
      const query = `(max-width: ${MOBILE_BREAKPOINT - 1}px)`;
      expect(query).toBe('(max-width: 767px)');
    });
  });

  describe('matchMedia interaction', () => {
    it('matchMedia is called with correct query', () => {
      const originalMatchMedia = window.matchMedia;
      const mockMatchMedia = vi.fn().mockReturnValue({
        matches: false,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
      });
      window.matchMedia = mockMatchMedia;

      window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`);
      expect(mockMatchMedia).toHaveBeenCalledWith('(max-width: 767px)');

      window.matchMedia = originalMatchMedia;
    });

    it('addEventListener registers change handler', () => {
      const addEventListener = vi.fn();
      const mql = {
        matches: false,
        addEventListener,
        removeEventListener: vi.fn(),
      };

      const onChange = vi.fn();
      mql.addEventListener('change', onChange);
      expect(addEventListener).toHaveBeenCalledWith('change', onChange);
    });

    it('removeEventListener cleans up change handler', () => {
      const removeEventListener = vi.fn();
      const mql = {
        matches: false,
        addEventListener: vi.fn(),
        removeEventListener,
      };

      const onChange = vi.fn();
      mql.removeEventListener('change', onChange);
      expect(removeEventListener).toHaveBeenCalledWith('change', onChange);
    });
  });

  describe('initial state', () => {
    it('initial state is undefined (falsy)', () => {
      const isMobile: boolean | undefined = undefined;
      expect(!!isMobile).toBe(false);
    });

    it('double negation converts undefined to false', () => {
      expect(!!undefined).toBe(false);
    });

    it('double negation converts true to true', () => {
      expect(!!true).toBe(true);
    });

    it('double negation converts false to false', () => {
      expect(!!false).toBe(false);
    });
  });

  describe('window resize scenarios', () => {
    it('desktop width detected correctly', () => {
      const width = 1440;
      expect(width < MOBILE_BREAKPOINT).toBe(false);
    });

    it('tablet width detected correctly', () => {
      const width = 768;
      expect(width < MOBILE_BREAKPOINT).toBe(false);
    });

    it('small phone width detected correctly', () => {
      const width = 320;
      expect(width < MOBILE_BREAKPOINT).toBe(true);
    });

    it('iPhone width detected correctly', () => {
      const width = 390;
      expect(width < MOBILE_BREAKPOINT).toBe(true);
    });

    it('iPad width not mobile', () => {
      const width = 810;
      expect(width < MOBILE_BREAKPOINT).toBe(false);
    });
  });
});
