import React, { useRef, useState } from 'react';
import {
  AIModelId,
  ModelSession,
  ChatMessage,
  LayoutMode,
} from '../types/arena';
import { SUPPORTED_MODELS } from '../config/models';
import { MarkdownRenderer } from './MarkdownRenderer';
import {
  BrainCircuit,
  ChevronDown,
  ChevronUp,
  Clock,
  Zap,
  Copy,
  Check,
  RotateCw,
  ThumbsUp,
  ThumbsDown,
  Star,
  Award,
  ExternalLink,
  MessageSquare,
  Sparkles,
  Globe
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface ArenaColumnsProps {
  selectedModelIds: AIModelId[];
  sessions: Record<AIModelId, ModelSession>;
  layoutMode: LayoutMode;
  syncScroll: boolean;
  onRegenerateSingle: (modelId: AIModelId, roundIndex: number) => void;
  onRateResponse: (modelId: AIModelId, messageId: string, rating: number) => void;
  onToggleFeedback: (modelId: AIModelId, messageId: string, feedback: 'like' | 'dislike') => void;
  onSetEloWinner: (modelId: AIModelId, messageId: string, roundIndex: number) => void;
  onQuickPromptClick: (prompt: string) => void;
  activeRound: number;
}

export const ArenaColumns: React.FC<ArenaColumnsProps> = ({
  selectedModelIds,
  sessions,
  layoutMode,
  syncScroll,
  onRegenerateSingle,
  onRateResponse,
  onToggleFeedback,
  onSetEloWinner,
  onQuickPromptClick,
  activeRound,
}) => {
  const columnRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const isScrollingRef = useRef(false);
  const [expandedThinking, setExpandedThinking] = useState<Record<string, boolean>>({});
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Link scroll across all active column containers
  const handleScroll = (sourceId: string, event: React.UIEvent<HTMLDivElement>) => {
    if (!syncScroll || isScrollingRef.current) return;
    isScrollingRef.current = true;

    const sourceEl = event.currentTarget;
    const scrollPercentage = sourceEl.scrollTop / (sourceEl.scrollHeight - sourceEl.clientHeight || 1);

    selectedModelIds.forEach(id => {
      if (id !== sourceId) {
        const targetEl = columnRefs.current[id];
        if (targetEl) {
          targetEl.scrollTop = scrollPercentage * (targetEl.scrollHeight - targetEl.clientHeight);
        }
      }
    });

    setTimeout(() => {
      isScrollingRef.current = false;
    }, 40);
  };

  const toggleThinking = (key: string) => {
    setExpandedThinking(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const triggerWinnerConfetti = (modelId: AIModelId, messageId: string, roundIndex: number) => {
    onSetEloWinner(modelId, messageId, roundIndex);
    confetti({
      particleCount: 80,
      spread: 70,
      origin: { y: 0.6 },
      colors: ['#4F46E5', '#10B981', '#F59E0B', '#6366F1']
    });
  };

  // Determine grid / column layout classes
  const getLayoutClasses = () => {
    switch (layoutMode) {
      case '2-col':
        return 'grid grid-cols-1 md:grid-cols-2';
      case '3-col':
        return 'grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3';
      case '4-col':
        return 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4';
      case '6-col':
        return 'grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-6';
      case 'grid':
        return 'grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3';
      default:
        return 'grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3';
    }
  };

  if (selectedModelIds.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-[#F8FAFC]">
        <div className="w-16 h-16 rounded-2xl bg-white border border-slate-200 shadow-sm flex items-center justify-center mb-4 text-indigo-500">
          <MessageSquare className="w-8 h-8" />
        </div>
        <h3 className="text-lg font-bold text-slate-800 mb-1">未选择任何并发模型</h3>
        <p className="text-sm text-slate-500 max-w-md mb-4">
          请在上方模型栏中勾选模型，即可一键并发发起对话并进行分栏实时对比。
        </p>
      </div>
    );
  }

  return (
    <div className={`flex-1 ${getLayoutClasses()} gap-4 p-4 overflow-hidden bg-[#F1F5F9]`}>
      {selectedModelIds.map(modelId => {
        const config = SUPPORTED_MODELS.find(m => m.id === modelId);
        const session = sessions[modelId] || { modelId, messages: [], isStreaming: false, status: 'idle' };
        if (!config) return null;

        const hasWinner = session.messages.some(m => m.isEloWinner);

        return (
          <div
            key={modelId}
            className={`flex flex-col h-[calc(100vh-140px)] min-h-[480px] bg-white rounded-xl shadow-xs border transition-all overflow-hidden ${
              hasWinner ? 'border-indigo-300 ring-2 ring-indigo-500/20' : 'border-slate-200 hover:border-slate-300'
            }`}
          >
            {/* Column Header */}
            <div className="p-3 border-b border-slate-100 flex items-center justify-between gap-2 shrink-0 bg-white">
              <div className="flex items-center gap-2.5 min-w-0">
                {/* Model Avatar */}
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
                    <span className="text-[10px] text-slate-400 font-mono hidden sm:inline truncate">
                      {config.subName}
                    </span>
                  </div>
                  <div className="text-[10px] text-slate-400 flex items-center gap-1">
                    <span>{config.company}</span>
                  </div>
                </div>
              </div>

              {/* Header Right Stats */}
              <div className="flex items-center gap-1.5 shrink-0">
                {session.lastLatencyMs !== undefined && (
                  <div className="flex items-center gap-1 text-[10px] font-mono text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full border border-slate-200">
                    <Clock className="w-3 h-3 text-slate-400" />
                    <span>{session.lastLatencyMs}ms</span>
                  </div>
                )}

                {session.lastTokensPerSec !== undefined && (
                  <div className="hidden sm:flex items-center gap-1 text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200/60">
                    <Zap className="w-3 h-3 text-emerald-500" />
                    <span>{session.lastTokensPerSec}t/s</span>
                  </div>
                )}

                <a
                  href={config.webUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="text-slate-400 hover:text-indigo-600 transition-colors p-1"
                  title={`在独立标签页打开 ${config.name}`}
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
            </div>

            {/* Conversation Timeline */}
            <div
              ref={el => { columnRefs.current[modelId] = el; }}
              onScroll={e => handleScroll(modelId, e)}
              className="flex-1 overflow-y-auto p-3.5 space-y-4 text-xs md:text-sm bg-white"
            >
              {session.messages.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center p-4 text-slate-400">
                  <div className="w-10 h-10 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-center mb-3 text-indigo-500">
                    <Sparkles className="w-5 h-5" />
                  </div>
                  <h4 className="font-semibold text-slate-700 mb-1 text-sm">{config.name} 就绪</h4>
                  <p className="text-xs text-slate-400 max-w-xs mb-3">
                    {config.description}
                  </p>
                  <div className="flex flex-wrap gap-1.5 justify-center max-w-xs">
                    {config.tags.map((tag, tIdx) => (
                      <span
                        key={tIdx}
                        className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full border border-slate-200"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              ) : (
                session.messages.map((msg, mIdx) => {
                  const isUser = msg.role === 'user';
                  const thinkingKey = `${modelId}-${msg.id}`;
                  const isThinkingOpen = expandedThinking[thinkingKey] ?? true;

                  if (isUser) {
                    return (
                      <div key={msg.id || mIdx} className="flex flex-col items-end">
                        <div className="flex items-center gap-1.5 text-[10px] text-slate-400 mb-1">
                          <span>第 {msg.roundIndex} 轮提问</span>
                          <span>•</span>
                          <span>{new Date(msg.timestamp).toLocaleTimeString()}</span>
                        </div>
                        <div className="max-w-[92%] bg-slate-50 border border-slate-200 text-slate-800 px-3.5 py-2.5 rounded-xl shadow-2xs text-[13px] leading-relaxed">
                          {msg.content}
                        </div>
                      </div>
                    );
                  }

                  // Assistant message
                  return (
                    <div key={msg.id || mIdx} className="flex flex-col space-y-2">
                      {/* DeepSeek R1 / Gemini Thinking Process Box */}
                      {msg.thinkingContent && (
                        <div className="border border-indigo-100 bg-indigo-50/40 rounded-xl overflow-hidden">
                          <button
                            onClick={() => toggleThinking(thinkingKey)}
                            className="w-full flex items-center justify-between px-3 py-1.5 bg-indigo-50/70 text-[11px] text-indigo-700 font-medium hover:bg-indigo-100/50 transition-colors"
                          >
                            <span className="flex items-center gap-1.5">
                              <BrainCircuit className="w-3.5 h-3.5 text-indigo-600" />
                              <span>思考推理过程 (CoT Reasoning)</span>
                            </span>
                            {isThinkingOpen ? (
                              <ChevronUp className="w-3.5 h-3.5" />
                            ) : (
                              <ChevronDown className="w-3.5 h-3.5" />
                            )}
                          </button>

                          {isThinkingOpen && (
                            <div className="p-3 text-xs font-mono text-slate-600 bg-slate-50/80 border-t border-indigo-100/60 whitespace-pre-wrap leading-relaxed">
                              {msg.thinkingContent}
                            </div>
                          )}
                        </div>
                      )}

                      {/* Main Markdown Body */}
                      <div className="bg-white border border-slate-100 rounded-xl p-3.5 text-slate-800">
                        {msg.status === 'streaming' && !msg.content ? (
                          <div className="flex items-center gap-2 text-xs text-slate-400 py-2">
                            <RotateCw className="w-3.5 h-3.5 text-indigo-600 animate-spin" />
                            <span>模型正在并发思考与组织语言...</span>
                          </div>
                        ) : (
                          <MarkdownRenderer
                            content={msg.content}
                            isStreaming={msg.status === 'streaming'}
                          />
                        )}
                      </div>

                      {/* Message Footer & Evaluation Actions */}
                      {msg.status === 'completed' && (
                        <div className="flex flex-wrap items-center justify-between gap-2 px-1 text-[11px] text-slate-500 border-t border-slate-100 pt-2">
                          {/* Metrics stats */}
                          <div className="flex items-center gap-2 font-mono text-[10px]">
                            {msg.latencyMs && <span>耗时: {msg.latencyMs}ms</span>}
                            {msg.tokensPerSec && <span className="text-emerald-600 font-semibold">{msg.tokensPerSec} t/s</span>}
                          </div>

                          {/* Action Toolbar */}
                          <div className="flex items-center gap-1.5">
                            {/* Winner Elo button */}
                            <button
                              onClick={() => triggerWinnerConfetti(modelId, msg.id, msg.roundIndex)}
                              className={`flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold transition-all ${
                                msg.isEloWinner
                                  ? 'bg-indigo-50 text-indigo-700 border border-indigo-200 shadow-2xs'
                                  : 'text-slate-500 hover:text-indigo-600 hover:bg-indigo-50'
                              }`}
                              title="设为本轮最佳回答 (Elo 胜出)"
                            >
                              <Award className="w-3 h-3 text-indigo-600" />
                              <span>{msg.isEloWinner ? '👑 本轮最佳' : '评为最佳'}</span>
                            </button>

                            {/* Like / Dislike */}
                            <button
                              onClick={() => onToggleFeedback(modelId, msg.id, 'like')}
                              className={`p-1 rounded transition-colors ${
                                msg.userFeedback === 'like' ? 'text-emerald-600 bg-emerald-50' : 'text-slate-400 hover:text-slate-700'
                              }`}
                              title="好评 👍"
                            >
                              <ThumbsUp className="w-3 h-3" />
                            </button>
                            <button
                              onClick={() => onToggleFeedback(modelId, msg.id, 'dislike')}
                              className={`p-1 rounded transition-colors ${
                                msg.userFeedback === 'dislike' ? 'text-rose-600 bg-rose-50' : 'text-slate-400 hover:text-slate-700'
                              }`}
                              title="差评 👎"
                            >
                              <ThumbsDown className="w-3 h-3" />
                            </button>

                            {/* 5-Star Rating */}
                            <div className="flex items-center gap-0.5 ml-1">
                              {[1, 2, 3, 4, 5].map(star => (
                                <button
                                  key={star}
                                  onClick={() => onRateResponse(modelId, msg.id, star)}
                                  className="text-slate-300 hover:text-amber-400 transition-colors p-0.5"
                                  title={`评分: ${star} 星`}
                                >
                                  <Star
                                    className={`w-3 h-3 ${
                                      (msg.score || 0) >= star
                                        ? 'text-amber-400 fill-amber-400'
                                        : 'text-slate-200'
                                    }`}
                                  />
                                </button>
                              ))}
                            </div>

                            {/* Copy Markdown */}
                            <button
                              onClick={() => handleCopy(msg.content, msg.id)}
                              className="p-1 rounded text-slate-400 hover:text-slate-700 transition-colors ml-1"
                              title="复制完整 Markdown 结果"
                            >
                              {copiedId === msg.id ? (
                                <Check className="w-3 h-3 text-emerald-600" />
                              ) : (
                                <Copy className="w-3 h-3" />
                              )}
                            </button>

                            {/* Single Model Regenerate */}
                            <button
                              onClick={() => onRegenerateSingle(modelId, msg.roundIndex)}
                              className="p-1 rounded text-slate-400 hover:text-indigo-600 transition-colors"
                              title="仅针对此模型重新生成"
                            >
                              <RotateCw className="w-3 h-3" />
                            </button>

                            {/* Direct Conversation Link */}
                            {(msg.conversationUrl || session.conversationUrl) && (
                              <a
                                href={msg.conversationUrl || session.conversationUrl}
                                target="_blank"
                                rel="noreferrer"
                                className="flex items-center gap-1 text-[10px] text-indigo-600 hover:text-indigo-800 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200/70 px-2 py-0.5 rounded font-medium transition-colors ml-1"
                                title="在官方平台查看此对话"
                              >
                                <Globe className="w-2.5 h-2.5" />
                                <span>官网链接</span>
                                <ExternalLink className="w-2.5 h-2.5" />
                              </a>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};
