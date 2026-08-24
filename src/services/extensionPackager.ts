import JSZip from 'jszip';

export interface ExtensionFile {
  path: string;
  content: string;
  isBinary?: boolean;
}

export function generateExtensionFiles(): ExtensionFile[] {
  const manifestJson = {
    manifest_version: 3,
    name: "OmniCompare AI Arena - 多模型并发评测竞技场",
    version: "1.4.0",
    description: "全屏多栏并排加载 ChatGPT、Gemini、DeepSeek、通义千问、Kimi、豆包、智谱清言、Claude 等官方网页，一键并发定位输入框、填充提示词、发起对话、实时高精度抓取完整回答、记录历史会话地址栏链接并导出文档",
    permissions: [
      "tabs",
      "activeTab",
      "scripting",
      "storage",
      "declarativeNetRequest",
      "declarativeNetRequestFeedback"
    ],
    host_permissions: [
      "<all_urls>",
      "https://chatgpt.com/*",
      "https://*.openai.com/*",
      "https://gemini.google.com/*",
      "https://*.google.com/*",
      "https://chat.qwen.ai/*",
      "https://chat.deepseek.com/*",
      "https://kimi.moonshot.cn/*",
      "https://www.doubao.com/*",
      "https://z.ai/*",
      "https://chatglm.cn/*",
      "https://claude.ai/*"
    ],
    declarative_net_request: {
      rule_resources: [
        {
          id: "iframe_unblocker_rules",
          enabled: true,
          path: "rules.json"
        }
      ]
    },
    action: {
      default_popup: "popup.html",
      default_title: "OmniCompare AI 并发控制台",
      default_icon: {
        "16": "icons/icon16.png",
        "48": "icons/icon48.png",
        "128": "icons/icon128.png"
      }
    },
    background: {
      service_worker: "background.js",
      type: "module"
    },
    content_scripts: [
      {
        matches: ["<all_urls>"],
        all_frames: true,
        js: ["content_scripts/omni_bridge.js"],
        run_at: "document_idle"
      }
    ],
    icons: {
      "16": "icons/icon16.png",
      "48": "icons/icon48.png",
      "128": "icons/icon128.png"
    },
    web_accessible_resources: [
      {
        resources: ["arena.html", "arena.js", "arena.css", "content_scripts/*", "icons/*"],
        matches: ["<all_urls>"]
      }
    ]
  };

  // declarativeNetRequest rules to remove X-Frame-Options, frame-ancestors CSP, COOP and spoof Sec-Fetch
  const rulesJson = [
    {
      id: 1,
      priority: 1,
      action: {
        type: "modifyHeaders",
        responseHeaders: [
          { header: "x-frame-options", operation: "remove" },
          { header: "X-Frame-Options", operation: "remove" },
          { header: "content-security-policy", operation: "remove" },
          { header: "Content-Security-Policy", operation: "remove" },
          { header: "frame-ancestors", operation: "remove" },
          { header: "cross-origin-opener-policy", operation: "remove" },
          { header: "Cross-Origin-Opener-Policy", operation: "remove" },
          { header: "cross-origin-embedder-policy", operation: "remove" },
          { header: "Cross-Origin-Embedder-Policy", operation: "remove" },
          { header: "cross-origin-resource-policy", operation: "remove" }
        ],
        requestHeaders: [
          { header: "sec-fetch-dest", operation: "set", "value": "document" },
          { header: "sec-fetch-mode", operation: "set", "value": "navigate" },
          { header: "sec-fetch-site", operation: "set", "value": "none" }
        ]
      },
      condition: {
        urlFilter: "*",
        resourceTypes: ["main_frame", "sub_frame", "xmlhttprequest", "other"]
      }
    }
  ];

  // High-Precision In-Page Automation & Extraction Engine
  const omniBridgeScript = `// OmniCompare High-Precision Content Script Bridge
console.log('[OmniCompare Bridge] Injected into:', window.location.href);

// URL change watcher to capture conversation URLs (e.g. /c/xxx in SPAs)
let currentHref = window.location.href;
function checkUrlChange(modelId) {
  if (window.location.href !== currentHref) {
    currentHref = window.location.href;
    try {
      window.parent.postMessage({
        type: 'OMNICOMPARE_AUTOMATION_EVENT',
        modelId,
        step: 'url_updated',
        status: 'info',
        conversationUrl: currentHref,
        message: '地址栏会话链接已更新: ' + currentHref
      }, '*');
    } catch (e) {}
  }
}
setInterval(() => checkUrlChange(), 800);

// Helper to detect current model from URL
function detectModelIdFromHref() {
  const href = (window.location.href || '').toLowerCase();
  if (href.includes('chatgpt.com') || href.includes('openai.com')) return 'chatgpt';
  if (href.includes('gemini.google.com')) return 'gemini';
  if (href.includes('deepseek.com')) return 'deepseek';
  if (href.includes('qwen.ai') || href.includes('tongyi.aliyun.com')) return 'qwen';
  if (href.includes('kimi.moonshot.cn') || href.includes('kimi.com')) return 'kimi';
  if (href.includes('doubao.com')) return 'doubao';
  if (href.includes('z.ai') || href.includes('chatglm.cn')) return 'zai';
  if (href.includes('claude.ai')) return 'claude';
  return '';
}

// Robust In-Page Element Setter with Rich Text & ContentEditable Support
function setElementValue(el, val) {
  if (!el) return false;
  try {
    el.focus();
  } catch (e) {}

  const isTextarea = el.tagName === 'TEXTAREA' || el.tagName === 'INPUT';

  if (isTextarea) {
    const proto = el.tagName === 'TEXTAREA' ? window.HTMLTextAreaElement.prototype : window.HTMLInputElement.prototype;
    const nativeSetter = Object.getOwnPropertyDescriptor(proto, 'value')?.set;
    if (nativeSetter) {
      nativeSetter.call(el, val);
    } else {
      el.value = val;
    }
  } else {
    // Rich Text / Contenteditable (ChatGPT ProseMirror / Lexical / Gemini / Doubao)
    try {
      el.focus();
      const selection = window.getSelection();
      const range = document.createRange();
      range.selectNodeContents(el);
      selection.removeAllRanges();
      selection.addRange(range);
      document.execCommand('selectAll', false, null);
      document.execCommand('delete', false, null);
      const inserted = document.execCommand('insertText', false, val);
      if (!inserted || !el.innerText || el.innerText.trim() === '') {
        el.innerText = val;
        el.textContent = val;
      }
    } catch (e) {
      el.innerText = val;
      el.textContent = val;
    }
  }

  // Dispatch all standard events for React / Vue / Angular change tracking
  try {
    el.dispatchEvent(new Event('focus', { bubbles: true }));
    el.dispatchEvent(new Event('input', { bubbles: true, composed: true }));
    el.dispatchEvent(new Event('change', { bubbles: true, composed: true }));
    el.dispatchEvent(new InputEvent('input', { bubbles: true, composed: true, inputType: 'insertText', data: val }));
    el.dispatchEvent(new KeyboardEvent('keydown', { key: 'Unidentified', bubbles: true }));
    el.dispatchEvent(new KeyboardEvent('keyup', { key: 'Unidentified', bubbles: true }));
  } catch (e) {}

  return true;
}

// Helper to test if a block is mostly CSS code or garbage
function isPureCssText(text) {
  if (!text) return true;
  const cssKeywords = (text.match(/(@keyframes|@media|font-family:|border-radius:|background-color:|margin:|padding:|!important|\.css-|\bdisplay:\s*flex|\bposition:\s*absolute)/gi) || []).length;
  if (cssKeywords >= 2) return true;
  return false;
}

// Clean stray CSS fragments and class definitions
function cleanCssArtifacts(text) {
  if (!text) return '';
  let cleaned = text;
  // Remove CSS property blocks like { margin: 0; padding: 0; ... }
  cleaned = cleaned.replace(/\{[^{}]*(?:font-|color:|background|display:|margin:|padding:|border:|flex:|width:|height:|opacity:|transform:)[^{}]*\}/gi, '');
  // Remove @keyframes, @media, @import rules
  cleaned = cleaned.replace(/@(?:keyframes|media|import|charset|font-face)[^{]*\{[\s\S]*?\}\s*\}/gi, '');
  cleaned = cleaned.replace(/@(?:keyframes|media|import|charset|font-face)[^{]*\{[\s\S]*?\}/gi, '');
  // Remove standalone css class selector blocks
  cleaned = cleaned.replace(/\.[a-zA-Z0-9_-]+\s*\{[\s\S]*?\}/gi, '');
  return cleaned.trim();
}

// Clean Container Text Extractor (Clones element, strips script/style tags, buttons, disclaimers, suggestions)
function extractCleanTextFromContainer(container, specificExclude = []) {
  if (!container) return '';
  try {
    const clone = container.cloneNode(true);
    // 1. Unconditionally remove all style, script, noscript, svg, canvas, iframe, and template elements
    const bannedTags = clone.querySelectorAll('style, script, noscript, link, meta, template, svg, canvas, iframe, video, audio');
    bannedTags.forEach(el => el.remove());

    const defaultExclude = [
      'button',
      'nav',
      'header',
      'footer',
      'form',
      '.ant-typography-caption',
      '.disclaimer',
      '[class*="disclaimer"]',
      '[class*="suggest"]',
      '[class*="recommend"]',
      '[class*="related"]',
      '[class*="video"]',
      '[class*="feedback"]',
      '[class*="action"]',
      '[class*="toolbar"]',
      '.ds-think',
      'details.ds-thought',
      '.thought-container',
      '[class*="thought"]'
    ];
    const toRemove = [...defaultExclude, ...specificExclude];
    for (const sel of toRemove) {
      try {
        const matches = clone.querySelectorAll(sel);
        matches.forEach(m => m.remove());
      } catch (e) {}
    }

    let extracted = (clone.innerText || clone.textContent || '').trim();
    extracted = cleanCssArtifacts(extracted);
    return extracted;
  } catch (e) {
    let raw = (container.innerText || container.textContent || '').trim();
    return cleanCssArtifacts(raw);
  }
}

// Universal Page Heuristic Scanner (Tier 3 Fallback)
function scanPageForLongestAssistantBlock(prompt) {
  const candidates = document.querySelectorAll('article, section, div[class*="message"], div[class*="bubble"], div[class*="markdown"], [data-role="assistant"]');
  let longest = '';
  const promptClean = (prompt || '').trim();

  for (let i = candidates.length - 1; i >= 0; i--) {
    const el = candidates[i];
    if (!el || el.offsetParent === null || el.tagName === 'STYLE' || el.tagName === 'SCRIPT') continue;
    if (el.matches('form, header, nav, footer, textarea, input, style, script') || el.closest('form, header, nav, footer, style, script')) continue;

    const text = extractCleanTextFromContainer(el);
    if (!text || isPureCssText(text)) continue;

    if (promptClean && (text === promptClean || (text.length < promptClean.length + 10 && text.includes(promptClean)))) {
      continue;
    }

    if (text.length > longest.length && text.length >= 25) {
      longest = text;
    }
  }
  return longest;
}

// Find input box across various AI interfaces
function findInputElement() {
  const selectors = [
    '#prompt-textarea',
    'textarea#prompt-textarea',
    'div[contenteditable="true"]#prompt-textarea',
    'div[contenteditable="true"][role="textbox"]',
    'textarea[placeholder*="Message"]',
    'textarea[placeholder*="Ask"]',
    'textarea[placeholder*="发送"]',
    'textarea[placeholder*="输入"]',
    '#chat-input',
    'textarea.ant-input',
    '.chat-input-editor',
    '.ql-editor',
    'rich-textarea p',
    'div[contenteditable="true"]',
    'textarea',
    'input[type="text"]'
  ];

  for (const sel of selectors) {
    try {
      const el = document.querySelector(sel);
      if (el && el.offsetParent !== null) return el;
    } catch (e) {}
  }
  return document.querySelector('textarea, [contenteditable="true"], [role="textbox"]');
}

// Find send button
function findSendButton() {
  const selectors = [
    'button[data-testid="send-button"]',
    'button[data-testid="chat_input_send_button"]',
    'button[aria-label*="Send prompt"]',
    'button[aria-label*="Send message"]',
    'button[aria-label*="Send"]',
    'button[aria-label*="发送"]',
    'button#send-button',
    'button.send-button',
    '.send-btn',
    '.send-button',
    'button.ant-btn-primary',
    'div[role="button"][aria-label="发送"]',
    'form button[type="submit"]',
    'button[type="submit"]'
  ];

  for (const sel of selectors) {
    try {
      const el = document.querySelector(sel);
      if (el && el.offsetParent !== null) return el;
    } catch (e) {}
  }
  return document.querySelector('button[type="submit"], [role="button"][aria-label*="发送"]');
}

// Multi-Tier Bulletproof Response Extractor
function extractLatestAssistantResponse(modelId, prompt = '') {
  let content = '';
  let thinking = '';
  const href = window.location.href.toLowerCase();

  // 1. ChatGPT (OpenAI)
  if (href.includes('chatgpt.com') || modelId === 'chatgpt') {
    const chatgptContainers = document.querySelectorAll(
      'div[data-message-author-role="assistant"], article:has(div[data-message-author-role="assistant"]), div.agent-turn, [data-message-model-slug], div.markdown.prose'
    );
    if (chatgptContainers.length > 0) {
      for (let i = chatgptContainers.length - 1; i >= 0; i--) {
        const text = extractCleanTextFromContainer(chatgptContainers[i]);
        if (text && text.length > content.length && !isPureCssText(text)) {
          content = text;
        }
        if (content.length > 30) break;
      }
    }
  }
  // 2. 通义千问 (Qwen) - Capture FULL container text
  else if (href.includes('qwen.ai') || modelId === 'qwen') {
    const qwenContainers = document.querySelectorAll(
      '.qwen-bubble-assistant, div[class*="chat-message-assistant"], div[class*="bubble-content"], div[class*="chat-item-assistant"], .markdown-body'
    );
    if (qwenContainers.length > 0) {
      for (let i = qwenContainers.length - 1; i >= 0; i--) {
        const text = extractCleanTextFromContainer(qwenContainers[i]);
        if (text && text.length > content.length && !isPureCssText(text)) {
          content = text;
        }
        if (content.length > 30) break;
      }
    }
  }
  // 3. 豆包 (Doubao) - Target full flow-markdown container
  else if (href.includes('doubao.com') || modelId === 'doubao') {
    const doubaoContainers = document.querySelectorAll(
      '.flow-markdown-body, div[data-testid="message-text-content"], div[class*="flow-markdown"], [data-testid="chat-message"] .flow-markdown-body, [data-testid="chat-message"]'
    );
    if (doubaoContainers.length > 0) {
      for (let i = doubaoContainers.length - 1; i >= 0; i--) {
        const text = extractCleanTextFromContainer(doubaoContainers[i]);
        if (text && text.length > content.length && !isPureCssText(text)) {
          content = text;
        }
        if (content.length > 30) break;
      }
    }
  }
  // 4. DeepSeek - Separate CoT & Main Text
  else if (href.includes('deepseek.com') || modelId === 'deepseek') {
    const thinkEls = document.querySelectorAll('.ds-think, .thinking-content, details.ds-thought');
    if (thinkEls.length > 0) {
      thinking = (thinkEls[thinkEls.length - 1].innerText || '').trim();
    }
    const dsContainers = document.querySelectorAll('[data-role="assistant"], .ds-markdown, div.ds-message-item');
    if (dsContainers.length > 0) {
      for (let i = dsContainers.length - 1; i >= 0; i--) {
        const text = extractCleanTextFromContainer(dsContainers[i]);
        if (text && text.length > content.length && !isPureCssText(text)) {
          content = text;
        }
        if (content.length > 30) break;
      }
    }
  }
  // 5. Kimi
  else if (href.includes('kimi.moonshot.cn') || href.includes('kimi.com') || modelId === 'kimi') {
    const kimiContainers = document.querySelectorAll('.segment-assistant, .chat-content, .markdown-body, div[class*="segment-content"]');
    if (kimiContainers.length > 0) {
      for (let i = kimiContainers.length - 1; i >= 0; i--) {
        const text = extractCleanTextFromContainer(kimiContainers[i]);
        if (text && text.length > content.length && !isPureCssText(text)) {
          content = text;
        }
        if (content.length > 30) break;
      }
    }
  }
  // 6. 智谱清言 (Z.AI / GLM)
  else if (href.includes('z.ai') || href.includes('chatglm.cn') || modelId === 'zai') {
    const zaiContainers = document.querySelectorAll(
      'div[class*="message-assistant"], div[class*="chat-item-assistant"], div[class*="assistant_message"], div[class*="answer-content"], div.message-answer, div.chat-bubble-assistant, div[class*="bubble-content"], div.markdown-body:not(style), div[class*="markdown"]:not(style), div.agent-bubble, div[data-role="assistant"]'
    );
    if (zaiContainers.length > 0) {
      for (let i = zaiContainers.length - 1; i >= 0; i--) {
        const text = extractCleanTextFromContainer(zaiContainers[i]);
        if (text && text.length > content.length && !isPureCssText(text)) {
          content = text;
        }
        if (content.length > 30) break;
      }
    }
  }
  // 7. Gemini
  else if (href.includes('gemini.google.com') || modelId === 'gemini') {
    const thinkEl = document.querySelector('.thought-container, .thinking-process, details');
    if (thinkEl) thinking = (thinkEl.innerText || '').trim();
    const geminiContainers = document.querySelectorAll('message-content, model-response, .model-response-text, .response-container');
    if (geminiContainers.length > 0) {
      for (let i = geminiContainers.length - 1; i >= 0; i--) {
        const text = extractCleanTextFromContainer(geminiContainers[i]);
        if (text && text.length > content.length && !isPureCssText(text)) {
          content = text;
        }
        if (content.length > 30) break;
      }
    }
  }
  // 8. Claude
  else if (href.includes('claude.ai') || modelId === 'claude') {
    const claudeContainers = document.querySelectorAll('div.font-claude-message, div[data-is-streaming], .prose');
    if (claudeContainers.length > 0) {
      for (let i = claudeContainers.length - 1; i >= 0; i--) {
        const text = extractCleanTextFromContainer(claudeContainers[i]);
        if (text && text.length > content.length && !isPureCssText(text)) {
          content = text;
        }
        if (content.length > 30) break;
      }
    }
  }

  // Tier 2 Fallback: General AI message container scan
  if (!content || content.length < 20 || isPureCssText(content)) {
    const generalContainers = document.querySelectorAll(
      '.flow-markdown-body, .markdown-body, div[data-message-author-role="assistant"], [data-role="assistant"], .qwen-bubble-assistant, div[class*="bubble-content"], div[class*="message-content"]'
    );
    if (generalContainers.length > 0) {
      for (let i = generalContainers.length - 1; i >= 0; i--) {
        const text = extractCleanTextFromContainer(generalContainers[i]);
        if (text && text.length > content.length && text.length > 20 && !isPureCssText(text)) {
          content = text;
          break;
        }
      }
    }
  }

  // Tier 3 Fallback: Universal Page Heuristic Scanner
  if (!content || content.length < 20 || isPureCssText(content)) {
    const heuristicText = scanPageForLongestAssistantBlock(prompt);
    if (heuristicText && heuristicText.length > content.length && !isPureCssText(heuristicText)) {
      content = heuristicText;
    }
  }

  return { content, thinking };
}

// Full In-page execution pipeline with URL capture & Adaptive Polling
async function executeInPageAutomation(prompt, modelId) {
  console.log('[OmniCompare Bridge] Executing automation with prompt:', prompt);

  function notify(step, status, data = {}) {
    const payload = {
      type: 'OMNICOMPARE_AUTOMATION_EVENT',
      modelId,
      step,
      status,
      timestamp: Date.now(),
      conversationUrl: window.location.href,
      ...data
    };
    try {
      window.parent.postMessage(payload, '*');
    } catch (e) {}
    try {
      if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.sendMessage) {
        chrome.runtime.sendMessage(payload);
      }
    } catch (e) {}
  }

  // 1. Find Input
  notify('finding_input', 'pending');
  const inputEl = findInputElement();
  if (!inputEl) {
    notify('finding_input', 'error', { message: '未找到输入框，请确认页面是否已完全加载' });
    return;
  }
  notify('finding_input', 'success', { message: '已定位输入框' });

  // 2. Fill Prompt
  notify('filling_prompt', 'pending');
  setElementValue(inputEl, prompt);
  notify('filling_prompt', 'success', { message: '已写入提示词并触发事件' });

  // Wait a short moment for React state to register the input
  await new Promise(r => setTimeout(r, 450));

  // 3. Click Send or Form Submit
  notify('submitting', 'pending');
  let sendSuccess = false;
  const sendBtn = findSendButton();

  if (sendBtn) {
    try {
      sendBtn.removeAttribute('disabled');
      sendBtn.disabled = false;
      sendBtn.classList.remove('disabled');
      sendBtn.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, cancelable: true, composed: true }));
      sendBtn.dispatchEvent(new MouseEvent('mousedown', { bubbles: true, cancelable: true, composed: true }));
      sendBtn.dispatchEvent(new PointerEvent('pointerup', { bubbles: true, cancelable: true, composed: true }));
      sendBtn.dispatchEvent(new MouseEvent('mouseup', { bubbles: true, cancelable: true, composed: true }));
      sendBtn.click();
      sendSuccess = true;
    } catch (e) {
      try { sendBtn.click(); sendSuccess = true; } catch (e2) {}
    }
  }

  // Check if inside a form
  if (!sendSuccess && inputEl.form && typeof inputEl.form.requestSubmit === 'function') {
    try {
      inputEl.form.requestSubmit();
      sendSuccess = true;
    } catch (e) {}
  }

  // Also dispatch keyboard Enter events with high fidelity
  const keyEvents = ['keydown', 'keypress', 'keyup'];
  for (const evtName of keyEvents) {
    try {
      inputEl.dispatchEvent(new KeyboardEvent(evtName, {
        key: 'Enter',
        code: 'Enter',
        keyCode: 13,
        which: 13,
        charCode: 13,
        bubbles: true,
        cancelable: true,
        composed: true,
        shiftKey: false,
        ctrlKey: false,
        metaKey: false
      }));
      sendSuccess = true;
    } catch (e) {}
  }

  notify('submitting', 'success', { message: '已触发对话发送指令' });

  // 4 & 5. Extended Adaptive Polling (up to 90 seconds)
  notify('waiting_response', 'pending', { message: '正在等待模型生成回复...' });
  let unchangedCount = 0;
  let lastLength = 0;
  let pollIteration = 0;

  const pollInterval = setInterval(() => {
    pollIteration++;
    const { content, thinking } = extractLatestAssistantResponse(modelId, prompt);

    if (content.length > 0) {
      if (content.length > lastLength) {
        lastLength = content.length;
        unchangedCount = 0;
        notify('waiting_response', 'streaming', {
          partialText: content,
          extractedText: content,
          extractedThinking: thinking,
          conversationUrl: window.location.href,
          message: '正在流式抓取中 (' + content.length + ' 字)...'
        });
      } else {
        unchangedCount++;
      }
    }

    // Completion indicators
    const copyBtn = document.querySelector('button[aria-label*="Copy"], button[aria-label*="复制"], button[title*="复制"], button[data-testid*="copy"]');
    const stopBtn = document.querySelector('button[aria-label*="Stop"], button[data-testid*="stop"], div[role="button"][aria-label*="停止"], button.stop-btn');

    const isComplete = (unchangedCount >= 5 && content.length > 20) || (copyBtn && !stopBtn && content.length > 20) || pollIteration >= 120;

    if (isComplete) {
      clearInterval(pollInterval);
      notify('scraping_result', 'success', {
        extractedText: content,
        extractedThinking: thinking,
        conversationUrl: window.location.href,
        message: '抓取完成 (共 ' + content.length + ' 字)'
      });
      notify('completed', 'success', {
        finalText: content,
        extractedText: content,
        extractedThinking: thinking,
        conversationUrl: window.location.href,
        message: '成功提取 ' + content.length + ' 字回答并记录链接'
      });
    }
  }, 800);
}

// Immediate Force-Scrape Handler with Heuristic Fallback
function handleImmediateScrape(modelId, prompt = '') {
  const { content, thinking } = extractLatestAssistantResponse(modelId, prompt);
  const payload = {
    type: 'OMNICOMPARE_AUTOMATION_EVENT',
    modelId,
    step: 'completed',
    status: 'success',
    timestamp: Date.now(),
    conversationUrl: window.location.href,
    extractedText: content || '',
    extractedThinking: thinking || '',
    finalText: content || '',
    message: content ? ('成功提取 ' + content.length + ' 字回答') : '已记录官网会话链接'
  };
  try {
    window.parent.postMessage(payload, '*');
  } catch (e) {}
}

// Listen for PostMessage from parent arena window
window.addEventListener('message', (event) => {
  if (!event.data || !event.data.type) return;
  const currentModelId = detectModelIdFromHref();

  if (event.data.type === 'OMNICOMPARE_EXECUTE_AUTOMATION') {
    const { modelId, prompt, targetModels } = event.data;
    if (targetModels && Array.isArray(targetModels) && currentModelId) {
      if (!targetModels.includes(currentModelId)) return;
    }
    const finalModelId = modelId || currentModelId || 'unknown';
    executeInPageAutomation(prompt, finalModelId);
  } else if (event.data.type === 'OMNICOMPARE_SCRAPE_NOW') {
    const finalModelId = event.data.modelId || currentModelId || 'unknown';
    handleImmediateScrape(finalModelId, event.data.prompt);
  }
});

// Listen for chrome.runtime messages
if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.onMessage) {
  chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
    const currentModelId = detectModelIdFromHref();
    if (msg.type === 'SEND_PROMPT_TO_PAGE' || msg.type === 'OMNICOMPARE_EXECUTE_AUTOMATION') {
      const finalModelId = msg.modelId || currentModelId || 'unknown';
      executeInPageAutomation(msg.prompt, finalModelId);
      sendResponse({ status: 'started' });
      return true;
    } else if (msg.type === 'OMNICOMPARE_SCRAPE_NOW') {
      const finalModelId = msg.modelId || currentModelId || 'unknown';
      handleImmediateScrape(finalModelId, msg.prompt);
      sendResponse({ status: 'scraped' });
      return true;
    }
  });
}
`;

  const backgroundJs = `// OmniCompare AI Chrome Extension - Background Service Worker
console.log('[OmniCompare Background] Service Worker active.');

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'PING') {
    sendResponse({ status: 'OK', version: '1.4.0' });
  } else if (message.type === 'DISPATCH_CONCURRENT_PROMPT') {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs[0]?.id) {
        chrome.scripting.executeScript({
          target: { tabId: tabs[0].id, allFrames: true },
          func: (p, models) => {
            window.postMessage({
              type: 'OMNICOMPARE_EXECUTE_AUTOMATION',
              prompt: p,
              targetModels: models
            }, '*');
          },
          args: [message.prompt, message.targetModels]
        }).catch(err => console.error(err));
      }
    });
    sendResponse({ status: 'dispatched' });
  }
  return true;
});
`;

  const popupHtml = `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <title>OmniCompare AI</title>
  <style>
    body {
      width: 360px;
      margin: 0;
      padding: 16px;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      background: #0F172A;
      color: #F8FAFC;
    }
    .header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      border-bottom: 1px solid #1E293B;
      padding-bottom: 12px;
      margin-bottom: 12px;
    }
    .title {
      font-weight: 700;
      font-size: 16px;
      color: #818CF8;
      display: flex;
      align-items: center;
      gap: 6px;
    }
    .badge {
      font-size: 10px;
      background: #10B981;
      color: white;
      padding: 2px 6px;
      border-radius: 10px;
    }
    .models-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 6px;
      margin-bottom: 12px;
    }
    .model-chip {
      background: #1E293B;
      border: 1px solid #334155;
      border-radius: 6px;
      padding: 6px 8px;
      font-size: 12px;
      display: flex;
      align-items: center;
      gap: 6px;
    }
    .btn-full {
      width: 100%;
      background: #4F46E5;
      color: white;
      border: none;
      border-radius: 8px;
      padding: 11px;
      font-size: 14px;
      font-weight: 700;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 6px;
      transition: background 0.2s;
    }
    .btn-full:hover {
      background: #4338CA;
    }
    .desc {
      font-size: 11px;
      color: #94A3B8;
      margin-top: 10px;
      line-height: 1.4;
      text-align: center;
    }
  </style>
</head>
<body>
  <div class="header">
    <div class="title">⚡ OmniCompare AI <span class="badge">v1.4.0</span></div>
  </div>

  <div class="models-grid">
    <div class="model-chip">🟢 ChatGPT</div>
    <div class="model-chip">🔵 Gemini</div>
    <div class="model-chip">🟣 通义千问</div>
    <div class="model-chip">🔷 DeepSeek</div>
    <div class="model-chip">🌙 Kimi</div>
    <div class="model-chip">🔴 豆包</div>
    <div class="model-chip">🟠 智谱清言</div>
    <div class="model-chip">🟤 Claude</div>
  </div>

  <button id="openArenaBtn" class="btn-full">
    🖥️ 打开全屏对战竞技场 (Arena)
  </button>

  <div class="desc">
    已内置最新完整自动化与流式结果抓取引擎，支持会话历史记录、地址栏会话直达链接与多格式导出。
  </div>

  <script src="popup.js"></script>
</body>
</html>
`;

  const popupJs = `document.getElementById('openArenaBtn').addEventListener('click', () => {
  chrome.tabs.create({
    url: chrome.runtime.getURL('arena.html')
  });
});
`;

  // Self-contained Pure CSS for Extension Arena UI
  const arenaCss = `
:root {
  --primary: #4F46E5;
  --primary-hover: #4338CA;
  --primary-light: #EEF2FF;
  --primary-border: #C7D2FE;
  --bg-main: #F1F5F9;
  --bg-card: #FFFFFF;
  --border: #E2E8F0;
  --text-main: #0F172A;
  --text-muted: #64748B;
  --text-sub: #94A3B8;
}

* {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

body {
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
  background-color: var(--bg-main);
  color: var(--text-main);
  display: flex;
  flex-direction: column;
  height: 100vh;
  width: 100vw;
  overflow: hidden;
  user-select: none;
}

/* 1. Header */
header {
  height: 60px;
  background: var(--bg-card);
  border-bottom: 1px solid var(--border);
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 20px;
  z-index: 30;
  flex-shrink: 0;
  box-shadow: 0 1px 2px rgba(0,0,0,0.03);
}

.brand-section {
  display: flex;
  align-items: center;
  gap: 12px;
}

.brand-logo {
  width: 32px;
  height: 32px;
  border-radius: 8px;
  background: var(--primary);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
  font-size: 16px;
  box-shadow: 0 2px 6px rgba(79, 70, 229, 0.3);
}

.brand-title {
  font-size: 15px;
  font-weight: 800;
  color: var(--text-main);
  line-height: 1.2;
}

.brand-title span {
  color: var(--primary);
}

.brand-sub {
  font-size: 11px;
  color: var(--text-muted);
}

.header-status-pill {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 4px 10px;
  background: #F1F5F9;
  border: 1px solid var(--border);
  border-radius: 20px;
  font-size: 11px;
  color: var(--text-muted);
}

.pulse-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #10B981;
  animation: pulse 2s infinite;
}

@keyframes pulse {
  0% { transform: scale(0.95); opacity: 0.8; }
  50% { transform: scale(1.2); opacity: 1; }
  100% { transform: scale(0.95); opacity: 0.8; }
}

.layout-group {
  display: flex;
  background: #F1F5F9;
  padding: 3px;
  border-radius: 8px;
  border: 1px solid var(--border);
  gap: 2px;
}

.btn-layout {
  padding: 4px 10px;
  border: none;
  background: transparent;
  border-radius: 6px;
  font-size: 12px;
  font-weight: 500;
  color: var(--text-muted);
  cursor: pointer;
  transition: all 0.15s;
}

.btn-layout.active {
  background: white;
  color: var(--text-main);
  font-weight: 700;
  box-shadow: 0 1px 2px rgba(0,0,0,0.06);
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 8px;
}

.btn {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 6px 12px;
  background: white;
  border: 1px solid var(--border);
  border-radius: 8px;
  font-size: 12px;
  font-weight: 500;
  color: var(--text-main);
  cursor: pointer;
  transition: all 0.15s;
  text-decoration: none;
}

.btn:hover {
  background: #F8FAFC;
  border-color: #CBD5E1;
}

.btn-primary {
  background: var(--primary);
  border-color: var(--primary);
  color: white;
  font-weight: 600;
}

.btn-primary:hover {
  background: var(--primary-hover);
}

/* 2. Model Selector Bar */
.model-bar {
  background: white;
  border-bottom: 1px solid var(--border);
  padding: 8px 20px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  overflow-x: auto;
  flex-shrink: 0;
}

.model-chips-list {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: nowrap;
}

.model-chip {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 4px 10px;
  background: #F8FAFC;
  border: 1px solid var(--border);
  border-radius: 8px;
  font-size: 12px;
  font-weight: 500;
  color: var(--text-muted);
  cursor: pointer;
  transition: all 0.15s;
  white-space: nowrap;
}

.model-chip.active {
  background: var(--primary-light);
  border-color: var(--primary-border);
  color: #3730A3;
  box-shadow: 0 1px 2px rgba(79, 70, 229, 0.08);
}

.chip-avatar {
  width: 18px;
  height: 18px;
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 9px;
  font-weight: bold;
}

.model-actions-quick {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  color: var(--text-sub);
  flex-shrink: 0;
}

.btn-link {
  background: none;
  border: none;
  color: var(--text-muted);
  font-size: 12px;
  font-weight: 500;
  cursor: pointer;
}

.btn-link:hover {
  color: var(--primary);
}

.btn-link.highlight {
  color: var(--primary);
  font-weight: 700;
}

/* 3. Arena Grid Container */
.arena-grid {
  flex: 1;
  display: grid;
  gap: 16px;
  padding: 16px;
  overflow-y: auto;
  background: #F1F5F9;
}

.grid-cols-2 { grid-template-columns: repeat(2, 1fr); }
.grid-cols-3 { grid-template-columns: repeat(3, 1fr); }
.grid-cols-4 { grid-template-columns: repeat(4, 1fr); }
.grid-cols-6 { grid-template-columns: repeat(6, 1fr); }

.model-card {
  display: flex;
  flex-direction: column;
  background: white;
  border-radius: 12px;
  border: 1px solid var(--border);
  box-shadow: 0 1px 3px rgba(0,0,0,0.05);
  overflow: hidden;
  min-height: 480px;
  height: 100%;
}

.card-header {
  padding: 10px 14px;
  background: white;
  border-bottom: 1px solid #F1F5F9;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  flex-shrink: 0;
}

.card-title-group {
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 0;
}

.card-title {
  font-size: 13px;
  font-weight: 700;
  color: var(--text-main);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.card-actions {
  display: flex;
  align-items: center;
  gap: 4px;
}

.btn-exec {
  background: #EEF2FF;
  color: var(--primary);
  border: 1px solid #C7D2FE;
  font-weight: 600;
  border-radius: 6px;
  padding: 3px 8px;
  font-size: 11px;
  cursor: pointer;
  transition: all 0.15s;
}

.btn-exec:hover {
  background: #E0E7FF;
}

.card-status-bar {
  padding: 6px 12px;
  background: #F8FAFC;
  border-bottom: 1px solid var(--border);
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 11px;
  color: var(--text-muted);
  flex-shrink: 0;
  gap: 6px;
}

.session-link-badge {
  display: inline-flex;
  align-items: center;
  gap: 3px;
  color: var(--primary);
  background: #EEF2FF;
  border: 1px solid #C7D2FE;
  padding: 2px 6px;
  border-radius: 4px;
  text-decoration: none;
  font-weight: 600;
  font-size: 10px;
  max-width: 140px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.session-link-badge:hover {
  background: #E0E7FF;
}

.status-badge {
  font-size: 10px;
  font-family: monospace;
  font-weight: 700;
  background: #E2E8F0;
  color: #475569;
  padding: 2px 6px;
  border-radius: 4px;
  white-space: nowrap;
}

.status-badge.in-progress {
  background: #EEF2FF;
  color: #4338CA;
}

.status-badge.success {
  background: #D1FAE5;
  color: #065F46;
}

.iframe-container {
  flex: 1;
  position: relative;
  background: white;
}

.iframe-container iframe {
  width: 100%;
  height: 100%;
  position: absolute;
  inset: 0;
  border: none;
}

/* Fallback Notice for strict sites like ChatGPT/Gemini */
.iframe-fallback-overlay {
  display: none;
  position: absolute;
  bottom: 10px;
  left: 10px;
  right: 10px;
  background: rgba(15, 23, 42, 0.85);
  color: white;
  padding: 8px 12px;
  border-radius: 8px;
  font-size: 11px;
  backdrop-filter: blur(4px);
  z-index: 10;
  align-items: center;
  justify-content: space-between;
}

/* 4. Bottom Prompt Bar */
.prompt-bar {
  background: var(--bg-card);
  border-top: 1px solid var(--border);
  padding: 12px 20px;
  box-shadow: 0 -2px 10px rgba(0,0,0,0.03);
  z-index: 30;
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.prompt-bar-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 12px;
  color: var(--text-muted);
}

.prompt-input-row {
  display: flex;
  align-items: flex-end;
  gap: 12px;
}

.prompt-textarea-wrapper {
  flex: 1;
  background: #F8FAFC;
  border: 1px solid var(--border);
  border-radius: 10px;
  padding: 10px 14px;
  transition: all 0.2s;
}

.prompt-textarea-wrapper:focus-within {
  border-color: var(--primary);
  background: white;
  box-shadow: 0 0 0 3px rgba(79, 70, 229, 0.12);
}

.prompt-textarea {
  width: 100%;
  height: 52px;
  border: none;
  background: transparent;
  outline: none;
  font-size: 13px;
  font-family: inherit;
  resize: none;
  color: var(--text-main);
}

.prompt-textarea::placeholder {
  color: var(--text-sub);
}

.btn-send-main {
  height: 74px;
  padding: 0 24px;
  background: var(--primary);
  color: white;
  border: none;
  border-radius: 10px;
  font-size: 14px;
  font-weight: 700;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  box-shadow: 0 4px 12px rgba(79, 70, 229, 0.3);
  transition: all 0.15s;
  flex-shrink: 0;
}

.btn-send-main:hover {
  background: var(--primary-hover);
}

.btn-send-main:active {
  transform: scale(0.98);
}

.btn-send-main:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

/* 5. Modals */
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(15, 23, 42, 0.6);
  backdrop-filter: blur(4px);
  z-index: 100;
  display: none;
  align-items: center;
  justify-content: center;
  padding: 20px;
}

.modal-overlay.active {
  display: flex;
}

.modal-box {
  background: white;
  border-radius: 16px;
  max-width: 800px;
  width: 100%;
  max-height: 85vh;
  display: flex;
  flex-direction: column;
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.2);
  overflow: hidden;
}

.modal-header {
  padding: 16px 20px;
  border-bottom: 1px solid var(--border);
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.modal-title {
  font-size: 16px;
  font-weight: 700;
  color: var(--text-main);
  display: flex;
  align-items: center;
  gap: 8px;
}

.modal-body {
  padding: 20px;
  overflow-y: auto;
  flex: 1;
  background: #F8FAFC;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.history-card {
  background: white;
  border: 1px solid var(--border);
  border-radius: 10px;
  padding: 14px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.history-prompt {
  font-size: 13px;
  font-weight: 600;
  color: var(--text-main);
}

.history-links {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}
`;

  // Arena HTML with full CSS, history panel and export modal
  const arenaHtml = `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>OmniCompare AI Arena - 多模型 IFrame 网页与并发评测对战台</title>
  <link rel="stylesheet" href="arena.css">
</head>
<body>

  <!-- 1. Top Navbar -->
  <header>
    <div class="brand-section">
      <div class="brand-logo">⚡</div>
      <div>
        <div class="brand-title">OmniCompare <span>AI</span></div>
        <div class="brand-sub">IFrame 内嵌网页自动化与多模型并发评测</div>
      </div>

      <div class="header-status-pill">
        <span class="pulse-dot"></span>
        <span id="activeCountHeader" style="color:#059669; font-weight:600;">7 模型已激活</span>
        <span style="color:#CBD5E1;">|</span>
        <span>第 <strong id="roundCounter" style="font-family:monospace; color:#0F172A;">0</strong> 轮</span>
      </div>
    </div>

    <!-- Layout Switcher -->
    <div class="layout-group">
      <button id="btnCol2" class="btn-layout">2 栏</button>
      <button id="btnCol3" class="btn-layout">3 栏</button>
      <button id="btnCol4" class="btn-layout active">4 栏</button>
      <button id="btnCol6" class="btn-layout">6 栏</button>
    </div>

    <!-- Actions -->
    <div class="header-actions">
      <button id="btnScrapeAll" class="btn" title="立即从当前所有内嵌网页提取完整回答并同步">🔄 重新抓取回答</button>
      <button id="btnHistoryModal" class="btn">📜 历史会话 (<span id="historyCountBadge">0</span>)</button>
      <button id="btnExportModal" class="btn btn-primary">📤 导出文档 (含完整回答与链接)</button>
      <button id="btnReloadAll" class="btn">🔄 刷新全部页面</button>
    </div>
  </header>

  <!-- 2. Model Selector Bar -->
  <div class="model-bar">
    <div class="model-chips-list" id="modelPillContainer"></div>
    <div class="model-actions-quick">
      <button id="btnSelectAll" class="btn-link">全选</button>
      <span>|</span>
      <button id="btnSelectRecommended" class="btn-link highlight">推荐 4 模型</button>
    </div>
  </div>

  <!-- 3. Main Arena Container -->
  <div class="arena-grid grid-cols-4" id="arenaGrid"></div>

  <!-- 4. Bottom Synchronous Prompt Bar -->
  <div class="prompt-bar">
    <div class="prompt-bar-header">
      <div>💡 <strong>全自动流程</strong>：输入后点击发起，系统将同时向所有内嵌官方网页执行：<strong>定位输入框 ➔ 填入词 ➔ 发送 ➔ 记录地址栏会话链接 ➔ 持续流式抓取完整结果</strong></div>
      <div><button id="btnClearPrompt" class="btn-link">清空输入</button></div>
    </div>

    <div class="prompt-input-row">
      <div class="prompt-textarea-wrapper">
        <textarea
          id="promptInput"
          class="prompt-textarea"
          placeholder="在此输入并发测试提示词（例如：请用中文详细介绍量子计算的基本原理、核心优势及最新突破，并给出一个经典与量子算法对比的代码示例）..."
        ></textarea>
      </div>

      <button id="btnSendConcurrent" class="btn-send-main">
        <span>🚀</span>
        <span>并发发起对话</span>
      </button>
    </div>
  </div>

  <!-- 5. History Modal -->
  <div id="historyModalOverlay" class="modal-overlay">
    <div class="modal-box">
      <div class="modal-header">
        <div class="modal-title">📜 会话历史记录与官网直达链接</div>
        <button id="btnCloseHistory" class="btn" style="padding:4px 8px;">✕</button>
      </div>
      <div class="modal-body" id="historyListContainer">
        <!-- Dynamic History Cards -->
      </div>
    </div>
  </div>

  <!-- 6. Export Modal -->
  <div id="exportModalOverlay" class="modal-overlay">
    <div class="modal-box" style="max-width: 600px;">
      <div class="modal-header">
        <div class="modal-title">📤 导出评测文档 (含完整回答与官方会话链接)</div>
        <button id="btnCloseExport" class="btn" style="padding:4px 8px;">✕</button>
      </div>
      <div class="modal-body">
        <div class="history-card" style="cursor:pointer;" id="btnExportMarkdown">
          <strong>📄 Markdown 完整报告 (.md)</strong>
          <p style="font-size:12px; color:#64748B;">包含多模型对比表格、各模型完整回答、思维链及官方会话直达链接</p>
        </div>
        <div class="history-card" style="cursor:pointer;" id="btnExportHTML">
          <strong>🌐 HTML 精美网页文档 (.html)</strong>
          <p style="font-size:12px; color:#64748B;">独立单文件网页文档，排版优美，内置官网直达按钮与完整内容</p>
        </div>
        <div class="history-card" style="cursor:pointer;" id="btnExportCSV">
          <strong>📊 CSV 结构化表格 (.csv)</strong>
          <p style="font-size:12px; color:#64748B;">含 Full_Response 与 Conversation_URL 列，方便导入飞书或 Excel</p>
        </div>
        <div class="history-card" style="cursor:pointer;" id="btnExportJSON">
          <strong>📦 JSON 全量会话存档 (.json)</strong>
          <p style="font-size:12px; color:#64748B;">全量持久化数据，包含每一轮提示词与模型完整响应与链接</p>
        </div>
      </div>
    </div>
  </div>

  <!-- 7. Manual Input Fallback Modal -->
  <div id="manualModalOverlay" class="modal-overlay">
    <div class="modal-box" style="max-width: 580px;">
      <div class="modal-header">
        <div class="modal-title" id="manualModalTitle">📝 手动补充/粘贴回答 (兜底)</div>
        <button id="btnCloseManual" class="btn" style="padding:4px 8px;">✕</button>
      </div>
      <div class="modal-body">
        <p style="font-size:12px; color:#64748B; margin:0;">
          💡 当内嵌页面改版或跨域限制导致未能自动抓全长文时，可直接将网页中的回答复制粘贴于此，系统将同步至历史记录与导出报告中。
        </p>
        <textarea
          id="manualTextInput"
          style="width:100%; height:180px; padding:10px; border-radius:8px; border:1px solid #CBD5E1; font-family:monospace; font-size:12px; resize:vertical; box-sizing:border-box;"
          placeholder="在此粘贴模型的完整回答长文..."
        ></textarea>
        <div style="display:flex; justify-content:flex-end; gap:8px; margin-top:8px;">
          <button id="btnCancelManual" class="btn">取消</button>
          <button id="btnSaveManual" class="btn btn-primary">保存并同步</button>
        </div>
      </div>
    </div>
  </div>

  <script src="arena.js"></script>
</body>
</html>
`;

  // Standalone Arena JS Controller with Real-Time History & Dynamic Scraping Synchronization
  const arenaJs = `// OmniCompare Arena Full Automation Controller with Dynamic Scraping & Clean Names
const SUPPORTED_MODELS = [
  { id: 'chatgpt', name: 'ChatGPT', url: 'https://chatgpt.com/', color: '#10B981', text: 'GPT', company: 'OpenAI' },
  { id: 'gemini', name: 'Gemini', url: 'https://gemini.google.com/app', color: '#2563EB', text: 'GEM', company: 'Google' },
  { id: 'deepseek', name: 'DeepSeek', url: 'https://chat.deepseek.com/', color: '#4F46E5', text: 'DS', company: 'DeepSeek 深度求索' },
  { id: 'qwen', name: '通义千问', url: 'https://chat.qwen.ai/', color: '#9333EA', text: '千问', company: '阿里云 / Alibaba' },
  { id: 'kimi', name: 'Kimi', url: 'https://kimi.moonshot.cn/', color: '#D97706', text: 'Kimi', company: '月之暗面 Moonshot' },
  { id: 'doubao', name: '豆包', url: 'https://www.doubao.com/chat/', color: '#E11D48', text: '豆包', company: '字节跳动' },
  { id: 'zai', name: '智谱清言', url: 'https://z.ai/', color: '#0891B2', text: 'GLM', company: '智谱 AI' },
  { id: 'claude', name: 'Claude', url: 'https://claude.ai/', color: '#EA580C', text: 'CLD', company: 'Anthropic' }
];

let selectedModelIds = ['chatgpt', 'gemini', 'deepseek', 'qwen', 'kimi', 'doubao', 'zai'];
let roundIndex = 0;
let modelCapturedUrls = {};
let modelScrapedTexts = {};
let modelScrapedThinkings = {};
let sessionHistoryList = [];

// DOM Elements
const arenaGrid = document.getElementById('arenaGrid');
const modelPillContainer = document.getElementById('modelPillContainer');
const promptInput = document.getElementById('promptInput');
const btnSendConcurrent = document.getElementById('btnSendConcurrent');
const activeCountHeader = document.getElementById('activeCountHeader');
const roundCounter = document.getElementById('roundCounter');
const historyCountBadge = document.getElementById('historyCountBadge');
const historyModalOverlay = document.getElementById('historyModalOverlay');
const historyListContainer = document.getElementById('historyListContainer');
const exportModalOverlay = document.getElementById('exportModalOverlay');

// Initialize History from Local Storage / Chrome Storage
function loadStoredHistory() {
  try {
    const raw = localStorage.getItem('omnicompare_ext_history');
    if (raw) {
      sessionHistoryList = JSON.parse(raw);
    }
  } catch (e) {}
  if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
    chrome.storage.local.get(['omnicompare_history'], (res) => {
      if (res && res.omnicompare_history) {
        sessionHistoryList = res.omnicompare_history;
        updateHistoryBadge();
      }
    });
  }
  updateHistoryBadge();
}

function saveHistory() {
  try {
    localStorage.setItem('omnicompare_ext_history', JSON.stringify(sessionHistoryList));
  } catch (e) {}
  if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
    chrome.storage.local.set({ omnicompare_history: sessionHistoryList });
  }
  updateHistoryBadge();
}

function updateHistoryBadge() {
  if (historyCountBadge) {
    historyCountBadge.innerText = sessionHistoryList.length;
  }
}

// Window Message Listener for Live IFrame Events, Streaming Text and URL capture
window.addEventListener('message', (event) => {
  if (!event.data || event.data.type !== 'OMNICOMPARE_AUTOMATION_EVENT') return;
  const { modelId, step, status, message, extractedText, partialText, extractedThinking, conversationUrl } = event.data;

  if (modelId) {
    if (conversationUrl) {
      modelCapturedUrls[modelId] = conversationUrl;
      const linkBadge = document.getElementById('link-' + modelId);
      if (linkBadge) {
        linkBadge.href = conversationUrl;
        linkBadge.style.display = 'inline-flex';
        linkBadge.title = '官网会话直达: ' + conversationUrl;
      }
    }

    const textToSave = extractedText || partialText;
    if (textToSave) {
      modelScrapedTexts[modelId] = textToSave;
    }
    if (extractedThinking) {
      modelScrapedThinkings[modelId] = extractedThinking;
    }

    // Dynamic Live Sync into current session history record
    if (sessionHistoryList.length > 0 && (extractedText || partialText || conversationUrl)) {
      const currentSession = sessionHistoryList[0];
      if (currentSession && currentSession.rounds && currentSession.rounds.length > 0) {
        const lastRound = currentSession.rounds[currentSession.rounds.length - 1];
        if (!lastRound.responses) lastRound.responses = {};
        if (!lastRound.responses[modelId]) lastRound.responses[modelId] = {};

        if (textToSave) lastRound.responses[modelId].content = textToSave;
        if (extractedThinking) lastRound.responses[modelId].thinking = extractedThinking;
        if (conversationUrl) lastRound.responses[modelId].conversationUrl = conversationUrl;

        saveHistory();
      }
    }

    const statusEl = document.getElementById('status-' + modelId);
    const badgeEl = document.getElementById('badge-' + modelId);

    if (statusEl && message) statusEl.innerText = message;
    if (badgeEl) {
      if (step === 'completed') {
        badgeEl.innerText = '5. 完成抓取 (' + (textToSave ? textToSave.length : 0) + '字)';
        badgeEl.className = 'status-badge success';
      } else if (step === 'waiting_response' || status === 'streaming') {
        badgeEl.innerText = '4. 流式生成中...';
        badgeEl.className = 'status-badge in-progress';
      }
    }
  }
});

// Render Models Selection Bar with Clean Names
function renderModelBar() {
  modelPillContainer.innerHTML = '';
  SUPPORTED_MODELS.forEach(m => {
    const isSelected = selectedModelIds.includes(m.id);
    const pill = document.createElement('div');
    pill.className = 'model-chip' + (isSelected ? ' active' : '');
    pill.innerHTML = \`
      <span class="chip-avatar" style="background:\${m.color};">\${m.text}</span>
      <span>\${m.name}</span>
    \`;
    pill.onclick = () => {
      if (isSelected) {
        if (selectedModelIds.length > 1) {
          selectedModelIds = selectedModelIds.filter(id => id !== m.id);
        }
      } else {
        selectedModelIds.push(m.id);
      }
      renderModelBar();
      renderGrid();
    };
    modelPillContainer.appendChild(pill);
  });
  activeCountHeader.innerText = selectedModelIds.length + ' 模型已激活';
}

// Render IFrame Grid
function renderGrid() {
  arenaGrid.innerHTML = '';
  selectedModelIds.forEach(modelId => {
    const config = SUPPORTED_MODELS.find(m => m.id === modelId);
    if (!config) return;

    const currentUrl = modelCapturedUrls[modelId] || config.url;

    const card = document.createElement('div');
    card.className = 'model-card';
    card.id = 'card-' + modelId;
    card.innerHTML = \`
      <div class="card-header">
        <div class="card-title-group">
          <span class="chip-avatar" style="background:\${config.color}; width:22px; height:22px; font-size:10px;">\${config.text}</span>
          <span class="card-title">\${config.name}</span>
        </div>
        <div class="card-actions">
          <button class="btn-exec" data-action="exec" data-model="\${modelId}" title="单独对该模型执行">▶ 执行</button>
          <button class="btn btn-sm" data-action="scrape" data-model="\${modelId}" title="重新抓取页面回答">📥 抓取</button>
          <button class="btn btn-sm" data-action="manual" data-model="\${modelId}" title="手动补充/粘贴回答（兜底）" style="color:#D97706;">📝 补充</button>
          <button class="btn btn-sm" data-action="reload" data-model="\${modelId}" title="刷新">🔄</button>
          <a href="\${currentUrl}" target="_blank" id="header-link-\${modelId}" class="btn btn-sm" title="在新标签页独立打开并登录" style="text-decoration:none;">↗</a>
        </div>
      </div>

      <div class="card-status-bar">
        <div style="display:flex; align-items:center; gap:6px; min-width:0;">
          <span id="status-\${modelId}" style="white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">准备就绪</span>
          <a id="link-\${modelId}" href="\${currentUrl}" target="_blank" class="session-link-badge" title="官网会话直达链接">🔗 官网直达</a>
        </div>
        <span id="badge-\${modelId}" class="status-badge">待命中</span>
      </div>

      <div class="iframe-container">
        <iframe
          id="iframe-\${modelId}"
          src="\${config.url}"
          sandbox="allow-same-origin allow-scripts allow-forms allow-popups allow-modals allow-downloads"
          allow="clipboard-read; clipboard-write; microphone; camera"
        ></iframe>
      </div>
    \`;
    arenaGrid.appendChild(card);
  });
}

// Global Event Delegation for Arena Grid Buttons (CSP Compliant in Extensions)
arenaGrid.addEventListener('click', (e) => {
  const targetBtn = e.target.closest('button[data-action]');
  if (!targetBtn) return;
  const action = targetBtn.getAttribute('data-action');
  const modelId = targetBtn.getAttribute('data-model');
  if (!modelId) return;

  if (action === 'exec') {
    executeModelAutomation(modelId);
  } else if (action === 'scrape') {
    triggerScrapeSingle(modelId);
  } else if (action === 'manual') {
    openManualInputModal(modelId);
  } else if (action === 'reload') {
    reloadIframe(modelId);
  }
});

// Reload Single IFrame
window.reloadIframe = function(modelId) {
  const iframe = document.getElementById('iframe-' + modelId);
  if (iframe) iframe.src = iframe.src;
};

// Trigger Single Model Scrape
window.triggerScrapeSingle = function(modelId) {
  const iframe = document.getElementById('iframe-' + modelId);
  const promptText = promptInput ? promptInput.value.trim() : '';
  if (iframe && iframe.contentWindow) {
    try {
      iframe.contentWindow.postMessage({
        type: 'OMNICOMPARE_SCRAPE_NOW',
        modelId,
        prompt: promptText
      }, '*');
    } catch (e) {}
  }
};

// Trigger All Model Scrape
window.triggerScrapeAll = function() {
  selectedModelIds.forEach(id => window.triggerScrapeSingle(id));
};

let currentManualModelId = null;
window.openManualInputModal = function(modelId) {
  currentManualModelId = modelId;
  const cfg = SUPPORTED_MODELS.find(m => m.id === modelId);
  const titleEl = document.getElementById('manualModalTitle');
  if (titleEl) titleEl.innerText = '📝 手动补充/粘贴【' + (cfg ? cfg.name : modelId) + '】回答（兜底）';
  const inputEl = document.getElementById('manualTextInput');
  if (inputEl) inputEl.value = modelScrapedTexts[modelId] || '';
  const overlay = document.getElementById('manualModalOverlay');
  if (overlay) overlay.classList.add('active');
};

const manualModalOverlay = document.getElementById('manualModalOverlay');
const btnCloseManual = document.getElementById('btnCloseManual');
const btnCancelManual = document.getElementById('btnCancelManual');
const btnSaveManual = document.getElementById('btnSaveManual');
const manualTextInput = document.getElementById('manualTextInput');

if (btnCloseManual) btnCloseManual.onclick = () => manualModalOverlay.classList.remove('active');
if (btnCancelManual) btnCancelManual.onclick = () => manualModalOverlay.classList.remove('active');
if (btnSaveManual) {
  btnSaveManual.onclick = () => {
    if (currentManualModelId && manualTextInput) {
      const text = manualTextInput.value.trim();
      modelScrapedTexts[currentManualModelId] = text;
      
      const badgeEl = document.getElementById('badge-' + currentManualModelId);
      if (badgeEl) {
        badgeEl.innerText = '5. 完成抓取 (' + text.length + '字)';
        badgeEl.className = 'status-badge success';
      }
      
      // Update session history
      if (sessionHistoryList.length > 0) {
        const currentSession = sessionHistoryList[0];
        if (currentSession && currentSession.rounds && currentSession.rounds.length > 0) {
          const lastRound = currentSession.rounds[currentSession.rounds.length - 1];
          if (!lastRound.responses) lastRound.responses = {};
          if (!lastRound.responses[currentManualModelId]) lastRound.responses[currentManualModelId] = {};
          lastRound.responses[currentManualModelId].content = text;
          saveHistory();
        }
      }
    }
    if (manualModalOverlay) manualModalOverlay.classList.remove('active');
  };
}

// Execute Automation for Single Model
window.executeModelAutomation = async function(modelId) {
  const config = SUPPORTED_MODELS.find(m => m.id === modelId);
  if (!config) return;

  const promptText = promptInput.value.trim() || '你好，请做个详细的自我介绍与核心优势说明';
  const statusEl = document.getElementById('status-' + modelId);
  const badgeEl = document.getElementById('badge-' + modelId);
  const iframe = document.getElementById('iframe-' + modelId);

  if (badgeEl) { badgeEl.innerText = '1. 定位输入框'; badgeEl.className = 'status-badge in-progress'; }
  if (statusEl) statusEl.innerText = '正在定位输入框元素...';

  if (iframe && iframe.contentWindow) {
    try {
      iframe.contentWindow.postMessage({
        type: 'OMNICOMPARE_EXECUTE_AUTOMATION',
        modelId,
        prompt: promptText
      }, '*');
    } catch (e) {}
  }

  if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.sendMessage) {
    chrome.runtime.sendMessage({
      type: 'DISPATCH_CONCURRENT_PROMPT',
      prompt: promptText,
      targetModels: [modelId]
    });
  }

  await new Promise(r => setTimeout(r, 400));
  if (badgeEl) { badgeEl.innerText = '2. 填入提示词'; }
  if (statusEl) statusEl.innerText = '已写入提示词并分发输入事件';

  await new Promise(r => setTimeout(r, 400));
  if (badgeEl) { badgeEl.innerText = '3. 点击发送'; }
  if (statusEl) statusEl.innerText = '已触发提交发送对话请求';

  await new Promise(r => setTimeout(r, 1200));
  if (badgeEl) { badgeEl.innerText = '4. 等待结果'; }
  if (statusEl) statusEl.innerText = '正在抓取最新流式回答...';
};

// Dispatch Prompt concurrently across all models and initialize session entry
btnSendConcurrent.onclick = async () => {
  const promptText = promptInput.value.trim();
  if (!promptText) {
    alert('请输入提示词后再发起并发对话');
    return;
  }

  roundIndex++;
  roundCounter.innerText = roundIndex;

  btnSendConcurrent.disabled = true;
  btnSendConcurrent.innerHTML = '<span>⏳</span><span>正在并发调度并记录链接中...</span>';

  // Initialize a new session item in history list immediately
  const roundData = {
    roundIndex,
    userPrompt: promptText,
    timestamp: Date.now(),
    responses: {}
  };

  selectedModelIds.forEach(id => {
    const cfg = SUPPORTED_MODELS.find(m => m.id === id);
    roundData.responses[id] = {
      content: modelScrapedTexts[id] || '',
      thinking: modelScrapedThinkings[id] || '',
      conversationUrl: modelCapturedUrls[id] || cfg?.url || ''
    };
  });

  const sessionEntry = {
    id: 'session-' + Date.now(),
    title: promptText.slice(0, 30) + (promptText.length > 30 ? '...' : ''),
    createdAt: Date.now(),
    roundsCount: 1,
    models: [...selectedModelIds],
    rounds: [roundData]
  };

  sessionHistoryList.unshift(sessionEntry);
  saveHistory();

  // Execute all active models concurrently
  const promises = selectedModelIds.map(id => window.executeModelAutomation(id));
  await Promise.all(promises);

  setTimeout(() => {
    btnSendConcurrent.disabled = false;
    btnSendConcurrent.innerHTML = '<span>🚀</span><span>并发发起对话</span>';
  }, 3000);
};

// Layout switcher
const layoutCols = ['2', '3', '4', '6'];
layoutCols.forEach(col => {
  const btn = document.getElementById('btnCol' + col);
  if (!btn) return;
  btn.onclick = () => {
    layoutCols.forEach(c => {
      const b = document.getElementById('btnCol' + c);
      if (b) b.classList.remove('active');
    });
    btn.classList.add('active');
    arenaGrid.className = 'arena-grid grid-cols-' + col;
  };
});

document.getElementById('btnReloadAll').onclick = () => {
  selectedModelIds.forEach(id => window.reloadIframe(id));
};

document.getElementById('btnScrapeAll').onclick = () => {
  window.triggerScrapeAll();
  alert('已向所有内嵌页面发起抓取同步，最新内容已更新！');
};

document.getElementById('btnSelectAll').onclick = () => {
  selectedModelIds = SUPPORTED_MODELS.map(m => m.id);
  renderModelBar();
  renderGrid();
};

document.getElementById('btnSelectRecommended').onclick = () => {
  selectedModelIds = ['chatgpt', 'gemini', 'deepseek', 'qwen'];
  renderModelBar();
  renderGrid();
};

document.getElementById('btnClearPrompt').onclick = () => {
  promptInput.value = '';
};

// History Modal Handlers
document.getElementById('btnHistoryModal').onclick = () => {
  renderHistoryList();
  historyModalOverlay.classList.add('active');
};

document.getElementById('btnCloseHistory').onclick = () => {
  historyModalOverlay.classList.remove('active');
};

function renderHistoryList() {
  historyListContainer.innerHTML = '';
  if (sessionHistoryList.length === 0) {
    historyListContainer.innerHTML = '<div style="text-align:center; color:#94A3B8; padding:30px;">暂无历史会话，点击并发发起对话后将自动记录！</div>';
    return;
  }

  sessionHistoryList.forEach((item, index) => {
    const card = document.createElement('div');
    card.className = 'history-card';
    const dateStr = new Date(item.createdAt).toLocaleString();
    const promptText = item.rounds[0]?.userPrompt || item.title;

    let linksHtml = '';
    item.models.forEach(mId => {
      const cfg = SUPPORTED_MODELS.find(m => m.id === mId);
      const url = item.rounds[0]?.responses[mId]?.conversationUrl || cfg?.url;
      linksHtml += \`<a href="\${url}" target="_blank" class="session-link-badge">🔗 \${cfg?.name || mId} 直达</a>\`;
    });

    card.innerHTML = \`
      <div style="display:flex; justify-content:space-between; align-items:center;">
        <span style="font-size:11px; color:#94A3B8;">\${dateStr}</span>
        <button class="btn btn-sm" data-action="delete-history" data-index="\${index}" style="color:#E11D48;">删除</button>
      </div>
      <div class="history-prompt">💬 \${promptText}</div>
      <div class="history-links">\${linksHtml}</div>
    \`;
    historyListContainer.appendChild(card);
  });
}

// Event delegation for history container
historyListContainer.addEventListener('click', (e) => {
  const btn = e.target.closest('button[data-action="delete-history"]');
  if (!btn) return;
  const idx = parseInt(btn.getAttribute('data-index') || '-1', 10);
  if (idx >= 0) {
    deleteHistoryItem(idx);
  }
});

window.deleteHistoryItem = function(index) {
  sessionHistoryList.splice(index, 1);
  saveHistory();
  renderHistoryList();
};

// Export Modal Handlers
document.getElementById('btnExportModal').onclick = () => {
  window.triggerScrapeAll();
  exportModalOverlay.classList.add('active');
};

document.getElementById('btnCloseExport').onclick = () => {
  exportModalOverlay.classList.remove('active');
};

// Export Markdown with Full Responses and direct session URLs
document.getElementById('btnExportMarkdown').onclick = () => {
  window.triggerScrapeAll();

  let md = '# ⚡ OmniCompare 多模型并发评测报告\\n\\n';
  md += '> 生成时间：' + new Date().toLocaleString() + ' | 参与模型数：' + selectedModelIds.length + '\\n\\n';
  md += '## 📊 官方会话直达链接与评测一览\\n\\n';
  md += '| 模型名称 | 所属厂商 | 官网会话直达链接 |\\n';
  md += '| :--- | :--- | :--- |\\n';

  selectedModelIds.forEach(id => {
    const cfg = SUPPORTED_MODELS.find(m => m.id === id);
    const url = modelCapturedUrls[id] || cfg?.url;
    md += '| **' + (cfg?.name || id) + '** | ' + (cfg?.company || '-') + ' | [🔗 官方直达链接](' + url + ') |\\n';
  });

  md += '\\n---\\n\\n## 📝 对话记录\\n\\n';
  md += '### 提示词：\\n\`\`\`\\n' + (promptInput.value.trim() || '默认提示词测试') + '\\n\`\`\`\\n\\n';

  selectedModelIds.forEach(id => {
    const cfg = SUPPORTED_MODELS.find(m => m.id === id);
    const url = modelCapturedUrls[id] || cfg?.url;
    const text = modelScrapedTexts[id] || '（已在内嵌官方网页中生成，如未显示完整内容请在主页面点击【🔄 重新抓取回答】）';
    const think = modelScrapedThinkings[id];

    md += '#### 【' + (cfg?.name || id) + '】 回答\\n';
    md += '> 🔗 **官方对话源链接：** [' + url + '](' + url + ')\\n\\n';
    if (think) {
      md += '> 💭 **思维链思考过程：**\\n> ' + think.replace(/\\n/g, '\\n> ') + '\\n\\n';
    }
    md += text + '\\n\\n';
  });

  downloadFile(md, 'OmniCompare-Report-' + Date.now() + '.md', 'text/markdown');
  exportModalOverlay.classList.remove('active');
};

// Export HTML with Full Responses & direct links
document.getElementById('btnExportHTML').onclick = () => {
  let html = '<!DOCTYPE html><html><head><meta charset="UTF-8"><title>评测报告</title><style>body{font-family:-apple-system,BlinkMacSystemFont,sans-serif;max-width:960px;margin:30px auto;padding:24px;background:#f8fafc;color:#0f172a;}table{width:100%;border-collapse:collapse;margin:16px 0;}th,td{border:1px solid #e2e8f0;padding:12px;text-align:left;background:white;}th{background:#f1f5f9;font-weight:700;}.card{background:white;border:1px solid #e2e8f0;border-radius:10px;padding:20px;margin-bottom:20px;box-shadow:0 1px 3px rgba(0,0,0,0.05);}.btn-link{background:#eef2ff;color:#4f46e5;padding:4px 8px;border-radius:4px;text-decoration:none;font-size:12px;font-weight:600;}.thinking{background:#f8fafc;border-left:3px solid #6366f1;padding:10px;margin:10px 0;font-size:13px;color:#475569;white-space:pre-wrap;}</style></head><body>';
  html += '<h1>⚡ OmniCompare 多模型并发评测报告</h1><p style="color:#64748b;">生成时间：' + new Date().toLocaleString() + '</p>';
  html += '<h3>📊 官方会话直达链接</h3><table><thead><tr><th>模型</th><th>厂商</th><th>会话直达链接</th></tr></thead><tbody>';
  selectedModelIds.forEach(id => {
    const cfg = SUPPORTED_MODELS.find(m => m.id === id);
    const url = modelCapturedUrls[id] || cfg?.url;
    html += '<tr><td><strong>' + (cfg?.name || id) + '</strong></td><td>' + (cfg?.company || '-') + '</td><td><a href="' + url + '" target="_blank" class="btn-link">🔗 官网直达</a></td></tr>';
  });
  html += '</tbody></table><h3>📝 对话内容与评测回答</h3><div class="card" style="background:#eef2ff;border-color:#c7d2fe;"><strong>提示词：</strong> ' + (promptInput.value.trim() || '-') + '</div>';
  selectedModelIds.forEach(id => {
    const cfg = SUPPORTED_MODELS.find(m => m.id === id);
    const url = modelCapturedUrls[id] || cfg?.url;
    const text = modelScrapedTexts[id] || '（已在内嵌网页中执行）';
    const think = modelScrapedThinkings[id];

    html += '<div class="card"><div style="display:flex;justify-content:space-between;align-items:center;border-bottom:1px solid #f1f5f9;padding-bottom:10px;margin-bottom:12px;"><h3 style="margin:0;">' + (cfg?.name || id) + '</h3><a href="' + url + '" target="_blank" class="btn-link">🔗 官方链接</a></div>';
    if (think) {
      html += '<div class="thinking"><strong>💭 思考过程：</strong>\\n' + think + '</div>';
    }
    html += '<div style="white-space:pre-wrap;line-height:1.6;">' + text + '</div></div>';
  });
  html += '</body></html>';
  downloadFile(html, 'OmniCompare-Doc-' + Date.now() + '.html', 'text/html');
  exportModalOverlay.classList.remove('active');
};

// Export CSV with full responses & URLs
document.getElementById('btnExportCSV').onclick = () => {
  let csv = '\\uFEFFModel_Name,Company,Conversation_URL,Prompt,Full_Response,Response_Length\\n';
  const promptVal = (promptInput.value.trim() || '').replace(/"/g, '""');
  selectedModelIds.forEach(id => {
    const cfg = SUPPORTED_MODELS.find(m => m.id === id);
    const url = (modelCapturedUrls[id] || cfg?.url || '').replace(/"/g, '""');
    const text = (modelScrapedTexts[id] || '').replace(/"/g, '""');
    const len = (modelScrapedTexts[id] || '').length;
    csv += '"' + (cfg?.name || id) + '","' + (cfg?.company || '') + '","' + url + '","' + promptVal + '","' + text + '","' + len + '"\\n';
  });
  downloadFile(csv, 'OmniCompare-Data-' + Date.now() + '.csv', 'text/csv;charset=utf-8;');
  exportModalOverlay.classList.remove('active');
};

// Export JSON
document.getElementById('btnExportJSON').onclick = () => {
  const data = {
    title: 'OmniCompare Full Export',
    createdAt: new Date().toISOString(),
    models: selectedModelIds,
    prompt: promptInput.value.trim(),
    capturedUrls: modelCapturedUrls,
    scrapedTexts: modelScrapedTexts,
    scrapedThinkings: modelScrapedThinkings,
    history: sessionHistoryList
  };
  downloadFile(JSON.stringify(data, null, 2), 'OmniCompare-Backup-' + Date.now() + '.json', 'application/json');
  exportModalOverlay.classList.remove('active');
};

function downloadFile(content, filename, type) {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// Initial Setup
loadStoredHistory();
renderModelBar();
renderGrid();
`;

  const readmeMd = `# OmniCompare AI Chrome 浏览器扩展插件 (v1.4.0)

## 🌟 核心功能与升级
1. **IFrame 多模型并排加载**：同时内嵌 ChatGPT、Gemini、DeepSeek、通义千问、Kimi、豆包、智谱清言、Claude 等官方网页；
2. **纯净品牌展示**：去除冗长版本号，直观展示清晰品牌名称；
3. **高精度抓取与流式同步**：大幅强化 DOM 结构抓取算法，自适应等待大模型生成完毕，支持思维链分离提取；
4. **会话历史记录**：自动记录各轮提问与各模型在官方地址栏生成的对话直达链接；
5. **全格式文档导出**：支持导出 Markdown (.md)、HTML 独立网页 (.html)、CSV 表格与 JSON 全量存档，均包含完整回答与官方会话链接。

## 🚀 安装步骤 (只需 15 秒)
1. 将下载的 \`OmniCompare-Chrome-Extension-v1.4.0.zip\` 解压到任意本地文件夹；
2. 打开 Google Chrome 浏览器，在地址栏输入：\`chrome://extensions/\` 并回车；
3. 打开右上角的 **「开发者模式」 (Developer mode)** 开关；
4. 点击左上角的 **「加载已解压的扩展程序」 (Load unpacked)**；
5. 选择刚才解压的文件夹目录；
6. 安装完成！点击浏览器右上角扩展栏的 OmniCompare 图标，点击「打开全屏对战竞技场 (Arena)」即可立即使用！

## 💡 常见问题与排查 (ChatGPT / Gemini 网络与登录状态)
- **提示连接重置或登录拦截**：
  - 如果 ChatGPT 或 Gemini 提示 \`unexpectedly closed the connection\` 或空白，通常是因为当前浏览器尚未登录 OpenAI / Google 账号，或触发了 Cloudflare 验证。
  - 请直接点击对应卡片右上角的 **「↗」** 按钮，在新标签页中登录 ChatGPT / Gemini 账号，然后返回对战竞技场点击 **「🔄」** 刷新即可正常内嵌与并发联动！
`;

  return [
    { path: 'manifest.json', content: JSON.stringify(manifestJson, null, 2) },
    { path: 'rules.json', content: JSON.stringify(rulesJson, null, 2) },
    { path: 'arena.html', content: arenaHtml },
    { path: 'arena.css', content: arenaCss },
    { path: 'arena.js', content: arenaJs },
    { path: 'popup.html', content: popupHtml },
    { path: 'popup.js', content: popupJs },
    { path: 'background.js', content: backgroundJs },
    { path: 'content_scripts/omni_bridge.js', content: omniBridgeScript },
    { path: 'icons/icon16.png', content: createPlaceholderPngBase64(), isBinary: true },
    { path: 'icons/icon48.png', content: createPlaceholderPngBase64(), isBinary: true },
    { path: 'icons/icon128.png', content: createPlaceholderPngBase64(), isBinary: true },
    { path: 'README.md', content: readmeMd }
  ];
}

function createPlaceholderPngBase64(): string {
  return "iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAAABHNCSVQICAgIfAhkiAAAAAlwSFlzAAAOxAAADsQBlSsOGwAAAEZJREFUWIXt1rENACAMBLH4/2n4o0Chr42sK5FkdtV6Z3iWzNzsX6Z3n78AAAAAAAAAAAAAAAAAAAAAAABg2gF/2QeQ/f45yAAAAABJRU5ErkJggg==";
}

export async function createExtensionZipBlob(): Promise<Blob> {
  const zip = new JSZip();
  const files = generateExtensionFiles();

  for (const file of files) {
    if (file.isBinary) {
      zip.file(file.path, file.content, { base64: true });
    } else {
      zip.file(file.path, file.content);
    }
  }

  return await zip.generateAsync({
    type: 'blob',
    compression: 'DEFLATE',
    compressionOptions: { level: 9 },
  });
}

export async function downloadExtensionZip(): Promise<void> {
  const blob = await createExtensionZipBlob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'OmniCompare-Chrome-Extension-v1.4.0.zip';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
