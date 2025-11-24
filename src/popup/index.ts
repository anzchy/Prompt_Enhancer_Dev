import { MessageType, OptimizePromptResponse } from '../shared/messages';

const inputEl = document.getElementById('inputPrompt') as HTMLTextAreaElement;
const outputEl = document.getElementById('outputPrompt') as HTMLTextAreaElement;
const statusEl = document.getElementById('statusText') as HTMLDivElement;
const optimizeBtn = document.getElementById('optimizeBtn') as HTMLButtonElement;
const copyBtn = document.getElementById('copyBtn') as HTMLButtonElement;
const clearBtn = document.getElementById('clearBtn') as HTMLButtonElement;
const styleSelect = document.getElementById('styleSelect') as HTMLSelectElement;

optimizeBtn?.addEventListener('click', optimizePrompt);
copyBtn?.addEventListener('click', copyOutput);
clearBtn?.addEventListener('click', clearFields);

function setStatus(text: string) {
  if (!statusEl) return;
  statusEl.textContent = text;
}

async function optimizePrompt() {
  const prompt = inputEl?.value.trim() || '';
  if (!prompt) {
    setStatus('请输入需要优化的 Prompt');
    return;
  }
  setLoading(true);
  setStatus('优化中...');
  try {
    const response = (await chrome.runtime.sendMessage({
      type: MessageType.OptimizePrompt,
      payload: { originalPrompt: prompt, styleId: styleSelect?.value, source: 'popup' }
    })) as OptimizePromptResponse;

    if (!response?.success || !response.optimizedPrompt) {
      setStatus(response?.error || '优化失败');
      return;
    }
    if (outputEl) outputEl.value = response.optimizedPrompt;
    setStatus('完成，可复制或编辑');
  } catch (error) {
    console.error('Optimize failed', error);
    setStatus('请求失败，请检查配置');
  } finally {
    setLoading(false);
  }
}

function copyOutput() {
  const value = outputEl?.value || '';
  if (!value) {
    setStatus('暂无可复制内容');
    return;
  }
  navigator.clipboard
    .writeText(value)
    .then(() => setStatus('已复制'))
    .catch(() => setStatus('复制失败'));
}

function clearFields() {
  if (inputEl) inputEl.value = '';
  if (outputEl) outputEl.value = '';
  setStatus('');
}

function setLoading(loading: boolean) {
  optimizeBtn.disabled = loading;
  copyBtn.disabled = loading;
  clearBtn.disabled = loading;
  optimizeBtn.textContent = loading ? '优化中…' : '✨ 优化';
}
