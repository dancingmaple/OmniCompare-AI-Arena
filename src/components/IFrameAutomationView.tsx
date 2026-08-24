import React, { useState } from 'react';
import {
  AIModelId,
  ModelAutomationState,
  AutomationStep,
  ModelSession,
  LayoutMode,
} from '../types/arena';
import { SUPPORTED_MODELS } from '../config/models';
import {
  ExternalLink,
  RotateCw,
  Play,
  Search,
  PenTool,
  Send,
  Download,
  Terminal,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Code,
  Sparkles,
  Layers,
  ChevronDown,
  ChevronUp,
  Sliders,
  Copy,
  Check,
  Edit3,
  FileText,
  X
} from 'lucide-react';
import { generateInPageAutomationScript } from '../services/iframeAutomationEngine';

interface IFrameAutomationViewProps {
  selectedModelIds: AIModelId[];
  automationStates: Record<AIModelId, ModelAutomationState>;
  sessions: Record<AIModelId, ModelSession>;
  currentPrompt: string;
  layoutMode: LayoutMode;
  onExecuteAutomation: (modelId: AIModelId, prompt: string) => void;
  onExecuteStep: (modelId: AIModelId, step: AutomationStep, prompt: string) => void;
  onReloadIframe: (modelId: AIModelId) => void;
  onOpenExtensionModal: () => void;
  onSyncScrapedToSession: (modelId: AIModelId, text: string, thinking?: string) => void;
}

const STEP_DEFINITIONS: { step: AutomationStep; label: string; icon: React.FC<{ className?: string }> }[] = [
  { step: 'finding_input', label: '1. 定位输入框', icon: Search },
  { step: 'filling_prompt', label: '2. 填入提示词', icon: PenTool },
  { step: 'submitting', label: '3. 发起对话', icon: Send },
  { step: 'waiting_response', label: '4. 等待结果', icon: RotateCw },
  { step: 'scraping_result', label: '5. 获取结果', icon: Download },
];

export const IFrameAutomationView: React.FC<IFrameAutomationViewProps> = ({
  selectedModelIds,
  automationStates,
  sessions,
  currentPrompt,
  layoutMode,
  onExecuteAutomation,
  onExecuteStep,
  onReloadIframe,
  onOpenExtensionModal,
  onSyncScrapedToSession,
}) => {
  const [activeTabByModel, setActiveTabByModel] = useState<Record<AIModelId, 'iframe' | 'logs' | 'selectors'>>({} as any);
  const [copiedScriptModel, setCopiedScriptModel] = useState<AIModelId | null>(null);
  const [copiedPromptModel, setCopiedPromptModel] = useState<AIModelId | null>(null);
  const [manualModalModel, setManualModalModel] = useState<AIModelId | null>(null);
  const [manualText, setManualText] = useState('');
  const [manualThinking, setManualThinking] = useState('');

  const getLayoutClasses = () => {
    switch (layoutMode) {
      case '2-col':
        return 'grid grid-cols-1 md:grid-cols-2';
      case '3-col':
        return 'grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3';
      case '4-col':
        return 'grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4';
      case '6-col':
        return 'grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-6';
      default:
        return 'grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3';
    }
  };

  const handleCopyScript = (modelId: AIModelId) => {
    const script = generateInPageAutomationScript(modelId, currentPrompt || '你好，请做个自我介绍');
    navigator.clipboard.writeText(script);
    setCopiedScriptModel(modelId);
    setTimeout(() => setCopiedScriptModel(null), 2000);
  };

  const handleCopyPrompt = (modelId: AIModelId) => {
    if (!currentPrompt) return;
    navigator.clipboard.writeText(currentPrompt);
    setCopiedPromptModel(modelId);
    setTimeout(() => setCopiedPromptModel(null), 2000);
  };

  const handleOpenManualModal = (modelId: AIModelId) => {
    const autoState = automationStates[modelId];
    const session = sessions[modelId];
    const lastAsst = session?.messages?.filter(m => m.role === 'assistant').pop();
    setManualText(autoState?.lastScrapedContent || lastAsst?.content || '');
    setManualThinking(autoState?.lastScrapedThinking || lastAsst?.thinkingContent || '');
    setManualModalModel(modelId);
  };

  const handleSaveManualModal = () => {
    if (manualModalModel) {
      onSyncScrapedToSession(manualModalModel, manualText.trim(), manualThinking.trim() || undefined);
      setManualModalModel(null);
    }
  };

  if (selectedModelIds.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-[#F8FAFC]">
        <div className="w-16 h-16 rounded-2xl bg-white border border-slate-200 shadow-sm flex items-center justify-center mb-4 text-indigo-500">
          <Layers className="w-8 h-8" />
        </div>
        <h3 className="text-lg font-bold text-slate-800 mb-1">未选择任何内嵌模型网页</h3>
        <p className="text-sm text-slate-500 max-w-md mb-4">
          请在上方模型栏中勾选模型，系统将直接在 IFrame 中加载官方 AI 对话页面并启动自动化流程。
        </p>
      </div>
    );
  }

  return (
    <div className={`flex-1 ${getLayoutClasses()} gap-4 p-4 overflow-y-auto bg-[#F1F5F9]`}>
      {selectedModelIds.map(modelId => {
        const config = SUPPORTED_MODELS.find(m => m.id === modelId);
        const autoState = automationStates[modelId] || {
          modelId,
          currentStep: 'idle',
          progressPercent: 0,
          statusMessage: '准备就绪，等待指令',
          isIframeLoaded: false,
          iframeKey: 0,
          inputFound: false,
          logs: [],
        };
        if (!config) return null;

        const activeTab = activeTabByModel[modelId] || 'iframe';
        const isRunning = autoState.currentStep !== 'idle' && autoState.currentStep !== 'completed' && autoState.currentStep !== 'error';
        const scrapedLength = autoState.lastScrapedContent ? autoState.lastScrapedContent.length : 0;

        return (
          <div
            key={modelId}
            className="flex flex-col h-[calc(100vh-140px)] min-h-[560px] bg-white rounded-xl shadow-xs border border-slate-200 hover:border-slate-300 transition-all overflow-hidden"
          >
            {/* 1. Header Bar */}
            <div className="p-3 border-b border-slate-100 flex items-center justify-between gap-2 shrink-0 bg-white">
              <div className="flex items-center gap-2.5 min-w-0">
                <div
                  className={`w-6 h-6 rounded-md bg-gradient-to-tr ${config.iconBg} text-white font-bold text-[10px] flex items-center justify-center shadow-xs shrink-0`}
                >
                  {config.avatarText.slice(0, 2)}
                </div>

                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="font-semibold text-sm text-slate-800 truncate">
                      {config.name}
                    </span>
                    <span className="text-[10px] bg-indigo-50 text-indigo-700 border border-indigo-200/60 px-1.5 py-0.5 rounded font-mono font-medium truncate">
                      IFrame 内嵌
                    </span>
                  </div>
                </div>
              </div>

              {/* View Switcher & Action buttons */}
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setActiveTabByModel(prev => ({ ...prev, [modelId]: 'iframe' }))}
                  className={`px-2 py-1 rounded text-xs font-medium transition-colors ${
                    activeTab === 'iframe'
                      ? 'bg-indigo-50 text-indigo-700 font-semibold'
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                  title="实时 IFrame 网页视图"
                >
                  网页视图
                </button>
                <button
                  onClick={() => setActiveTabByModel(prev => ({ ...prev, [modelId]: 'logs' }))}
                  className={`px-2 py-1 rounded text-xs font-medium transition-colors flex items-center gap-1 ${
                    activeTab === 'logs'
                      ? 'bg-indigo-50 text-indigo-700 font-semibold'
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                  title="DOM 自动化执行日志"
                >
                  <Terminal className="w-3 h-3" />
                  <span>日志</span>
                  {autoState.logs.length > 0 && (
                    <span className="text-[9px] bg-slate-200 text-slate-700 px-1 rounded-full font-mono">
                      {autoState.logs.length}
                    </span>
                  )}
                </button>
                <button
                  onClick={() => setActiveTabByModel(prev => ({ ...prev, [modelId]: 'selectors' }))}
                  className={`px-2 py-1 rounded text-xs font-medium transition-colors ${
                    activeTab === 'selectors'
                      ? 'bg-indigo-50 text-indigo-700 font-semibold'
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                  title="DOM 选择器配置"
                >
                  <Sliders className="w-3 h-3" />
                </button>

                {/* Reload */}
                <button
                  onClick={() => onReloadIframe(modelId)}
                  className="p-1 rounded text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
                  title="刷新 IFrame"
                >
                  <RotateCw className="w-3.5 h-3.5" />
                </button>

                {/* Open in new tab */}
                <a
                  href={config.webUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="p-1 rounded text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition-colors"
                  title={`在新标签页打开 ${config.name}`}
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
            </div>

            {/* 2. Automation Steps Progress Bar (5 Steps) */}
            <div className="px-3 py-2 bg-slate-50 border-b border-slate-100 flex flex-col gap-1.5 shrink-0">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-slate-700 flex items-center gap-1.5">
                  {isRunning ? (
                    <RotateCw className="w-3.5 h-3.5 text-indigo-600 animate-spin" />
                  ) : autoState.currentStep === 'completed' ? (
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  ) : (
                    <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                  )}
                  <span>自动化进度: {autoState.statusMessage}</span>
                </span>
                <span className="font-mono text-[11px] text-indigo-600 font-bold">
                  {autoState.progressPercent}%
                </span>
              </div>

              {/* 5 mini step indicators */}
              <div className="grid grid-cols-5 gap-1 pt-0.5">
                {STEP_DEFINITIONS.map((def, idx) => {
                  const stepIndex = STEP_DEFINITIONS.findIndex(s => s.step === autoState.currentStep);
                  const isDone = autoState.currentStep === 'completed' || (stepIndex > idx && autoState.currentStep !== 'idle');
                  const isCurrent = autoState.currentStep === def.step;

                  return (
                    <div
                      key={def.step}
                      className={`px-1.5 py-1 rounded text-[10px] font-medium flex items-center justify-center gap-1 transition-all ${
                        isDone
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : isCurrent
                          ? 'bg-indigo-600 text-white font-bold shadow-xs animate-pulse'
                          : 'bg-white text-slate-500 border border-slate-200'
                      }`}
                      title={def.label}
                    >
                      <def.icon className="w-2.5 h-2.5 shrink-0" />
                      <span className="truncate">{def.label.split(' ')[1]}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* 3. Action Toolbar (Execute Pipeline / Step-by-Step / Fallback) */}
            <div className="px-3 py-2 bg-white border-b border-slate-100 flex flex-wrap items-center justify-between gap-1.5 text-xs shrink-0">
              <div className="flex items-center gap-1 flex-wrap">
                {/* Auto Pilot Button */}
                <button
                  onClick={() => onExecuteAutomation(modelId, currentPrompt || '你好，请介绍一下你的核心优势')}
                  disabled={isRunning}
                  className="flex items-center gap-1 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white px-2.5 py-1 rounded-md text-[11px] font-bold shadow-2xs transition-all active:scale-95"
                >
                  <Play className="w-3 h-3 fill-white" />
                  <span>一键自动跑通</span>
                </button>

                {/* Step 3: Send */}
                <button
                  onClick={() => onExecuteStep(modelId, 'submitting', currentPrompt)}
                  className="px-2 py-1 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 rounded-md text-[11px] font-medium transition-colors"
                  title="点击发送"
                >
                  3.发送
                </button>

                {/* Step 5: Scrape */}
                <button
                  onClick={() => onExecuteStep(modelId, 'scraping_result', currentPrompt)}
                  className="px-2 py-1 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 rounded-md text-[11px] font-medium transition-colors flex items-center gap-1"
                  title="重新抓取页面回答"
                >
                  <Download className="w-3 h-3 text-indigo-600" />
                  <span>5.抓取</span>
                </button>

                {/* Fallback 1: Manual Paste/Edit */}
                <button
                  onClick={() => handleOpenManualModal(modelId)}
                  className="px-2 py-1 bg-amber-50 hover:bg-amber-100 border border-amber-200 text-amber-800 rounded-md text-[11px] font-semibold transition-colors flex items-center gap-1"
                  title="手动粘贴或补充模型回答（兜底）"
                >
                  <Edit3 className="w-3 h-3 text-amber-600" />
                  <span>📝 补充/粘贴</span>
                </button>
              </div>

              <div className="flex items-center gap-1">
                {/* Fallback 2: Copy Prompt */}
                <button
                  onClick={() => handleCopyPrompt(modelId)}
                  className="flex items-center gap-1 text-[11px] text-slate-500 hover:text-indigo-600 px-2 py-1 rounded hover:bg-indigo-50 transition-colors"
                  title="一键复制当前 Prompt"
                >
                  {copiedPromptModel === modelId ? (
                    <Check className="w-3 h-3 text-emerald-600" />
                  ) : (
                    <Copy className="w-3 h-3" />
                  )}
                  <span>{copiedPromptModel === modelId ? '已复制词' : '复制词'}</span>
                </button>

                {/* Copy Injection Script */}
                <button
                  onClick={() => handleCopyScript(modelId)}
                  className="flex items-center gap-1 text-[11px] text-slate-500 hover:text-indigo-600 px-2 py-1 rounded hover:bg-indigo-50 transition-colors"
                  title="复制此模型的独立自动化 JS 注入脚本"
                >
                  {copiedScriptModel === modelId ? (
                    <Check className="w-3 h-3 text-emerald-600" />
                  ) : (
                    <Code className="w-3 h-3" />
                  )}
                  <span>{copiedScriptModel === modelId ? '已复制脚本' : '脚本'}</span>
                </button>
              </div>
            </div>

            {/* 4. Tab Body Content */}
            <div className="flex-1 relative overflow-hidden bg-slate-50">
              {activeTab === 'iframe' && (
                <div className="w-full h-full relative flex flex-col">
                  {/* Extension Unblocker & Connection Reminder Banner */}
                  <div className="bg-indigo-50/90 border-b border-indigo-100 px-3 py-1.5 text-[11px] text-indigo-900 flex items-center justify-between shrink-0">
                    <div className="flex items-center gap-1.5 truncate">
                      <ShieldCheck className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                      <span className="truncate">
                        目标网页：<strong>{config.webUrl}</strong>
                      </span>
                    </div>
                    <div className="flex items-center gap-2 shrink-0 ml-2">
                      <a
                        href={config.webUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="text-indigo-700 hover:text-indigo-900 font-semibold flex items-center gap-1 bg-white/80 border border-indigo-200/80 px-2 py-0.5 rounded shadow-2xs text-[10px]"
                        title="如提示连接重置或未登录，点击在此新标签页登录后刷新即可联动"
                      >
                        <span>登录/重连</span>
                        <ExternalLink className="w-2.5 h-2.5" />
                      </a>
                      <button
                        onClick={onOpenExtensionModal}
                        className="text-indigo-700 hover:text-indigo-900 underline font-semibold text-[10px]"
                      >
                        配置插件解禁
                      </button>
                    </div>
                  </div>

                  {/* Real Live IFrame */}
                  <div className="flex-1 w-full relative bg-white">
                    <iframe
                      key={`${modelId}-${autoState.iframeKey}`}
                      id={`iframe-${modelId}`}
                      src={config.webUrl}
                      title={`IFrame - ${config.name}`}
                      className="w-full h-full border-0 absolute inset-0"
                      sandbox="allow-same-origin allow-scripts allow-forms allow-popups allow-modals allow-presentation allow-downloads"
                      allow="clipboard-read; clipboard-write; microphone; camera"
                    />

                    {/* Scraped Result Floating Badge (if extracted) */}
                    {autoState.lastScrapedContent && (
                      <div className="absolute bottom-3 left-3 right-3 bg-white/95 backdrop-blur-xs border border-indigo-200 rounded-xl p-3 shadow-lg z-10 animate-in fade-in slide-in-from-bottom-2">
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                            <span>最新抓取结果 ({autoState.lastScrapedContent.length} 字)</span>
                          </span>
                          <div className="flex items-center gap-1.5">
                            <button
                              onClick={() => handleOpenManualModal(modelId)}
                              className="bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] font-medium px-2 py-1 rounded-md transition-colors"
                            >
                              编辑
                            </button>
                            <button
                              onClick={() => onSyncScrapedToSession(modelId, autoState.lastScrapedContent!, autoState.lastScrapedThinking)}
                              className="bg-indigo-600 hover:bg-indigo-700 text-white text-[11px] font-bold px-2.5 py-1 rounded-md shadow-xs transition-colors"
                            >
                              同步至 Arena 对比
                            </button>
                          </div>
                        </div>
                        <p className="text-xs text-slate-600 line-clamp-2 font-mono">
                          {autoState.lastScrapedContent}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Automation Logs Tab */}
              {activeTab === 'logs' && (
                <div className="h-full p-3 font-mono text-xs overflow-y-auto space-y-1.5 bg-slate-900 text-slate-100">
                  <div className="flex items-center justify-between text-slate-400 text-[11px] pb-2 border-b border-slate-800">
                    <span>DOM 自动化调度执行日志</span>
                    <span>共 {autoState.logs.length} 条记录</span>
                  </div>

                  {autoState.logs.length === 0 ? (
                    <div className="h-48 flex items-center justify-center text-slate-500">
                      点击上方按钮触发定位、填充、发送或全流程自动化后即可在此查看详细步骤日志。
                    </div>
                  ) : (
                    autoState.logs.map((log, lIdx) => (
                      <div key={lIdx} className="leading-relaxed flex items-start gap-2">
                        <span className="text-slate-500 shrink-0 text-[10px]">{log.time}</span>
                        <span
                          className={`font-semibold shrink-0 text-[10px] ${
                            log.type === 'success'
                              ? 'text-emerald-400'
                              : log.type === 'error'
                              ? 'text-rose-400'
                              : log.type === 'warn'
                              ? 'text-amber-400'
                              : 'text-indigo-400'
                          }`}
                        >
                          [{log.type.toUpperCase()}]
                        </span>
                        <span className="text-slate-300 break-all">{log.text}</span>
                      </div>
                    ))
                  )}
                </div>
              )}

              {/* DOM Selectors Inspector Tab */}
              {activeTab === 'selectors' && (
                <div className="h-full p-4 overflow-y-auto space-y-3 text-xs bg-white">
                  <h4 className="font-bold text-slate-800 flex items-center gap-1.5">
                    <Sliders className="w-4 h-4 text-indigo-600" />
                    <span>{config.name} DOM 元素定位选择器配置</span>
                  </h4>

                  <div className="space-y-2.5">
                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">
                        1. 输入框定位选择器 (inputSelector)
                      </label>
                      <input
                        type="text"
                        readOnly
                        value={config.domSelectors.inputSelector}
                        className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 font-mono text-[11px] text-slate-800"
                      />
                    </div>

                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">
                        2. 发送按钮定位选择器 (submitSelector)
                      </label>
                      <input
                        type="text"
                        readOnly
                        value={config.domSelectors.submitSelector}
                        className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 font-mono text-[11px] text-slate-800"
                      />
                    </div>

                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">
                        3. AI 回答内容容器选择器 (responseSelector)
                      </label>
                      <input
                        type="text"
                        readOnly
                        value={config.domSelectors.responseSelector}
                        className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 font-mono text-[11px] text-slate-800"
                      />
                    </div>

                    {config.domSelectors.thinkingSelector && (
                      <div>
                        <label className="block font-semibold text-slate-700 mb-1">
                          4. 思维链 (CoT) 容器选择器 (thinkingSelector)
                        </label>
                        <input
                          type="text"
                          readOnly
                          value={config.domSelectors.thinkingSelector}
                          className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 font-mono text-[11px] text-slate-800"
                        />
                      </div>
                    )}
                  </div>

                  <div className="pt-2 border-t border-slate-100">
                    <button
                      onClick={() => handleCopyScript(modelId)}
                      className="w-full py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold rounded-lg border border-indigo-200 transition-colors flex items-center justify-center gap-1.5"
                    >
                      <Code className="w-3.5 h-3.5" />
                      <span>复制此模型完整 DOM 自动化注入代码</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        );
      })}

      {/* Manual Paste & Edit Fallback Modal */}
      {manualModalModel && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl border border-slate-200 flex flex-col gap-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <Edit3 className="w-5 h-5 text-indigo-600" />
                <h3 className="font-bold text-slate-800 text-base">
                  📝 手动补充/粘贴【{SUPPORTED_MODELS.find(m => m.id === manualModalModel)?.name}】回答
                </h3>
              </div>
              <button
                onClick={() => setManualModalModel(null)}
                className="text-slate-400 hover:text-slate-700 p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="text-xs text-slate-500">
              💡 当内嵌页面由于跨域或最新改版未能自动抓取完整时，您可直接将网页中的回答复制并粘贴到下方，系统将自动同步至 Arena 评测对比与导出文档中。
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  AI 回答正文 (Markdown / 纯文本)：
                </label>
                <textarea
                  rows={8}
                  value={manualText}
                  onChange={e => setManualText(e.target.value)}
                  placeholder="在此粘贴模型的完整回答内容..."
                  className="w-full text-xs font-mono p-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  思考过程 / 思维链（可选）：
                </label>
                <textarea
                  rows={2}
                  value={manualThinking}
                  onChange={e => setManualThinking(e.target.value)}
                  placeholder="在此粘贴模型的思考过程内容（可选）..."
                  className="w-full text-xs font-mono p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                onClick={() => setManualModalModel(null)}
                className="px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
              >
                取消
              </button>
              <button
                onClick={handleSaveManualModal}
                disabled={!manualText.trim()}
                className="px-5 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 rounded-xl shadow-xs transition-colors"
              >
                保存并同步 ({manualText.trim().length} 字)
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

