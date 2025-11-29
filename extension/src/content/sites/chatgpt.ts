/**
 * ChatGPT site handler
 * Implements button injection for chatgpt.com and chat.openai.com
 */

import { BaseSiteHandler } from '../shared/types';

export class ChatGptHandler extends BaseSiteHandler {
  hostPatterns = ['chatgpt.com', 'chat.openai.com'];
  name = 'ChatGPT';
  inputSelectors = [
    'div[role="textbox"]',
    '#prompt-textarea',
    'textarea[placeholder*="Message"]'
  ];

  /**
   * Insert button with 4-level fallback strategy optimized for ChatGPT's layout
   */
  insertButton(button: HTMLButtonElement, input: HTMLElement): boolean {
    console.log('[Prompt Optimizer] ChatGPT: Trying insertion strategies...');

    // Strategy 1: Try to anchor next to ChatGPT "+" button
    const plusButtonEl = document.querySelector('[data-testid="composer-plus-btn"]');
    if (plusButtonEl) {
      const plusContainer = plusButtonEl.parentElement;
      if (plusContainer) {
        plusContainer.appendChild(button);
        this.logStrategy(1, true, '(next to + button)');
        return true;
      }
    }
    this.logStrategy(1, false);

    // Strategy 2: Try grid-area:leading container
    const leadingArea = document.querySelector('[class*="grid-area:leading"]');
    if (leadingArea) {
      const plusButtonSpan = leadingArea.querySelector('span.flex');
      if (plusButtonSpan) {
        plusButtonSpan.appendChild(button);
        this.logStrategy(2, true, '(grid-area:leading)');
        return true;
      }
    }
    this.logStrategy(2, false);

    // Strategy 3: Insert before target's parent
    const parent = input.parentElement;
    if (parent) {
      parent.insertBefore(button, input);
      this.logStrategy(3, true, '(before target parent)');
      return true;
    }
    this.logStrategy(3, false);

    // Strategy 4: Last resort
    try {
      input.insertAdjacentElement('beforebegin', button);
      this.logStrategy(4, true, '(insertAdjacentElement)');
      return true;
    } catch (error) {
      this.logStrategy(4, false);
      return false;
    }
  }
}
