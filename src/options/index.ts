import { DEFAULT_CONFIG, loadConfig, normalizeApiBase, saveConfig } from '../shared/config';

const apiBaseInput = document.getElementById('apiBaseUrl') as HTMLInputElement;
const apiKeyInput = document.getElementById('apiKey') as HTMLInputElement;
const modelInput = document.getElementById('model') as HTMLInputElement;
const systemPromptInput = document.getElementById('systemPrompt') as HTMLTextAreaElement;
const saveBtn = document.getElementById('saveBtn') as HTMLButtonElement;
const statusEl = document.getElementById('statusText') as HTMLDivElement;

init();
saveBtn?.addEventListener('click', onSave);

async function init() {
  try {
    const config = await loadConfig();
    if (apiBaseInput) apiBaseInput.value = config.apiBaseUrl || DEFAULT_CONFIG.apiBaseUrl;
    if (apiKeyInput) apiKeyInput.value = config.apiKey || '';
    if (modelInput) modelInput.value = config.model || DEFAULT_CONFIG.model;
    if (systemPromptInput) systemPromptInput.value = config.systemPrompt || DEFAULT_CONFIG.systemPrompt;
  } catch (error) {
    console.error('Failed to load config', error);
    setStatus('加载配置失败');
  }
}

async function onSave() {
  const apiBaseUrl = normalizeApiBase(apiBaseInput?.value || DEFAULT_CONFIG.apiBaseUrl);
  const apiKey = apiKeyInput?.value.trim() || '';
  const model = (modelInput?.value.trim() || DEFAULT_CONFIG.model).trim();
  const systemPrompt = systemPromptInput?.value.trim() || DEFAULT_CONFIG.systemPrompt;

  try {
    await saveConfig({ apiBaseUrl, apiKey, model, systemPrompt });
    setStatus('已保存');
  } catch (error) {
    console.error('Save failed', error);
    setStatus('保存失败，请重试');
  }
}

function setStatus(text: string) {
  if (!statusEl) return;
  statusEl.textContent = text;
}
