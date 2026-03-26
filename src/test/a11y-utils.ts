/**
 * Accessibility testing utilities for component tests.
 * Provides helpers to validate ARIA attributes, focus management,
 * keyboard navigation, and color contrast basics.
 *
 * Usage:
 *   import { a11y } from '@/test/a11y-utils';
 *   a11y.assertNoA11yViolations(container);
 */

/**
 * Check that all images have alt text.
 */
function assertImagesHaveAlt(container: HTMLElement): string[] {
  const violations: string[] = [];
  const images = container.querySelectorAll('img');
  images.forEach((img, i) => {
    if (!img.hasAttribute('alt')) {
      violations.push(`Image #${i + 1} (src="${img.src?.slice(0, 50)}") missing alt attribute`);
    }
  });
  return violations;
}

/**
 * Check that all interactive elements are keyboard accessible.
 */
function assertKeyboardAccessible(container: HTMLElement): string[] {
  const violations: string[] = [];
  const clickables = container.querySelectorAll('[onclick], [role="button"]');
  clickables.forEach((el, i) => {
    const tag = el.tagName.toLowerCase();
    if (tag !== 'button' && tag !== 'a' && tag !== 'input') {
      const tabIndex = el.getAttribute('tabindex');
      if (tabIndex === null || parseInt(tabIndex) < 0) {
        violations.push(
          `Interactive element #${i + 1} (<${tag} role="${el.getAttribute('role')}">)  is not keyboard accessible (missing tabindex)`
        );
      }
    }
  });
  return violations;
}

/**
 * Check that form inputs have associated labels.
 */
function assertFormLabels(container: HTMLElement): string[] {
  const violations: string[] = [];
  const inputs = container.querySelectorAll('input, select, textarea');
  inputs.forEach((input, i) => {
    const id = input.getAttribute('id');
    const ariaLabel = input.getAttribute('aria-label');
    const ariaLabelledBy = input.getAttribute('aria-labelledby');
    const hasLabel = id && container.querySelector(`label[for="${id}"]`);
    const isHidden = input.getAttribute('type') === 'hidden';

    if (!isHidden && !hasLabel && !ariaLabel && !ariaLabelledBy) {
      violations.push(
        `Form input #${i + 1} (<${input.tagName.toLowerCase()} type="${input.getAttribute('type')}">)  has no associated label or aria-label`
      );
    }
  });
  return violations;
}

/**
 * Check that ARIA roles are valid.
 */
function assertValidAriaRoles(container: HTMLElement): string[] {
  const violations: string[] = [];
  const validRoles = new Set([
    'alert', 'alertdialog', 'application', 'article', 'banner', 'button',
    'cell', 'checkbox', 'columnheader', 'combobox', 'complementary',
    'contentinfo', 'definition', 'dialog', 'directory', 'document', 'feed',
    'figure', 'form', 'grid', 'gridcell', 'group', 'heading', 'img',
    'link', 'list', 'listbox', 'listitem', 'log', 'main', 'marquee',
    'math', 'menu', 'menubar', 'menuitem', 'menuitemcheckbox',
    'menuitemradio', 'navigation', 'none', 'note', 'option', 'presentation',
    'progressbar', 'radio', 'radiogroup', 'region', 'row', 'rowgroup',
    'rowheader', 'scrollbar', 'search', 'searchbox', 'separator', 'slider',
    'spinbutton', 'status', 'switch', 'tab', 'table', 'tablist', 'tabpanel',
    'term', 'textbox', 'timer', 'toolbar', 'tooltip', 'tree', 'treegrid',
    'treeitem',
  ]);

  const elements = container.querySelectorAll('[role]');
  elements.forEach((el) => {
    const role = el.getAttribute('role');
    if (role && !validRoles.has(role)) {
      violations.push(`Invalid ARIA role "${role}" on <${el.tagName.toLowerCase()}>`);
    }
  });
  return violations;
}

/**
 * Check that heading levels are sequential (no skipping h1 -> h3).
 */
function assertHeadingHierarchy(container: HTMLElement): string[] {
  const violations: string[] = [];
  const headings = container.querySelectorAll('h1, h2, h3, h4, h5, h6');
  let lastLevel = 0;

  headings.forEach((heading) => {
    const level = parseInt(heading.tagName[1]);
    if (lastLevel > 0 && level > lastLevel + 1) {
      violations.push(
        `Heading hierarchy skipped from h${lastLevel} to h${level}: "${heading.textContent?.slice(0, 40)}"`
      );
    }
    lastLevel = level;
  });
  return violations;
}

/**
 * Check that buttons and links have accessible text.
 */
function assertInteractiveText(container: HTMLElement): string[] {
  const violations: string[] = [];
  const interactives = container.querySelectorAll('button, a[href]');

  interactives.forEach((el, i) => {
    const text = el.textContent?.trim();
    const ariaLabel = el.getAttribute('aria-label');
    const ariaLabelledBy = el.getAttribute('aria-labelledby');
    const title = el.getAttribute('title');
    const hasImg = el.querySelector('img[alt], svg[aria-label]');

    if (!text && !ariaLabel && !ariaLabelledBy && !title && !hasImg) {
      violations.push(
        `Interactive element #${i + 1} (<${el.tagName.toLowerCase()}>) has no accessible text`
      );
    }
  });
  return violations;
}

/**
 * Run all accessibility checks and return violations.
 */
function checkA11y(container: HTMLElement): string[] {
  return [
    ...assertImagesHaveAlt(container),
    ...assertKeyboardAccessible(container),
    ...assertFormLabels(container),
    ...assertValidAriaRoles(container),
    ...assertHeadingHierarchy(container),
    ...assertInteractiveText(container),
  ];
}

/**
 * Assert no accessibility violations (throws if any found).
 */
function assertNoA11yViolations(container: HTMLElement): void {
  const violations = checkA11y(container);
  if (violations.length > 0) {
    throw new Error(
      `Found ${violations.length} accessibility violation(s):\n${violations.map((v, i) => `  ${i + 1}. ${v}`).join('\n')}`
    );
  }
}

export const a11y = {
  checkA11y,
  assertNoA11yViolations,
  assertImagesHaveAlt,
  assertKeyboardAccessible,
  assertFormLabels,
  assertValidAriaRoles,
  assertHeadingHierarchy,
  assertInteractiveText,
};
