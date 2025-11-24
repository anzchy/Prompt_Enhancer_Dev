import { loadConfig } from '../shared/config';
import { requestOptimizedPrompt } from '../shared/llm';
import { isOptimizePromptRequest, OptimizePromptResponse } from '../shared/messages';

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (!isOptimizePromptRequest(message)) return;

  handleOptimize(message)
    .then((response) => sendResponse(response))
    .catch((error: Error) =>
      sendResponse({
        success: false,
        error: error?.message || 'Unknown error'
      } satisfies OptimizePromptResponse)
    );

  return true; // keep the message channel open for async responses
});

async function handleOptimize(message: Parameters<typeof isOptimizePromptRequest>[0]): Promise<OptimizePromptResponse> {
  const config = await loadConfig();
  if (!config.apiKey) {
    return { success: false, error: '请先在 Options 页面配置 API Key' };
  }
  const optimizedPrompt = await requestOptimizedPrompt(config, message.payload.originalPrompt, message.payload.pageHost);
  return { success: true, optimizedPrompt };
}
