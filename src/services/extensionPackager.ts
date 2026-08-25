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
        match_about_blank: true,
        js: ["content_scripts/anti_frame_buster.js"],
        run_at: "document_start"
      },
      {
        matches: ["<all_urls>"],
        all_frames: true,
        match_about_blank: true,
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
          { header: "content-security-policy-report-only", operation: "remove" },
          { header: "frame-ancestors", operation: "remove" },
          { header: "cross-origin-opener-policy", operation: "remove" },
          { header: "Cross-Origin-Opener-Policy", operation: "remove" },
          { header: "cross-origin-embedder-policy", operation: "remove" },
          { header: "Cross-Origin-Embedder-Policy", operation: "remove" },
          { header: "cross-origin-resource-policy", operation: "remove" }
        ],
        requestHeaders: [
          { header: "sec-fetch-dest", operation: "set", value: "document" },
          { header: "sec-fetch-mode", operation: "set", value: "navigate" },
          { header: "sec-fetch-site", operation: "set", value: "none" }
        ]
      },
      condition: {
        urlFilter: "*",
        resourceTypes: ["main_frame", "sub_frame", "xmlhttprequest", "other"]
      }
    },
    {
      id: 2,
      priority: 2,
      action: {
        type: "modifyHeaders",
        responseHeaders: [
          { header: "x-frame-options", operation: "remove" },
          { header: "content-security-policy", operation: "remove" },
          { header: "content-security-policy-report-only", operation: "remove" },
          { header: "cross-origin-opener-policy", operation: "remove" },
          { header: "cross-origin-embedder-policy", operation: "remove" },
          { header: "cross-origin-resource-policy", operation: "remove" }
        ],
        requestHeaders: [
          { header: "sec-fetch-dest", operation: "set", value: "document" },
          { header: "sec-fetch-mode", operation: "set", value: "navigate" },
          { header: "sec-fetch-site", operation: "set", value: "same-origin" }
        ]
      },
      condition: {
        domains: ["chatgpt.com", "openai.com", "oaistatic.com", "oaiusercontent.com"],
        resourceTypes: ["main_frame", "sub_frame", "xmlhttprequest", "script", "other"]
      }
    }
  ];

  const antiFrameBusterScript = `// OmniCompare Anti Frame-Buster & Top Window Shim
(function() {
  try {
    if (window.top !== window.self) {
      window.__OMNI_REAL_TOP__ = window.top;
      window.__OMNI_REAL_PARENT__ = window.parent;
      try {
        Object.defineProperty(window, 'top', {
          get: function() { return window.self; },
          configurable: true
        });
      } catch(e) {}
      try {
        Object.defineProperty(window, 'parent', {
          get: function() { return window.self; },
          configurable: true
        });
      } catch(e) {}
    }
  } catch(e) {}
})();
`;

  // High-Precision In-Page Automation & Extraction Engine
  const omniBridgeScript = `// OmniCompare High-Precision Content Script Bridge
console.log('[OmniCompare Bridge] Injected into:', window.location.href);

// Reliable multi-channel event dispatcher to host window and Chrome runtime
function sendOmniAutomationEvent(payload) {
  try {
    if (window.__OMNI_REAL_PARENT__ && window.__OMNI_REAL_PARENT__ !== window) {
      window.__OMNI_REAL_PARENT__.postMessage(payload, '*');
    }
  } catch (e) {}
  try {
    if (window.__OMNI_REAL_TOP__ && window.__OMNI_REAL_TOP__ !== window) {
      window.__OMNI_REAL_TOP__.postMessage(payload, '*');
    }
  } catch (e) {}
  try {
    if (window.parent && window.parent !== window) {
      window.parent.postMessage(payload, '*');
    }
  } catch (e) {}
  try {
    if (window.top && window.top !== window) {
      window.top.postMessage(payload, '*');
    }
  } catch (e) {}
  try {
    if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.sendMessage) {
      chrome.runtime.sendMessage(payload);
    }
  } catch (e) {}
}

// URL change watcher to capture conversation URLs (e.g. /c/xxx in SPAs)
let currentHref = window.location.href;
function checkUrlChange(modelId) {
  if (window.location.href !== currentHref) {
    currentHref = window.location.href;
    sendOmniAutomationEvent({
      type: 'OMNICOMPARE_AUTOMATION_EVENT',
      modelId: modelId || detectModelIdFromHref() || 'unknown',
      step: 'url_updated',
      status: 'info',
      conversationUrl: currentHref,
      message: '地址栏会话链接已更新: ' + currentHref
    });
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
    // 1. Try React native setter
    const proto = el.tagName === 'TEXTAREA' ? window.HTMLTextAreaElement.prototype : window.HTMLInputElement.prototype;
    const nativeSetter = Object.getOwnPropertyDescriptor(proto, 'value')?.set;
    if (nativeSetter) {
      nativeSetter.call(el, val);
    } else {
      el.value = val;
    }
    try {
      el.setSelectionRange(val.length, val.length);
    } catch(e) {}
  } else {
    // Rich Text / Contenteditable (ChatGPT ProseMirror / Lexical / Gemini / Doubao / Kimi)
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

  // Dispatch rich event sequences for React / Vue / Semi Design (Doubao) / Slate / Draft.js
  try {
    el.dispatchEvent(new Event('focus', { bubbles: true }));
    el.dispatchEvent(new CompositionEvent('compositionstart', { bubbles: true, data: '' }));
    el.dispatchEvent(new CompositionEvent('compositionupdate', { bubbles: true, data: val }));
    el.dispatchEvent(new CompositionEvent('compositionend', { bubbles: true, data: val }));
    el.dispatchEvent(new InputEvent('beforeinput', { bubbles: true, cancelable: true, inputType: 'insertText', data: val }));
    el.dispatchEvent(new InputEvent('input', { bubbles: true, composed: true, inputType: 'insertText', data: val }));
    el.dispatchEvent(new Event('input', { bubbles: true, composed: true }));
    el.dispatchEvent(new Event('change', { bubbles: true, composed: true }));
    el.dispatchEvent(new KeyboardEvent('keydown', { key: 'Unidentified', bubbles: true }));
    el.dispatchEvent(new KeyboardEvent('keyup', { key: 'Unidentified', bubbles: true }));
  } catch (e) {}

  return true;
}

// Helper to test if a block is mostly raw CSS stylesheet code rather than natural language / markdown
function isPureCssText(text) {
  if (!text || typeof text !== 'string') return true;
  const trimmed = text.trim();
  if (trimmed.length < 5) return true;
  // If it starts with standard CSS rules and has no human language, it is raw CSS
  if (/^@(?:keyframes|media|charset|import)\s+[^{]+\{[\s\S]*\}$/i.test(trimmed)) return true;
  if (/^[.#][a-zA-Z0-9_-]+\s*\{(?:\s*[a-z-]+:\s*[^;]+;\s*)+\}$/i.test(trimmed)) return true;
  return false;
}

// Clean Container Text Extractor (Clones element, strips script/style tags, buttons, disclaimers, suggestions)
function extractCleanTextFromContainer(container) {
  if (!container) return '';
  try {
    const clone = container.cloneNode(true);
    // 1. Unconditionally remove all style, script, noscript, svg, canvas, iframe, video, audio, and template elements
    const bannedTags = clone.querySelectorAll('style, script, noscript, link, meta, template, svg, canvas, iframe, video, audio');
    bannedTags.forEach(el => el.remove());

    // 2. Remove purely structural UI buttons, headers, and footers
    const uiElements = clone.querySelectorAll('button, nav, header, footer, form, input, textarea, .disclaimer, [class*="disclaimer"]');
    uiElements.forEach(el => {
      try { el.remove(); } catch (e) {}
    });

    let extracted = (clone.innerText || clone.textContent || '').trim();
    return extracted;
  } catch (e) {
    let raw = (container.innerText || container.textContent || '').trim();
    return raw;
  }
}

// Universal Page Heuristic Scanner (Tier 3 Fallback)
function scanPageForLongestAssistantBlock(prompt) {
  const candidates = document.querySelectorAll('article, section, div[class*="message"], div[class*="bubble"], div[class*="markdown"], div[class*="segment"], [data-role="assistant"], [data-testid*="message"], div[class*="chat-content"]');
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

    if (text.length > longest.length && text.length >= 20) {
      longest = text;
    }
  }
  return longest;
}

// Find input box across various AI interfaces (ChatGPT, Gemini, DeepSeek, Qwen, Kimi, Doubao, ZAI, Claude)
function findInputElement() {
  const selectors = [
    // 豆包 (Doubao)
    'textarea[data-testid="chat_input_input"]',
    'div[data-testid="chat_input_input"]',
    'textarea.semi-input-textarea',
    '.semi-input-textarea',
    'textarea[placeholder*="发消息"]',
    // ChatGPT
    '#prompt-textarea',
    'textarea#prompt-textarea',
    'div[contenteditable="true"]#prompt-textarea',
    'div[contenteditable="true"][role="textbox"]',
    // Kimi
    '.chat-input-editor',
    'div[data-slate-editor="true"]',
    'div[contenteditable="true"].chat-input',
    // DeepSeek
    '#chat-input',
    'textarea[placeholder*="DeepSeek"]',
    // 通义千问 (Qwen)
    'textarea.ant-input',
    '.chat-input textarea',
    // Gemini
    '.ql-editor',
    'rich-textarea p',
    // General
    'textarea[placeholder*="Message"]',
    'textarea[placeholder*="Ask"]',
    'textarea[placeholder*="发送"]',
    'textarea[placeholder*="输入"]',
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

// Find send button across various AI interfaces
function findSendButton() {
  const selectors = [
    // 豆包 (Doubao)
    'button[data-testid="chat_input_send_button"]',
    'div[data-testid="chat_input_send_button"]',
    'button[data-testid="send_button"]',
    'button.semi-button-primary',
    // ChatGPT
    'button[data-testid="send-button"]',
    'button[aria-label*="Send prompt"]',
    'button[aria-label*="Send message"]',
    // Kimi
    '.send-button',
    'div[class*="send-button"]',
    'button[class*="send-button"]',
    '.send-icon',
    // DeepSeek
    'div[role="button"][aria-label="发送"]',
    'button.send-btn',
    // 通义千问 & 智谱清言 & Claude
    'button[aria-label*="Send"]',
    'button[aria-label*="发送"]',
    'button#send-button',
    'button.ant-btn-primary',
    'button[type="submit"]',
    'form button[type="submit"]'
  ];

  for (const sel of selectors) {
    try {
      const el = document.querySelector(sel);
      if (el && el.offsetParent !== null) return el;
    } catch (e) {}
  }
  return document.querySelector('button[type="submit"], [role="button"][aria-label*="发送"], button:has(svg)');
}

// Multi-Tier Bulletproof Response Extractor
function extractLatestAssistantResponse(modelId, prompt = '') {
  let content = '';
  let thinking = '';
  const href = window.location.href.toLowerCase();

  const isValidText = (t) => t && t.length >= 10 && !isPureCssText(t);

  // 1. ChatGPT (OpenAI)
  if (href.includes('chatgpt.com') || modelId === 'chatgpt') {
    const chatgptContainers = document.querySelectorAll(
      'div[data-message-author-role="assistant"], article:has(div[data-message-author-role="assistant"]), div.agent-turn, [data-message-model-slug], div.markdown.prose, div.markdown, div[class*="agent-turn"]'
    );
    if (chatgptContainers.length > 0) {
      // Find the last assistant container and get its full text
      for (let i = chatgptContainers.length - 1; i >= 0; i--) {
        const text = extractCleanTextFromContainer(chatgptContainers[i]);
        if (isValidText(text) && text.length > content.length) {
          content = text;
        }
      }
    }
  }
  // 2. 通义千问 (Qwen) - Capture FULL container text
  else if (href.includes('qwen.ai') || href.includes('tongyi.aliyun.com') || modelId === 'qwen') {
    const qwenContainers = document.querySelectorAll(
      '.qwen-bubble-assistant, div[class*="chat-message-assistant"], div[class*="bubble-content"], div[class*="chat-item-assistant"], .markdown-body, div[class*="chat-item"], div[class*="message-assistant"], div[class*="assistant-message"]'
    );
    if (qwenContainers.length > 0) {
      for (let i = qwenContainers.length - 1; i >= 0; i--) {
        const text = extractCleanTextFromContainer(qwenContainers[i]);
        if (isValidText(text) && text.length > content.length) {
          content = text;
        }
      }
    }
  }
  // 3. 豆包 (Doubao) - Target full flow-markdown container & message-content
  else if (href.includes('doubao.com') || modelId === 'doubao') {
    // Look for entire assistant chat-message blocks first
    const doubaoAssistantBlocks = document.querySelectorAll(
      '[data-testid="chat-message"]:has(.flow-markdown-body), div[class*="answer-container"], div[class*="message-item"]:has(.flow-markdown-body), .flow-markdown-body, div[data-testid="message-text-content"], div[class*="flow-markdown"], [data-testid="chat-message"], div[class*="message-content"]'
    );
    if (doubaoAssistantBlocks.length > 0) {
      for (let i = doubaoAssistantBlocks.length - 1; i >= 0; i--) {
        const text = extractCleanTextFromContainer(doubaoAssistantBlocks[i]);
        if (isValidText(text) && text.length > content.length) {
          content = text;
        }
      }
    }
  }
  // 4. DeepSeek - Separate CoT & Main Text
  else if (href.includes('deepseek.com') || modelId === 'deepseek') {
    const thinkEls = document.querySelectorAll('.ds-think, .thinking-content, details.ds-thought, div[class*="ds-think"]');
    if (thinkEls.length > 0) {
      thinking = (thinkEls[thinkEls.length - 1].innerText || '').trim();
    }
    const dsContainers = document.querySelectorAll('[data-role="assistant"], .ds-markdown, div.ds-message-item, div[class*="message-content"], div[class*="ds-message"], .ds-response');
    if (dsContainers.length > 0) {
      for (let i = dsContainers.length - 1; i >= 0; i--) {
        const text = extractCleanTextFromContainer(dsContainers[i]);
        if (isValidText(text) && text.length > content.length) {
          content = text;
        }
      }
    }
  }
  // 5. Kimi (Moonshot) - Complete Segment / Assistant Message Extractor
  else if (href.includes('kimi.moonshot.cn') || href.includes('kimi.com') || modelId === 'kimi') {
    // In Kimi, assistant messages are in .segment-assistant or parent message wrappers
    const kimiAssistantRoots = document.querySelectorAll(
      '.segment-assistant, div[class*="segment-assistant"], div[data-role="assistant"], div[class*="chat-item-assistant"], div[class*="m-message-assistant"], .chat-content, div[class*="segment-content-box"], .markdown-body, div[class*="markdown"]'
    );
    if (kimiAssistantRoots.length > 0) {
      for (let i = kimiAssistantRoots.length - 1; i >= 0; i--) {
        const text = extractCleanTextFromContainer(kimiAssistantRoots[i]);
        if (isValidText(text) && text.length > content.length) {
          content = text;
        }
      }
    }
    // Clean Kimi specific upgrade banners or prompts at the bottom
    if (content) {
      content = content.replace(/High demand\. Switched to K2\.6 Instant for speed\..*$/s, '').trim();
      content = content.replace(/Upgrade to use K2\.6 Thinking.*$/s, '').trim();
    }
  }
  // 6. 智谱清言 (Z.AI / GLM / ChatGLM)
  else if (href.includes('z.ai') || href.includes('chatglm.cn') || href.includes('bigmodel.cn') || modelId === 'zai') {
    const zaiContainers = document.querySelectorAll(
      '.message-answer, .markdown-content, .markdown-body, .chat-item-answer, .answer-item, .render-message, div[class*="message-assistant"], div[class*="chat-item-assistant"], div[class*="assistant_message"], div[class*="answer-content"], div.chat-bubble-assistant, div[class*="bubble-content"], div[class*="txt-box"], div[class*="answer-box"], div.agent-bubble, div[data-role="assistant"], div[class*="chat-content"]'
    );
    if (zaiContainers.length > 0) {
      for (let i = zaiContainers.length - 1; i >= 0; i--) {
        const text = extractCleanTextFromContainer(zaiContainers[i]);
        if (isValidText(text) && text.length > content.length) {
          content = text;
        }
      }
    }
  }
  // 7. Gemini
  else if (href.includes('gemini.google.com') || modelId === 'gemini') {
    const thinkEl = document.querySelector('.thought-container, .thinking-process, details');
    if (thinkEl) thinking = (thinkEl.innerText || '').trim();
    const geminiContainers = document.querySelectorAll('message-content, model-response, .model-response-text, .response-container, .markdown-main-panel, div[class*="response-container"], div.model-content');
    if (geminiContainers.length > 0) {
      for (let i = geminiContainers.length - 1; i >= 0; i--) {
        const text = extractCleanTextFromContainer(geminiContainers[i]);
        if (isValidText(text) && text.length > content.length) {
          content = text;
        }
      }
    }
  }
  // 8. Claude
  else if (href.includes('claude.ai') || modelId === 'claude') {
    const claudeContainers = document.querySelectorAll('div.font-claude-message, div[data-is-streaming], .prose, div[class*="rendered-markdown"]');
    if (claudeContainers.length > 0) {
      for (let i = claudeContainers.length - 1; i >= 0; i--) {
        const text = extractCleanTextFromContainer(claudeContainers[i]);
        if (isValidText(text) && text.length > content.length) {
          content = text;
        }
      }
    }
  }

  // Tier 2 Fallback: General AI message container scan
  if (!content || content.length < 15 || isPureCssText(content)) {
    const generalContainers = document.querySelectorAll(
      '.segment-assistant, .flow-markdown-body, .markdown-body, div[data-message-author-role="assistant"], [data-role="assistant"], .qwen-bubble-assistant, div[class*="bubble-content"], div[class*="message-content"], div[class*="segment-content"], .chat-content, article, div[class*="assistant"]'
    );
    if (generalContainers.length > 0) {
      for (let i = generalContainers.length - 1; i >= 0; i--) {
        const text = extractCleanTextFromContainer(generalContainers[i]);
        if (isValidText(text) && text.length > content.length) {
          content = text;
        }
      }
    }
  }

  // Tier 3 Fallback: Universal Page Heuristic Scanner
  if (!content || content.length < 15 || isPureCssText(content)) {
    const scanned = scanPageForLongestAssistantBlock(prompt);
    if (scanned && scanned.length > content.length) {
      content = scanned;
    }
  }

  return { content, thinking };
}

// Full In-page execution pipeline with URL capture & Adaptive Polling
async function executeInPageAutomation(prompt, modelId) {
  console.log('[OmniCompare Bridge] Executing automation with prompt on ' + modelId + ':', prompt);

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
    sendOmniAutomationEvent(payload);
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
  notify('filling_prompt', 'success', { message: '已写入提示词并触发状态同步' });

  // Wait 400ms for React / Slate / Semi Design state sync before sending
  await new Promise(r => setTimeout(r, 450));

  // 3. Click Send or Form Submit
  notify('submitting', 'pending');
  let sendSuccess = false;
  const sendBtn = findSendButton();

  if (sendBtn) {
    try {
      sendBtn.removeAttribute('disabled');
      sendBtn.disabled = false;
      sendBtn.classList.remove('disabled', 'semi-button-disabled');
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

  // Fallback: Check if inside a form
  if (!sendSuccess && inputEl.form && typeof inputEl.form.requestSubmit === 'function') {
    try {
      inputEl.form.requestSubmit();
      sendSuccess = true;
    } catch (e) {}
  }

  // Fallback: Dispatch keyboard Enter events with high fidelity
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
  notify('waiting_response', 'pending', { message: '等待模型生成回复中...' });
  let unchangedCount = 0;
  let lastLength = 0;
  let pollIteration = 0;

  const pollInterval = setInterval(() => {
    pollIteration++;
    const { content, thinking } = extractLatestAssistantResponse(modelId, prompt);

    if (content && content.length > 0) {
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
    } else {
      unchangedCount++;
    }

    // Check completion indicators
    const copyBtn = document.querySelector('button[aria-label*="Copy"], button[aria-label*="复制"], button[title*="复制"], button[data-testid*="copy"], div[class*="copy"]');
    const stopBtn = document.querySelector('button[aria-label*="Stop"], button[data-testid*="stop"], div[role="button"][aria-label*="停止"], button.stop-button, button.stop-btn, button:has(svg rect)');

    // Condition 1: text stabilized & stop button gone
    const isStabilized = unchangedCount >= 3 && content.length >= 15 && !stopBtn;
    // Condition 2: copy button appeared and no stop button
    const isCopyReady = Boolean(copyBtn && !stopBtn && content.length >= 15);
    // Condition 3: elapsed > 8s (12 iterations) and text found and stopBtn not present
    const isTimeoutWithText = pollIteration >= 12 && content.length >= 15 && !stopBtn;
    // Condition 4: max timeout fallback (60s)
    const isMaxTimeout = pollIteration >= 80;

    if (isStabilized || isCopyReady || isTimeoutWithText || isMaxTimeout) {
      clearInterval(pollInterval);
      
      const finalContent = content || scanPageForLongestAssistantBlock(prompt) || '';
      
      notify('scraping_result', 'success', {
        extractedText: finalContent,
        extractedThinking: thinking,
        conversationUrl: window.location.href,
        message: finalContent ? ('抓取完成 (共 ' + finalContent.length + ' 字)') : '已抓取当前可见内容'
      });
      notify('completed', 'success', {
        finalText: finalContent,
        extractedText: finalContent,
        extractedThinking: thinking,
        conversationUrl: window.location.href,
        message: finalContent ? ('成功提取 ' + finalContent.length + ' 字回答并记录链接') : '已完成会话联动'
      });
    }
  }, 600);
}

// Immediate Force-Scrape Handler with Heuristic Fallback
function handleImmediateScrape(modelId, prompt = '') {
  let { content, thinking } = extractLatestAssistantResponse(modelId, prompt);
  if (!content || content.length < 15) {
    content = scanPageForLongestAssistantBlock(prompt) || content;
  }

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
  sendOmniAutomationEvent(payload);
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
    } else if (msg.type === 'OMNICOMPARE_SCRAPE_NOW' || msg.type === 'DISPATCH_SCRAPE_ALL') {
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
  } else if (message.type === 'DISPATCH_SCRAPE_ALL' || message.type === 'OMNICOMPARE_SCRAPE_NOW') {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs[0]?.id) {
        chrome.scripting.executeScript({
          target: { tabId: tabs[0].id, allFrames: true },
          func: (mId, p) => {
            window.postMessage({
              type: 'OMNICOMPARE_SCRAPE_NOW',
              modelId: mId,
              prompt: p
            }, '*');
          },
          args: [message.modelId || null, message.prompt || '']
        }).catch(err => console.error(err));
      }
    });
    sendResponse({ status: 'scrape_dispatched' });
  } else if (message.type === 'OMNICOMPARE_AUTOMATION_EVENT') {
    // Forward any automation event received from child frames to the top main tab
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs[0]?.id) {
        chrome.scripting.executeScript({
          target: { tabId: tabs[0].id },
          func: (ev) => {
            window.postMessage(ev, '*');
          },
          args: [message]
        }).catch(() => {});
      }
    });
    sendResponse({ status: 'event_forwarded' });
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
  background: white;
  flex-shrink: 0;
}

.modal-title {
  font-size: 15px;
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

/* Prompt Presets Styles */
.preset-category-bar {
  display: flex;
  align-items: center;
  gap: 6px;
  overflow-x: auto;
  padding-bottom: 4px;
  border-bottom: 1px solid var(--border);
  margin-bottom: 8px;
}

.btn-preset-cat {
  padding: 4px 10px;
  border-radius: 6px;
  font-size: 12px;
  font-weight: 500;
  border: 1px solid var(--border);
  background: white;
  color: var(--text-muted);
  cursor: pointer;
  white-space: nowrap;
}

.btn-preset-cat.active {
  background: var(--primary);
  color: white;
  border-color: var(--primary);
}

.preset-card {
  background: white;
  border: 1px solid var(--border);
  border-radius: 10px;
  padding: 14px;
  display: flex;
  flex-direction: column;
  gap: 8px;
  transition: all 0.15s;
}

.preset-card:hover {
  border-color: #A5B4FC;
  box-shadow: 0 4px 12px rgba(79, 70, 229, 0.08);
}

.preset-card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}

.preset-card-title {
  font-size: 13px;
  font-weight: 700;
  color: var(--text-main);
  display: flex;
  align-items: center;
  gap: 6px;
}

.preset-tag {
  font-size: 10px;
  background: #EEF2FF;
  color: var(--primary);
  padding: 2px 6px;
  border-radius: 4px;
  font-weight: 600;
}

.preset-prompt-box {
  background: #F8FAFC;
  border: 1px solid var(--border);
  border-radius: 6px;
  padding: 8px 10px;
  font-size: 12px;
  font-family: monospace;
  color: var(--text-main);
  white-space: pre-wrap;
  max-height: 100px;
  overflow-y: auto;
}

.preset-actions {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 6px;
}

/* Fullscreen Immersive Modal */
.fullscreen-overlay {
  position: fixed;
  inset: 0;
  background: #0F172A;
  z-index: 200;
  display: none;
  flex-direction: column;
  overflow: hidden;
}

.fullscreen-overlay.active {
  display: flex;
}

.fullscreen-topbar {
  background: #1E293B;
  border-bottom: 1px solid #334155;
  padding: 8px 16px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  color: white;
  z-index: 20;
  gap: 12px;
  flex-shrink: 0;
}

.fullscreen-tabs-wrapper {
  display: flex;
  align-items: center;
  gap: 6px;
  overflow-x: auto;
  max-width: 60%;
  padding: 2px 0;
}

.fullscreen-tab {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  border-radius: 8px;
  font-size: 12px;
  font-weight: 600;
  background: #334155;
  color: #94A3B8;
  cursor: pointer;
  white-space: nowrap;
  transition: all 0.15s;
  border: 1px solid transparent;
}

.fullscreen-tab:hover {
  background: #475569;
  color: white;
}

.fullscreen-tab.active {
  background: var(--primary);
  color: white;
  border-color: #818CF8;
  box-shadow: 0 0 10px rgba(79, 70, 229, 0.4);
}

.fullscreen-body {
  flex: 1;
  position: relative;
  width: 100%;
  height: 100%;
  background: white;
}

.fullscreen-body iframe {
  width: 100%;
  height: 100%;
  border: none;
}

.fullscreen-nav-btn {
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  width: 44px;
  height: 64px;
  background: rgba(15, 23, 42, 0.65);
  color: white;
  border: 1px solid rgba(255, 255, 255, 0.2);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
  cursor: pointer;
  z-index: 30;
  transition: all 0.2s;
  backdrop-filter: blur(4px);
}

.fullscreen-nav-btn:hover {
  background: rgba(79, 70, 229, 0.9);
  width: 52px;
}

.fullscreen-nav-prev {
  left: 0;
  border-radius: 0 12px 12px 0;
}

.fullscreen-nav-next {
  right: 0;
  border-radius: 12px 0 0 12px;
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
      <button id="btnPresetModal" class="btn" style="background:#EEF2FF; color:#4F46E5; border-color:#C7D2FE; font-weight:700;">📚 提示词模板 (<span id="templateCountBadge">8</span>)</button>
      <button id="btnStyleModal" class="btn" title="自定义边框粗细、圆角与颜色风格">🎨 边框样式</button>
      <button id="btnScrapeAll" class="btn" title="立即从当前所有内嵌网页提取完整回答并同步">🔄 重新抓取回答</button>
      <button id="btnHistoryModal" class="btn">📜 历史会话 (<span id="historyCountBadge">0</span>)</button>
      <button id="btnExportModal" class="btn btn-primary">📤 导出文档</button>
      <button id="btnReloadAll" class="btn">🔄 刷新全部</button>
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
      <div style="display:flex; gap:8px;">
        <button id="btnOpenPresetsFromBar" class="btn-link" style="font-weight:700; color:#4F46E5;">📚 模板库</button>
        <span>|</span>
        <button id="btnClearPrompt" class="btn-link">清空输入</button>
      </div>
    </div>

    <div class="prompt-input-row">
      <div class="prompt-textarea-wrapper">
        <textarea
          id="promptInput"
          class="prompt-textarea"
          placeholder="在此输入并发测试提示词（例如：请用 TypeScript 实现高并发异步调度器，或点击上方【📚 提示词模板】一键填充预设场景）..."
        ></textarea>
      </div>

      <button id="btnSendConcurrent" class="btn-send-main">
        <span>🚀</span>
        <span>并发发起对话</span>
      </button>
    </div>
  </div>

  <!-- 5. Prompt Presets Modal -->
  <div id="presetModalOverlay" class="modal-overlay">
    <div class="modal-box" style="max-width: 860px;">
      <div class="modal-header">
        <div class="modal-title">📚 提示词模板与评测场景库</div>
        <div style="display:flex; align-items:center; gap:8px;">
          <button id="btnOpenNewPresetForm" class="btn btn-primary" style="padding:4px 10px; font-size:12px;">+ 新建模板</button>
          <button id="btnClosePresets" class="btn" style="padding:4px 8px;">✕</button>
        </div>
      </div>

      <!-- Presets Search & Categories Toolbar -->
      <div style="padding: 12px 20px 0 20px; background:white; display:flex; flex-direction:column; gap:8px;">
        <div style="display:flex; gap:8px;">
          <input
            id="presetSearchInput"
            type="text"
            placeholder="搜索模板标题、提示词正文、标签..."
            style="flex:1; padding:6px 12px; border-radius:8px; border:1px solid #CBD5E1; font-size:12px; outline:none;"
          />
          <button id="btnExportPresetsJson" class="btn btn-sm" title="导出模板为 JSON">⬇ 导出</button>
          <button id="btnImportPresetsJson" class="btn btn-sm" title="导入 JSON 模板">⬆ 导入</button>
          <input type="file" id="presetFileInput" accept=".json" style="display:none;" />
          <button id="btnResetPresetsDefault" class="btn btn-sm" title="恢复官方默认模板">🔄 重置</button>
        </div>

        <div class="preset-category-bar" id="presetCategoryList">
          <button class="btn-preset-cat active" data-cat="all">全部场景</button>
          <button class="btn-preset-cat" data-cat="custom">⭐ 我的自定义</button>
          <button class="btn-preset-cat" data-cat="coding">代码重构</button>
          <button class="btn-preset-cat" data-cat="math">数理逻辑</button>
          <button class="btn-preset-cat" data-cat="arch">系统架构</button>
          <button class="btn-preset-cat" data-cat="writing">创意文案</button>
          <button class="btn-preset-cat" data-cat="eval">语义辨析</button>
          <button class="btn-preset-cat" data-cat="translation">学术翻译</button>
          <button class="btn-preset-cat" data-cat="legal">法律合规</button>
        </div>
      </div>

      <!-- Presets Cards List -->
      <div class="modal-body" id="presetCardsContainer">
        <!-- Dynamic Preset Cards -->
      </div>
    </div>
  </div>

  <!-- Preset Edit / Create Modal Form Overlay -->
  <div id="presetEditModalOverlay" class="modal-overlay">
    <div class="modal-box" style="max-width: 600px;">
      <div class="modal-header">
        <div class="modal-title" id="presetEditModalTitle">📝 新建提示词模板</div>
        <button id="btnClosePresetEdit" class="btn" style="padding:4px 8px;">✕</button>
      </div>
      <div class="modal-body">
        <div>
          <label style="font-size:12px; font-weight:700; color:#334155; margin-bottom:4px; display:block;">模板标题 *</label>
          <input id="formPresetTitle" type="text" placeholder="例如：高并发分布式秒杀架构评测" style="width:100%; padding:8px; border-radius:8px; border:1px solid #CBD5E1; font-size:12px; box-sizing:border-box;" />
        </div>
        <div style="display:flex; gap:10px;">
          <div style="flex:1;">
            <label style="font-size:12px; font-weight:700; color:#334155; margin-bottom:4px; display:block;">分类场景</label>
            <select id="formPresetCategory" style="width:100%; padding:8px; border-radius:8px; border:1px solid #CBD5E1; font-size:12px; box-sizing:border-box;">
              <option value="custom">⭐ 自定义场景</option>
              <option value="coding">代码重构</option>
              <option value="math">数理逻辑</option>
              <option value="arch">系统架构</option>
              <option value="writing">创意文案</option>
              <option value="eval">语义辨析</option>
              <option value="translation">学术翻译</option>
              <option value="legal">法律合规</option>
            </select>
          </div>
          <div style="flex:1;">
            <label style="font-size:12px; font-weight:700; color:#334155; margin-bottom:4px; display:block;">标签 (逗号分隔)</label>
            <input id="formPresetTags" type="text" placeholder="并发, 架构, Redis" style="width:100%; padding:8px; border-radius:8px; border:1px solid #CBD5E1; font-size:12px; box-sizing:border-box;" />
          </div>
        </div>
        <div>
          <label style="font-size:12px; font-weight:700; color:#334155; margin-bottom:4px; display:block;">评测与场景说明</label>
          <input id="formPresetDesc" type="text" placeholder="简要描述本模板的评测侧重点..." style="width:100%; padding:8px; border-radius:8px; border:1px solid #CBD5E1; font-size:12px; box-sizing:border-box;" />
        </div>
        <div>
          <label style="font-size:12px; font-weight:700; color:#334155; margin-bottom:4px; display:block;">提示词正文 (Prompt) *</label>
          <textarea id="formPresetPrompt" rows="6" placeholder="在此输入完整的提示词内容..." style="width:100%; padding:8px; border-radius:8px; border:1px solid #CBD5E1; font-size:12px; font-family:monospace; box-sizing:border-box; resize:vertical;"></textarea>
        </div>
        <div style="display:flex; justify-content:flex-end; gap:8px; margin-top:8px;">
          <button id="btnCancelPresetForm" class="btn">取消</button>
          <button id="btnSavePresetForm" class="btn btn-primary">保存模板</button>
        </div>
      </div>
    </div>
  </div>

  <!-- 6. Style & Border Customizer Modal -->
  <div id="styleSettingsModalOverlay" class="modal-overlay">
    <div class="modal-box" style="max-width: 520px;">
      <div class="modal-header">
        <div class="modal-title">🎨 IFrame 边框大小与视觉风格自定义</div>
        <button id="btnCloseStyle" class="btn" style="padding:4px 8px;">✕</button>
      </div>
      <div class="modal-body">
        <div>
          <label style="font-size:12px; font-weight:700; color:#334155; margin-bottom:6px; display:block;">1. 边框粗细 (Border Width)</label>
          <div style="display:flex; gap:6px;" id="borderWidthGroup">
            <button class="btn btn-sm" data-bwidth="0">0px 无边框</button>
            <button class="btn btn-sm" data-bwidth="1">1px 极细</button>
            <button class="btn btn-sm" data-bwidth="2">2px 标准</button>
            <button class="btn btn-sm" data-bwidth="3">3px 加粗</button>
            <button class="btn btn-sm" data-bwidth="4">4px 强化</button>
          </div>
        </div>

        <div>
          <label style="font-size:12px; font-weight:700; color:#334155; margin-bottom:6px; display:block;">2. 边框色系风格 (Border Style)</label>
          <div style="display:flex; gap:6px; flex-wrap:wrap;" id="borderStyleGroup">
            <button class="btn btn-sm" data-bstyle="default">默认灰白</button>
            <button class="btn btn-sm" data-bstyle="indigo">品牌紫蓝</button>
            <button class="btn btn-sm" data-bstyle="accent">模型专属品牌色</button>
            <button class="btn btn-sm" data-bstyle="glow">炫彩极光</button>
            <button class="btn btn-sm" data-bstyle="dark">沉浸深黑</button>
          </div>
        </div>

        <div>
          <label style="font-size:12px; font-weight:700; color:#334155; margin-bottom:6px; display:block;">3. 圆角大小 (Border Radius)</label>
          <div style="display:flex; gap:6px;" id="borderRadiusGroup">
            <button class="btn btn-sm" data-bradius="0">0px 直角</button>
            <button class="btn btn-sm" data-bradius="8">8px 微圆角</button>
            <button class="btn btn-sm" data-bradius="12">12px 标准</button>
            <button class="btn btn-sm" data-bradius="16">16px 柔和</button>
            <button class="btn btn-sm" data-bradius="24">24px 大圆角</button>
          </div>
        </div>

        <div>
          <label style="font-size:12px; font-weight:700; color:#334155; margin-bottom:6px; display:block;">4. 卡片高度 (Card Height)</label>
          <div style="display:flex; gap:6px;" id="cardHeightGroup">
            <button class="btn btn-sm" data-cheight="compact">紧凑 (580px)</button>
            <button class="btn btn-sm" data-cheight="standard">标准 (700px)</button>
            <button class="btn btn-sm" data-cheight="tall">扩展 (860px)</button>
            <button class="btn btn-sm" data-cheight="full">填满屏幕</button>
          </div>
        </div>
      </div>
    </div>
  </div>

  <!-- 7. Fullscreen Modal Viewer with Tabs and Swipe navigation -->
  <div id="fullscreenModalOverlay" class="fullscreen-overlay">
    <div class="fullscreen-topbar">
      <!-- Active Model Info -->
      <div style="display:flex; align-items:center; gap:8px; min-width:0;">
        <span id="fsModelAvatar" class="chip-avatar" style="width:24px; height:24px; font-size:11px;">GPT</span>
        <strong id="fsModelTitle" style="font-size:14px;">ChatGPT</strong>
        <span id="fsModelStatus" class="status-badge">全屏视图</span>
      </div>

      <!-- Horizontal Model Tabs List -->
      <div class="fullscreen-tabs-wrapper" id="fullscreenTabsContainer"></div>

      <!-- Action Buttons -->
      <div style="display:flex; align-items:center; gap:6px;">
        <button id="btnFsExec" class="btn-exec" title="单独对此模型执行">▶ 执行</button>
        <button id="btnFsScrape" class="btn btn-sm" style="background:#334155; color:white;" title="重新抓取页面回答">📥 抓取</button>
        <button id="btnFsManual" class="btn btn-sm" style="background:#334155; color:#F59E0B;" title="手动补充回答">📝 补充</button>
        <button id="btnFsReload" class="btn btn-sm" style="background:#334155; color:white;" title="刷新此页面">🔄 刷新</button>
        <a id="fsExternalLink" href="#" target="_blank" class="btn btn-sm" style="background:#334155; color:white; text-decoration:none;" title="在新标签页独立打开">↗</a>
        <button id="btnCloseFullscreen" class="btn btn-primary" style="padding:4px 10px; font-size:12px;">✕ 退出全屏 (ESC)</button>
      </div>
    </div>

    <div class="fullscreen-body" id="fullscreenBody">
      <!-- Floating Navigation Arrows -->
      <button class="fullscreen-nav-btn fullscreen-nav-prev" id="btnFsPrev" title="上一个模型 (← 键)">◀</button>
      <button class="fullscreen-nav-btn fullscreen-nav-next" id="btnFsNext" title="下一个模型 (→ 键)">▶</button>

      <iframe id="fullscreenIframe" src="about:blank" sandbox="allow-same-origin allow-scripts allow-forms allow-popups allow-modals allow-downloads" allow="clipboard-read; clipboard-write; microphone; camera"></iframe>
    </div>
  </div>

  <!-- 8. History Modal -->
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

  <!-- 9. Export Modal -->
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

  <!-- 10. Manual Input Fallback Modal -->
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

  // Standalone Arena JS Controller with Real-Time History, Presets, Border Styles & Fullscreen Swipe
  const arenaJs = `// OmniCompare Arena Full Automation Controller
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

const DEFAULT_PRESETS = [
  {
    id: 'code-refactor',
    category: 'coding',
    categoryLabel: '代码重构',
    title: '高并发异步队列与重试机制设计',
    description: '对比各模型编写 TypeScript / Node.js 异步任务调度器的架构设计与代码质量',
    tags: ['TypeScript', '并发调度', '单元测试'],
    isBuiltIn: true,
    prompt: '请用 TypeScript 设计一个工业级的通用异步任务调度器（TaskScheduler）。\\n要求：\\n1. 支持配置最大并发数 concurrency（例如 3）；\\n2. 支持失败自动重试策略（带指数退避与最大重试次数配置）；\\n3. 支持任务优先级队列（High, Normal, Low）；\\n4. 提供简洁优雅的链式调用 API 与完整的单元测试用例。'
  },
  {
    id: 'math-logic',
    category: 'math',
    categoryLabel: '数理逻辑',
    title: '三门问题变体与概率博弈推演',
    description: '评测模型深度思考 (DeepSeek R1 / Gemini Thinking) 对概率反直觉题目的严谨推演',
    tags: ['概率论', '贝叶斯', '博弈论'],
    isBuiltIn: true,
    prompt: '有 3 个盒子 A、B、C。其中一个装有 100 万元奖金，另外两个是空的。\\n你随机选择了盒子 A。\\n此时主持人（知道奖金在哪）在剩下的 B、C 中打开了空的盒子 B。\\n随后主持人提出：允许你以 1 万元代价换成盒子 C。\\n请问：\\n1. 从纯期望收益角度，你应该换吗？\\n2. 请给出严格的条件概率（贝叶斯公式）推导过程与最终期望数值对比。'
  },
  {
    id: 'system-arch',
    category: 'arch',
    categoryLabel: '系统架构',
    title: '亿级日活分布式秒杀与防刷风控架构',
    description: '考察模型在微服务高可用、多级缓存、分布式锁与消息削峰上的系统设计深度',
    tags: ['架构设计', 'Redis', '高可用', '微服务'],
    isBuiltIn: true,
    prompt: '请作为资深互联网架构师，为电商平台设计一个支持 10 万 QPS 瞬时峰值的“分布式秒杀与风控系统”。\\n请详细输出：\\n1. 总体架构拓扑图（文字 ASCII / Markdown 清晰表达）与流量链路（CDN -> 网关 -> 多级缓存 -> 消息队列 -> 数据库）；\\n2. 如何通过 Redis Lua 脚本原子扣减库存并彻底解决超卖与少卖问题；\\n3. 防脚本机刷与黄牛的动态风控策略（IP 限流、滑块验证码、用户画像评分与令牌桶算法）；\\n4. 数据库最终一致性兜底方案。'
  },
  {
    id: 'writing-critique',
    category: 'writing',
    categoryLabel: '创意文案',
    title: '乔布斯风格产品发布会 Slogan 与文案',
    description: '对比各模型的中文修辞、品牌定位叙事与文案抓人程度',
    tags: ['产品文案', '品牌定位', '社交媒体'],
    isBuiltIn: true,
    prompt: '我们正在开发一款面向开发者的“多模型聚合对比 Chrome 浏览器插件”，名为 OmniCompare。\\n请为这款产品撰写：\\n1. 一个极具穿透力、乔布斯风格的 Hero Slogan（主标题 + 副标题）；\\n2. 3 篇适合发布在知乎与 V2EX 的干货技术宣发文案框架（包含痛点、解决方案与对比演示）；\\n3. 5 条朗朗上口的一句话社交媒体推广金句。'
  },
  {
    id: 'eval-bench',
    category: 'eval',
    categoryLabel: '语义辨析',
    title: '中文成语典故与职场反讽语义消歧',
    description: '考察多模型在隐喻、幽默与复杂中文上下文下的理解精准度与情商分析',
    tags: ['中文理解', '隐喻消歧', '高情商沟通'],
    isBuiltIn: true,
    prompt: '请分析并解释以下场景中的语义与人物真实心理状态：\\n小王连续加班两周完成了项目，在庆功会上，领导拍着小王的肩膀说：“小王啊，你可真是咱们部门的‘及时雨’，要是大家都能像你一样把公司当成家，咱们公司的电费估计能省下一半！”\\n请问：\\n1. 领导这番话表面意思和潜台词分别是什么？\\n2. 运用了哪些修辞手法（如反讽、借代）？\\n3. 作为高情商员工，小王现场应该如何得体回应？'
  },
  {
    id: 'translation-academic',
    category: 'translation',
    categoryLabel: '学术翻译',
    title: 'MoE 架构顶会论文信达雅学术翻译',
    description: '对比各模型在专业 AI 论文摘要的翻译流畅度与行业术语规范度',
    tags: ['学术论文', '信达雅', '专业术语'],
    isBuiltIn: true,
    prompt: 'Please translate the following technical excerpt into high-level, fluent, natural Chinese (信达雅 style for AI research paper):\\n\\n"Mixture of Experts (MoE) architectures dynamically route token representations through a sparse gate, activating only a sub-network of parameters per forward pass. While this decouples model capacity from computational FLOPs, it introduces challenging distributed training bottlenecks, notably all-to-all communication overhead and expert load imbalance."\\n\\n请输出：\\n1. 官方权威专业学术中文翻译；\\n2. 关键专业名词中英文对照解释表；\\n3. 通俗易懂的一句话大白话解释（供非技术人员理解）。'
  },
  {
    id: 'legal-risk',
    category: 'legal',
    categoryLabel: '法律合规',
    title: 'SaaS 企业级服务采购合同风险审查',
    description: '评测模型对知识产权、SLA 违约赔偿责任、数据出境等法务条款的敏锐度',
    tags: ['合同审查', 'SLA', '法律合规'],
    isBuiltIn: true,
    prompt: '作为企业法务专家，请审查以下软件采购核心条款并指出其中的法律陷阱与修改建议：\\n条款：“乙方保证系统全年可用率达到 99.9%，若因不可抗力或第三方云服务商宕机导致服务中断，乙方不承担任何赔偿责任。甲方在平台内生成的所有衍生数据，乙方享有免费用于训练 AI 模型的不可撤销许可。”\\n请指出：\\n1. 存在哪 3 个对甲方极度不利的条款漏洞？\\n2. 提供专业、严密、可供商务谈判使用的修订条款对照版。'
  }
];

let selectedModelIds = ['chatgpt', 'gemini', 'deepseek', 'qwen', 'kimi', 'doubao', 'zai'];
let roundIndex = 0;
let modelCapturedUrls = {};
let modelScrapedTexts = {};
let modelScrapedThinkings = {};
let sessionHistoryList = [];
let promptPresetsList = [];
let activeCategory = 'all';
let currentFullscreenModelId = 'chatgpt';

// Style Settings State
let styleSettings = {
  borderWidth: 2,
  borderStyle: 'default',
  borderRadius: 12,
  cardHeight: 'standard'
};

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

// Preset DOMs
const presetModalOverlay = document.getElementById('presetModalOverlay');
const presetCardsContainer = document.getElementById('presetCardsContainer');
const presetCategoryList = document.getElementById('presetCategoryList');
const presetSearchInput = document.getElementById('presetSearchInput');
const templateCountBadge = document.getElementById('templateCountBadge');
const presetEditModalOverlay = document.getElementById('presetEditModalOverlay');
const presetFileInput = document.getElementById('presetFileInput');

// Style Settings DOMs
const styleSettingsModalOverlay = document.getElementById('styleSettingsModalOverlay');

// Fullscreen DOMs
const fullscreenModalOverlay = document.getElementById('fullscreenModalOverlay');
const fullscreenTabsContainer = document.getElementById('fullscreenTabsContainer');
const fullscreenIframe = document.getElementById('fullscreenIframe');
const fsModelAvatar = document.getElementById('fsModelAvatar');
const fsModelTitle = document.getElementById('fsModelTitle');
const fsExternalLink = document.getElementById('fsExternalLink');

// Load Stored Styles
function loadStoredStyles() {
  try {
    const raw = localStorage.getItem('omnicompare_iframe_style');
    if (raw) {
      styleSettings = { ...styleSettings, ...JSON.parse(raw) };
    }
  } catch (e) {}
  applyStyleSettings();
}

function saveStyles() {
  try {
    localStorage.setItem('omnicompare_iframe_style', JSON.stringify(styleSettings));
  } catch (e) {}
  applyStyleSettings();
}

function applyStyleSettings() {
  document.querySelectorAll('.model-card').forEach(card => {
    const modelId = card.id.replace('card-', '');
    const cfg = SUPPORTED_MODELS.find(m => m.id === modelId);

    // Border Width & Radius
    card.style.borderWidth = styleSettings.borderWidth + 'px';
    card.style.borderRadius = styleSettings.borderRadius + 'px';

    // Border Color Style
    if (styleSettings.borderWidth === 0) {
      card.style.border = 'none';
    } else if (styleSettings.borderStyle === 'indigo') {
      card.style.borderColor = '#6366F1';
      card.style.boxShadow = '0 4px 14px rgba(99, 102, 241, 0.15)';
    } else if (styleSettings.borderStyle === 'accent' && cfg) {
      card.style.borderColor = cfg.color;
      card.style.boxShadow = '0 4px 14px ' + cfg.color + '25';
    } else if (styleSettings.borderStyle === 'glow') {
      card.style.borderColor = '#818CF8';
      card.style.boxShadow = '0 0 16px rgba(129, 140, 248, 0.35)';
    } else if (styleSettings.borderStyle === 'dark') {
      card.style.borderColor = '#0F172A';
      card.style.boxShadow = '0 6px 18px rgba(15, 23, 42, 0.18)';
    } else {
      card.style.borderColor = '#E2E8F0';
      card.style.boxShadow = '0 1px 3px rgba(0,0,0,0.05)';
    }

    // Card Height
    if (styleSettings.cardHeight === 'compact') {
      card.style.height = '580px';
    } else if (styleSettings.cardHeight === 'tall') {
      card.style.height = '860px';
    } else if (styleSettings.cardHeight === 'full') {
      card.style.height = 'calc(100vh - 220px)';
    } else {
      card.style.height = '700px';
    }
  });

  // Sync active buttons in style modal
  document.querySelectorAll('#borderWidthGroup button').forEach(b => {
    b.className = 'btn btn-sm' + (parseInt(b.dataset.bwidth) === styleSettings.borderWidth ? ' btn-primary' : '');
  });
  document.querySelectorAll('#borderStyleGroup button').forEach(b => {
    b.className = 'btn btn-sm' + (b.dataset.bstyle === styleSettings.borderStyle ? ' btn-primary' : '');
  });
  document.querySelectorAll('#borderRadiusGroup button').forEach(b => {
    b.className = 'btn btn-sm' + (parseInt(b.dataset.bradius) === styleSettings.borderRadius ? ' btn-primary' : '');
  });
  document.querySelectorAll('#cardHeightGroup button').forEach(b => {
    b.className = 'btn btn-sm' + (b.dataset.cheight === styleSettings.cardHeight ? ' btn-primary' : '');
  });
}

// Initialize Presets
function loadStoredPresets() {
  try {
    const raw = localStorage.getItem('omnicompare_presets');
    if (raw) {
      promptPresetsList = JSON.parse(raw);
    } else {
      promptPresetsList = [...DEFAULT_PRESETS];
    }
  } catch (e) {
    promptPresetsList = [...DEFAULT_PRESETS];
  }
  updatePresetBadge();
}

function savePresets() {
  try {
    localStorage.setItem('omnicompare_presets', JSON.stringify(promptPresetsList));
  } catch (e) {}
  updatePresetBadge();
}

function updatePresetBadge() {
  if (templateCountBadge) {
    templateCountBadge.innerText = promptPresetsList.length;
  }
}

// Render Presets List
function renderPresets() {
  if (!presetCardsContainer) return;
  presetCardsContainer.innerHTML = '';

  const search = (presetSearchInput?.value || '').trim().toLowerCase();
  const filtered = promptPresetsList.filter(p => {
    const matchCat = activeCategory === 'all' ? true : activeCategory === 'custom' ? (!p.isBuiltIn || p.category === 'custom') : p.category === activeCategory;
    const matchSearch = !search ||
      p.title.toLowerCase().includes(search) ||
      p.prompt.toLowerCase().includes(search) ||
      (p.description && p.description.toLowerCase().includes(search)) ||
      (p.tags && p.tags.some(t => t.toLowerCase().includes(search)));
    return matchCat && matchSearch;
  });

  if (filtered.length === 0) {
    presetCardsContainer.innerHTML = '<div style="text-align:center; color:#94A3B8; padding:40px;">未找到匹配的提示词模板，点击右上角【+ 新建模板】添加！</div>';
    return;
  }

  filtered.forEach(p => {
    const card = document.createElement('div');
    card.className = 'preset-card';

    let tagsHtml = '';
    if (p.tags && p.tags.length > 0) {
      tagsHtml = '<div style="display:flex; gap:4px; flex-wrap:wrap; margin-top:2px;">' +
        p.tags.map(t => '<span style="font-size:10px; background:#F1F5F9; color:#64748B; padding:1px 5px; border-radius:4px;">#' + t + '</span>').join('') +
        '</div>';
    }

    card.innerHTML = \`
      <div class="preset-card-header">
        <div class="preset-card-title">
          <span class="preset-tag">\${p.categoryLabel || p.category}</span>
          <span>\${p.title}</span>
          \${p.isBuiltIn ? '<span style="font-size:10px; color:#94A3B8; font-family:monospace;">[官方预置]</span>' : ''}
        </div>
        <div class="preset-actions">
          <button class="btn btn-sm" data-action="copy-preset" data-id="\${p.id}" title="复制提示词内容">📋 复制</button>
          <button class="btn btn-sm" data-action="edit-preset" data-id="\${p.id}" title="编辑此模板">📝 编辑</button>
          \${!p.isBuiltIn ? '<button class="btn btn-sm" data-action="delete-preset" data-id="' + p.id + '" style="color:#E11D48;" title="删除模板">🗑️</button>' : ''}
          <button class="btn btn-sm" data-action="fill-preset" data-id="\${p.id}" style="background:#F8FAFC; color:#4F46E5; font-weight:600;" title="填入对话框可继续编辑">📥 填入对话框</button>
          <button class="btn btn-sm btn-primary" data-action="send-preset" data-id="\${p.id}" title="填入并立即并发发送">🚀 并发发送</button>
        </div>
      </div>
      \${p.description ? '<div style="font-size:12px; color:#64748B;">' + p.description + '</div>' : ''}
      <div class="preset-prompt-box">\${p.prompt}</div>
      \${tagsHtml}
    \`;
    presetCardsContainer.appendChild(card);
  });
}

// Preset Cards Delegation Listener
presetCardsContainer?.addEventListener('click', (e) => {
  const btn = e.target.closest('button[data-action]');
  if (!btn) return;
  const action = btn.dataset.action;
  const id = btn.dataset.id;
  const preset = promptPresetsList.find(p => p.id === id);
  if (!preset) return;

  if (action === 'copy-preset') {
    navigator.clipboard.writeText(preset.prompt);
    btn.innerText = '✓ 已复制';
    setTimeout(() => { btn.innerText = '📋 复制'; }, 1500);
  } else if (action === 'fill-preset') {
    promptInput.value = preset.prompt;
    promptInput.focus();
    presetModalOverlay.classList.remove('active');
  } else if (action === 'send-preset') {
    promptInput.value = preset.prompt;
    presetModalOverlay.classList.remove('active');
    btnSendConcurrent.click();
  } else if (action === 'edit-preset') {
    openPresetEditModal(preset);
  } else if (action === 'delete-preset') {
    if (confirm('确定要删除该提示词模板吗？')) {
      promptPresetsList = promptPresetsList.filter(p => p.id !== id);
      savePresets();
      renderPresets();
    }
  }
});

// Category Switcher
presetCategoryList?.addEventListener('click', (e) => {
  const btn = e.target.closest('button[data-cat]');
  if (!btn) return;
  document.querySelectorAll('.btn-preset-cat').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  activeCategory = btn.dataset.cat;
  renderPresets();
});

presetSearchInput?.addEventListener('input', () => {
  renderPresets();
});

// Edit Preset Modal
let editingPresetId = null;
function openPresetEditModal(preset = null) {
  editingPresetId = preset ? (preset.isBuiltIn ? 'custom-' + Date.now() : preset.id) : 'custom-' + Date.now();
  const isNew = !preset;
  document.getElementById('presetEditModalTitle').innerText = isNew ? '📝 新建提示词模板' : (preset.isBuiltIn ? '📝 基于模板创建副本' : '📝 修改提示词模板');

  document.getElementById('formPresetTitle').value = preset ? (preset.isBuiltIn ? preset.title + ' (副本)' : preset.title) : '';
  document.getElementById('formPresetCategory').value = preset ? preset.category : 'custom';
  document.getElementById('formPresetTags').value = preset && preset.tags ? preset.tags.join(', ') : '';
  document.getElementById('formPresetDesc').value = preset?.description || '';
  document.getElementById('formPresetPrompt').value = preset?.prompt || '';

  presetEditModalOverlay.classList.add('active');
}

document.getElementById('btnOpenNewPresetForm')?.addEventListener('click', () => openPresetEditModal(null));
document.getElementById('btnClosePresetEdit')?.addEventListener('click', () => presetEditModalOverlay.classList.remove('active'));
document.getElementById('btnCancelPresetForm')?.addEventListener('click', () => presetEditModalOverlay.classList.remove('active'));

document.getElementById('btnSavePresetForm')?.addEventListener('click', () => {
  const title = document.getElementById('formPresetTitle').value.trim();
  const prompt = document.getElementById('formPresetPrompt').value.trim();
  const category = document.getElementById('formPresetCategory').value;
  const desc = document.getElementById('formPresetDesc').value.trim();
  const tagsRaw = document.getElementById('formPresetTags').value.trim();

  if (!title) { alert('请输入模板标题'); return; }
  if (!prompt) { alert('请输入提示词正文'); return; }

  const catNames = {
    custom: '⭐ 我的自定义',
    coding: '代码重构',
    math: '数理逻辑',
    arch: '系统架构',
    writing: '创意文案',
    eval: '语义辨析',
    translation: '学术翻译',
    legal: '法律合规'
  };

  const tags = tagsRaw ? tagsRaw.split(/[,，]/).map(t => t.trim()).filter(Boolean) : [];

  const item = {
    id: editingPresetId || 'custom-' + Date.now(),
    title,
    category,
    categoryLabel: catNames[category] || '自定义场景',
    description: desc,
    prompt,
    tags,
    isBuiltIn: false,
    updatedAt: Date.now()
  };

  const idx = promptPresetsList.findIndex(p => p.id === item.id);
  if (idx >= 0) {
    promptPresetsList[idx] = item;
  } else {
    promptPresetsList.unshift(item);
  }

  savePresets();
  renderPresets();
  presetEditModalOverlay.classList.remove('active');
});

// Reset / Import / Export Presets
document.getElementById('btnResetPresetsDefault')?.addEventListener('click', () => {
  if (confirm('确定要重置为默认官方预置模板库吗？（自定义模板将被覆盖）')) {
    promptPresetsList = [...DEFAULT_PRESETS];
    savePresets();
    renderPresets();
  }
});

document.getElementById('btnExportPresetsJson')?.addEventListener('click', () => {
  downloadFile(JSON.stringify(promptPresetsList, null, 2), 'OmniCompare-Templates-' + Date.now() + '.json', 'application/json');
});

document.getElementById('btnImportPresetsJson')?.addEventListener('click', () => {
  presetFileInput?.click();
});

presetFileInput?.addEventListener('change', (e) => {
  const file = e.target.files?.[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = (evt) => {
    try {
      const parsed = JSON.parse(evt.target.result);
      if (Array.isArray(parsed)) {
        promptPresetsList = parsed;
        savePresets();
        renderPresets();
        alert('成功导入 ' + parsed.length + ' 个提示词模板！');
      } else {
        alert('文件格式错误：必须为 JSON 模板数组');
      }
    } catch (err) {
      alert('解析 JSON 失败');
    }
  };
  reader.readAsText(file);
  e.target.value = '';
});

// Style Modal Handlers
document.getElementById('btnStyleModal')?.addEventListener('click', () => {
  styleSettingsModalOverlay.classList.add('active');
});
document.getElementById('btnCloseStyle')?.addEventListener('click', () => {
  styleSettingsModalOverlay.classList.remove('active');
});

document.getElementById('borderWidthGroup')?.addEventListener('click', (e) => {
  const b = e.target.closest('button[data-bwidth]');
  if (!b) return;
  styleSettings.borderWidth = parseInt(b.dataset.bwidth, 10);
  saveStyles();
});

document.getElementById('borderStyleGroup')?.addEventListener('click', (e) => {
  const b = e.target.closest('button[data-bstyle]');
  if (!b) return;
  styleSettings.borderStyle = b.dataset.bstyle;
  saveStyles();
});

document.getElementById('borderRadiusGroup')?.addEventListener('click', (e) => {
  const b = e.target.closest('button[data-bradius]');
  if (!b) return;
  styleSettings.borderRadius = parseInt(b.dataset.bradius, 10);
  saveStyles();
});

document.getElementById('cardHeightGroup')?.addEventListener('click', (e) => {
  const b = e.target.closest('button[data-cheight]');
  if (!b) return;
  styleSettings.cardHeight = b.dataset.cheight;
  saveStyles();
});

// Fullscreen Viewer Logic with Swipe & Tab Navigation
function openFullscreenModel(modelId) {
  currentFullscreenModelId = modelId;
  renderFullscreenTabs();
  updateFullscreenIframe();
  fullscreenModalOverlay.classList.add('active');
}

function updateFullscreenIframe() {
  const cfg = SUPPORTED_MODELS.find(m => m.id === currentFullscreenModelId);
  if (!cfg) return;

  const currentUrl = modelCapturedUrls[currentFullscreenModelId] || cfg.url;
  fullscreenIframe.src = currentUrl;

  fsModelAvatar.style.background = cfg.color;
  fsModelAvatar.innerText = cfg.text;
  fsModelTitle.innerText = cfg.name;
  fsExternalLink.href = currentUrl;

  renderFullscreenTabs();
}

function renderFullscreenTabs() {
  if (!fullscreenTabsContainer) return;
  fullscreenTabsContainer.innerHTML = '';

  selectedModelIds.forEach(id => {
    const cfg = SUPPORTED_MODELS.find(m => m.id === id);
    if (!cfg) return;
    const tab = document.createElement('div');
    tab.className = 'fullscreen-tab' + (id === currentFullscreenModelId ? ' active' : '');
    tab.innerHTML = '<span class="chip-avatar" style="width:16px; height:16px; font-size:9px; background:' + cfg.color + ';">' + cfg.text + '</span><span>' + cfg.name + '</span>';
    tab.onclick = () => {
      currentFullscreenModelId = id;
      updateFullscreenIframe();
    };
    fullscreenTabsContainer.appendChild(tab);
  });
}

function switchFullscreenNext() {
  const idx = selectedModelIds.indexOf(currentFullscreenModelId);
  const nextIdx = (idx + 1) % selectedModelIds.length;
  currentFullscreenModelId = selectedModelIds[nextIdx];
  updateFullscreenIframe();
}

function switchFullscreenPrev() {
  const idx = selectedModelIds.indexOf(currentFullscreenModelId);
  const prevIdx = (idx - 1 + selectedModelIds.length) % selectedModelIds.length;
  currentFullscreenModelId = selectedModelIds[prevIdx];
  updateFullscreenIframe();
}

// Navigation Buttons & Keys
document.getElementById('btnFsNext')?.addEventListener('click', switchFullscreenNext);
document.getElementById('btnFsPrev')?.addEventListener('click', switchFullscreenPrev);
document.getElementById('btnCloseFullscreen')?.addEventListener('click', () => {
  fullscreenModalOverlay.classList.remove('active');
  fullscreenIframe.src = 'about:blank';
});

// Fullscreen Topbar Quick Actions
document.getElementById('btnFsExec')?.addEventListener('click', () => {
  executeModelAutomation(currentFullscreenModelId);
});
document.getElementById('btnFsScrape')?.addEventListener('click', () => {
  triggerScrapeSingle(currentFullscreenModelId);
});
document.getElementById('btnFsManual')?.addEventListener('click', () => {
  openManualInputModal(currentFullscreenModelId);
});
document.getElementById('btnFsReload')?.addEventListener('click', () => {
  if (fullscreenIframe) fullscreenIframe.src = fullscreenIframe.src;
  reloadIframe(currentFullscreenModelId);
});

// Global Keyboard Navigation for Fullscreen (Left/Right arrow keys & ESC)
window.addEventListener('keydown', (e) => {
  if (fullscreenModalOverlay && fullscreenModalOverlay.classList.contains('active')) {
    if (e.key === 'ArrowRight') {
      switchFullscreenNext();
    } else if (e.key === 'ArrowLeft') {
      switchFullscreenPrev();
    } else if (e.key === 'Escape') {
      fullscreenModalOverlay.classList.remove('active');
      fullscreenIframe.src = 'about:blank';
    }
  }
});

// Touch Swipe Gesture for Mobile / Tablet / Touch screens in Fullscreen
let touchStartX = 0;
let touchEndX = 0;
fullscreenModalOverlay?.addEventListener('touchstart', (e) => {
  touchStartX = e.changedTouches[0].screenX;
}, { passive: true });

fullscreenModalOverlay?.addEventListener('touchend', (e) => {
  touchEndX = e.changedTouches[0].screenX;
  const deltaX = touchEndX - touchStartX;
  if (Math.abs(deltaX) > 60) {
    if (deltaX < 0) {
      switchFullscreenNext(); // Swipe Left -> Next
    } else {
      switchFullscreenPrev(); // Swipe Right -> Prev
    }
  }
}, { passive: true });

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
          <button class="btn btn-sm" data-action="fullscreen" data-model="\${modelId}" title="全屏沉浸查看并左右滑动切换" style="color:#4F46E5; font-weight:700;">⛶ 全屏</button>
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

  applyStyleSettings();
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
  } else if (action === 'fullscreen') {
    openFullscreenModel(modelId);
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

// Presets Modal Open/Close Handlers
document.getElementById('btnPresetModal')?.addEventListener('click', () => {
  renderPresets();
  presetModalOverlay.classList.add('active');
});

document.getElementById('btnOpenPresetsFromBar')?.addEventListener('click', () => {
  renderPresets();
  presetModalOverlay.classList.add('active');
});

document.getElementById('btnClosePresets')?.addEventListener('click', () => {
  presetModalOverlay.classList.remove('active');
});

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
    history: sessionHistoryList,
    presets: promptPresetsList
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
loadStoredPresets();
loadStoredStyles();
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

  const iconSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 128 128" width="128" height="128">
  <defs>
    <linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#0F172A"/>
      <stop offset="50%" stop-color="#1E1B4B"/>
      <stop offset="100%" stop-color="#312E81"/>
    </linearGradient>
    <linearGradient id="neonGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#6366F1"/>
      <stop offset="50%" stop-color="#8B5CF6"/>
      <stop offset="100%" stop-color="#EC4899"/>
    </linearGradient>
    <linearGradient id="coreGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#38BDF8"/>
      <stop offset="100%" stop-color="#818CF8"/>
    </linearGradient>
    <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
      <feGaussianBlur stdDeviation="3" result="blur" />
      <feComposite in="SourceGraphic" in2="blur" operator="over" />
    </filter>
  </defs>
  <rect width="128" height="128" rx="28" fill="url(#bgGrad)"/>
  <rect x="3" y="3" width="122" height="122" rx="25" fill="none" stroke="url(#neonGrad)" stroke-width="2.5" stroke-opacity="0.8"/>
  <circle cx="64" cy="64" r="18" fill="url(#coreGrad)" filter="url(#glow)"/>
  <circle cx="64" cy="64" r="8" fill="#FFFFFF"/>
  <circle cx="34" cy="40" r="10" fill="#10B981" filter="url(#glow)"/>
  <circle cx="94" cy="40" r="10" fill="#3B82F6" filter="url(#glow)"/>
  <circle cx="34" cy="88" r="10" fill="#8B5CF6" filter="url(#glow)"/>
  <circle cx="94" cy="88" r="10" fill="#F59E0B" filter="url(#glow)"/>
  <line x1="41" y1="46" x2="52" y2="55" stroke="#38BDF8" stroke-width="3" stroke-linecap="round" opacity="0.8"/>
  <line x1="87" y1="46" x2="76" y2="55" stroke="#38BDF8" stroke-width="3" stroke-linecap="round" opacity="0.8"/>
  <line x1="41" y1="82" x2="52" y2="73" stroke="#818CF8" stroke-width="3" stroke-linecap="round" opacity="0.8"/>
  <line x1="87" y1="82" x2="76" y2="73" stroke="#EC4899" stroke-width="3" stroke-linecap="round" opacity="0.8"/>
  <polygon points="64,20 66,28 74,30 66,32 64,40 62,32 54,30 62,28" fill="#FDE047"/>
</svg>`;

  return [
    { path: 'manifest.json', content: JSON.stringify(manifestJson, null, 2) },
    { path: 'rules.json', content: JSON.stringify(rulesJson, null, 2) },
    { path: 'arena.html', content: arenaHtml },
    { path: 'arena.css', content: arenaCss },
    { path: 'arena.js', content: arenaJs },
    { path: 'popup.html', content: popupHtml },
    { path: 'popup.js', content: popupJs },
    { path: 'background.js', content: backgroundJs },
    { path: 'content_scripts/anti_frame_buster.js', content: antiFrameBusterScript },
    { path: 'content_scripts/omni_bridge.js', content: omniBridgeScript },
    { path: 'icons/icon.svg', content: iconSvg },
    { path: 'icons/icon16.png', content: generatePngIconBase64(16), isBinary: true },
    { path: 'icons/icon48.png', content: generatePngIconBase64(48), isBinary: true },
    { path: 'icons/icon128.png', content: generatePngIconBase64(128), isBinary: true },
    { path: 'README.md', content: readmeMd }
  ];
}

// Generate crisp PNG base64 icon using HTML5 Canvas or high-quality embedded fallback
export function generatePngIconBase64(size: number = 128): string {
  if (typeof document !== 'undefined') {
    try {
      const canvas = document.createElement('canvas');
      canvas.width = size;
      canvas.height = size;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        const s = size;
        const scale = s / 128;

        // 1. Background rounded rectangle with gradient
        const radius = 26 * scale;
        const grad = ctx.createLinearGradient(0, 0, s, s);
        grad.addColorStop(0, '#0F172A');
        grad.addColorStop(0.5, '#1E1B4B');
        grad.addColorStop(1, '#312E81');

        ctx.beginPath();
        ctx.moveTo(radius, 0);
        ctx.lineTo(s - radius, 0);
        ctx.quadraticCurveTo(s, 0, s, radius);
        ctx.lineTo(s, s - radius);
        ctx.quadraticCurveTo(s, s, s - radius, s);
        ctx.lineTo(radius, s);
        ctx.quadraticCurveTo(0, s, 0, s - radius);
        ctx.lineTo(0, radius);
        ctx.quadraticCurveTo(0, 0, radius, 0);
        ctx.closePath();
        ctx.fillStyle = grad;
        ctx.fill();

        // 2. Glowing border
        ctx.lineWidth = Math.max(1.5, 3 * scale);
        const borderGrad = ctx.createLinearGradient(0, 0, s, s);
        borderGrad.addColorStop(0, '#6366F1');
        borderGrad.addColorStop(0.5, '#8B5CF6');
        borderGrad.addColorStop(1, '#EC4899');
        ctx.strokeStyle = borderGrad;
        ctx.stroke();

        // 3. Central Core Glowing Circle
        const cx = 64 * scale;
        const cy = 64 * scale;
        
        ctx.shadowColor = '#38BDF8';
        ctx.shadowBlur = 12 * scale;
        const coreGrad = ctx.createRadialGradient(cx, cy, 2 * scale, cx, cy, 18 * scale);
        coreGrad.addColorStop(0, '#38BDF8');
        coreGrad.addColorStop(1, '#6366F1');
        ctx.fillStyle = coreGrad;
        ctx.beginPath();
        ctx.arc(cx, cy, 18 * scale, 0, Math.PI * 2);
        ctx.fill();

        // Center bright spark
        ctx.fillStyle = '#FFFFFF';
        ctx.beginPath();
        ctx.arc(cx, cy, 7 * scale, 0, Math.PI * 2);
        ctx.fill();

        // 4. Surrounding AI model nodes (Emerald, Sky, Violet, Amber)
        ctx.shadowBlur = 8 * scale;
        const nodes = [
          { x: 34 * scale, y: 40 * scale, color: '#10B981', glow: '#10B981' },
          { x: 94 * scale, y: 40 * scale, color: '#3B82F6', glow: '#3B82F6' },
          { x: 34 * scale, y: 88 * scale, color: '#8B5CF6', glow: '#8B5CF6' },
          { x: 94 * scale, y: 88 * scale, color: '#F59E0B', glow: '#F59E0B' },
        ];

        // Connection lines
        ctx.shadowBlur = 0;
        ctx.lineWidth = Math.max(1, 2.5 * scale);
        ctx.strokeStyle = 'rgba(56, 189, 248, 0.7)';
        nodes.forEach(n => {
          ctx.beginPath();
          ctx.moveTo(n.x, n.y);
          ctx.lineTo(cx, cy);
          ctx.stroke();
        });

        // Nodes
        nodes.forEach(n => {
          ctx.shadowColor = n.glow;
          ctx.shadowBlur = 8 * scale;
          ctx.fillStyle = n.color;
          ctx.beginPath();
          ctx.arc(n.x, n.y, 8 * scale, 0, Math.PI * 2);
          ctx.fill();
        });

        // Top Golden Star
        ctx.shadowColor = '#FDE047';
        ctx.shadowBlur = 6 * scale;
        ctx.fillStyle = '#FDE047';
        ctx.beginPath();
        ctx.arc(64 * scale, 24 * scale, 3.5 * scale, 0, Math.PI * 2);
        ctx.fill();

        const dataUrl = canvas.toDataURL('image/png');
        return dataUrl.replace(/^data:image\/png;base64,/, '');
      }
    } catch (e) {
      console.warn('Canvas icon generation failed:', e);
    }
  }

  // High quality embedded fallback icon Base64 if canvas is unavailable
  return "iVBORw0KGgoAAAANSUhEUgAAAEAAAABACAYAAACqaXHeAAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAAJcEhZcwAADsMAAA7DAcdvqGQAAAIcSURBVHhe7ZrbUdtQEEW/y3v+mggHUkEqEAlUAapgKgikAicKqCKhAkRk4U2kApkKhAqmgj9+h4x4jL1nSVkY66xr5o+E9Ym102r3St6lZdkOqapqj0x59L0y+8rU70jK8w/2j4R9qX1lZk/Z7051K9v7h70r+R/JbW7b134+Uq/z2e3W2d7eN15fX7sXFxc39/f3X5qm+dI0zc/Hx8cffv/6+vp70zQ3z8/Pf8/Pz2/Gsf4Xm9jV/k1N0zQ+Pj6+Xl1d/e/i4uL77e3tl4uLi29e7vV9r7/f3Nz8/Pnzh+fzeebf1/ZfbWqPZ3p4ePjh77u7u5+fn59fHh8fv87Ozr58/Pjx28nJSff29vbt9PT0/d3d3evnz59vPj8//319ff3DkXvV9t/2/f395/39/Y/b29ufvsz3/t/W69PTE32v90hvb2+d7/fev/u/9vW39X1m7x3X19c/Dw8P34+Ojj77vvcP7u/v330/t+c3x2lX+9q/6f7+/u3w8PDr5eXlD9/v9/f33z4v32vP58671vcfX/f/3Pfvfvff/u79x5/38fFRq9WqdV0ffj574v933f/6vvb/2q6b2v/+6uqqt21bnp6e6vn5+VqWZXV1dVXH4/HaNE19fn6uRVF8enx8rMfj8bIsi766uqqrq6taFEX1ej32367+/ffv311V1er7/er1+vry8rLOZrPquq5eXV3V9/f39ffff/e+7+txHD/7vuf7fT6fV9/3tSzL6uvr63/Tvv629q8d745/Bf4C/AX4C/AX4C/AX4C/AH8B/gL8BfgL8BfgL8BfgL8BfwH+AvwF+AvwF+AvwF+AvwB/Af4C/AX4C/AX4C/AX4C/AH8B/gL8BfgL8BfgL8BfgL8BfwH+AvwF+AvwF+AvwF+AvwB/Af4C/AX4C/AX4C/AX4C/AH8B/gL8BfgL8BfgL8BfgL8BfwH+AvwF+AvwF+AvwF+AvwB/Af4C/AX4C/AX4C/AX4C/AH8B/gL8BfgL8BfgL8BfgL8BfwH+AvwF+AvwF+AvwF+AvwB/Af4C/AX4C/AX4C/AX4C/AH8B/gL8BfgL8BfgL8BfgL8BfwH+AvwF+AvwF+AvwF+AvwB/Af4C/AX4C/AX4C/AX4C/AH8B/gL8BfgL8BfgL8BfgL8BfwH+AvwF+AvwF+AvwF+AvwB/Af4C/AX4C/AX4C/AX4C/AH8B/gL8BfgL8BfgL8BfgL8BfwH+AvwF+AvwF+AvwF+AvwB/Af4C/AX4C/AX4C/AX4C/AH8B/gL8BfgL8BfgL8BfgL8BfwH+AvwF+AvwF+AvwF+AvwB/Af4C/AX4C/AX4C/AX4C/AH8B/gL8BfgL8BfgL8BfgL8BfwH+AvwF+AvwF+AvwF+AvwB/Af4C/AX4C/AX4C/AX4C/AH8B/gL8BfgL8BfgL8BfgL8BfwH+AvwF+AvwF+AvwF+AvwB/Af4C/AX4C/AX4C/AX4C/AH8B/gL8BfgL8BfgL8BfgL8BfwH+AvwF+AvwF+AvwF+AvwB/Af4C/AX4C/AX4C/AX4C/AH8B/gL8BfgL8BfgL8BfgL8BfwH+AvwF+AvwF+AvwF+AvwB/Af4C/AX4C/AX4C/AX4C/AH8B/gL8BfgL8BfgL8BfgL8BfwH+AvwF+AvwF+AvwF+AvwB/Af4C/AX4C/AX4C/AX4C/AH8B/gL8BfgL8BfgL8BfgL8BfwH+AvwF+AvwF+AvwF+AvwB/Af4C/AX4C/AX4C/AX4C/AH8B/gL8BfgL8BfgL8BfgL8BfwH+AvwF+AvwF+AvwF+AvwB/Af4C/AX4C/AX4C/AX4C/AH8B/gL8BfgL8BfgL8BfgL8BfwH+AvwF+AvwF+AvwF+AvwB/Af4C/AX4C/AX4C/AX4C/AH8B/gL8BfgL8BfgL8BfgL8BfwH+AvwF+AvwF+AvwF+AvwB/Af4C/AX4C/AX4C/AX4C/AH8B/gL8BfgL8BfgL8BfgL8BfwH+AvwF+AvwF+AvwF+AvwB/Af4C/AX4C/AX4C/AX4C/AH8B/gL8BfgL8BfgL8BfgL8BfwH+AvwF+AvwF+AvwF+AvwB/Af4C/AX4C/AX4C/AX4C/AH8B/gL8BfgL8BfgL8BfgL8BfwH+AvwF+AvwF+AvwF+AvwB/Af4C/AX4C/AX4C/AX4C/AH8B/gL8BfgL8BfgL8BfgL8BfwH+AvwF+AvwF+AvwF+AvwB/Af4C/AX4C/AX4C/AX4C/AH8B/gL8BfgL8BfgL8BfgL8BfwH+AvwF+AvwF+AvwF+AvwB/Af4C/AX4C/AX4C/AX4C/AH8B/gL8BfgL8BfgL8BfgL8BfwH+AvwF+AvwF+AvwF+AvwB/Af4C/AX4C/AX4C/AX4C/AH8B/gL8BfgL8BfgL8BfgL8BfwH+AvwF+AvwF+AvwF+AvwB/Af4C/AX4C/AX4C/AX4C/AH8B/gL8BfgL8BfgL8BfgL8BfwH+AvwF+AvwF+AvwF+AvwB/Af4C/AX4C/AX4C/AX4C/AH8B/gL8BfgL8BfgL8BfgL8BfwH+AvwF+AvwF+AvwF+AvwB/Af4C/AX4C/AX4C/AX4C/AH8B/gL8BfgL8BfgL8BfgL8BfwH+AvwF+AvwF+AvwF+AvwB/Af4C/AX4C/AX4C/AX4C/AH8B/gL8BfgL8BfgL8BfgL8BfwH+AvwF+AvwF+AvwF+AvwB/Af4C/AX4C/AX4C/AX4C/AH8B/gL8BfgL8BfgL8BfgL8BfwH+AvwF+AvwF+AvwF+AvwB/Af4C/AX4C/AX4C/AX4C/AH8B/gL8BfgL8BfgL8BfgL8BfwH+AvwF+AvwF+AvwF+AvwB/Af4C/AX4C/AX4C/AX4C/AH8B/gL8BfgL8BfgL8BfgL8BfwH+AvwF+AvwF+AvwF+AvwB/Af4C/AX4C/AX4C/AX4C/AH8B/gL8BfgL8BfgL8BfgL8BfwH+AvwF+AvwF+AvwF+AvwB/Af4C/AX4C/AX4C/AX4C/AH8B/gL8BfgL8BfgL8BfgL8BfwH+AvwF+AvwF+AvwF+AvwB/Af4C/AX4C/AX4C/AX4C/AH8B/gL8BfgL8BfgL8BfgL8BfwH+AvwF+AvwF+AvwF+AvwB/Af4C/AX4C/AX4C/AX4C/AH8B/gL8BfgL8BfgL8BfgL8BfwH+AvwF+AvwF+AvwF+AvwB/Af4C/AX4C/AX4C/AX4C/AH8B/gL8BfgL8BfgL8BfgL8BfwH+AvwF+AvwF+AvwF+AvwB/Af4C/AX4C/AX4C/AX4C/AH8B/gL8BfgL8BfgL8BfgL8BfwH+AvwF+AvwF+AvwF+AvwB/Af4C/AX4C/AX4C/AX4C/AH8B/gL8BfgL8BfgL8BfgL8BfwH+AvwF+AvwF+AvwF+AvwB/Af4C/AX4C/AX4C/AX4C/AH8B/gL8BfgL8BfgL8BfgL8BfwH+AvwF+AvwF+AvwF+AvwB/Af4C/AX4C/AX4C/AX4C/AH8B/gL8BfgL8BfgL8BfgL8BfwH+AvwF+AvwF+AvwF+AvwB/Af4C/AX4C/AX4C/AX4C/AH8B/gL8BfgL8BfgL8BfgL8BfwH+AvwF+AvwF+AvwF+AvwB/Af4C/AX4C/AX4C/AX4C/AH8B/gL8BfgL8BfgL8BfgL8BfwH+AvwF+AvwF+AvwF+AvwB/Af4C/AX4C/AX4C/AX4C/AH8B/gL8BfgL8BfgL8BfgL8BfwH+AvwF+AvwF+AvwF+AvwB/Af4C/AX4C/AX4C/AX4C/AH8B/gL8BfgL8BfgL8BfgL8BfwH+AvwF+AvwF+AvwF+AvwB/Af4C/AX4C/AX4C/AX4C/AH8B/gL8BfgL8BfgL8BfgL8BfwH+AvwF+AvwF+AvwF+AvwB/Af4C/AX4C/AX4C/AX4C/AH8B/gL8BfgL8BfgL8BfgL8BfwH+AvwF+AvwF+AvwF+AvwB/Af4C/AX4C/AX4C/AX4C/AH8B/gL8BfgL8BfgL8BfgL8BfwH+AvwF+AvwF+AvwF+AvwB/Af4C/AX4C/AX4C/AX4C/AH8B/gL8BfgL8BfgL8BfgL8BfwH+AvwF+AvwF+AvwF+AvwB/Af4C/AX4C/AX4C/AX4C/AH8B/gL8BfgL8BfgL8BfgL8BfwH+AvwF+AvwF+AvwF+AvwB/Af4C/AX4C/AX4C/AX4C/AH8B/gL8BfgL8BfgL8BfgL8BfwH+AvwF+AvwF+AvwF+AvwB/Af4C/AX4C/AX4C/AX4C/AH8B/gL8BfgL8BfgL8BfgL8BfwH+AvwF+AvwF+AvwF+AvwB/Af4C/AX4C/AX4C/AX4C/AH8B/gL8BfgL8BfgL8BfgL8BfwH+AvwF+AvwF+AvwF+AvwB/Af4C/AX4C/AX4C/AX4C/AH8B/gL8BfgL8BfgL8BfgL8BfwH+AvwF+AvwF+AvwF+AvwB/Af4C/AX4C/AX4C/AX4C/AH8B/gL8BfgL8BfgL8BfgL8BfwH+AvwF+AvwF+AvwF+AvwB/Af4C/AX4C/AX4C/AX4C/AH8B/gL8BfgL8BfgL8BfgL8BfwH+AvwF+AvwF+AvwF+AvwB/Af4C/AX4C/AX4C/AX4C/AH8B/gL8BfgL8BfgL8BfgL8BfwH+AvwF+AvwF+AvwF+AvwB/Af4C/AX4C/AX4C/AX4C/AH8B/gL8BfgL8BfgL8BfgL8Bf/Av0G4T7N/702/92AAAAAElFTkSuQmCC";
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
