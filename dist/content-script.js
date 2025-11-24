// src/shared/messages.ts
var MessageType = {
  OptimizePrompt: "OPTIMIZE_PROMPT"
};

// src/content/index.ts
var BUTTON_CLASS = "prompt-enhancer-btn";
var BUTTON_TEXT = "\u4F18\u5316\u6307\u4EE4";
function selectorMap(host) {
  if (host.includes("chatgpt.com") || host.includes("chat.openai.com")) {
    return ['div[role="textbox"]', 'textarea[placeholder*="Message"]'];
  }
  if (host.includes("manus.im")) {
    return ['div[contenteditable="true"][role="textbox"]', "textarea", 'div[role="textbox"]'];
  }
  if (host.includes("gemini.google.com")) {
    return ["textarea", 'div[contenteditable="true"]'];
  }
  return ['div[role="textbox"]', "textarea", 'input[type="text"]'];
}
function findPromptInput() {
  const selectors = selectorMap(window.location.host);
  for (const selector of selectors) {
    const el = document.querySelector(selector);
    if (el) return el;
  }
  return null;
}
function getPromptValue(el) {
  if (el instanceof HTMLTextAreaElement || el instanceof HTMLInputElement) {
    return el.value || "";
  }
  return el.textContent || "";
}
function setPromptValue(el, value) {
  if (el instanceof HTMLTextAreaElement || el instanceof HTMLInputElement) {
    el.value = value;
    el.dispatchEvent(new Event("input", { bubbles: true }));
    return;
  }
  el.textContent = value;
  el.dispatchEvent(new Event("input", { bubbles: true }));
}
function insertButton(target) {
  if (document.querySelector(`.${BUTTON_CLASS}`)) return;
  const button = document.createElement("button");
  button.type = "button";
  button.textContent = BUTTON_TEXT;
  button.className = BUTTON_CLASS;
  styleButton(button);
  button.addEventListener("click", () => handleOptimize(button, target));
  const parent = target.parentElement;
  if (parent) {
    parent.appendChild(button);
  } else {
    target.insertAdjacentElement("afterend", button);
  }
}
function styleButton(button) {
  button.style.marginLeft = "8px";
  button.style.padding = "6px 12px";
  button.style.borderRadius = "999px";
  button.style.border = "1px solid rgba(0,0,0,0.1)";
  button.style.background = "#f5f5f5";
  button.style.color = "#111";
  button.style.cursor = "pointer";
  button.style.fontSize = "13px";
  button.style.display = "inline-flex";
  button.style.alignItems = "center";
  button.style.gap = "6px";
}
async function handleOptimize(button, target) {
  const originalPrompt = getPromptValue(target).trim();
  if (!originalPrompt) {
    button.textContent = "\u8BF7\u8F93\u5165\u5185\u5BB9";
    setTimeout(() => button.textContent = BUTTON_TEXT, 1200);
    return;
  }
  setLoading(button, true);
  try {
    const response = await chrome.runtime.sendMessage({
      type: MessageType.OptimizePrompt,
      payload: { originalPrompt, source: "content-script", pageHost: window.location.host }
    });
    if (!response?.success || !response.optimizedPrompt) {
      const msg = response?.error || "\u4F18\u5316\u5931\u8D25";
      button.textContent = msg;
      setTimeout(() => button.textContent = BUTTON_TEXT, 1400);
      return;
    }
    setPromptValue(target, response.optimizedPrompt);
  } catch (error) {
    console.error("Optimize failed", error);
    button.textContent = "\u8BF7\u6C42\u9519\u8BEF";
    setTimeout(() => button.textContent = BUTTON_TEXT, 1400);
  } finally {
    setLoading(button, false);
  }
}
function setLoading(button, loading) {
  button.disabled = loading;
  button.textContent = loading ? "\u4F18\u5316\u4E2D\u2026" : BUTTON_TEXT;
}
function mount() {
  const input = findPromptInput();
  if (input) {
    insertButton(input);
    return;
  }
  const observer = new MutationObserver(() => {
    const found = findPromptInput();
    if (found) {
      insertButton(found);
      observer.disconnect();
    }
  });
  observer.observe(document.body, { childList: true, subtree: true });
}
if (document.readyState === "complete" || document.readyState === "interactive") {
  mount();
} else {
  window.addEventListener("DOMContentLoaded", mount);
}
//# sourceMappingURL=content-script.js.map
