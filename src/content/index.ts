import { MessageType, OptimizePromptResponse } from '../shared/messages';

const BUTTON_CLASS = 'prompt-enhancer-btn';
const BUTTON_TEXT = '优化指令';

function selectorMap(host: string): string[] {
  if (host.includes('chatgpt.com') || host.includes('chat.openai.com')) {
    return ['div[role="textbox"]', 'textarea[placeholder*="Message"]'];
  }
  if (host.includes('manus.im')) {
    return ['div[contenteditable="true"][role="textbox"]', 'textarea', 'div[role="textbox"]'];
  }
  if (host.includes('gemini.google.com')) {
    return ['textarea', 'div[contenteditable="true"]'];
  }
  return ['div[role="textbox"]', 'textarea', 'input[type="text"]'];
}

function findPromptInput(): HTMLElement | null {
  const selectors = selectorMap(window.location.host);
  for (const selector of selectors) {
    const el = document.querySelector<HTMLElement>(selector);
    if (el) return el;
  }
  return null;
}

function getPromptValue(el: HTMLElement): string {
  if (el instanceof HTMLTextAreaElement || el instanceof HTMLInputElement) {
    return el.value || '';
  }
  return el.textContent || '';
}

function setPromptValue(el: HTMLElement, value: string) {
  if (el instanceof HTMLTextAreaElement || el instanceof HTMLInputElement) {
    el.value = value;
    el.dispatchEvent(new Event('input', { bubbles: true }));
    return;
  }
  el.textContent = value;
  el.dispatchEvent(new Event('input', { bubbles: true }));
}

function insertButton(target: HTMLElement) {
  if (document.querySelector(`.${BUTTON_CLASS}`)) return;

  const button = document.createElement('button');
  button.type = 'button';
  button.textContent = BUTTON_TEXT;
  button.className = BUTTON_CLASS;
  styleButton(button);

  button.addEventListener('click', () => handleOptimize(button, target));

  const parent = target.parentElement;
  if (parent) {
    parent.appendChild(button);
  } else {
    target.insertAdjacentElement('afterend', button);
  }
}

function styleButton(button: HTMLButtonElement) {
  button.style.marginLeft = '8px';
  button.style.padding = '6px 12px';
  button.style.borderRadius = '999px';
  button.style.border = '1px solid rgba(0,0,0,0.1)';
  button.style.background = '#f5f5f5';
  button.style.color = '#111';
  button.style.cursor = 'pointer';
  button.style.fontSize = '13px';
  button.style.display = 'inline-flex';
  button.style.alignItems = 'center';
  button.style.gap = '6px';
}

async function handleOptimize(button: HTMLButtonElement, target: HTMLElement) {
  const originalPrompt = getPromptValue(target).trim();
  if (!originalPrompt) {
    button.textContent = '请输入内容';
    setTimeout(() => (button.textContent = BUTTON_TEXT), 1200);
    return;
  }

  setLoading(button, true);
  try {
    const response = (await chrome.runtime.sendMessage({
      type: MessageType.OptimizePrompt,
      payload: { originalPrompt, source: 'content-script', pageHost: window.location.host }
    })) as OptimizePromptResponse;

    if (!response?.success || !response.optimizedPrompt) {
      const msg = response?.error || '优化失败';
      button.textContent = msg;
      setTimeout(() => (button.textContent = BUTTON_TEXT), 1400);
      return;
    }

    setPromptValue(target, response.optimizedPrompt);
  } catch (error) {
    console.error('Optimize failed', error);
    button.textContent = '请求错误';
    setTimeout(() => (button.textContent = BUTTON_TEXT), 1400);
  } finally {
    setLoading(button, false);
  }
}

function setLoading(button: HTMLButtonElement, loading: boolean) {
  button.disabled = loading;
  button.textContent = loading ? '优化中…' : BUTTON_TEXT;
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

if (document.readyState === 'complete' || document.readyState === 'interactive') {
  mount();
} else {
  window.addEventListener('DOMContentLoaded', mount);
}
