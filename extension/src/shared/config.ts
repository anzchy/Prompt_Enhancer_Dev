export type ExtensionConfig = {
  apiBaseUrl: string;
  apiKey: string;
  model: string;
  systemPrompt: string;
};

const SYNC_KEY = 'promptEnhancerConfig';
const LOCAL_KEY = 'promptEnhancerSecrets';

export const DEFAULT_CONFIG: ExtensionConfig = {
  apiBaseUrl: 'https://api.openai.com/v1',
  apiKey: '',
  model: 'gpt-4.1-mini',
  systemPrompt:
    'You upgrade user prompts into concise, structured prompts with clear inputs, outputs, and constraints. Return only the improved prompt.'
};

type StorageArea = 'sync' | 'local';

function readFromStorage<T>(area: StorageArea, key: string): Promise<T | undefined> {
  return new Promise((resolve) => {
    const storageArea = chrome?.storage?.[area];
    if (!storageArea) {
      resolve(undefined);
      return;
    }
    storageArea.get(key, (result: Record<string, T>) => resolve(result?.[key]));
  });
}

function writeToStorage<T>(area: StorageArea, key: string, value: T): Promise<void> {
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

export async function loadConfig(): Promise<ExtensionConfig> {
  const [syncConfig, localSecrets] = await Promise.all([
    readFromStorage<ExtensionConfig>('sync', SYNC_KEY),
    readFromStorage<{ apiKey: string }>('local', LOCAL_KEY)
  ]);

  return {
    ...DEFAULT_CONFIG,
    ...syncConfig,
    apiKey: localSecrets?.apiKey ?? syncConfig?.apiKey ?? ''
  };
}

export async function saveConfig(next: ExtensionConfig): Promise<void> {
  const { apiKey, ...rest } = next;
  await Promise.all([
    writeToStorage('sync', SYNC_KEY, rest),
    writeToStorage('local', LOCAL_KEY, { apiKey })
  ]);
}

export function normalizeApiBase(url: string): string {
  const trimmed = url.trim();
  if (!trimmed) return DEFAULT_CONFIG.apiBaseUrl;
  return trimmed.endsWith('/') ? trimmed.slice(0, -1) : trimmed;
}
