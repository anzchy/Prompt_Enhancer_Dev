/**
 * Shared button controller for managing the optimize button across all sites
 * Handles button creation, optimization flow, and state management
 */

import { MessageType, OptimizePromptResponse } from '../../shared/messages';
import { applyButtonStyles, observeThemeChanges } from '../button-styles';

const BUTTON_CLASS = 'prompt-enhancer-btn';
const BUTTON_TEXT = '优化指令';

/**
 * Creates the optimize button element
 * @returns A configured button element ready to be inserted into the DOM
 */
export function createButton(): HTMLButtonElement {
  const button = document.createElement('button');
  button.type = 'button';
  button.textContent = BUTTON_TEXT;
  button.className = BUTTON_CLASS;

  // Apply styles (CSS handles most styling now)
  applyButtonStyles(button);
  observeThemeChanges(button);

  return button;
}

/**
 * Handles the optimize button click - sends prompt to background worker for optimization
 * @param button - The button element (for state updates)
 * @param target - The input element containing the prompt
 * @param getPromptValue - Function to read prompt from input element
 * @param setPromptValue - Function to write optimized prompt to input element
 */
export async function handleOptimize(
  button: HTMLButtonElement,
  target: HTMLElement,
  getPromptValue: (el: HTMLElement) => string,
  setPromptValue: (el: HTMLElement, value: string) => void
): Promise<void> {
  console.log('[Prompt Optimizer] Optimize triggered');

  const originalPrompt = getPromptValue(target).trim();
  if (!originalPrompt) {
    console.warn('[Prompt Optimizer] Empty prompt');
    button.textContent = '请输入内容';
    setTimeout(() => (button.textContent = BUTTON_TEXT), 1200);
    return;
  }

  console.log('[Prompt Optimizer] Original prompt:', originalPrompt.substring(0, 50) + '...');

  setLoading(button, true);
  try {
    console.log('[Prompt Optimizer] Sending request to background...');
    const response = (await chrome.runtime.sendMessage({
      type: MessageType.OptimizePrompt,
      payload: { originalPrompt, source: 'content-script', pageHost: window.location.host }
    })) as OptimizePromptResponse;

    console.log('[Prompt Optimizer] Response:', response);

    if (!response?.success || !response.optimizedPrompt) {
      const msg = response?.error || '优化失败';
      console.error('[Prompt Optimizer] Failed:', msg);
      button.textContent = msg;
      setTimeout(() => (button.textContent = BUTTON_TEXT), 1400);
      return;
    }

    console.log('[Prompt Optimizer] ✅ Success, updating prompt');
    setPromptValue(target, response.optimizedPrompt);
  } catch (error) {
    console.error('[Prompt Optimizer] Error:', error);
    button.textContent = '请求错误';
    setTimeout(() => (button.textContent = BUTTON_TEXT), 1400);
  } finally {
    setLoading(button, false);
  }
}

/**
 * Updates the button's loading state
 * @param button - The button element to update
 * @param loading - True if loading, false if idle
 */
export function setLoading(button: HTMLButtonElement, loading: boolean): void {
  button.disabled = loading;
  button.textContent = loading ? '优化中…' : BUTTON_TEXT;
  if (loading) {
    button.classList.add('loading');
  } else {
    button.classList.remove('loading');
  }
}

/**
 * Check if the button already exists on the page
 * @returns True if button exists, false otherwise
 */
export function buttonExists(): boolean {
  return !!document.querySelector(`.${BUTTON_CLASS}`);
}

/**
 * Remove the button from the page
 */
export function removeButton(): void {
  const button = document.querySelector(`.${BUTTON_CLASS}`);
  if (button) {
    button.remove();
    console.log('[Prompt Optimizer] Button removed');
  }
}
