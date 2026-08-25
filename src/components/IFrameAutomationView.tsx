import React, { useState, useEffect, useRef } from 'react';
import {
  AIModelId,
  ModelAutomationState,
  AutomationStep,
  ModelSession,
  LayoutMode,
  IFrameCardStyleConfig
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
  X,
  Maximize2,
  Minimize2,
  ChevronLeft,
  ChevronRight,
  Palette,
  Eye,
  Clock,
  Zap,
  RefreshCw,
  AlertTriangle
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
  onTriggerRetryScrape?: (modelId?: AIModelId) => void;
  onCancelRetry?: (modelId: AIModelId) => void;
  onFixChatGPTBlank?: (modelId?: AIModelId) => void;
}

const STEP_DEFINITIONS: { step: AutomationStep; label: string; icon: React.FC<{ className?: string }> }[] = [
  { step: 'finding_input', label: '1. 定位输入框', icon: Search },
  { step: 'filling_prompt', label: '2. 填入提示词', icon: PenTool },
  { step: 'submitting', label: '3. 发起对话', icon: Send },
  { step: 'waiting_response', label: '4. 等待结果', icon: RotateCw },
  { step: 'scraping_result', label: '5. 获取结果', icon: Download },
];

const DEFAULT_STYLE_CONFIG: IFrameCardStyleConfig = {
  borderWidth: 2,
  borderColorMode: 'default',
  borderRadius: 12,
  cardHeight: 'standard',
  shadowStyle: 'sm'
};

const STORAGE_STYLE_KEY = 'omnicompare_iframe_style_v2';

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
  onTriggerRetryScrape,
  onCancelRetry,
  onFixChatGPTBlank,
}) => {
  const [activeTabByModel, setActiveTabByModel] = useState<Record<AIModelId, 'iframe' | 'logs' | 'selectors'>>({} as any);
  const [copiedScriptModel, setCopiedScriptModel] = useState<AIModelId | null>(null);
  const [copiedPromptModel, setCopiedPromptModel] = useState<AIModelId | null>(null);
  const [manualModalModel, setManualModalModel] = useState<AIModelId | null>(null);
  const [manualText, setManualText] = useState('');
  const [manualThinking, setManualThinking] = useState('');

  // Style customization state
  const [styleConfig, setStyleConfig] = useState<IFrameCardStyleConfig>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_STYLE_KEY);
      if (saved) return { ...DEFAULT_STYLE_CONFIG, ...JSON.parse(saved) };
    } catch (e) {}
    return DEFAULT_STYLE_CONFIG;
  });
  const [isStyleModalOpen, setIsStyleModalOpen] = useState(false);

  // Fullscreen Viewer state
  const [fullscreenModelId, setFullscreenModelId] = useState<AIModelId | null>(null);
  const touchStartXRef = useRef<number>(0);

  // Persist style config
  const updateStyleConfig = (updater: Partial<IFrameCardStyleConfig>) => {
    setStyleConfig(prev => {
      const next = { ...prev, ...updater };
      try {
        localStorage.setItem(STORAGE_STYLE_KEY, JSON.stringify(next));
      } catch (e) {}
      return next;
    });
  };

  // Keyboard navigation in Fullscreen (Left / Right / Escape)
  useEffect(() => {
    if (!fullscreenModelId) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') {
        e.preventDefault();
        switchFullscreenNext();
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        switchFullscreenPrev();
      } else if (e.key === 'Escape') {
        e.preventDefault();
        setFullscreenModelId(null);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [fullscreenModelId, selectedModelIds]);

  const switchFullscreenNext = () => {
    if (!fullscreenModelId || selectedModelIds.length === 0) return;
    const currentIndex = selectedModelIds.indexOf(fullscreenModelId);
    const nextIndex = (currentIndex + 1) % selectedModelIds.length;
    setFullscreenModelId(selectedModelIds[nextIndex]);
  };

  const switchFullscreenPrev = () => {
    if (!fullscreenModelId || selectedModelIds.length === 0) return;
    const currentIndex = selectedModelIds.indexOf(fullscreenModelId);
    const prevIndex = (currentIndex - 1 + selectedModelIds.length) % selectedModelIds.length;
    setFullscreenModelId(selectedModelIds[prevIndex]);
  };

  // Touch Swipe Handlers for Mobile / Touch screens
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartXRef.current = e.touches[0].clientX;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    const touchEndX = e.changedTouches[0].clientX;
    const diff = touchEndX - touchStartXRef.current;
    if (Math.abs(diff) > 60) {
      if (diff < 0) {
        switchFullscreenNext(); // Swipe Left -> Next Tab
      } else {
        switchFullscreenPrev(); // Swipe Right -> Previous Tab
      }
    }
  };

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

  const getCardHeightClass = () => {
    switch (styleConfig.cardHeight) {
      case 'compact':
        return 'h-[520px] min-h-[520px]';
      case 'tall':
        return 'h-[820px] min-h-[820px]';
      case 'full':
        return 'h-[calc(100vh-140px)] min-h-[560px]';
      case 'standard':
      default:
        return 'h-[680px] min-h-[560px]';
    }
  };

  const getCardStyle = (modelConfig: (typeof SUPPORTED_MODELS)[0]) => {
    const styles: React.CSSProperties = {
      borderRadius: `${styleConfig.borderRadius}px`,
      borderWidth: `${styleConfig.borderWidth}px`,
    };

    if (styleConfig.borderWidth === 0) {
      styles.borderStyle = 'none';
    } else {
      styles.borderStyle = 'solid';
      if (styleConfig.borderColorMode === 'indigo') {
        styles.borderColor = '#6366F1';
        styles.boxShadow = '0 4px 16px rgba(99, 102, 241, 0.15)';
      } else if (styleConfig.borderColorMode === 'accent') {
        styles.borderColor = modelConfig.accentColor || '#6366F1';
        styles.boxShadow = `0 4px 16px ${modelConfig.accentColor}25`;
      } else if (styleConfig.borderColorMode === 'glow') {
        styles.borderColor = '#818CF8';
        styles.boxShadow = '0 0 16px rgba(129, 140, 248, 0.35)';
      } else if (styleConfig.borderColorMode === 'dark') {
        styles.borderColor = '#0F172A';
        styles.boxShadow = '0 6px 20px rgba(15, 23, 42, 0.16)';
      } else {
        styles.borderColor = '#E2E8F0';
      }
    }

    return styles;
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

  const activeFullscreenConfig = fullscreenModelId ? SUPPORTED_MODELS.find(m => m.id === fullscreenModelId) : null;
  const activeFullscreenAutoState = fullscreenModelId ? automationStates[fullscreenModelId] : null;

  return (
    <div className="flex-1 flex flex-col min-h-0 relative bg-[#F1F5F9]">
      {/* Top Style & Control Quick Toolbar */}
      <div className="px-4 py-2 bg-white border-b border-slate-200 flex items-center justify-between gap-3 text-xs shrink-0 shadow-2xs">
        <div className="flex items-center gap-2 text-slate-600">
          <span className="font-semibold text-slate-800">🌐 实时内嵌 DOM 自动化与对战台</span>
          <span className="text-slate-300">|</span>
          <span>已激活 <strong>{selectedModelIds.length}</strong> 个模型 IFrame</span>
        </div>

        <div className="flex items-center gap-2">
          {/* Batch Retry Scrape Button */}
          {onTriggerRetryScrape && (
            <button
              onClick={() => onTriggerRetryScrape()}
              className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-semibold shadow-xs transition-all active:scale-95 cursor-pointer"
              title="对所有模型重新获取回答，若未获取到则在 1分钟、2分钟、3分钟 自动阶梯重试"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>🔄 全部重新获取回答 (1/2/3分重试)</span>
            </button>
          )}

          {/* Border Customizer Trigger */}
          <button
            onClick={() => setIsStyleModalOpen(true)}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium transition-colors cursor-pointer"
            title="自定义 IFrame 卡片边框大小、色系与圆角"
          >
            <Palette className="w-3.5 h-3.5 text-indigo-600" />
            <span>边框: {styleConfig.borderWidth}px / {styleConfig.borderColorMode}</span>
          </button>

          {/* Fullscreen Quick Button */}
          {selectedModelIds.length > 0 && (
            <button
              onClick={() => setFullscreenModelId(selectedModelIds[0])}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-semibold border border-indigo-200 transition-colors cursor-pointer"
              title="打开全屏沉浸式查看，支持左右滑动/Tab切换"
            >
              <Maximize2 className="w-3.5 h-3.5" />
              <span>全屏沉浸查看</span>
            </button>
          )}
        </div>
      </div>

      {/* Main Grid View */}
      <div className={`flex-1 ${getLayoutClasses()} gap-4 p-4 overflow-y-auto`}>
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

          return (
            <div
              key={modelId}
              style={getCardStyle(config)}
              className={`flex flex-col ${getCardHeightClass()} bg-white transition-all overflow-hidden`}
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
                    className={`px-2 py-1 rounded text-xs font-medium transition-colors cursor-pointer ${
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
                    className={`px-2 py-1 rounded text-xs font-medium transition-colors flex items-center gap-1 cursor-pointer ${
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
                    className={`px-2 py-1 rounded text-xs font-medium transition-colors cursor-pointer ${
                      activeTab === 'selectors'
                        ? 'bg-indigo-50 text-indigo-700 font-semibold'
                        : 'text-slate-500 hover:text-slate-800'
                    }`}
                    title="DOM 选择器配置"
                  >
                    <Sliders className="w-3 h-3" />
                  </button>

                  {/* Fullscreen Button */}
                  <button
                    onClick={() => setFullscreenModelId(modelId)}
                    className="p-1 rounded text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition-colors cursor-pointer"
                    title="全屏查看并左右滑动切换"
                  >
                    <Maximize2 className="w-3.5 h-3.5 text-indigo-600" />
                  </button>

                  {/* Reload */}
                  <button
                    onClick={() => onReloadIframe(modelId)}
                    className="p-1 rounded text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
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
                    className="flex items-center gap-1 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white px-2.5 py-1 rounded-md text-[11px] font-bold shadow-2xs transition-all active:scale-95 cursor-pointer"
                  >
                    <Play className="w-3 h-3 fill-white" />
                    <span>一键自动跑通</span>
                  </button>

                  {/* Step 3: Send */}
                  <button
                    onClick={() => onExecuteStep(modelId, 'submitting', currentPrompt)}
                    className="px-2 py-1 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 rounded-md text-[11px] font-medium transition-colors cursor-pointer"
                    title="点击发送"
                  >
                    3.发送
                  </button>

                  {/* Step 5: Scrape */}
                  <button
                    onClick={() => onExecuteStep(modelId, 'scraping_result', currentPrompt)}
                    className="px-2 py-1 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 rounded-md text-[11px] font-medium transition-colors flex items-center gap-1 cursor-pointer"
                    title="重新抓取页面回答（若未获取到则在1/2/3分钟自动重试）"
                  >
                    <Download className="w-3 h-3 text-indigo-600" />
                    <span>5.抓取</span>
                  </button>

                  {/* Fallback 1: Manual Paste/Edit */}
                  <button
                    onClick={() => handleOpenManualModal(modelId)}
                    className="px-2 py-1 bg-amber-50 hover:bg-amber-100 border border-amber-200 text-amber-800 rounded-md text-[11px] font-semibold transition-colors flex items-center gap-1 cursor-pointer"
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
                    className="flex items-center gap-1 text-[11px] text-slate-500 hover:text-indigo-600 px-2 py-1 rounded hover:bg-indigo-50 transition-colors cursor-pointer"
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
                    className="flex items-center gap-1 text-[11px] text-slate-500 hover:text-indigo-600 px-2 py-1 rounded hover:bg-indigo-50 transition-colors cursor-pointer"
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

              {/* 3.1 Auto-Retry Ladder Status Capsule (1min, 2min, 3min) */}
              {autoState.isRetrying && autoState.nextRetrySeconds !== undefined && (
                <div className="px-3 py-2 bg-gradient-to-r from-amber-500/10 via-amber-400/10 to-orange-500/10 border-b border-amber-200 flex items-center justify-between gap-2 text-xs">
                  <div className="flex items-center gap-2 text-amber-900 font-medium min-w-0">
                    <span className="relative flex h-2.5 w-2.5 shrink-0">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-amber-500"></span>
                    </span>
                    <span className="truncate">
                      未检测到回答，将在 <strong className="font-mono text-amber-700 font-bold">{autoState.nextRetrySeconds}s</strong> 后第 <strong>{autoState.retryCount || 1}</strong> 次自动重新获取 (1/2/3分钟阶梯轮询)
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      onClick={() => onExecuteStep(modelId, 'scraping_result', currentPrompt)}
                      className="px-2 py-0.5 bg-amber-600 hover:bg-amber-700 text-white rounded font-bold text-[10px] shadow-2xs cursor-pointer"
                    >
                      立即抓取
                    </button>
                    {onCancelRetry && (
                      <button
                        onClick={() => onCancelRetry(modelId)}
                        className="px-1.5 py-0.5 bg-white border border-amber-300 text-amber-800 hover:bg-amber-50 rounded text-[10px] cursor-pointer"
                      >
                        停止重试
                      </button>
                    )}
                  </div>
                </div>
              )}

              {/* 3.2 ChatGPT Blank Screen Rescue Banner */}
              {modelId === 'chatgpt' && (
                <div className="bg-emerald-50/90 border-b border-emerald-200/90 px-3 py-1.5 text-[11px] text-emerald-950 flex items-center justify-between shrink-0">
                  <div className="flex items-center gap-1.5 truncate">
                    <Zap className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <span className="font-semibold text-emerald-900">ChatGPT 白屏/转圈自愈：</span>
                    <span className="text-emerald-700 text-[10px] hidden md:inline">若卡在加载中，点击右侧解除防嵌入检测</span>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      onClick={() => onFixChatGPTBlank ? onFixChatGPTBlank(modelId) : onReloadIframe(modelId)}
                      className="flex items-center gap-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-2 py-0.5 rounded text-[10px] shadow-2xs transition-colors cursor-pointer"
                      title="重载 ChatGPT 并注入防沙箱拦截补丁"
                    >
                      <RotateCw className="w-2.5 h-2.5" />
                      <span>强制解除白屏</span>
                    </button>
                    <a
                      href="https://chatgpt.com/"
                      target="_blank"
                      rel="noreferrer"
                      className="text-emerald-800 hover:text-emerald-950 flex items-center gap-1 bg-white border border-emerald-300 px-1.5 py-0.5 rounded text-[10px] font-medium"
                      title="在新标签页登录 OpenAI 账号"
                    >
                      <span>新标签登录</span>
                      <ExternalLink className="w-2.5 h-2.5" />
                    </a>
                  </div>
                </div>
              )}

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
                          className="text-indigo-700 hover:text-indigo-900 underline font-semibold text-[10px] cursor-pointer"
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
                                className="bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] font-medium px-2 py-1 rounded-md transition-colors cursor-pointer"
                              >
                                编辑
                              </button>
                              <button
                                onClick={() => onSyncScrapedToSession(modelId, autoState.lastScrapedContent!, autoState.lastScrapedThinking)}
                                className="bg-indigo-600 hover:bg-indigo-700 text-white text-[11px] font-bold px-2.5 py-1 rounded-md shadow-xs transition-colors cursor-pointer"
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
                        className="w-full py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold rounded-lg border border-indigo-200 transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
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
      </div>

      {/* Style & Border Customizer Modal */}
      {isStyleModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 flex flex-col gap-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <Palette className="w-5 h-5 text-indigo-600" />
                <h3 className="font-bold text-slate-800 text-base">🎨 IFrame 边框大小与视觉风格自定义</h3>
              </div>
              <button
                onClick={() => setIsStyleModalOpen(false)}
                className="text-slate-400 hover:text-slate-700 p-1 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              {/* Border Width */}
              <div>
                <label className="block font-bold text-slate-700 mb-2">1. 边框粗细 (Border Width)</label>
                <div className="grid grid-cols-5 gap-1.5">
                  {[0, 1, 2, 3, 4].map(w => (
                    <button
                      key={w}
                      onClick={() => updateStyleConfig({ borderWidth: w })}
                      className={`py-2 px-2 rounded-xl font-semibold border text-center transition-all cursor-pointer ${
                        styleConfig.borderWidth === w
                          ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                          : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      {w === 0 ? '无边框' : `${w}px`}
                    </button>
                  ))}
                </div>
              </div>

              {/* Border Style / Color Mode */}
              <div>
                <label className="block font-bold text-slate-700 mb-2">2. 边框色系风格 (Border Color)</label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: 'default', label: '默认灰白' },
                    { id: 'indigo', label: '品牌紫蓝' },
                    { id: 'accent', label: '模型专属色' },
                    { id: 'glow', label: '炫彩极光' },
                    { id: 'dark', label: '沉浸深黑' },
                  ].map(item => (
                    <button
                      key={item.id}
                      onClick={() => updateStyleConfig({ borderColorMode: item.id as any })}
                      className={`py-2 px-2.5 rounded-xl font-semibold border text-center transition-all cursor-pointer ${
                        styleConfig.borderColorMode === item.id
                          ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                          : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Border Radius */}
              <div>
                <label className="block font-bold text-slate-700 mb-2">3. 圆角大小 (Border Radius)</label>
                <div className="grid grid-cols-5 gap-1.5">
                  {[0, 8, 12, 16, 24].map(r => (
                    <button
                      key={r}
                      onClick={() => updateStyleConfig({ borderRadius: r })}
                      className={`py-2 px-2 rounded-xl font-semibold border text-center transition-all cursor-pointer ${
                        styleConfig.borderRadius === r
                          ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                          : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      {r === 0 ? '直角' : `${r}px`}
                    </button>
                  ))}
                </div>
              </div>

              {/* Card Height */}
              <div>
                <label className="block font-bold text-slate-700 mb-2">4. 卡片高度 (Card Height)</label>
                <div className="grid grid-cols-4 gap-1.5">
                  {[
                    { id: 'compact', label: '紧凑 (520px)' },
                    { id: 'standard', label: '标准 (680px)' },
                    { id: 'tall', label: '扩展 (820px)' },
                    { id: 'full', label: '填满窗口' },
                  ].map(item => (
                    <button
                      key={item.id}
                      onClick={() => updateStyleConfig({ cardHeight: item.id as any })}
                      className={`py-2 px-1 rounded-xl font-semibold border text-center text-[11px] transition-all cursor-pointer ${
                        styleConfig.cardHeight === item.id
                          ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                          : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-3 border-t border-slate-100">
              <button
                onClick={() => setIsStyleModalOpen(false)}
                className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs shadow-xs cursor-pointer"
              >
                完成设置
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Fullscreen Modal Viewer with Tabs & Left/Right Swipe */}
      {fullscreenModelId && activeFullscreenConfig && (
        <div
          className="fixed inset-0 bg-slate-950 z-50 flex flex-col animate-in fade-in"
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
        >
          {/* Fullscreen Top Navigation Bar */}
          <div className="bg-slate-900 border-b border-slate-800 px-4 py-2.5 flex items-center justify-between gap-3 text-white shrink-0 z-20">
            {/* Left: Active Model Identity */}
            <div className="flex items-center gap-2.5 min-w-0">
              <div
                className={`w-7 h-7 rounded-lg bg-gradient-to-tr ${activeFullscreenConfig.iconBg} text-white font-bold text-xs flex items-center justify-center shadow-xs shrink-0`}
              >
                {activeFullscreenConfig.avatarText.slice(0, 2)}
              </div>
              <div className="flex items-center gap-2 truncate">
                <span className="font-bold text-sm text-slate-100 truncate">{activeFullscreenConfig.name}</span>
                <span className="text-[10px] bg-slate-800 text-slate-300 px-2 py-0.5 rounded-full border border-slate-700 font-mono hidden sm:inline">
                  全屏对战视图
                </span>
              </div>
            </div>

            {/* Center: Tabs Strip for all active models */}
            <div className="flex items-center gap-1.5 overflow-x-auto max-w-[55%] py-0.5 px-2 bg-slate-950/60 rounded-xl border border-slate-800">
              {selectedModelIds.map(mId => {
                const cfg = SUPPORTED_MODELS.find(m => m.id === mId);
                if (!cfg) return null;
                const isActive = mId === fullscreenModelId;

                return (
                  <button
                    key={mId}
                    onClick={() => setFullscreenModelId(mId)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                      isActive
                        ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                        : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                    }`}
                  >
                    <span className="w-2 h-2 rounded-full" style={{ background: cfg.accentColor || '#818CF8' }} />
                    <span>{cfg.name}</span>
                  </button>
                );
              })}
            </div>

            {/* Right: Actions */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => onExecuteAutomation(fullscreenModelId, currentPrompt || '你好，请做个自我介绍')}
                className="hidden md:flex items-center gap-1 bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-1.5 rounded-lg text-xs font-bold transition-all shadow-xs cursor-pointer"
              >
                <Play className="w-3 h-3 fill-white" />
                <span>执行</span>
              </button>

              <button
                onClick={() => onExecuteStep(fullscreenModelId, 'scraping_result', currentPrompt)}
                className="hidden md:flex items-center gap-1 bg-slate-800 hover:bg-slate-700 text-slate-200 px-2.5 py-1.5 rounded-lg text-xs font-semibold border border-slate-700 transition-colors cursor-pointer"
                title="重新抓取页面回答"
              >
                <Download className="w-3 h-3 text-indigo-400" />
                <span>抓取</span>
              </button>

              <button
                onClick={() => handleOpenManualModal(fullscreenModelId)}
                className="hidden md:flex items-center gap-1 bg-slate-800 hover:bg-slate-700 text-amber-400 px-2.5 py-1.5 rounded-lg text-xs font-semibold border border-slate-700 transition-colors cursor-pointer"
                title="手动粘贴补充回答"
              >
                <Edit3 className="w-3 h-3" />
                <span>补充</span>
              </button>

              <button
                onClick={() => onReloadIframe(fullscreenModelId)}
                className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg border border-slate-700 transition-colors cursor-pointer"
                title="刷新当前页面"
              >
                <RotateCw className="w-3.5 h-3.5" />
              </button>

              <a
                href={activeFullscreenConfig.webUrl}
                target="_blank"
                rel="noreferrer"
                className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg border border-slate-700 transition-colors"
                title="在独立新窗口打开"
              >
                <ExternalLink className="w-3.5 h-3.5" />
              </a>

              <button
                onClick={() => setFullscreenModelId(null)}
                className="flex items-center gap-1 bg-rose-600 hover:bg-rose-700 text-white px-3 py-1.5 rounded-lg text-xs font-bold transition-all shadow-xs ml-1 cursor-pointer"
                title="退出全屏 (ESC)"
              >
                <Minimize2 className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">退出全屏</span>
              </button>
            </div>
          </div>

          {/* Fullscreen Body with Floating Left/Right Navigation Arrows */}
          <div className="flex-1 relative w-full h-full bg-white overflow-hidden">
            {/* Left Arrow Button */}
            <button
              onClick={switchFullscreenPrev}
              className="absolute left-0 top-1/2 -translate-y-1/2 w-12 h-20 bg-slate-900/70 hover:bg-indigo-600/90 text-white flex items-center justify-center rounded-r-2xl z-30 transition-all backdrop-blur-xs border-r border-t border-b border-white/10 group shadow-xl cursor-pointer"
              title="切换至上一个模型 (快捷键: ← 键)"
            >
              <ChevronLeft className="w-7 h-7 group-hover:-translate-x-1 transition-transform" />
            </button>

            {/* Right Arrow Button */}
            <button
              onClick={switchFullscreenNext}
              className="absolute right-0 top-1/2 -translate-y-1/2 w-12 h-20 bg-slate-900/70 hover:bg-indigo-600/90 text-white flex items-center justify-center rounded-l-2xl z-30 transition-all backdrop-blur-xs border-l border-t border-b border-white/10 group shadow-xl cursor-pointer"
              title="切换至下一个模型 (快捷键: → 键)"
            >
              <ChevronRight className="w-7 h-7 group-hover:translate-x-1 transition-transform" />
            </button>

            {/* Live Fullscreen IFrame */}
            <iframe
              key={`fullscreen-${fullscreenModelId}-${activeFullscreenAutoState?.iframeKey || 0}`}
              id={`fullscreen-iframe-${fullscreenModelId}`}
              src={activeFullscreenConfig.webUrl}
              title={`Fullscreen - ${activeFullscreenConfig.name}`}
              className="w-full h-full border-0 absolute inset-0"
              sandbox="allow-same-origin allow-scripts allow-forms allow-popups allow-modals allow-presentation allow-downloads"
              allow="clipboard-read; clipboard-write; microphone; camera"
            />
          </div>
        </div>
      )}

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
                className="text-slate-400 hover:text-slate-700 p-1 rounded-lg cursor-pointer"
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
                className="px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
              >
                取消
              </button>
              <button
                onClick={handleSaveManualModal}
                disabled={!manualText.trim()}
                className="px-5 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 rounded-xl shadow-xs transition-colors cursor-pointer"
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
