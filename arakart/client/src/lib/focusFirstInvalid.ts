/**
 * Focuses on the first invalid field in a given list of element IDs or HTML elements.
 * Automatically scrolls the field into view for superior UX and accessibility.
 */
export const focusFirstInvalidField = (
  items: (string | HTMLElement | null | undefined)[]
): boolean => {
  for (const item of items) {
    if (!item) continue;
    const el = typeof item === 'string' ? document.getElementById(item) : item;
    if (el && typeof el.focus === 'function') {
      el.focus();
      if (typeof el.scrollIntoView === 'function') {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
      return true;
    }
  }
  return false;
};
