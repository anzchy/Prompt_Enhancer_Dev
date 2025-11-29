/**
 * Gemini site handler
 * Implements button injection for gemini.google.com with 5-level fallback strategy
 * Includes support for Quill editor (contenteditable div with custom event handling)
 */

import { BaseSiteHandler } from '../shared/types';

export class GeminiHandler extends BaseSiteHandler {
  hostPatterns = ['gemini.google.com'];
  name = 'Gemini';
  inputSelectors = [
    '.ql-editor.textarea[contenteditable="true"][data-placeholder="Ask Gemini"]', // Most specific
    'div[role="textbox"][aria-label*="Enter a prompt here"]', // Quill editor wrapper
    'div.ql-editor[contenteditable="true"]', // Quill editor element
    'rich-textarea div[contenteditable="true"]', // Web component fallback
    'div[contenteditable="true"]' // Generic contenteditable (least specific)
  ];

  /**
   * Insert button with 5-level fallback strategy optimized for Gemini's layout
   * Gemini uses Material Design with leading-actions-wrapper for action buttons
   */
  insertButton(button: HTMLButtonElement, input: HTMLElement): boolean {
    console.log('[Prompt Optimizer] Gemini: Trying insertion strategies...');

    // Strategy 1: Find .leading-actions-wrapper, insert after upload button (or prepend if absent)
    const leadingActionsWrapper = document.querySelector('.leading-actions-wrapper');
    if (leadingActionsWrapper) {
      const uploadButton = leadingActionsWrapper.querySelector('button[aria-label*="upload" i]');
      if (uploadButton && uploadButton.nextElementSibling) {
        uploadButton.parentElement?.insertBefore(button, uploadButton.nextElementSibling);
        this.logStrategy(1, true, '(after upload button)');
        return true;
      } else {
        // Prepend if upload button not found
        leadingActionsWrapper.insertBefore(button, leadingActionsWrapper.firstChild);
        this.logStrategy(1, true, '(leading actions wrapper)');
        return true;
      }
    }
    this.logStrategy(1, false);

    // Strategy 2: Find .leading-actions-wrapper and append button as last child
    const leadingActionsWrapper2 = document.querySelector('.leading-actions-wrapper');
    if (leadingActionsWrapper2) {
      leadingActionsWrapper2.appendChild(button);
      this.logStrategy(2, true, '(append to leading actions)');
      return true;
    }
    this.logStrategy(2, false);

    // Strategy 3: Find .text-input-field_textarea-wrapper and insert after rich-textarea
    const textInputWrapper = document.querySelector('.text-input-field_textarea-wrapper');
    if (textInputWrapper) {
      const richTextarea = textInputWrapper.querySelector('rich-textarea');
      if (richTextarea && richTextarea.nextElementSibling) {
        richTextarea.parentElement?.insertBefore(button, richTextarea.nextElementSibling);
        this.logStrategy(3, true, '(after rich-textarea)');
        return true;
      } else if (richTextarea) {
        richTextarea.parentElement?.appendChild(button);
        this.logStrategy(3, true, '(append to textarea wrapper)');
        return true;
      }
    }
    this.logStrategy(3, false);

    // Strategy 4: Insert before ql-editor parent element
    const qlEditorParent = input.parentElement;
    if (qlEditorParent) {
      qlEditorParent.insertBefore(button, input);
      this.logStrategy(4, true, '(before ql-editor parent)');
      return true;
    }
    this.logStrategy(4, false);

    // Strategy 5: Last resort - insert adjacent to input
    try {
      input.insertAdjacentElement('beforebegin', button);
      this.logStrategy(5, true, '(insertAdjacentElement)');
      return true;
    } catch (error) {
      this.logStrategy(5, false);
      return false;
    }
  }

  /**
   * Override getPromptValue for Gemini's Quill editor
   * Quill editor uses contenteditable div, read text via textContent or innerText
   */
  getPromptValue(el: HTMLElement): string {
    // For Quill editor, use textContent to get plain text
    // This avoids getting HTML markup
    const text = el.textContent || el.innerText || '';
    return text.trim();
  }

  /**
   * Override setPromptValue for Gemini's Quill editor
   * Must update innerHTML for Quill and dispatch input event for framework detection
   */
  setPromptValue(el: HTMLElement, value: string): void {
    // For Quill editor, set the HTML content
    // Wrap in <p> tag as Quill expects block-level elements
    el.innerHTML = `<p>${this.escapeHtml(value)}</p>`;

    // Dispatch both input and change events to trigger Gemini's framework
    const inputEvent = new Event('input', { bubbles: true });
    const changeEvent = new Event('change', { bubbles: true });
    el.dispatchEvent(inputEvent);
    el.dispatchEvent(changeEvent);

    console.log('[Prompt Optimizer] Gemini: Updated Quill editor content');
  }

  /**
   * Escape HTML special characters to prevent XSS
   */
  private escapeHtml(text: string): string {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }
}
