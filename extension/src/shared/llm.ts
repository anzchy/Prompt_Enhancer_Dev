import { ExtensionConfig, normalizeApiBase } from './config';

type ChatCompletionChoice = { message?: { content?: string } };
type ChatCompletionResponse = { choices?: ChatCompletionChoice[] };

export async function requestOptimizedPrompt(
  config: ExtensionConfig,
  originalPrompt: string,
  pageHost?: string
): Promise<string> {
  if (!originalPrompt.trim()) {
    throw new Error('Prompt is empty');
  }
  if (!config.apiKey) {
    throw new Error('API key is missing');
  }

  const endpoint = `${normalizeApiBase(config.apiBaseUrl)}/chat/completions`;
  const systemPrompt = config.systemPrompt || '';
  const userContent = buildUserContent(originalPrompt, pageHost);

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${config.apiKey}`
    },
    body: JSON.stringify({
      model: config.model,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userContent }
      ]
    })
  });

  if (!response.ok) {
    const text = await response.text().catch(() => '');
    throw new Error(`Model request failed (${response.status}): ${text || 'unknown error'}`);
  }

  const data = (await response.json()) as ChatCompletionResponse;
  const optimized = data?.choices?.[0]?.message?.content?.trim();
  if (!optimized) {
    throw new Error('Model returned no content');
  }
  return optimized;
}

function buildUserContent(originalPrompt: string, pageHost?: string): string {
  const hostLine = pageHost ? `Target host: ${pageHost}\n` : '';
  return `${hostLine}Optimize the following prompt. Return only the improved prompt:\n\n${originalPrompt}`;
}
