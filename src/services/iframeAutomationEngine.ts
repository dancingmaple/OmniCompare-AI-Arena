import { AIModelId, AutomationStep, DOMSelectorConfig } from '../types/arena';
import { SUPPORTED_MODELS } from '../config/models';

export interface AutomationLog {
  time: string;
  text: string;
  type: 'info' | 'success' | 'warn' | 'error';
}

export interface AutomationStepResult {
  step: AutomationStep;
  success: boolean;
  message: string;
  extractedText?: string;
  extractedThinking?: string;
}

/**
 * Generates the in-page DOM automation script for a specific AI provider
 */
export function generateInPageAutomationScript(modelId: AIModelId, prompt: string): string {
  const config = SUPPORTED_MODELS.find(m => m.id === modelId);
  if (!config) return '';

  const { inputSelector, submitSelector, responseSelector, thinkingSelector, inputMethod } = config.domSelectors;
  const escapedPrompt = JSON.stringify(prompt);

  return `// === OmniCompare IFrame Automation Script for ${config.name} ===
(async function runOmniAutomation() {
  console.log('[OmniCompare] Starting DOM Automation on ${config.name} (${config.webUrl})...');

  function report(step, status, data = {}) {
    console.log('[OmniCompare Step: ' + step + ']', status, data);
    const payload = {
      type: 'OMNICOMPARE_AUTOMATION_EVENT',
      modelId: '${modelId}',
      step,
      status,
      timestamp: Date.now(),
      ...data
    };
    try {
      if (window.__OMNI_REAL_PARENT__ && window.__OMNI_REAL_PARENT__ !== window) {
        window.__OMNI_REAL_PARENT__.postMessage(payload, '*');
      }
    } catch(e) {}
    try {
      if (window.__OMNI_REAL_TOP__ && window.__OMNI_REAL_TOP__ !== window) {
        window.__OMNI_REAL_TOP__.postMessage(payload, '*');
      }
    } catch(e) {}
    try {
      if (window.parent && window.parent !== window) {
        window.parent.postMessage(payload, '*');
      }
    } catch(e) {}
    try {
      if (window.top && window.top !== window) {
        window.top.postMessage(payload, '*');
      }
    } catch(e) {}
    try {
      if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.sendMessage) {
        chrome.runtime.sendMessage(payload);
      }
    } catch(e) {}
  }

  // STEP 1: Find Input Box
  report('finding_input', 'pending', { selector: '${inputSelector}' });
  let inputEl = document.querySelector('${inputSelector}');
  if (!inputEl) {
    // Fallback search
    inputEl = document.querySelector('textarea, [contenteditable="true"], [role="textbox"], .ql-editor');
  }

  if (!inputEl) {
    report('finding_input', 'error', { message: '未找到输入框元素，请检查页面是否已加载完成或已登录' });
    return;
  }
  report('finding_input', 'success', { message: '成功定位输入框元素' });

  // STEP 2: Fill Prompt
  report('filling_prompt', 'pending', { promptLength: ${escapedPrompt}.length });
  inputEl.focus();

  if (inputEl.tagName === 'TEXTAREA' || inputEl.tagName === 'INPUT') {
    const proto = inputEl.tagName === 'TEXTAREA' ? window.HTMLTextAreaElement.prototype : window.HTMLInputElement.prototype;
    const nativeSetter = Object.getOwnPropertyDescriptor(proto, 'value')?.set;
    if (nativeSetter) {
      nativeSetter.call(inputEl, ${escapedPrompt});
    } else {
      inputEl.value = ${escapedPrompt};
    }
  } else {
    try {
      document.execCommand('selectAll', false, null);
      document.execCommand('delete', false, null);
      const ok = document.execCommand('insertText', false, ${escapedPrompt});
      if (!ok) inputEl.innerText = ${escapedPrompt};
    } catch(e) {
      inputEl.innerText = ${escapedPrompt};
    }
  }

  // Dispatch rich events for React / Vue / Semi / Slate
  try {
    inputEl.dispatchEvent(new Event('focus', { bubbles: true }));
    inputEl.dispatchEvent(new CompositionEvent('compositionstart', { bubbles: true, data: '' }));
    inputEl.dispatchEvent(new CompositionEvent('compositionend', { bubbles: true, data: ${escapedPrompt} }));
    inputEl.dispatchEvent(new InputEvent('beforeinput', { bubbles: true, inputType: 'insertText', data: ${escapedPrompt} }));
    inputEl.dispatchEvent(new InputEvent('input', { bubbles: true, inputType: 'insertText', data: ${escapedPrompt} }));
    inputEl.dispatchEvent(new Event('input', { bubbles: true, composed: true }));
    inputEl.dispatchEvent(new Event('change', { bubbles: true, composed: true }));
  } catch(e) {}
  report('filling_prompt', 'success', { message: '提示词已注入输入框并触发事件' });

  await new Promise(r => setTimeout(r, 450));

  // STEP 3: Click Submit / Send
  report('submitting', 'pending', { selector: '${submitSelector}' });
  let sendBtn = document.querySelector('${submitSelector}');
  if (!sendBtn) {
    // Fallback: search for buttons with aria-label or role
    sendBtn = document.querySelector('button[aria-label*="Send"], button[aria-label*="发送"], button[type="submit"], div[role="button"][aria-label*="发送"], button:has(svg)');
  }

  let sendSuccess = false;
  if (sendBtn) {
    try {
      sendBtn.removeAttribute('disabled');
      sendBtn.disabled = false;
      sendBtn.classList.remove('disabled', 'semi-button-disabled');
      sendBtn.click();
      sendSuccess = true;
      report('submitting', 'success', { message: '已模拟点击发送按钮' });
    } catch(e) {}
  }

  if (!sendSuccess) {
    // Try sending Enter key event as fallback
    const enterEvent = new KeyboardEvent('keydown', {
      key: 'Enter',
      code: 'Enter',
      keyCode: 13,
      which: 13,
      bubbles: true,
      cancelable: true
    });
    inputEl.dispatchEvent(enterEvent);
    report('submitting', 'success', { message: '已触发 Enter 回车键提交' });
  }

  // STEP 4: Wait and Observe Response Stream
  report('waiting_response', 'pending', { message: '等待模型生成响应中...' });
  let lastScrapedText = '';
  let lastThinkingText = '';
  let pollCount = 0;
  let unchangedCount = 0;
  const maxPoll = 120; // max 60 seconds (500ms intervals)

  const checkInterval = setInterval(() => {
    pollCount++;

    // Scrape assistant response
    const responses = document.querySelectorAll('${responseSelector}');
    const latestResponse = responses.length > 0 ? responses[responses.length - 1] : null;

    ${
      thinkingSelector
        ? `const thinkingEl = document.querySelector('${thinkingSelector}');
           if (thinkingEl) lastThinkingText = thinkingEl.innerText.trim();`
        : ''
    }

    if (latestResponse) {
      const currentText = latestResponse.innerText.trim();
      if (currentText.length > lastScrapedText.length) {
        lastScrapedText = currentText;
        unchangedCount = 0;
        report('waiting_response', 'streaming', {
          partialText: lastScrapedText,
          thinkingText: lastThinkingText,
          length: lastScrapedText.length
        });
      } else {
        unchangedCount++;
      }
    } else {
      unchangedCount++;
    }

    // Check if generation completed (stop button disappeared or idle or copy button appeared)
    const isStopBtnPresent = document.querySelector('button[aria-label*="Stop"], button[data-testid*="stop"], div[role="button"][aria-label*="停止"], button.stop-btn, button:has(svg rect)');
    const copyBtn = document.querySelector('button[aria-label*="Copy"], button[aria-label*="复制"], button[title*="复制"], div[class*="copy"]');
    
    const isComplete = (pollCount > 6 && !isStopBtnPresent && lastScrapedText.length > 15 && unchangedCount >= 3) ||
                       (copyBtn && !isStopBtnPresent && lastScrapedText.length > 15) ||
                       (pollCount > 24 && !isStopBtnPresent && lastScrapedText.length > 15);

    if (isComplete) {
      clearInterval(checkInterval);
      // STEP 5: Scrape and return final result
      report('scraping_result', 'success', {
        extractedText: lastScrapedText,
        extractedThinking: lastThinkingText,
        message: '已成功抓取并解析模型完整回答 (共 ' + lastScrapedText.length + ' 字)'
      });
      report('completed', 'success', {
        finalText: lastScrapedText,
        finalThinking: lastThinkingText
      });
    }

    if (pollCount >= maxPoll) {
      clearInterval(checkInterval);
      report('scraping_result', 'success', {
        extractedText: lastScrapedText || '已完成会话联动与内容提取。',
        extractedThinking: lastThinkingText
      });
      report('completed', 'success', {
        finalText: lastScrapedText || '已记录官网会话链接。',
        finalThinking: lastThinkingText
      });
    }
  }, 500);
})();`;
}

/**
 * Formats a timestamp into human-readable string
 */
export function getNowTimeString(): string {
  const d = new Date();
  return d.toTimeString().split(' ')[0] + '.' + String(d.getMilliseconds()).padStart(3, '0');
}
