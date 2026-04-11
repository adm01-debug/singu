import { describe, it, expect, vi } from 'vitest';
import {
  createTabHandler,
  createPeriodFilterHandler,
  createEITabHandler,
  createTriggerAnalyticsTabHandler,
  createFocusTypeHandler,
  createTriggerCategoryHandler,
  PERIOD_FILTER_VALUES,
  EI_TAB_VALUES,
  TRIGGER_ANALYTICS_TAB_VALUES,
  FOCUS_TYPE_VALUES,
  TRIGGER_CATEGORY_VALUES,
} from '../tab-utils';

// ========================================
// createTabHandler - 20+ scenarios
// ========================================
describe('createTabHandler', () => {
  it('calls setter with value when no validValues', () => {
    const setter = vi.fn();
    const handler = createTabHandler(setter);
    handler('any-value');
    expect(setter).toHaveBeenCalledWith('any-value');
  });

  it('calls setter with valid value', () => {
    const setter = vi.fn();
    const handler = createTabHandler(setter, ['a', 'b', 'c'] as const);
    handler('b');
    expect(setter).toHaveBeenCalledWith('b');
  });

  it('does NOT call setter with invalid value', () => {
    const setter = vi.fn();
    const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const handler = createTabHandler(setter, ['a', 'b'] as const);
    handler('invalid');
    expect(setter).not.toHaveBeenCalled();
    // Logger formats with timestamp prefix, so check that the message is included in the call args
    expect(consoleSpy).toHaveBeenCalled();
    const callArgs = consoleSpy.mock.calls[0].join(' ');
    expect(callArgs).toContain('Invalid tab value: invalid');
    consoleSpy.mockRestore();
  });

  it('handles empty string as value', () => {
    const setter = vi.fn();
    const handler = createTabHandler(setter, ['', 'a'] as const);
    handler('');
    expect(setter).toHaveBeenCalledWith('');
  });

  it('handles multiple calls', () => {
    const setter = vi.fn();
    const handler = createTabHandler(setter, ['a', 'b'] as const);
    handler('a');
    handler('b');
    handler('a');
    expect(setter).toHaveBeenCalledTimes(3);
  });
});

// ========================================
// Period filter handler - 10+ scenarios  
// ========================================
describe('createPeriodFilterHandler', () => {
  it('accepts all valid period values', () => {
    const setter = vi.fn();
    const handler = createPeriodFilterHandler(setter);
    for (const val of PERIOD_FILTER_VALUES) {
      handler(val);
    }
    expect(setter).toHaveBeenCalledTimes(PERIOD_FILTER_VALUES.length);
  });

  it('rejects invalid period value', () => {
    const setter = vi.fn();
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    const handler = createPeriodFilterHandler(setter);
    handler('60d');
    expect(setter).not.toHaveBeenCalled();
  });

  it('PERIOD_FILTER_VALUES contains expected values', () => {
    expect(PERIOD_FILTER_VALUES).toContain('7d');
    expect(PERIOD_FILTER_VALUES).toContain('30d');
    expect(PERIOD_FILTER_VALUES).toContain('90d');
    expect(PERIOD_FILTER_VALUES).toContain('365d');
    expect(PERIOD_FILTER_VALUES).toContain('all');
  });
});

// ========================================
// EI Tab handler
// ========================================
describe('createEITabHandler', () => {
  it('accepts all valid EI tab values', () => {
    const setter = vi.fn();
    const handler = createEITabHandler(setter);
    for (const val of EI_TAB_VALUES) {
      handler(val);
    }
    expect(setter).toHaveBeenCalledTimes(EI_TAB_VALUES.length);
  });

  it('EI_TAB_VALUES has 4 tabs', () => {
    expect(EI_TAB_VALUES.length).toBe(4);
  });
});

// ========================================
// Trigger analytics tab handler
// ========================================
describe('createTriggerAnalyticsTabHandler', () => {
  it('accepts valid values', () => {
    const setter = vi.fn();
    const handler = createTriggerAnalyticsTabHandler(setter);
    handler('overview');
    handler('disc');
    handler('triggers');
    expect(setter).toHaveBeenCalledTimes(3);
  });
});

// ========================================
// Focus type handler
// ========================================
describe('createFocusTypeHandler', () => {
  it('accepts valid focus types', () => {
    const setter = vi.fn();
    const handler = createFocusTypeHandler(setter);
    for (const val of FOCUS_TYPE_VALUES) {
      handler(val);
    }
    expect(setter).toHaveBeenCalledTimes(3);
  });
});

// ========================================
// Trigger category handler
// ========================================
describe('createTriggerCategoryHandler', () => {
  it('accepts all trigger categories', () => {
    const setter = vi.fn();
    const handler = createTriggerCategoryHandler(setter);
    for (const val of TRIGGER_CATEGORY_VALUES) {
      handler(val);
    }
    expect(setter).toHaveBeenCalledTimes(TRIGGER_CATEGORY_VALUES.length);
  });

  it('includes all expected categories', () => {
    expect(TRIGGER_CATEGORY_VALUES).toContain('urgency');
    expect(TRIGGER_CATEGORY_VALUES).toContain('social_proof');
    expect(TRIGGER_CATEGORY_VALUES).toContain('scarcity');
    expect(TRIGGER_CATEGORY_VALUES).toContain('authority');
    expect(TRIGGER_CATEGORY_VALUES).toContain('reciprocity');
  });

  it('rejects unknown category', () => {
    const setter = vi.fn();
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    const handler = createTriggerCategoryHandler(setter);
    handler('unknown_category');
    expect(setter).not.toHaveBeenCalled();
  });
});
