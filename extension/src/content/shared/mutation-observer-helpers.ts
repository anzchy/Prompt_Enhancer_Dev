/**
 * MutationObserver helper for managing button injection across SPAs and DOM changes
 * Prevents duplicate button injection and handles re-mounting after SPA navigation
 */

/**
 * Configuration for the MutationObserver
 */
const OBSERVER_CONFIG: MutationObserverInit = {
  childList: true,
  subtree: true
};

const MAX_RETRY_ATTEMPTS = 100;

/**
 * Creates and manages a MutationObserver for monitoring DOM changes
 * Useful for SPA applications that change the DOM structure
 * @param callback - Function to call when DOM changes are detected
 * @param maxAttempts - Maximum number of times the callback should be triggered (default: 100)
 * @returns A MutationObserver instance (already observing document.body)
 */
export function createMutationObserver(
  callback: () => void,
  maxAttempts: number = MAX_RETRY_ATTEMPTS
): MutationObserver {
  let attempts = 0;

  const observer = new MutationObserver(() => {
    attempts++;
    console.log(`[Prompt Optimizer] MutationObserver triggered (attempt ${attempts}/${maxAttempts})`);

    callback();

    if (attempts >= maxAttempts) {
      console.warn(`[Prompt Optimizer] MutationObserver reached max attempts (${maxAttempts})`);
      observer.disconnect();
    }
  });

  observer.observe(document.body, OBSERVER_CONFIG);
  return observer;
}

/**
 * Detects URL changes in SPA applications
 * Useful for sites like Gemini and Manus that are SPAs
 * @param onUrlChange - Function to call when URL changes
 */
export function detectUrlChanges(onUrlChange: () => void): void {
  let lastUrl = location.href;

  const observer = new MutationObserver(() => {
    if (location.href !== lastUrl) {
      console.log(`[Prompt Optimizer] URL changed from ${lastUrl} to ${location.href}`);
      lastUrl = location.href;
      onUrlChange();
    }
  });

  observer.observe(document, { subtree: true, childList: true });
}

/**
 * Monitors if the input element is still in the DOM
 * If removed, triggers a callback (useful for re-injecting button after input changes)
 * @param inputElement - The input element to monitor
 * @param onRemoved - Function to call if input is removed from DOM
 */
export function monitorInputElement(
  inputElement: HTMLElement,
  onRemoved: () => void
): void {
  const observer = new MutationObserver(() => {
    if (!document.contains(inputElement)) {
      console.log('[Prompt Optimizer] Input element was removed from DOM');
      onRemoved();
      observer.disconnect();
    }
  });

  observer.observe(document.body, OBSERVER_CONFIG);
}
