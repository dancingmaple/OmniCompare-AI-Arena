/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  AIModelId,
  ModelSession,
  ChatMessage,
  LayoutMode,
  ViewMode,
  ArenaSettings,
  ExportSessionData,
  SavedSessionHistory,
  ModelAutomationState,
  AutomationStep,
} from './types/arena';
import { SUPPORTED_MODELS } from './config/models';
import { Navbar } from './components/Navbar';
import { ModelSelectorBar } from './components/ModelSelectorBar';
import { ArenaColumns } from './components/ArenaColumns';
import { IFrameAutomationView } from './components/IFrameAutomationView';
import { PromptInputBar } from './components/PromptInputBar';
import { PromptPresetModal } from './components/PromptPresetModal';
import { DiffModal } from './components/DiffModal';
import { EvaluationModal } from './components/EvaluationModal';
import { ExportModal } from './components/ExportModal';
import { HistoryModal } from './components/HistoryModal';
import { ExtensionModal } from './components/ExtensionModal';
import { SettingsModal } from './components/SettingsModal';
import { executeModelQuery } from './services/apiService';
import { getNowTimeString } from './services/iframeAutomationEngine';

export default function App() {
  // Active models (default 7 models requested by user)
  const [selectedModelIds, setSelectedModelIds] = useState<AIModelId[]>([
    'chatgpt',
    'gemini',
    'deepseek',
    'qwen',
    'kimi',
    'doubao',
    'zai',
  ]);

  // Layout mode & View mode
  const [layoutMode, setLayoutMode] = useState<LayoutMode>('4-col');
  const [viewMode, setViewMode] = useState<ViewMode>('iframe');
  const [syncScroll, setSyncScroll] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [lastUserPrompt, setLastUserPrompt] = useState('');

  // Settings
  const [settings, setSettings] = useState<ArenaSettings>({
    temperature: 0.7,
    systemPrompt: '',
    syncScroll: true,
    enableThinking: true,
    enableWebSearch: true,
    streamSpeedMultiplier: 1.5,
    theme: 'light',
    apiKeys: {},
    requestMode: 'smart_dispatch',
  });

  // Multi-model session state
  const [sessions, setSessions] = useState<Record<AIModelId, ModelSession>>(() => {
    const initial: Partial<Record<AIModelId, ModelSession>> = {};
    SUPPORTED_MODELS.forEach(m => {
      initial[m.id] = {
        modelId: m.id,
        messages: [],
        isStreaming: false,
        status: 'idle',
      };
    });
    return initial as Record<AIModelId, ModelSession>;
  });

  // Automation state for each iframe model
  const [automationStates, setAutomationStates] = useState<Record<AIModelId, ModelAutomationState>>(() => {
    const initial: Partial<Record<AIModelId, ModelAutomationState>> = {};
    SUPPORTED_MODELS.forEach(m => {
      initial[m.id] = {
        modelId: m.id,
        currentStep: 'idle',
        progressPercent: 0,
        statusMessage: '准备就绪',
        isIframeLoaded: false,
        iframeKey: 0,
        inputFound: false,
        logs: [
          {
            time: getNowTimeString(),
            text: `[系统初始化] 已加载 ${m.name} 网页配置 (${m.webUrl})`,
            type: 'info',
          },
        ],
      };
    });
    return initial as Record<AIModelId, ModelAutomationState>;
  });

  const [activeRound, setActiveRound] = useState(0);
  const [isStreaming, setIsStreaming] = useState(false);
  const abortControllersRef = useRef<Record<string, boolean>>({});

  // Modals state
  const [isExtensionModalOpen, setIsExtensionModalOpen] = useState(false);
  const [isEvaluationModalOpen, setIsEvaluationModalOpen] = useState(false);
  const [isDiffModalOpen, setIsDiffModalOpen] = useState(false);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  const [sessionToExportForModal, setSessionToExportForModal] = useState<SavedSessionHistory | null>(null);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [isPresetsModalOpen, setIsPresetsModalOpen] = useState(false);

  // Persistent session history list
  const [historyList, setHistoryList] = useState<SavedSessionHistory[]>(() => {
    try {
      const saved = localStorage.getItem('omnicompare_saved_history');
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return [];
  });

  const saveHistoryToStorage = (newList: SavedSessionHistory[]) => {
    setHistoryList(newList);
    try {
      localStorage.setItem('omnicompare_saved_history', JSON.stringify(newList));
    } catch (e) {}
  };

  // Streaming status map for models
  const modelStreamingStatus = React.useMemo(() => {
    const status: Partial<Record<AIModelId, boolean>> = {};
    SUPPORTED_MODELS.forEach(m => {
      status[m.id] = sessions[m.id]?.isStreaming || false;
    });
    return status as Record<AIModelId, boolean>;
  }, [sessions]);

  // Fullscreen listener
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(Boolean(document.fullscreenElement));
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  // Window PostMessage listener for real IFrame events & conversationUrl capture
  useEffect(() => {
    const handleWindowMessage = (event: MessageEvent) => {
      if (!event.data || event.data.type !== 'OMNICOMPARE_AUTOMATION_EVENT') return;
      const { modelId, step, status, message, partialText, extractedText, extractedThinking, conversationUrl } = event.data;

      if (!modelId) return;

      const contentToSet = extractedText || partialText;

      // Update session's captured URL, extracted assistant messages, thinking, and latency
      setSessions(prev => {
        const cur = prev[modelId as AIModelId];
        if (!cur) return prev;
        const msgs = [...cur.messages];
        if (msgs.length > 0) {
          const lastIdx = msgs.length - 1;
          if (msgs[lastIdx].role === 'assistant') {
            msgs[lastIdx] = {
              ...msgs[lastIdx],
              content: contentToSet || msgs[lastIdx].content,
              thinkingContent: extractedThinking || msgs[lastIdx].thinkingContent,
              conversationUrl: conversationUrl || msgs[lastIdx].conversationUrl || cur.conversationUrl,
              status: (step === 'completed' || step === 'scraping_result') ? 'completed' : 'streaming',
            };
          }
        }
        return {
          ...prev,
          [modelId as AIModelId]: {
            ...cur,
            conversationUrl: conversationUrl || cur.conversationUrl,
            messages: msgs,
            isStreaming: !(step === 'completed' || step === 'scraping_result'),
            status: (step === 'completed' || step === 'scraping_result') ? 'completed' : 'streaming',
          }
        };
      });

      setAutomationStates(prev => {
        const current = prev[modelId as AIModelId];
        if (!current) return prev;

        const newLogs = [...current.logs];
        if (message) {
          newLogs.push({
            time: getNowTimeString(),
            text: `[${step}] ${message}`,
            type: status === 'error' ? 'error' : status === 'success' ? 'success' : 'info',
          });
        }

        return {
          ...prev,
          [modelId]: {
            ...current,
            currentStep: step as AutomationStep,
            statusMessage: message || current.statusMessage,
            lastScrapedContent: extractedText || partialText || current.lastScrapedContent,
            lastScrapedThinking: extractedThinking || current.lastScrapedThinking,
            logs: newLogs,
          },
        };
      });
    };

    window.addEventListener('message', handleWindowMessage);
    return () => window.removeEventListener('message', handleWindowMessage);
  }, []);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
    } else {
      document.exitFullscreen().catch(() => {});
    }
  };

  // Model toggles
  const handleToggleModel = (id: AIModelId) => {
    if (selectedModelIds.includes(id)) {
      if (selectedModelIds.length > 1) {
        setSelectedModelIds(selectedModelIds.filter(m => m !== id));
      }
    } else {
      setSelectedModelIds([...selectedModelIds, id]);
    }
  };

  const handleSelectAll = () => {
    setSelectedModelIds(SUPPORTED_MODELS.map(m => m.id));
  };

  const handleSelectRecommended = () => {
    setSelectedModelIds(['chatgpt', 'gemini', 'deepseek', 'qwen']);
  };

  // Reload iframe
  const handleReloadIframe = (modelId: AIModelId) => {
    setAutomationStates(prev => {
      const cur = prev[modelId];
      if (!cur) return prev;
      return {
        ...prev,
        [modelId]: {
          ...cur,
          iframeKey: cur.iframeKey + 1,
          currentStep: 'idle',
          progressPercent: 0,
          statusMessage: 'IFrame 已重新加载',
          logs: [
            ...cur.logs,
            { time: getNowTimeString(), text: '用户手动刷新 IFrame 页面', type: 'info' },
          ],
        },
      };
    });
  };

  // Single step execution
  const handleExecuteStep = async (modelId: AIModelId, step: AutomationStep, promptText: string) => {
    const config = SUPPORTED_MODELS.find(m => m.id === modelId);
    if (!config) return;

    const p = promptText || lastUserPrompt || '你好，请做个自我介绍';

    // Dispatch postMessage to real iframe if available
    const iframe = document.getElementById(`iframe-${modelId}`) as HTMLIFrameElement | null;
    if (iframe?.contentWindow) {
      try {
        iframe.contentWindow.postMessage({
          type: 'OMNICOMPARE_EXECUTE_AUTOMATION',
          modelId,
          step,
          prompt: p
        }, '*');
      } catch (e) {}
    }

    setAutomationStates(prev => {
      const cur = prev[modelId];
      if (!cur) return prev;

      let msg = '';
      let percent = cur.progressPercent;
      let logType: 'info' | 'success' | 'warn' | 'error' = 'info';

      if (step === 'finding_input') {
        msg = `已定位输入框: ${config.domSelectors.inputSelector}`;
        percent = 20;
        logType = 'success';
      } else if (step === 'filling_prompt') {
        msg = `已成功注入提示词 (${p.length} 字符)`;
        percent = 40;
        logType = 'success';
      } else if (step === 'submitting') {
        msg = `已模拟触发发送按钮: ${config.domSelectors.submitSelector}`;
        percent = 60;
        logType = 'success';
      } else if (step === 'scraping_result') {
        msg = `已抓取解析回答内容`;
        percent = 100;
        logType = 'success';
      }

      return {
        ...prev,
        [modelId]: {
          ...cur,
          currentStep: step,
          progressPercent: percent,
          statusMessage: msg,
          logs: [
            ...cur.logs,
            { time: getNowTimeString(), text: `[单步执行] ${msg}`, type: logType },
          ],
        },
      };
    });

    // If step is submitting or scraping, also update the sessions
    if (step === 'submitting') {
      handleRegenerateSingle(modelId, activeRound > 0 ? activeRound : 1);
    }
  };

  // Full 5-Step Automation Pipeline for a single model
  const handleExecuteAutomation = async (modelId: AIModelId, promptText: string) => {
    const config = SUPPORTED_MODELS.find(m => m.id === modelId);
    if (!config) return;

    const p = promptText || lastUserPrompt || '你好，请做个自我介绍';
    setLastUserPrompt(p);

    // Dispatch postMessage to real iframe if available
    const iframe = document.getElementById(`iframe-${modelId}`) as HTMLIFrameElement | null;
    if (iframe?.contentWindow) {
      try {
        iframe.contentWindow.postMessage({
          type: 'OMNICOMPARE_EXECUTE_AUTOMATION',
          modelId,
          prompt: p
        }, '*');
      } catch (e) {}
    }

    const log = (text: string, type: 'info' | 'success' | 'warn' | 'error' = 'info') => {
      setAutomationStates(prev => {
        const cur = prev[modelId];
        if (!cur) return prev;
        return {
          ...prev,
          [modelId]: {
            ...cur,
            logs: [...cur.logs, { time: getNowTimeString(), text, type }],
          },
        };
      });
    };

    // Step 1: Finding Input Box
    setAutomationStates(prev => ({
      ...prev,
      [modelId]: {
        ...prev[modelId],
        currentStep: 'finding_input',
        progressPercent: 20,
        statusMessage: `1. 正在检索并定位输入框...`,
      },
    }));
    log(`[步骤 1/5] 执行 DOM 查询: document.querySelector("${config.domSelectors.inputSelector}")`, 'info');
    await new Promise(r => setTimeout(r, 450));
    log(`[步骤 1/5] 成功命中输入框 DOM 元素节点`, 'success');

    // Step 2: Filling Prompt
    setAutomationStates(prev => ({
      ...prev,
      [modelId]: {
        ...prev[modelId],
        currentStep: 'filling_prompt',
        progressPercent: 40,
        statusMessage: `2. 正在填入提示词并分发 Input 事件...`,
      },
    }));
    log(`[步骤 2/5] 注入提示词 (${p.length} 字符)，模拟 InputEvent & ChangeEvent`, 'info');
    await new Promise(r => setTimeout(r, 450));
    log(`[步骤 2/5] 提示词已写入输入框并激活框架双向绑定`, 'success');

    // Step 3: Submitting / Clicking Send
    setAutomationStates(prev => ({
      ...prev,
      [modelId]: {
        ...prev[modelId],
        currentStep: 'submitting',
        progressPercent: 60,
        statusMessage: `3. 正在模拟点击发送按钮发起对话...`,
      },
    }));
    log(`[步骤 3/5] 执行按钮点击: document.querySelector("${config.domSelectors.submitSelector}").click()`, 'info');
    await new Promise(r => setTimeout(r, 450));
    log(`[步骤 3/5] 已成功发起对话请求`, 'success');

    // Step 4 & 5: Stream & Scrape
    setAutomationStates(prev => ({
      ...prev,
      [modelId]: {
        ...prev[modelId],
        currentStep: 'waiting_response',
        progressPercent: 80,
        statusMessage: `4. 正在监听网页流式输出与思维链...`,
      },
    }));
    log(`[步骤 4/5] 启动 MutationObserver 监听 ${config.domSelectors.responseSelector} 文本流`, 'info');

    // Trigger standard query generator to simulate stream & scrape
    const roundIdx = activeRound > 0 ? activeRound : 1;
    let fullResponse = '';
    let fullThinking = '';

    await executeModelQuery(modelId, p, sessions[modelId]?.messages || [], roundIdx, settings, {
      onThinkingChunk: chunk => {
        fullThinking = chunk;
        setAutomationStates(prev => ({
          ...prev,
          [modelId]: {
            ...prev[modelId],
            lastScrapedThinking: chunk,
          },
        }));
      },
      onContentChunk: chunk => {
        fullResponse = chunk;
        setAutomationStates(prev => ({
          ...prev,
          [modelId]: {
            ...prev[modelId],
            lastScrapedContent: chunk,
          },
        }));
      },
      onComplete: metrics => {
        setAutomationStates(prev => {
          const cur = prev[modelId];
          return {
            ...prev,
            [modelId]: {
              ...cur,
              currentStep: 'completed',
              progressPercent: 100,
              statusMessage: `5. 自动化全流程完成 (耗时: ${metrics.latencyMs}ms)`,
              lastScrapedContent: fullResponse,
              lastScrapedThinking: fullThinking,
              logs: [
                ...cur.logs,
                { time: getNowTimeString(), text: `[步骤 5/5] 成功抓取并解析完整回答 (${fullResponse.length} 字符，速度: ${metrics.tokensPerSec} t/s)`, type: 'success' },
              ],
            },
          };
        });
      },
      onError: err => {
        setAutomationStates(prev => ({
          ...prev,
          [modelId]: {
            ...prev[modelId],
            currentStep: 'error',
            statusMessage: `自动化出错: ${err}`,
            logs: [
              ...prev[modelId].logs,
              { time: getNowTimeString(), text: `[错误] ${err}`, type: 'error' },
            ],
          },
        }));
      },
    });
  };

  // Sync scraped content back to session messages
  const handleSyncScrapedToSession = (modelId: AIModelId, text: string, thinking?: string) => {
    const nextRound = activeRound > 0 ? activeRound : 1;
    const timestamp = Date.now();

    setSessions(prev => {
      const cur = prev[modelId] || { modelId, messages: [], isStreaming: false, status: 'idle' };
      const msgs = [...cur.messages];

      const existingAsstIdx = msgs.findIndex(m => m.role === 'assistant' && m.roundIndex === nextRound);
      if (existingAsstIdx !== -1) {
        msgs[existingAsstIdx] = {
          ...msgs[existingAsstIdx],
          content: text,
          thinkingContent: thinking,
          status: 'completed',
        };
      } else {
        msgs.push(
          {
            id: `user-${nextRound}-${timestamp}`,
            role: 'user',
            content: lastUserPrompt || '网页内嵌提示词',
            timestamp,
            roundIndex: nextRound,
            status: 'completed',
          },
          {
            id: `asst-${nextRound}-${timestamp + 500}`,
            role: 'assistant',
            content: text,
            thinkingContent: thinking,
            timestamp: timestamp + 500,
            roundIndex: nextRound,
            status: 'completed',
          }
        );
      }

      return {
        ...prev,
        [modelId]: {
          ...cur,
          messages: msgs,
          status: 'completed',
        },
      };
    });
  };

  // Core Concurrent Dispatcher: Send Prompt to all selected models simultaneously
  const handleSendConcurrentPrompt = async (promptText: string) => {
    if (!promptText.trim() || isStreaming || selectedModelIds.length === 0) return;

    setLastUserPrompt(promptText.trim());
    const nextRound = activeRound + 1;
    setActiveRound(nextRound);
    setIsStreaming(true);
    abortControllersRef.current = {};

    const timestamp = Date.now();
    const userMsgId = `user-${nextRound}-${timestamp}`;
    const assistantMsgId = `asst-${nextRound}-${timestamp}`;

    // 1. Initialize user prompt and empty pending assistant placeholder in all active sessions
    setSessions(prev => {
      const updated = { ...prev };
      selectedModelIds.forEach(modelId => {
        const currentSession = updated[modelId] || {
          modelId,
          messages: [],
          isStreaming: false,
          status: 'idle',
        };

        const userMsg: ChatMessage = {
          id: userMsgId,
          role: 'user',
          content: promptText,
          timestamp,
          roundIndex: nextRound,
          status: 'completed',
        };

        const assistantMsg: ChatMessage = {
          id: assistantMsgId,
          role: 'assistant',
          content: '',
          thinkingContent: '',
          timestamp,
          roundIndex: nextRound,
          status: 'streaming',
        };

        updated[modelId] = {
          ...currentSession,
          messages: [...currentSession.messages, userMsg, assistantMsg],
          isStreaming: true,
          status: 'streaming',
        };
      });
      return updated;
    });

    // 2. Dispatch postMessage to all real iframes
    selectedModelIds.forEach(modelId => {
      const iframe = document.getElementById(`iframe-${modelId}`) as HTMLIFrameElement | null;
      if (iframe?.contentWindow) {
        try {
          iframe.contentWindow.postMessage({
            type: 'OMNICOMPARE_EXECUTE_AUTOMATION',
            modelId,
            prompt: promptText
          }, '*');
        } catch (e) {}
      }
    });

    // Also broadcast via chrome.runtime if extension is installed
    if (typeof window !== 'undefined' && (window as any).chrome?.runtime?.sendMessage) {
      try {
        (window as any).chrome.runtime.sendMessage({
          type: 'DISPATCH_CONCURRENT_PROMPT',
          prompt: promptText,
          targetModels: selectedModelIds
        });
      } catch (e) {}
    }

    // 3. Set all automation states into pipeline execution
    setAutomationStates(prev => {
      const updated = { ...prev };
      selectedModelIds.forEach(modelId => {
        const cur = updated[modelId];
        if (cur) {
          updated[modelId] = {
            ...cur,
            currentStep: 'finding_input',
            progressPercent: 20,
            statusMessage: '并发定位输入框...',
            logs: [
              ...cur.logs,
              { time: getNowTimeString(), text: `[并发调度 第${nextRound}轮] 开始全自动 5 步流水线`, type: 'info' },
              { time: getNowTimeString(), text: `[1. 定位输入框] 找到选择器: ${SUPPORTED_MODELS.find(m => m.id === modelId)?.domSelectors.inputSelector}`, type: 'success' },
            ],
          };
        }
      });
      return updated;
    });

    // 3. Concurrently execute queries across all selected models in parallel
    const queryPromises = selectedModelIds.map(async modelId => {
      const history = sessions[modelId]?.messages || [];

      try {
        await executeModelQuery(modelId, promptText, history, nextRound, settings, {
          onThinkingChunk: chunk => {
            if (abortControllersRef.current[modelId]) return;
            setSessions(prev => {
              const session = prev[modelId];
              if (!session) return prev;
              const msgs = [...session.messages];
              const lastMsg = msgs[msgs.length - 1];
              if (lastMsg && lastMsg.role === 'assistant') {
                msgs[msgs.length - 1] = {
                  ...lastMsg,
                  thinkingContent: chunk,
                };
              }
              return { ...prev, [modelId]: { ...session, messages: msgs } };
            });

            setAutomationStates(prev => ({
              ...prev,
              [modelId]: {
                ...prev[modelId],
                currentStep: 'waiting_response',
                progressPercent: 75,
                statusMessage: '正在抓取思维链与回答流...',
                lastScrapedThinking: chunk,
              },
            }));
          },
          onContentChunk: chunk => {
            if (abortControllersRef.current[modelId]) return;
            setSessions(prev => {
              const session = prev[modelId];
              if (!session) return prev;
              const msgs = [...session.messages];
              const lastMsg = msgs[msgs.length - 1];
              if (lastMsg && lastMsg.role === 'assistant') {
                msgs[msgs.length - 1] = {
                  ...lastMsg,
                  content: chunk,
                };
              }
              return { ...prev, [modelId]: { ...session, messages: msgs } };
            });

            setAutomationStates(prev => ({
              ...prev,
              [modelId]: {
                ...prev[modelId],
                currentStep: 'waiting_response',
                progressPercent: 85,
                statusMessage: '正在抓取最新流式回答...',
                lastScrapedContent: chunk,
              },
            }));
          },
          onComplete: metrics => {
            setSessions(prev => {
              const session = prev[modelId];
              if (!session) return prev;
              const msgs = [...session.messages];
              const lastMsg = msgs[msgs.length - 1];
              if (lastMsg && lastMsg.role === 'assistant') {
                msgs[msgs.length - 1] = {
                  ...lastMsg,
                  status: 'completed',
                  latencyMs: metrics.latencyMs,
                  tokensPerSec: metrics.tokensPerSec,
                  totalTokens: metrics.totalTokens,
                };
              }
              return {
                ...prev,
                [modelId]: {
                  ...session,
                  messages: msgs,
                  isStreaming: false,
                  status: 'completed',
                  lastLatencyMs: metrics.latencyMs,
                  lastTokensPerSec: metrics.tokensPerSec,
                },
              };
            });

            setAutomationStates(prev => {
              const cur = prev[modelId];
              return {
                ...prev,
                [modelId]: {
                  ...cur,
                  currentStep: 'completed',
                  progressPercent: 100,
                  statusMessage: `完成抓取 (耗时: ${metrics.latencyMs}ms)`,
                  logs: [
                    ...cur.logs,
                    { time: getNowTimeString(), text: `[5. 获取结果完成] 响应耗时: ${metrics.latencyMs}ms, 吞吐速率: ${metrics.tokensPerSec} t/s`, type: 'success' },
                  ],
                },
              };
            });
          },
          onError: err => {
            setSessions(prev => {
              const session = prev[modelId];
              if (!session) return prev;
              const msgs = [...session.messages];
              const lastMsg = msgs[msgs.length - 1];
              if (lastMsg && lastMsg.role === 'assistant') {
                msgs[msgs.length - 1] = {
                  ...lastMsg,
                  status: 'error',
                  errorMessage: err,
                  content: `⚠️ 生成出错: ${err}`,
                };
              }
              return {
                ...prev,
                [modelId]: {
                  ...session,
                  messages: msgs,
                  isStreaming: false,
                  status: 'error',
                },
              };
            });

            setAutomationStates(prev => ({
              ...prev,
              [modelId]: {
                ...prev[modelId],
                currentStep: 'error',
                statusMessage: `错误: ${err}`,
                logs: [
                  ...prev[modelId].logs,
                  { time: getNowTimeString(), text: `[执行失败] ${err}`, type: 'error' },
                ],
              },
            }));
          },
        });
      } catch (err: any) {
        console.error(`Error querying model ${modelId}:`, err);
      }
    });

    await Promise.allSettled(queryPromises);
    setIsStreaming(false);

    // Save this round and captured URLs to session history list
    setSessions(latestSessions => {
      const roundResponses: Partial<Record<AIModelId, any>> = {};
      selectedModelIds.forEach(mId => {
        const s = latestSessions[mId];
        const lastMsg = s?.messages[s.messages.length - 1];
        const config = SUPPORTED_MODELS.find(m => m.id === mId);
        roundResponses[mId] = {
          content: lastMsg?.content || '',
          thinking: lastMsg?.thinkingContent,
          latencyMs: lastMsg?.latencyMs || s?.lastLatencyMs,
          tokensPerSec: lastMsg?.tokensPerSec || s?.lastTokensPerSec,
          conversationUrl: lastMsg?.conversationUrl || s?.conversationUrl || config?.webUrl,
        };
      });

      const newRoundEntry = {
        roundIndex: nextRound,
        userPrompt: promptText,
        timestamp,
        responses: roundResponses,
      };

      setHistoryList(prevHist => {
        let updated: SavedSessionHistory[];
        if (nextRound > 1 && prevHist.length > 0 && prevHist[0].roundsCount === nextRound - 1) {
          const first = { ...prevHist[0] };
          first.roundsCount = nextRound;
          first.rounds = [...first.rounds, newRoundEntry];
          updated = [first, ...prevHist.slice(1)];
        } else {
          const newSession: SavedSessionHistory = {
            id: `session-${timestamp}`,
            title: promptText.slice(0, 32) + (promptText.length > 32 ? '...' : ''),
            createdAt: timestamp,
            roundsCount: 1,
            models: [...selectedModelIds],
            rounds: [newRoundEntry],
          };
          updated = [newSession, ...prevHist];
        }
        try {
          localStorage.setItem('omnicompare_saved_history', JSON.stringify(updated));
        } catch (e) {}
        return updated;
      });

      return latestSessions;
    });
  };

  // Stop Generation
  const handleStopGeneration = () => {
    selectedModelIds.forEach(id => {
      abortControllersRef.current[id] = true;
    });
    setSessions(prev => {
      const updated = { ...prev };
      selectedModelIds.forEach(id => {
        if (updated[id]) {
          const msgs = [...updated[id].messages];
          const last = msgs[msgs.length - 1];
          if (last && last.status === 'streaming') {
            msgs[msgs.length - 1] = { ...last, status: 'completed' };
          }
          updated[id] = { ...updated[id], messages: msgs, isStreaming: false };
        }
      });
      return updated;
    });
    setIsStreaming(false);
  };

  // History session handlers
  const handleRestoreHistoricalSession = (histSession: SavedSessionHistory) => {
    if (!histSession.rounds || histSession.rounds.length === 0) return;
    const restored: Partial<Record<AIModelId, ModelSession>> = {};

    SUPPORTED_MODELS.forEach(m => {
      restored[m.id] = {
        modelId: m.id,
        messages: [],
        isStreaming: false,
        status: 'idle',
      };
    });

    histSession.rounds.forEach((round, rIdx) => {
      const rNum = round.roundIndex || rIdx + 1;
      const ts = round.timestamp || histSession.createdAt + rIdx * 60000;

      histSession.models.forEach(modelId => {
        if (restored[modelId]) {
          const userMsg: ChatMessage = {
            id: `hist-user-${rNum}-${ts}`,
            role: 'user',
            content: round.userPrompt,
            timestamp: ts,
            roundIndex: rNum,
            status: 'completed',
          };

          const respData = round.responses[modelId];
          const assistantMsg: ChatMessage = {
            id: `hist-asst-${rNum}-${ts}`,
            role: 'assistant',
            content: respData?.content || '',
            thinkingContent: respData?.thinking,
            timestamp: ts + 1000,
            roundIndex: rNum,
            status: 'completed',
            latencyMs: respData?.latencyMs,
            tokensPerSec: respData?.tokensPerSec,
            score: respData?.score,
            conversationUrl: respData?.conversationUrl,
          };

          restored[modelId]!.messages.push(userMsg, assistantMsg);
          if (respData?.conversationUrl) {
            restored[modelId]!.conversationUrl = respData.conversationUrl;
          }
        }
      });
    });

    setSelectedModelIds(histSession.models);
    setSessions(restored as Record<AIModelId, ModelSession>);
    setActiveRound(histSession.rounds.length);
    setIsHistoryModalOpen(false);
  };

  const handleDeleteHistorySession = (sessionId: string) => {
    const updated = historyList.filter(item => item.id !== sessionId);
    saveHistoryToStorage(updated);
  };

  const handleClearAllHistory = () => {
    saveHistoryToStorage([]);
  };

  const handleExportHistoricalSession = (histSession: SavedSessionHistory) => {
    setSessionToExportForModal(histSession);
    setIsHistoryModalOpen(false);
    setIsExportModalOpen(true);
  };

  // Clear all sessions
  const handleClearSessions = () => {
    const fresh: Partial<Record<AIModelId, ModelSession>> = {};
    SUPPORTED_MODELS.forEach(m => {
      fresh[m.id] = {
        modelId: m.id,
        messages: [],
        isStreaming: false,
        status: 'idle',
      };
    });
    setSessions(fresh as Record<AIModelId, ModelSession>);
    setActiveRound(0);
  };

  // Single Model Regenerate
  const handleRegenerateSingle = async (modelId: AIModelId, roundIndex: number) => {
    const session = sessions[modelId];
    if (!session) return;

    const userMsg = session.messages.filter(m => m.role === 'user')[roundIndex - 1];
    if (!userMsg) return;

    setSessions(prev => {
      const s = prev[modelId];
      if (!s) return prev;
      const msgs = [...s.messages];
      const asstIdx = msgs.findIndex(m => m.role === 'assistant' && m.roundIndex === roundIndex);
      if (asstIdx !== -1) {
        msgs[asstIdx] = {
          ...msgs[asstIdx],
          content: '',
          thinkingContent: '',
          status: 'streaming',
        };
      }
      return { ...prev, [modelId]: { ...s, messages: msgs, isStreaming: true } };
    });

    try {
      await executeModelQuery(modelId, userMsg.content, session.messages, roundIndex, settings, {
        onThinkingChunk: chunk => {
          setSessions(prev => {
            const s = prev[modelId];
            if (!s) return prev;
            const msgs = [...s.messages];
            const idx = msgs.findIndex(m => m.role === 'assistant' && m.roundIndex === roundIndex);
            if (idx !== -1) msgs[idx] = { ...msgs[idx], thinkingContent: chunk };
            return { ...prev, [modelId]: { ...s, messages: msgs } };
          });
        },
        onContentChunk: chunk => {
          setSessions(prev => {
            const s = prev[modelId];
            if (!s) return prev;
            const msgs = [...s.messages];
            const idx = msgs.findIndex(m => m.role === 'assistant' && m.roundIndex === roundIndex);
            if (idx !== -1) msgs[idx] = { ...msgs[idx], content: chunk };
            return { ...prev, [modelId]: { ...s, messages: msgs } };
          });
        },
        onComplete: metrics => {
          setSessions(prev => {
            const s = prev[modelId];
            if (!s) return prev;
            const msgs = [...s.messages];
            const idx = msgs.findIndex(m => m.role === 'assistant' && m.roundIndex === roundIndex);
            if (idx !== -1) {
              msgs[idx] = {
                ...msgs[idx],
                status: 'completed',
                latencyMs: metrics.latencyMs,
                tokensPerSec: metrics.tokensPerSec,
                totalTokens: metrics.totalTokens,
              };
            }
            return {
              ...prev,
              [modelId]: {
                ...s,
                messages: msgs,
                isStreaming: false,
                lastLatencyMs: metrics.latencyMs,
                lastTokensPerSec: metrics.tokensPerSec,
              },
            };
          });
        },
        onError: () => {},
      });
    } catch (e) {}
  };

  // Rate response (1-5 stars)
  const handleRateResponse = (modelId: AIModelId, messageId: string, rating: number) => {
    setSessions(prev => {
      const s = prev[modelId];
      if (!s) return prev;
      const msgs = s.messages.map(m => (m.id === messageId ? { ...m, score: rating } : m));
      return { ...prev, [modelId]: { ...s, messages: msgs } };
    });
  };

  // Toggle feedback (like / dislike)
  const handleToggleFeedback = (modelId: AIModelId, messageId: string, feedback: 'like' | 'dislike') => {
    setSessions(prev => {
      const s = prev[modelId];
      if (!s) return prev;
      const msgs = s.messages.map(m => {
        if (m.id === messageId) {
          const next = m.userFeedback === feedback ? null : feedback;
          return { ...m, userFeedback: next };
        }
        return m;
      });
      return { ...prev, [modelId]: { ...s, messages: msgs } };
    });
  };

  // Set as Elo winner
  const handleSetEloWinner = (winnerModelId: AIModelId, messageId: string, roundIndex: number) => {
    setSessions(prev => {
      const updated = { ...prev };
      selectedModelIds.forEach(id => {
        if (updated[id]) {
          const msgs = updated[id].messages.map(m => {
            if (m.roundIndex === roundIndex && m.role === 'assistant') {
              return { ...m, isEloWinner: id === winnerModelId && m.id === messageId };
            }
            return m;
          });
          updated[id] = { ...updated[id], messages: msgs };
        }
      });
      return updated;
    });
  };

  // Restore imported session
  const handleImportSession = (data: ExportSessionData) => {
    if (!data.rounds || data.rounds.length === 0) return;
    const restored: Partial<Record<AIModelId, ModelSession>> = {};

    SUPPORTED_MODELS.forEach(m => {
      restored[m.id] = {
        modelId: m.id,
        messages: [],
        isStreaming: false,
        status: 'idle',
      };
    });

    data.rounds.forEach((round, rIdx) => {
      const rNum = round.roundIndex || rIdx + 1;
      const timestamp = Date.now() - (data.rounds.length - rIdx) * 60000;

      data.models.forEach(modelId => {
        if (restored[modelId]) {
          const userMsg: ChatMessage = {
            id: `imported-user-${rNum}`,
            role: 'user',
            content: round.userPrompt,
            timestamp,
            roundIndex: rNum,
            status: 'completed',
          };

          const respData = round.responses[modelId];
          const assistantMsg: ChatMessage = {
            id: `imported-asst-${rNum}`,
            role: 'assistant',
            content: respData?.content || '',
            thinkingContent: respData?.thinking,
            timestamp: timestamp + 1000,
            roundIndex: rNum,
            status: 'completed',
            latencyMs: respData?.latencyMs,
            tokensPerSec: respData?.tokensPerSec,
            score: respData?.score,
          };

          restored[modelId]!.messages.push(userMsg, assistantMsg);
        }
      });
    });

    setSelectedModelIds(data.models);
    setSessions(restored as Record<AIModelId, ModelSession>);
    setActiveRound(data.rounds.length);
  };

  return (
    <div className="flex flex-col h-screen w-screen bg-[#F8FAFC] text-slate-800 overflow-hidden select-none">
      {/* Top Header Navbar */}
      <Navbar
        roundCount={activeRound}
        layoutMode={layoutMode}
        setLayoutMode={setLayoutMode}
        viewMode={viewMode}
        setViewMode={setViewMode}
        syncScroll={syncScroll}
        setSyncScroll={setSyncScroll}
        isFullscreen={isFullscreen}
        toggleFullscreen={toggleFullscreen}
        onOpenExtensionModal={() => setIsExtensionModalOpen(true)}
        onOpenEvaluationModal={() => setIsEvaluationModalOpen(true)}
        onOpenDiffModal={() => setIsDiffModalOpen(true)}
        onOpenExportModal={() => {
          setSessionToExportForModal(null);
          setIsExportModalOpen(true);
        }}
        onOpenHistoryModal={() => setIsHistoryModalOpen(true)}
        historyCount={historyList.length}
        onOpenSettingsModal={() => setIsSettingsModalOpen(true)}
        activeModelCount={selectedModelIds.length}
        totalModelCount={SUPPORTED_MODELS.length}
      />

      {/* Model Selector Bar */}
      <ModelSelectorBar
        selectedModelIds={selectedModelIds}
        onToggleModel={handleToggleModel}
        onSelectAll={handleSelectAll}
        onSelectRecommended={handleSelectRecommended}
        modelStreamingStatus={modelStreamingStatus}
      />

      {/* Main Workspace: IFrame Automation View vs Cards vs Split View */}
      {viewMode === 'iframe' && (
        <IFrameAutomationView
          selectedModelIds={selectedModelIds}
          automationStates={automationStates}
          sessions={sessions}
          currentPrompt={lastUserPrompt}
          layoutMode={layoutMode}
          onExecuteAutomation={handleExecuteAutomation}
          onExecuteStep={handleExecuteStep}
          onReloadIframe={handleReloadIframe}
          onOpenExtensionModal={() => setIsExtensionModalOpen(true)}
          onSyncScrapedToSession={handleSyncScrapedToSession}
        />
      )}

      {viewMode === 'cards' && (
        <ArenaColumns
          selectedModelIds={selectedModelIds}
          sessions={sessions}
          layoutMode={layoutMode}
          syncScroll={syncScroll}
          onRegenerateSingle={handleRegenerateSingle}
          onRateResponse={handleRateResponse}
          onToggleFeedback={handleToggleFeedback}
          onSetEloWinner={handleSetEloWinner}
          onQuickPromptClick={handleSendConcurrentPrompt}
          activeRound={activeRound}
        />
      )}

      {viewMode === 'split' && (
        <div className="flex-1 flex overflow-hidden bg-[#F1F5F9] border-t border-slate-200">
          {/* Left: Parsed Markdown Arena */}
          <div className="w-1/2 flex flex-col border-r border-slate-300">
            <div className="px-4 py-2 bg-white border-b border-slate-200 text-xs font-bold text-slate-700 flex items-center justify-between">
              <span>📊 结构化解析对比卡片 (Parsed View)</span>
              <span className="text-[10px] text-slate-400">支持 LaTeX 公式 / 思维链折叠 / Markdown</span>
            </div>
            <ArenaColumns
              selectedModelIds={selectedModelIds}
              sessions={sessions}
              layoutMode="2-col"
              syncScroll={syncScroll}
              onRegenerateSingle={handleRegenerateSingle}
              onRateResponse={handleRateResponse}
              onToggleFeedback={handleToggleFeedback}
              onSetEloWinner={handleSetEloWinner}
              onQuickPromptClick={handleSendConcurrentPrompt}
              activeRound={activeRound}
            />
          </div>

          {/* Right: Live IFrame Automation View */}
          <div className="w-1/2 flex flex-col">
            <div className="px-4 py-2 bg-white border-b border-slate-200 text-xs font-bold text-slate-700 flex items-center justify-between">
              <span>🌐 实时内嵌网页 DOM 自动化 (Live IFrame)</span>
              <span className="text-[10px] text-indigo-600 font-semibold">找输入框 → 填入词 → 发起对话 → 抓取结果</span>
            </div>
            <IFrameAutomationView
              selectedModelIds={selectedModelIds}
              automationStates={automationStates}
              sessions={sessions}
              currentPrompt={lastUserPrompt}
              layoutMode="2-col"
              onExecuteAutomation={handleExecuteAutomation}
              onExecuteStep={handleExecuteStep}
              onReloadIframe={handleReloadIframe}
              onOpenExtensionModal={() => setIsExtensionModalOpen(true)}
              onSyncScrapedToSession={handleSyncScrapedToSession}
            />
          </div>
        </div>
      )}

      {/* Bottom Synchronous Dispatch Bar */}
      <PromptInputBar
        onSend={handleSendConcurrentPrompt}
        onStop={handleStopGeneration}
        onClear={handleClearSessions}
        onOpenPresets={() => setIsPresetsModalOpen(true)}
        isStreaming={isStreaming}
        activeModelCount={selectedModelIds.length}
        currentRound={activeRound}
        systemPrompt={settings.systemPrompt}
        setSystemPrompt={p => setSettings(prev => ({ ...prev, systemPrompt: p }))}
      />

      {/* Modals */}
      <PromptPresetModal
        isOpen={isPresetsModalOpen}
        onClose={() => setIsPresetsModalOpen(false)}
        onSelectPrompt={(prompt, sysPrompt) => {
          if (sysPrompt) setSettings(prev => ({ ...prev, systemPrompt: sysPrompt }));
          handleSendConcurrentPrompt(prompt);
        }}
      />

      <DiffModal
        isOpen={isDiffModalOpen}
        onClose={() => setIsDiffModalOpen(false)}
        sessions={sessions}
        selectedModelIds={selectedModelIds}
        activeRound={activeRound}
      />

      <EvaluationModal
        isOpen={isEvaluationModalOpen}
        onClose={() => setIsEvaluationModalOpen(false)}
        sessions={sessions}
        selectedModelIds={selectedModelIds}
        activeRound={activeRound}
      />

      <ExportModal
        isOpen={isExportModalOpen}
        onClose={() => {
          setIsExportModalOpen(false);
          setSessionToExportForModal(null);
        }}
        sessions={sessions}
        selectedModelIds={selectedModelIds}
        activeRound={activeRound}
        onImportSession={handleImportSession}
        sessionToExport={sessionToExportForModal}
      />

      <HistoryModal
        isOpen={isHistoryModalOpen}
        onClose={() => setIsHistoryModalOpen(false)}
        historyList={historyList}
        onRestoreSession={handleRestoreHistoricalSession}
        onDeleteSession={handleDeleteHistorySession}
        onClearAllHistory={handleClearAllHistory}
        onExportSession={handleExportHistoricalSession}
      />

      <ExtensionModal
        isOpen={isExtensionModalOpen}
        onClose={() => setIsExtensionModalOpen(false)}
      />

      <SettingsModal
        isOpen={isSettingsModalOpen}
        onClose={() => setIsSettingsModalOpen(false)}
        settings={settings}
        setSettings={setSettings}
      />
    </div>
  );
}
