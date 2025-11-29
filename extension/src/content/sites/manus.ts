/**
 * Manus.im site handler
 * Implements button injection for manus.im with 4-level fallback strategy
 */

import { BaseSiteHandler } from '../shared/types';

export class ManusHandler extends BaseSiteHandler {
  hostPatterns = ['manus.im'];
  name = 'Manus';
  inputSelectors = [
    'textarea[placeholder="Assign a task or ask anything"]', // Exact match - most specific
    'textarea[placeholder*="Assign"]', // Partial match - handles variations
    'textarea[placeholder*="ask"]', // Partial match - case-insensitive fallback
    'textarea' // Generic fallback - always succeeds
  ];

  /**
   * Insert button with 4-level fallback strategy optimized for Manus's layout
   * Manus uses a flex container with buttons that we anchor to
   */
  insertButton(button: HTMLButtonElement, input: HTMLElement): boolean {
    console.log('[Prompt Optimizer] Manus: Trying insertion strategies...');

    // Strategy 1: Find .flex.gap-2.items-center.flex-shrink-0, locate first button.rounded-full (plus), insert after
    const flexContainer = document.querySelector('.flex.gap-2.items-center.flex-shrink-0');
    if (flexContainer) {
      const plusButton = flexContainer.querySelector('button.rounded-full');
      if (plusButton && plusButton.nextElementSibling) {
        // Insert after the plus button with spacing
        plusButton.parentElement?.insertBefore(button, plusButton.nextElementSibling);
        this.logStrategy(1, true, '(next to plus button)');
        return true;
      } else if (plusButton) {
        // If no next sibling, append to parent
        plusButton.parentElement?.appendChild(button);
        this.logStrategy(1, true, '(after plus button)');
        return true;
      }
    }
    this.logStrategy(1, false);

    // Strategy 2: Find .flex.gap-2.items-center.flex-shrink-0 and append button as last child
    const flexContainer2 = document.querySelector('.flex.gap-2.items-center.flex-shrink-0');
    if (flexContainer2) {
      flexContainer2.appendChild(button);
      this.logStrategy(2, true, '(flex.gap-2 container)');
      return true;
    }
    this.logStrategy(2, false);

    // Strategy 3: Find .px-3.flex.gap-2 (action bar) and append button
    const actionBar = document.querySelector('.px-3.flex.gap-2');
    if (actionBar) {
      actionBar.appendChild(button);
      this.logStrategy(3, true, '(action bar)');
      return true;
    }
    this.logStrategy(3, false);

    // Strategy 4: Last resort - insert before textarea parent
    const parent = input.parentElement;
    if (parent) {
      parent.insertBefore(button, input);
      this.logStrategy(4, true, '(before target parent)');
      return true;
    }
    this.logStrategy(4, false);

    return false;
  }
}
