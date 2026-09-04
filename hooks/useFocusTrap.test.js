import { describe, expect, it } from 'vitest';
import { wrapFocusIndex } from './useFocusTrap';

describe('focus trap wrapping', () => {
  it('wraps forward and backward', () => {
    expect(wrapFocusIndex(3, 3)).toBe(0);
    expect(wrapFocusIndex(-1, 3)).toBe(2);
  });

  it('handles empty dialogs', () => {
    expect(wrapFocusIndex(0, 0)).toBe(-1);
  });
});