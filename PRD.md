
# Prompt Optimizer for Chat-based LLMs – Chrome Extension PRD

> Version: 0.1  
> Owner: Jack  
> Target Platforms: Chrome (Manifest V3)  
> Target Sites:  
> - https://chatgpt.com / https://chat.openai.com  
> - https://manus.im  
> - https://gemini.google.com  

---

## 1. 背景 / Background

在日常使用 ChatGPT / Gemini / manus.im 等 LLM 产品时，Prompt 的质量直接决定回答效果。  
但在真实工作流中存在几个痛点：

1. 用户临时想到一个问题就直接在输入框里敲，很少花时间结构化、补充上下文和约束条件；
2. 每次想写「高质量 Prompt」都需要手动复制到别处（比如 Notion / IDE）润色后再粘回，流程割裂；
3. 已有的提示词优化工具大多是网页端/命令行，无法与 ChatGPT/Gemini 这类在线 IDE 无缝嵌入。

**目标**：开发一个 Chrome Extension，在目标网站的 Prompt 输入区附近提供「一键优化指令」能力，使用预设/可配置的系统 Prompt + LLM API，将用户原始 Prompt 自动升级为结构化、高质量 Prompt，尽量减少打断当前对话/工作流。

---

## 2. 产品目标 / Goals

### 2.1 Primary Goals

- G1：在 ChatGPT / manus.im / Gemini 网页端，实现「一键优化当前 Prompt」的交互能力；
- G2：支持在插件中配置 LLM API（OpenAI 或兼容代理）和系统 Prompt，用户无需改代码即可更换优化策略；
- G3：优化后的 Prompt 可以：
  - 一键覆盖页面输入框，直接继续对话；
  - 或一键复制为纯文本，用于 IDE/笔记等其他场景。

### 2.2 Secondary Goals

- G4：提供多种优化风格预设（例如：代码生成、写作、结构化分析），可在下拉菜单中快捷切换；
- G5：提供原始 Prompt vs 优化 Prompt 的对比视图，帮助用户理解优化策略。

### 2.3 Non-goals（当前不做）

- N1：不做完整 Prompt 管理器（版本管理、云同步收藏库等）；  
- N2：不做账号体系（用户登录 / 多设备同步）；  
- N3：不提供模型帐号代理或付费接口，只接入用户自己的 API Key / 代理。

---

## 3. 用户画像 & 使用场景 / Users & Use Cases

### 3.1 用户画像

- 频繁使用 ChatGPT、Gemini、manus.im 的知识工作者：开发者、分析师、产品经理等；
- 已经知道「Prompt 很重要」，但不想每次都手工打磨；
- 熟悉 Chrome 扩展安装和基础设置。

### 3.2 核心场景 / User Stories

1. **U1 – ChatGPT 写代码前优化指令**
   - 我在 ChatGPT 中随手敲了一个很粗糙的指令，例如「写个 Python 脚本抓取某个网站的新闻」；
   - 我点击输入框旁边的「优化指令」按钮；
   - 扩展调用 LLM，生成更详细、更结构化的 Prompt（比如包含输入/输出格式、错误处理要求等），覆盖输入框；
   - 我直接点击 ChatGPT 的发送按钮，不需要额外拷贝。

2. **U2 – 手动输入到插件 Popup，复制到其他工具**
   - 我在 manus.im 或 Gemini 页面上打开插件的浮窗 Popup；
   - 在 Popup 的「原始 Prompt 输入框」中输入想问的问题；
   - 点击「优化」按钮，得到优化后的 Prompt；
   - 点击「复制」按钮，将优化结果粘贴到 IDE / Notion / 终端工具中使用。

3. **U3 – 不同优化风格切换**
   - 我在插件 Options 页面中预设了几种风格：  
     - 「标准结构化提问」  
     - 「代码生成」  
     - 「行业研究分析」  
   - 在 Popup 中通过下拉菜单选择某个风格，优化结果会根据对应的系统 Prompt 生成；
   - 不同任务场景（写代码 / 写文章 / 写调研）可以快速切换。

---

## 4. 功能需求 / Functional Requirements

### 4.1 浏览器扩展基础结构

- 使用 Manifest V3；
- 最小模块集合：
  1. `manifest.json`
  2. `background.js`（Service Worker）
  3. `content-script.js`（注入目标页面）
  4. `popup.html` + `popup.js`（浏览器工具栏弹窗，可选）
  5. `options.html` + `options.js`（配置页面）
  6. 静态资源：图标、CSS

---

### 4.2 内容脚本 – 页面集成

#### 4.2.1 目标站点匹配规则

- `https://chatgpt.com/*`
- `https://chat.openai.com/*`
- `https://manus.im/*`
- `https://gemini.google.com/*`

#### 4.2.2 输入框识别规则（v1 可以 hardcode + 容错）

1. ChatGPT / chat.openai.com / chatgpt.com  
   - 优先：`div[role="textbox"]`  
   - 兜底：`textarea[placeholder*="Message"]`

2. manus.im  
   - 通过 DevTools 分析后选择其主要 Prompt 输入框的 DOM 结构，示例：  
     - `textarea` 或 `div[contenteditable="true"]` 带有特定 class 或 `role="textbox"`。

3. gemini.google.com  
   - 同样通过 DOM 结构确定输入区域：  
     - 常见为 `textarea` 或 `div[contenteditable="true"]`。

> 需求：  
> - 内容脚本需要实现一个通用的 `findPromptInput()` 函数，根据 `location.host` 分发不同选择器；
> - 若 500ms 内未找到输入框，可通过 `MutationObserver` 监听 DOM 变化，重试挂载按钮。

#### 4.2.3 页面内按钮 / 入口设计

- 在识别到输入框后，在其附近插入一个按钮：

  - 文案：`优化指令`（可考虑英文 `Optimize Prompt`）；
  - 样式：
    - 最小化侵入现有 UI，采用浅色 pill 样式；
    - 悬停有轻微阴影；
  - 不破坏原有页面布局：
    - 优先插在输入框父容器的末尾；
    - 当无法安全插入时，可退化为右下角的浮动按钮（fixed）。

- 按钮行为：
  - 点击后：
    1. 读取当前输入框内容；
    2. 调用 Background 进行 LLM 请求；
    3. 将返回的优化 Prompt 写回输入框（覆盖模式）；
    4. 提供 Toast / 简单提示，表明已完成。

- 状态提示：
  - 点击后按钮进入 `loading` 状态（文案 `优化中…`，不可再次点击）；
  - 请求结束后恢复原状态；
  - 请求失败时弹出错误提示（alert 或页面 Toast）。

---

### 4.3 Popup 窗口（浏览器工具栏）

> 对应 `browserAction` / `action` 的 `popup.html`。

#### 4.3.1 UI 结构

- 布局：

  - 上部：  
    - 「原始 Prompt」多行文本框；
  - 中部：  
    - 「优化后 Prompt」只读文本框；
  - 下部按钮区域：
    - `[✨ 优化]`  
    - `[📋 复制优化结果]`  
    - `[🧹 清空]`  
    - 风格下拉框 `[风格: 通用 / 代码 / 写作 / 分析]`（v1 可以先实现 1 个风格，预留结构）

- 字段说明：

  - 原始 Prompt 输入框：
    - 用户手动输入任何文本；
    - 支持粘贴外部内容。
  - 优化后 Prompt 输出框：
    - 显示优化结果；
    - 可手动编辑（可选）；
    - 复制按钮将此框内容复制到剪贴板。

#### 4.3.2 功能逻辑

- 点击「✨ 优化」：

  1. 检查原始 Prompt 是否为空，为空则显示错误提示；
  2. 异步调用 Background → LLM API；
  3. 将返回结果写入「优化后 Prompt」文本框；
  4. 失败时显示错误消息（如 API Key 未配置、网络错误、LLM 返回错误等）。

- 点击「📋 复制优化结果」：

  - 将优化结果写入剪贴板；
  - 若为空，提示「暂无可复制内容」。

- 点击「🧹 清空」：

  - 清空两个文本框内容；
  - 清除状态提示。

- 风格选择（若实现）：

  - 响应下拉框选择，修改调用时使用的系统 Prompt；
  - 在 Options 页面中可以配置每种风格对应的系统 Prompt。

---

### 4.4 Options 页面（配置）

#### 4.4.1 配置项

1. **API / 模型配置**

   - `apiBaseUrl`（默认：`https://api.openai.com/v1` 或用户自建代理地址）
   - `apiKey`（字符串，mask 显示）
   - `model`（默认：`gpt-4.1-mini`，可填任意兼容 model id）

2. **系统 Prompt 配置**

   - 默认系统 Prompt（通用优化风格）：
     - 可编辑多行文本；
   - （进阶）多风格配置：
     - 例如 `styles: [{id: 'default', name: '通用', systemPrompt: '...'}, ...]`

3. **行为配置**

   - 优化后写回输入框模式：
     - 覆盖原 Prompt；
     - 在前附加 / 在后附加；
     - 仅复制到剪贴板（不自动写回）。
   - 错误提示方式：
     - 弹窗 alert；
     - 页面 Toast（如果有封装）。

#### 4.4.2 存储方式

- 使用 `chrome.storage.sync` / `chrome.storage.local` 存储配置；
- 敏感字段（如 API Key）仅存本地（`local`），不要同步跨设备；

---

### 4.5 Background / Service Worker

#### 4.5.1 职责

- 接收 Content Script / Popup 的消息；
- 从 `chrome.storage` 中读取 API Key、base URL、model、system Prompt 等；
- 调用 LLM API（OpenAI Chat Completions 或兼容接口）；
- 将优化后的 Prompt 返回给调用方。

#### 4.5.2 消息协议（示例）

- 请求消息（来自 Content Script / Popup）：

  ```ts
  type OptimizePromptRequest = {
    type: 'OPTIMIZE_PROMPT';
    payload: {
      originalPrompt: string;
      styleId?: string; // 可选，用于多风格
      source?: 'content-script' | 'popup';
      pageHost?: string; // chatgpt.com / manus.im 等
    };
  };
  



* 响应消息：

  ```ts
  type OptimizePromptResponse = {
    success: boolean;
    optimizedPrompt?: string;
    error?: string; // 错误信息，用于 UI 提示
  };
  ```

#### 4.5.3 LLM 调用规范（以 OpenAI 风格为例）

* Endpoint:

  * `${apiBaseUrl}/chat/completions`

* Request body:

  ```jsonc
  {
    "model": "gpt-4.1-mini",
    "messages": [
      { "role": "system", "content": "<systemPrompt>" },
      {
        "role": "user",
        "content": "下面是用户的原始 Prompt，请你返回优化后的 Prompt（只输出优化后的内容本身）：\n\n<originalPrompt>"
      }
    ]
  }
  ```

* Error handling：

  * HTTP 非 2xx：读取 `status` + text，返回给前端；
  * JSON 解析失败：返回通用错误；
  * LLM 不返回 `choices[0].message.content`：视为异常，返回错误。

---

## 5. 非功能需求 / Non-functional Requirements

### 5.1 性能

* Prompt 优化操作通常用户可接受 1–3 秒等待；
* 插件本身 JS 体积尽量轻量，避免拖慢目标网站加载；
* 内容脚本应避免频繁的 DOM 查询：

  * 使用 `MutationObserver` + 节流策略。

### 5.2 安全

* API Key 不应注入目标站点 Window 全局空间，只在 Background / Extension 沙箱内使用；
* 不将用户 Prompt 或优化结果上传至任何第三方 analytics 服务；
* Option 页面应提供清除配置的能力（包括清除 API Key）。

### 5.3 兼容性

* Chrome 最新正式版；
* 适配浅色 / 深色模式（Popup 与页面按钮尽量跟随系统 / 站点风格）；
* 不保证在非 Chromium 浏览器上工作（v1）。

---

## 6. 接口 & 模块边界 / Architecture Overview

### 6.1 模块图（文字说明）

1. **Content Script**

   * 职责：

     * 识别输入框；
     * 插入「优化指令」按钮；
     * 读取写回页面 Prompt；
     * 通过 `chrome.runtime.sendMessage` 调用 Background。
   * 不直接调用外部 LLM API。

2. **Popup**

   * 职责：

     * 提供独立的 Prompt 输入 / 优化 / 复制 UI；
     * 通过 `chrome.runtime.sendMessage` 调用 Background。

3. **Options**

   * 职责：

     * 管理配置（API Key、Base URL、Model、系统 Prompt etc.）；
     * 读写 `chrome.storage`。

4. **Background (Service Worker)**

   * 职责：

     * 接收统一的 `OPTIMIZE_PROMPT` 消息；
     * 读取配置；
     * 调用 LLM 接口；
     * 将结果回传给 Sender。

---

## 7. UX 交互流程 / UX Flows

### 7.1 Flow A：在 ChatGPT 页面一键优化输入框 Prompt

1. 用户打开 chatgpt.com；
2. 内容脚本注入，识别输入框并渲染按钮「优化指令」；
3. 用户在输入框输入原始 Prompt；
4. 点击「优化指令」按钮；
5. 按钮进入 loading 状态；
6. Content Script → Background 发送 `OPTIMIZE_PROMPT` 消息；
7. Background 调用 LLM → 返回优化文本；
8. Content Script 覆盖输入框内容为新 Prompt；
9. 按钮恢复正常状态，同时短 Toast 提示如「已优化，可直接发送」。

### 7.2 Flow B：在插件 Popup 中优化并复制

1. 用户点击浏览器工具栏图标；
2. Popup 打开，显示原始/优化文本框和按钮；
3. 用户在「原始 Prompt」中输入文本；
4. 点击「✨ 优化」；
5. Popup 调用 Background → LLM → 返回结果；
6. 「优化后 Prompt」文本框填入结果；
7. 用户点击「📋 复制」，结果复制到剪贴板；
8. 用户在目标工具（IDE / 其他页面）粘贴使用。

---

## 8. 开发优先级与里程碑 / Roadmap

### 8.1 v0.1 – 最小可用版本（MVP）

* Manifest V3 基础结构搭好；
* Options 页面支持配置：

  * `apiBaseUrl`、`apiKey`、`model`、`systemPrompt`；
* Background 支持 `OPTIMIZE_PROMPT` 消息 & 调用 LLM；
* Content Script 仅支持 chatgpt.com：

  * 识别输入框；
  * 插入按钮；
  * 一键优化并覆盖输入框；
* Popup 实现基本 Prompt → 优化 → 复制流程；
* 基本错误处理（API Key 未配置 / 网络错误）。

### 8.2 v0.2 – 多站支持 & UX 优化

* 扩展适配 manus.im 和 gemini.google.com 的输入框；
* 优化按钮样式 + loading/错误状态 Toast；
* Popup 增加「风格选择」下拉框（内部预设 2–3 条系统 Prompt 模版）；
* Options 页面支持简单「风格列表」配置。

### 8.3 v0.3 – 高级特性（可选）

* 原始 vs 优化 Prompt 的对比模式；
* 快捷键触发优化（例如 `Ctrl+Shift+O` 在输入框聚焦时触发）；
* 轻量埋点（仅本地统计调用次数，方便自查使用频率，不上传远程）。

---

## 9. 验收标准 / Acceptance Criteria

1. 在 chatgpt.com 上：

   * 输入框旁可见「优化指令」按钮；
   * 输入任意 Prompt，点击后 5 秒内返回优化结果并成功覆盖输入框；
   * API Key 未配置时，点击按钮会提示「请先配置 API Key」。

2. 在 Popup 中：

   * 输入 Prompt → 点击「✨ 优化」→ 在输出框获得优化文本；
   * 点击「📋 复制」后，可以在其他应用中粘贴相同文本。

3. Options：

   * 填写 API Key、Base URL、Model、System Prompt → 点击保存 → 重新打开 Popup / 页面仍然能读到最新配置；
   * 清除配置后，插件行为符合「未配置」的错误提示逻辑。

---

## 10. 附录 / Notes

* 后续使用 Codex CLI 开发时，可以把本 PRD 作为「插件说明文档」，在 prompt 中明确：

  * 目标文件结构；
  * 关键模块的职责和接口；
  * 目标站点与输入框选择器策略；
  * LLM 调用协议示例（OpenAI 风格）。

* 安全建议：

  * 长期线上使用时，推荐自己搭建代理（Cloudflare Worker / Vercel / 自托管），并在 Options 中仅配置代理 Key，而非裸露官方 OpenAI Key。
