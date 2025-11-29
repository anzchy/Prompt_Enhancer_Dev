/**
 * Site-specific handler interface for button injection
 * Defines the contract that each site handler must implement
 */

/**
 * Handler for injecting the optimize button on a specific chat site
 */
export interface SiteHandler {
  /** Hostname patterns this handler supports (e.g., ['chatgpt.com', 'chat.openai.com']) */
  hostPatterns: string[];

  /** Site name for logging purposes */
  name: string;

  /** CSS selectors to find the prompt input, in priority order */
  inputSelectors: string[];

  /**
   * Find the input element on the page
   * Tries selectors in priority order
   * @returns The input element, or null if not found
   */
  findPromptInput(): HTMLElement | null;

  /**
   * Get the current prompt text from the input element
   * @param input - The input element
   * @returns The prompt text
   */
  getPromptValue(input: HTMLElement): string;

  /**
   * Set the prompt text in the input element
   * @param input - The input element
   * @param value - The new prompt text
   */
  setPromptValue(input: HTMLElement, value: string): void;

  /**
   * Insert the optimize button at the appropriate location on the page
   * @param button - The button element to insert
   * @param input - The input element (for reference when deciding placement)
   * @returns True if insertion succeeded, false if all strategies failed
   */
  insertButton(button: HTMLButtonElement, input: HTMLElement): boolean;

  /**
   * Check if this handler should be active for the current site
   * @returns True if this is the right handler for the current host
   */
  shouldActivate(): boolean;
}

/**
 * Base implementation of SiteHandler with common functionality
 */
export abstract class BaseSiteHandler implements SiteHandler {
  abstract hostPatterns: string[];
  abstract name: string;
  abstract inputSelectors: string[];

  findPromptInput(): HTMLElement | null {
    console.log(`[Prompt Optimizer] ${this.name}: Trying selectors:`, this.inputSelectors);

    for (const selector of this.inputSelectors) {
      const el = document.querySelector<HTMLElement>(selector);
      if (el) {
        console.log(`[Prompt Optimizer] ${this.name}: ✅ Found input element:`, selector);
        return el;
      }
    }

    console.warn(`[Prompt Optimizer] ${this.name}: ❌ Could not find input element`);
    return null;
  }

  getPromptValue(input: HTMLElement): string {
    if (input instanceof HTMLTextAreaElement || input instanceof HTMLInputElement) {
      return input.value || '';
    }
    return input.textContent || '';
  }

  setPromptValue(input: HTMLElement, value: string): void {
    if (input instanceof HTMLTextAreaElement || input instanceof HTMLInputElement) {
      input.value = value;
      input.dispatchEvent(new Event('input', { bubbles: true }));
      return;
    }
    input.textContent = value;
    input.dispatchEvent(new Event('input', { bubbles: true }));
  }

  abstract insertButton(button: HTMLButtonElement, input: HTMLElement): boolean;

  shouldActivate(): boolean {
    return this.hostPatterns.some(pattern => window.location.host.includes(pattern));
  }

  /**
   * Helper method to log strategy success/failure
   */
  protected logStrategy(strategyNum: number, success: boolean, details: string = '') {
    if (success) {
      console.log(`[Prompt Optimizer] ${this.name}: ✅ Strategy ${strategyNum} succeeded ${details}`);
    } else {
      console.warn(`[Prompt Optimizer] ${this.name}: Strategy ${strategyNum} failed ${details}`);
    }
  }
}
