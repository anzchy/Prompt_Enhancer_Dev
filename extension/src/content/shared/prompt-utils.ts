/**
 * Prompt utility functions for reading and writing prompt text across different input types
 */

/**
 * Reads the prompt value from an input element
 * Handles both standard inputs (textarea, input[type=text]) and contenteditable divs
 * @param el - The input element to read from
 * @returns The current prompt text
 */
export function getPromptValue(el: HTMLElement): string {
  if (el instanceof HTMLTextAreaElement || el instanceof HTMLInputElement) {
    return el.value || '';
  }
  return el.textContent || '';
}

/**
 * Sets the prompt value on an input element
 * Handles both standard inputs (textarea, input[type=text]) and contenteditable divs
 * Dispatches 'input' event to trigger change detection in the target site's framework
 * @param el - The input element to write to
 * @param value - The new prompt text to set
 */
export function setPromptValue(el: HTMLElement, value: string) {
  if (el instanceof HTMLTextAreaElement || el instanceof HTMLInputElement) {
    el.value = value;
    el.dispatchEvent(new Event('input', { bubbles: true }));
    return;
  }
  el.textContent = value;
  el.dispatchEvent(new Event('input', { bubbles: true }));
}
