// src/shared/config.ts
var SYNC_KEY = "promptEnhancerConfig";
var LOCAL_KEY = "promptEnhancerSecrets";
var DEFAULT_CONFIG = {
  apiBaseUrl: "https://api.openai.com/v1",
  apiKey: "",
  model: "gpt-4.1-mini",
  systemPrompt: "You upgrade user prompts into concise, structured prompts with clear inputs, outputs, and constraints. Return only the improved prompt."
};
function readFromStorage(area, key) {
  return new Promise((resolve) => {
    const storageArea = chrome?.storage?.[area];
    if (!storageArea) {
      resolve(void 0);
      return;
    }
    storageArea.get(key, (result) => resolve(result?.[key]));
  });
}
function writeToStorage(area, key, value) {
  return new Promise((resolve, reject) => {
    const storageArea = chrome?.storage?.[area];
    if (!storageArea) {
      resolve();
      return;
    }
    storageArea.set({ [key]: value }, () => {
      const lastError = chrome.runtime?.lastError;
      if (lastError) {
        reject(lastError);
      } else {
        resolve();
      }
    });
  });
}
async function loadConfig() {
  const [syncConfig, localSecrets] = await Promise.all([
    readFromStorage("sync", SYNC_KEY),
    readFromStorage("local", LOCAL_KEY)
  ]);
  return {
    ...DEFAULT_CONFIG,
    ...syncConfig,
    apiKey: localSecrets?.apiKey ?? syncConfig?.apiKey ?? ""
  };
}
async function saveConfig(next) {
  const { apiKey, ...rest } = next;
  await Promise.all([
    writeToStorage("sync", SYNC_KEY, rest),
    writeToStorage("local", LOCAL_KEY, { apiKey })
  ]);
}
function normalizeApiBase(url) {
  const trimmed = url.trim();
  if (!trimmed) return DEFAULT_CONFIG.apiBaseUrl;
  return trimmed.endsWith("/") ? trimmed.slice(0, -1) : trimmed;
}

// src/options/index.ts
var apiBaseInput = document.getElementById("apiBaseUrl");
var apiKeyInput = document.getElementById("apiKey");
var modelInput = document.getElementById("model");
var systemPromptInput = document.getElementById("systemPrompt");
var saveBtn = document.getElementById("saveBtn");
var statusEl = document.getElementById("statusText");
init();
saveBtn?.addEventListener("click", onSave);
async function init() {
  try {
    const config = await loadConfig();
    if (apiBaseInput) apiBaseInput.value = config.apiBaseUrl || DEFAULT_CONFIG.apiBaseUrl;
    if (apiKeyInput) apiKeyInput.value = config.apiKey || "";
    if (modelInput) modelInput.value = config.model || DEFAULT_CONFIG.model;
    if (systemPromptInput) systemPromptInput.value = config.systemPrompt || DEFAULT_CONFIG.systemPrompt;
  } catch (error) {
    console.error("Failed to load config", error);
    setStatus("\u52A0\u8F7D\u914D\u7F6E\u5931\u8D25");
  }
}
async function onSave() {
  const apiBaseUrl = normalizeApiBase(apiBaseInput?.value || DEFAULT_CONFIG.apiBaseUrl);
  const apiKey = apiKeyInput?.value.trim() || "";
  const model = (modelInput?.value.trim() || DEFAULT_CONFIG.model).trim();
  const systemPrompt = systemPromptInput?.value.trim() || DEFAULT_CONFIG.systemPrompt;
  try {
    await saveConfig({ apiBaseUrl, apiKey, model, systemPrompt });
    setStatus("\u5DF2\u4FDD\u5B58");
  } catch (error) {
    console.error("Save failed", error);
    setStatus("\u4FDD\u5B58\u5931\u8D25\uFF0C\u8BF7\u91CD\u8BD5");
  }
}
function setStatus(text) {
  if (!statusEl) return;
  statusEl.textContent = text;
}
//# sourceMappingURL=options.js.map
