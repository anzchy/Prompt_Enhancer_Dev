import { MessageType, isTriggerOptimizeMessage } from '../shared/messages';
import {
  createButton,
  handleOptimize,
  buttonExists,
  removeButton
} from './shared/button-controller';
import { ChatGptHandler } from './sites/chatgpt';
import { ManusHandler } from './sites/manus';
import { GeminiHandler } from './sites/gemini';
import { createMutationObserver } from './shared/mutation-observer-helpers';
import type { SiteHandler } from './shared/types';

const BUTTON_CLASS = 'prompt-enhancer-btn';

console.log('[Prompt Optimizer] Content script loaded on:', window.location.href);

// Array of all supported site handlers
const handlers: SiteHandler[] = [
  new ChatGptHandler(),
  new ManusHandler(),
  new GeminiHandler()
];

/**
 * Get the appropriate handler for the current site
 * @returns The handler for the current site, or null if no handler matches
 */
function getActiveHandler(): SiteHandler | null {
  for (const handler of handlers) {
    if (handler.shouldActivate()) {
      return handler;
    }
  }
  return null;
}

/**
 * Main initialization function
 * Attempts to inject the button immediately, then sets up MutationObserver for SPAs
 */
function mount(): void {
  console.log('[Prompt Optimizer] mount() called');

  const handler = getActiveHandler();
  if (!handler) {
    console.log('[Prompt Optimizer] No supported host detected');
    return;
  }

  console.log(`[Prompt Optimizer] ✅ Active handler: ${handler.name}`);

  // Try to find and inject button immediately
  const input = handler.findPromptInput();
  if (input) {
    console.log('[Prompt Optimizer] Input found immediately');
    injectButton(handler, input);
    return;
  }

  // If not found immediately, set up MutationObserver for SPAs
  console.log('[Prompt Optimizer] Setting up MutationObserver for SPA navigation...');

  createMutationObserver(
    () => {
      // Try again when DOM changes
      const foundInput = handler.findPromptInput();
      if (foundInput && !buttonExists()) {
        console.log('[Prompt Optimizer] Input found via MutationObserver');
        injectButton(handler, foundInput);
      }
    },
    100  // Max attempts
  );
}

/**
 * Inject the button for a given handler and input element
 * @param handler - The site handler
 * @param input - The input element where button should be injected
 */
function injectButton(handler: SiteHandler, input: HTMLElement): void {
  if (buttonExists()) {
    console.log('[Prompt Optimizer] Button already exists');
    return;
  }

  console.log('[Prompt Optimizer] Creating button...');
  const button = createButton();

  // Add click listener to button
  button.addEventListener('click', async () => {
    await handleOptimize(button, input, handler.getPromptValue.bind(handler), handler.setPromptValue.bind(handler));
  });

  // Insert button using site-specific handler
  const success = handler.insertButton(button, input);
  if (!success) {
    console.warn('[Prompt Optimizer] All insertion strategies failed');
    removeButton();
  }
}

// Initialize on page load
if (document.readyState === 'complete' || document.readyState === 'interactive') {
  console.log('[Prompt Optimizer] Document ready, mounting...');
  mount();
} else {
  console.log('[Prompt Optimizer] Waiting for DOMContentLoaded...');
  window.addEventListener('DOMContentLoaded', () => {
    console.log('[Prompt Optimizer] DOMContentLoaded fired');
    mount();
  });
}

// Delayed retry for SPAs
setTimeout(() => {
  console.log('[Prompt Optimizer] Delayed mount attempt (2s)');
  mount();
}, 2000);

// Handle keyboard shortcut
chrome.runtime.onMessage.addListener((message) => {
  if (isTriggerOptimizeMessage(message)) {
    console.log('[Prompt Optimizer] Keyboard shortcut triggered');
    const handler = getActiveHandler();
    if (!handler) {
      console.warn('[Prompt Optimizer] No active handler for keyboard shortcut');
      return;
    }

    const button = document.querySelector<HTMLButtonElement>(`.${BUTTON_CLASS}`);
    const target = handler.findPromptInput();

    if (button && target) {
      handleOptimize(button, target, handler.getPromptValue.bind(handler), handler.setPromptValue.bind(handler));
    } else {
      console.warn('[Prompt Optimizer] Cannot handle shortcut - button or input missing');
    }
  }
});

console.log('[Prompt Optimizer] Content script initialized');
