// src/shared/messages.ts
var MessageType = {
  OptimizePrompt: "OPTIMIZE_PROMPT",
  TriggerOptimize: "TRIGGER_OPTIMIZE"
};
function isTriggerOptimizeMessage(message) {
  if (!message || typeof message !== "object") return false;
  const typed = message;
  return typed.type === MessageType.TriggerOptimize;
}

// src/content/button-styles.ts
function isDarkMode() {
  return document.documentElement.classList.contains("dark");
}
function applyButtonStyles(button) {
  console.log("[Prompt Optimizer] Button styles applied via CSS");
}
function observeThemeChanges(button) {
  const observer = new MutationObserver(() => {
    const isDark = isDarkMode();
    console.log("[Prompt Optimizer] Theme changed to:", isDark ? "dark" : "light");
  });
  observer.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ["class"]
  });
  return observer;
}

// src/content/shared/button-controller.ts
var BUTTON_CLASS = "prompt-enhancer-btn";
var BUTTON_TEXT = "\u4F18\u5316\u6307\u4EE4";
function createButton() {
  const button = document.createElement("button");
  button.type = "button";
  button.textContent = BUTTON_TEXT;
  button.className = BUTTON_CLASS;
  applyButtonStyles(button);
  observeThemeChanges(button);
  return button;
}
async function handleOptimize(button, target, getPromptValue, setPromptValue) {
  console.log("[Prompt Optimizer] Optimize triggered");
  const originalPrompt = getPromptValue(target).trim();
  if (!originalPrompt) {
    console.warn("[Prompt Optimizer] Empty prompt");
    button.textContent = "\u8BF7\u8F93\u5165\u5185\u5BB9";
    setTimeout(() => button.textContent = BUTTON_TEXT, 1200);
    return;
  }
  console.log("[Prompt Optimizer] Original prompt:", originalPrompt.substring(0, 50) + "...");
  setLoading(button, true);
  try {
    console.log("[Prompt Optimizer] Sending request to background...");
    const response = await chrome.runtime.sendMessage({
      type: MessageType.OptimizePrompt,
      payload: { originalPrompt, source: "content-script", pageHost: window.location.host }
    });
    console.log("[Prompt Optimizer] Response:", response);
    if (!response?.success || !response.optimizedPrompt) {
      const msg = response?.error || "\u4F18\u5316\u5931\u8D25";
      console.error("[Prompt Optimizer] Failed:", msg);
      button.textContent = msg;
      setTimeout(() => button.textContent = BUTTON_TEXT, 1400);
      return;
    }
    console.log("[Prompt Optimizer] \u2705 Success, updating prompt");
    setPromptValue(target, response.optimizedPrompt);
  } catch (error) {
    console.error("[Prompt Optimizer] Error:", error);
    button.textContent = "\u8BF7\u6C42\u9519\u8BEF";
    setTimeout(() => button.textContent = BUTTON_TEXT, 1400);
  } finally {
    setLoading(button, false);
  }
}
function setLoading(button, loading) {
  button.disabled = loading;
  button.textContent = loading ? "\u4F18\u5316\u4E2D\u2026" : BUTTON_TEXT;
  if (loading) {
    button.classList.add("loading");
  } else {
    button.classList.remove("loading");
  }
}
function buttonExists() {
  return !!document.querySelector(`.${BUTTON_CLASS}`);
}
function removeButton() {
  const button = document.querySelector(`.${BUTTON_CLASS}`);
  if (button) {
    button.remove();
    console.log("[Prompt Optimizer] Button removed");
  }
}

// src/content/shared/types.ts
var BaseSiteHandler = class {
  findPromptInput() {
    console.log(`[Prompt Optimizer] ${this.name}: Trying selectors:`, this.inputSelectors);
    for (const selector of this.inputSelectors) {
      const el = document.querySelector(selector);
      if (el) {
        console.log(`[Prompt Optimizer] ${this.name}: \u2705 Found input element:`, selector);
        return el;
      }
    }
    console.warn(`[Prompt Optimizer] ${this.name}: \u274C Could not find input element`);
    return null;
  }
  getPromptValue(input) {
    if (input instanceof HTMLTextAreaElement || input instanceof HTMLInputElement) {
      return input.value || "";
    }
    return input.textContent || "";
  }
  setPromptValue(input, value) {
    if (input instanceof HTMLTextAreaElement || input instanceof HTMLInputElement) {
      input.value = value;
      input.dispatchEvent(new Event("input", { bubbles: true }));
      return;
    }
    input.textContent = value;
    input.dispatchEvent(new Event("input", { bubbles: true }));
  }
  shouldActivate() {
    return this.hostPatterns.some((pattern) => window.location.host.includes(pattern));
  }
  /**
   * Helper method to log strategy success/failure
   */
  logStrategy(strategyNum, success, details = "") {
    if (success) {
      console.log(`[Prompt Optimizer] ${this.name}: \u2705 Strategy ${strategyNum} succeeded ${details}`);
    } else {
      console.warn(`[Prompt Optimizer] ${this.name}: Strategy ${strategyNum} failed ${details}`);
    }
  }
};

// src/content/sites/chatgpt.ts
var ChatGptHandler = class extends BaseSiteHandler {
  constructor() {
    super(...arguments);
    this.hostPatterns = ["chatgpt.com", "chat.openai.com"];
    this.name = "ChatGPT";
    this.inputSelectors = [
      'div[role="textbox"]',
      "#prompt-textarea",
      'textarea[placeholder*="Message"]'
    ];
  }
  /**
   * Insert button with 4-level fallback strategy optimized for ChatGPT's layout
   */
  insertButton(button, input) {
    console.log("[Prompt Optimizer] ChatGPT: Trying insertion strategies...");
    const plusButtonEl = document.querySelector('[data-testid="composer-plus-btn"]');
    if (plusButtonEl) {
      const plusContainer = plusButtonEl.parentElement;
      if (plusContainer) {
        plusContainer.appendChild(button);
        this.logStrategy(1, true, "(next to + button)");
        return true;
      }
    }
    this.logStrategy(1, false);
    const leadingArea = document.querySelector('[class*="grid-area:leading"]');
    if (leadingArea) {
      const plusButtonSpan = leadingArea.querySelector("span.flex");
      if (plusButtonSpan) {
        plusButtonSpan.appendChild(button);
        this.logStrategy(2, true, "(grid-area:leading)");
        return true;
      }
    }
    this.logStrategy(2, false);
    const parent = input.parentElement;
    if (parent) {
      parent.insertBefore(button, input);
      this.logStrategy(3, true, "(before target parent)");
      return true;
    }
    this.logStrategy(3, false);
    try {
      input.insertAdjacentElement("beforebegin", button);
      this.logStrategy(4, true, "(insertAdjacentElement)");
      return true;
    } catch (error) {
      this.logStrategy(4, false);
      return false;
    }
  }
};

// src/content/sites/manus.ts
var ManusHandler = class extends BaseSiteHandler {
  constructor() {
    super(...arguments);
    this.hostPatterns = ["manus.im"];
    this.name = "Manus";
    this.inputSelectors = [
      'textarea[placeholder="Assign a task or ask anything"]',
      // Exact match - most specific
      'textarea[placeholder*="Assign"]',
      // Partial match - handles variations
      'textarea[placeholder*="ask"]',
      // Partial match - case-insensitive fallback
      "textarea"
      // Generic fallback - always succeeds
    ];
  }
  /**
   * Insert button with 4-level fallback strategy optimized for Manus's layout
   * Manus uses a flex container with buttons that we anchor to
   */
  insertButton(button, input) {
    console.log("[Prompt Optimizer] Manus: Trying insertion strategies...");
    const flexContainer = document.querySelector(".flex.gap-2.items-center.flex-shrink-0");
    if (flexContainer) {
      const plusButton = flexContainer.querySelector("button.rounded-full");
      if (plusButton && plusButton.nextElementSibling) {
        plusButton.parentElement?.insertBefore(button, plusButton.nextElementSibling);
        this.logStrategy(1, true, "(next to plus button)");
        return true;
      } else if (plusButton) {
        plusButton.parentElement?.appendChild(button);
        this.logStrategy(1, true, "(after plus button)");
        return true;
      }
    }
    this.logStrategy(1, false);
    const flexContainer2 = document.querySelector(".flex.gap-2.items-center.flex-shrink-0");
    if (flexContainer2) {
      flexContainer2.appendChild(button);
      this.logStrategy(2, true, "(flex.gap-2 container)");
      return true;
    }
    this.logStrategy(2, false);
    const actionBar = document.querySelector(".px-3.flex.gap-2");
    if (actionBar) {
      actionBar.appendChild(button);
      this.logStrategy(3, true, "(action bar)");
      return true;
    }
    this.logStrategy(3, false);
    const parent = input.parentElement;
    if (parent) {
      parent.insertBefore(button, input);
      this.logStrategy(4, true, "(before target parent)");
      return true;
    }
    this.logStrategy(4, false);
    return false;
  }
};

// src/content/sites/gemini.ts
var GeminiHandler = class extends BaseSiteHandler {
  constructor() {
    super(...arguments);
    this.hostPatterns = ["gemini.google.com"];
    this.name = "Gemini";
    this.inputSelectors = [
      '.ql-editor.textarea[contenteditable="true"][data-placeholder="Ask Gemini"]',
      // Most specific
      'div[role="textbox"][aria-label*="Enter a prompt here"]',
      // Quill editor wrapper
      'div.ql-editor[contenteditable="true"]',
      // Quill editor element
      'rich-textarea div[contenteditable="true"]',
      // Web component fallback
      'div[contenteditable="true"]'
      // Generic contenteditable (least specific)
    ];
  }
  /**
   * Insert button with 5-level fallback strategy optimized for Gemini's layout
   * Gemini uses Material Design with leading-actions-wrapper for action buttons
   */
  insertButton(button, input) {
    console.log("[Prompt Optimizer] Gemini: Trying insertion strategies...");
    const leadingActionsWrapper = document.querySelector(".leading-actions-wrapper");
    if (leadingActionsWrapper) {
      const uploadButton = leadingActionsWrapper.querySelector('button[aria-label*="upload" i]');
      if (uploadButton && uploadButton.nextElementSibling) {
        uploadButton.parentElement?.insertBefore(button, uploadButton.nextElementSibling);
        this.logStrategy(1, true, "(after upload button)");
        return true;
      } else {
        leadingActionsWrapper.insertBefore(button, leadingActionsWrapper.firstChild);
        this.logStrategy(1, true, "(leading actions wrapper)");
        return true;
      }
    }
    this.logStrategy(1, false);
    const leadingActionsWrapper2 = document.querySelector(".leading-actions-wrapper");
    if (leadingActionsWrapper2) {
      leadingActionsWrapper2.appendChild(button);
      this.logStrategy(2, true, "(append to leading actions)");
      return true;
    }
    this.logStrategy(2, false);
    const textInputWrapper = document.querySelector(".text-input-field_textarea-wrapper");
    if (textInputWrapper) {
      const richTextarea = textInputWrapper.querySelector("rich-textarea");
      if (richTextarea && richTextarea.nextElementSibling) {
        richTextarea.parentElement?.insertBefore(button, richTextarea.nextElementSibling);
        this.logStrategy(3, true, "(after rich-textarea)");
        return true;
      } else if (richTextarea) {
        richTextarea.parentElement?.appendChild(button);
        this.logStrategy(3, true, "(append to textarea wrapper)");
        return true;
      }
    }
    this.logStrategy(3, false);
    const qlEditorParent = input.parentElement;
    if (qlEditorParent) {
      qlEditorParent.insertBefore(button, input);
      this.logStrategy(4, true, "(before ql-editor parent)");
      return true;
    }
    this.logStrategy(4, false);
    try {
      input.insertAdjacentElement("beforebegin", button);
      this.logStrategy(5, true, "(insertAdjacentElement)");
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
  getPromptValue(el) {
    const text = el.textContent || el.innerText || "";
    return text.trim();
  }
  /**
   * Override setPromptValue for Gemini's Quill editor
   * Must update innerHTML for Quill and dispatch input event for framework detection
   */
  setPromptValue(el, value) {
    el.innerHTML = `<p>${this.escapeHtml(value)}</p>`;
    const inputEvent = new Event("input", { bubbles: true });
    const changeEvent = new Event("change", { bubbles: true });
    el.dispatchEvent(inputEvent);
    el.dispatchEvent(changeEvent);
    console.log("[Prompt Optimizer] Gemini: Updated Quill editor content");
  }
  /**
   * Escape HTML special characters to prevent XSS
   */
  escapeHtml(text) {
    const div = document.createElement("div");
    div.textContent = text;
    return div.innerHTML;
  }
};

// src/content/shared/mutation-observer-helpers.ts
var OBSERVER_CONFIG = {
  childList: true,
  subtree: true
};
var MAX_RETRY_ATTEMPTS = 100;
function createMutationObserver(callback, maxAttempts = MAX_RETRY_ATTEMPTS) {
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

// src/content/index.ts
var BUTTON_CLASS2 = "prompt-enhancer-btn";
console.log("[Prompt Optimizer] Content script loaded on:", window.location.href);
var handlers = [
  new ChatGptHandler(),
  new ManusHandler(),
  new GeminiHandler()
];
function getActiveHandler() {
  for (const handler of handlers) {
    if (handler.shouldActivate()) {
      return handler;
    }
  }
  return null;
}
function mount() {
  console.log("[Prompt Optimizer] mount() called");
  const handler = getActiveHandler();
  if (!handler) {
    console.log("[Prompt Optimizer] No supported host detected");
    return;
  }
  console.log(`[Prompt Optimizer] \u2705 Active handler: ${handler.name}`);
  const input = handler.findPromptInput();
  if (input) {
    console.log("[Prompt Optimizer] Input found immediately");
    injectButton(handler, input);
    return;
  }
  console.log("[Prompt Optimizer] Setting up MutationObserver for SPA navigation...");
  createMutationObserver(
    () => {
      const foundInput = handler.findPromptInput();
      if (foundInput && !buttonExists()) {
        console.log("[Prompt Optimizer] Input found via MutationObserver");
        injectButton(handler, foundInput);
      }
    },
    100
    // Max attempts
  );
}
function injectButton(handler, input) {
  if (buttonExists()) {
    console.log("[Prompt Optimizer] Button already exists");
    return;
  }
  console.log("[Prompt Optimizer] Creating button...");
  const button = createButton();
  button.addEventListener("click", async () => {
    await handleOptimize(button, input, handler.getPromptValue.bind(handler), handler.setPromptValue.bind(handler));
  });
  const success = handler.insertButton(button, input);
  if (!success) {
    console.warn("[Prompt Optimizer] All insertion strategies failed");
    removeButton();
  }
}
if (document.readyState === "complete" || document.readyState === "interactive") {
  console.log("[Prompt Optimizer] Document ready, mounting...");
  mount();
} else {
  console.log("[Prompt Optimizer] Waiting for DOMContentLoaded...");
  window.addEventListener("DOMContentLoaded", () => {
    console.log("[Prompt Optimizer] DOMContentLoaded fired");
    mount();
  });
}
setTimeout(() => {
  console.log("[Prompt Optimizer] Delayed mount attempt (2s)");
  mount();
}, 2e3);
chrome.runtime.onMessage.addListener((message) => {
  if (isTriggerOptimizeMessage(message)) {
    console.log("[Prompt Optimizer] Keyboard shortcut triggered");
    const handler = getActiveHandler();
    if (!handler) {
      console.warn("[Prompt Optimizer] No active handler for keyboard shortcut");
      return;
    }
    const button = document.querySelector(`.${BUTTON_CLASS2}`);
    const target = handler.findPromptInput();
    if (button && target) {
      handleOptimize(button, target, handler.getPromptValue.bind(handler), handler.setPromptValue.bind(handler));
    } else {
      console.warn("[Prompt Optimizer] Cannot handle shortcut - button or input missing");
    }
  }
});
console.log("[Prompt Optimizer] Content script initialized");
//# sourceMappingURL=content-script.js.map
