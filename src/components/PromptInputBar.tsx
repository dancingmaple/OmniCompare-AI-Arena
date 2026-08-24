import React, { useState, useRef, useEffect } from 'react';
import {
  Send,
  Square,
  Sparkles,
  Trash2,
  BookOpen,
  SlidersHorizontal,
  ChevronUp,
  ChevronDown
} from 'lucide-react';

interface PromptInputBarProps {
  onSend: (prompt: string) => void;
  onStop: () => void;
  onClear: () => void;
  onOpenPresets: () => void;
  isStreaming: boolean;
  activeModelCount: number;
  currentRound: number;
  systemPrompt: string;
  setSystemPrompt: (prompt: string) => void;
}

export const PromptInputBar: React.FC<PromptInputBarProps> = ({
  onSend,
  onStop,
  onClear,
  onOpenPresets,
  isStreaming,
  activeModelCount,
  currentRound,
  systemPrompt,
  setSystemPrompt,
}) => {
  const [prompt, setPrompt] = useState('');
  const [showSystemConfig, setShowSystemConfig] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 180)}px`;
    }
  }, [prompt]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleSubmit = () => {
    if (!prompt.trim() || isStreaming || activeModelCount === 0) return;
    onSend(prompt.trim());
    setPrompt('');
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
  };

  return (
    <div className="p-4 sm:p-5 bg-white border-t border-slate-200 shrink-0 z-20 shadow-2xs">
      <div className="max-w-6xl mx-auto space-y-2.5">
        {/* System Prompt Collapsible Bar */}
        {showSystemConfig && (
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 flex items-center gap-2.5 text-xs shadow-2xs">
            <SlidersHorizontal className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
            <span className="text-slate-700 shrink-0 font-semibold">统一系统提示词:</span>
            <input
              type="text"
              value={systemPrompt}
              onChange={e => setSystemPrompt(e.target.value)}
              placeholder="例如：请作为资深全栈工程师，对比各技术方案的优劣并给出高可用架构..."
              className="flex-1 bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 text-xs"
            />
          </div>
        )}

        {/* Input Controls Bar */}
        <div className="relative flex items-center bg-slate-50 border border-slate-300 rounded-2xl p-2.5 focus-within:ring-2 focus-within:ring-indigo-500/20 focus-within:border-indigo-500 transition-all shadow-2xs">
          {/* Quick Preset Library Button */}
          <button
            onClick={onOpenPresets}
            className="flex items-center gap-1.5 text-slate-600 hover:text-indigo-600 bg-white hover:bg-slate-100 border border-slate-200 px-3 py-2 rounded-xl text-xs font-medium transition-colors shrink-0 shadow-2xs"
            title="查看预置评测场景与提示词库"
          >
            <BookOpen className="w-3.5 h-3.5 text-indigo-600" />
            <span className="hidden sm:inline">提示词库</span>
          </button>

          {/* System Prompt Toggle */}
          <button
            onClick={() => setShowSystemConfig(!showSystemConfig)}
            className={`p-2 rounded-xl text-xs transition-colors shrink-0 ml-1.5 ${
              showSystemConfig ? 'bg-indigo-50 text-indigo-600 border border-indigo-200 font-semibold' : 'text-slate-500 hover:text-slate-800 hover:bg-slate-200/60'
            }`}
            title="配置统一 System Prompt"
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
          </button>

          {/* Main Textarea */}
          <textarea
            ref={textareaRef}
            value={prompt}
            onChange={e => setPrompt(e.target.value)}
            onKeyDown={handleKeyDown}
            rows={1}
            placeholder={
              activeModelCount === 0
                ? '请先在上方勾选至少 1 个并发模型...'
                : `向 ${activeModelCount} 个 AI 模型并发提问（Enter 发送，Shift+Enter 换行）...`
            }
            disabled={activeModelCount === 0}
            className="flex-1 max-h-40 min-h-[38px] bg-transparent text-slate-900 placeholder-slate-400 text-xs md:text-sm resize-none focus:outline-none py-1.5 px-3 leading-relaxed"
          />

          {/* Action Buttons */}
          <div className="flex items-center gap-2 shrink-0">
            {/* Clear All Sessions */}
            <button
              onClick={onClear}
              className="p-2 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
              title="清空所有模型对话记录"
            >
              <Trash2 className="w-4 h-4" />
            </button>

            {/* Concurrent Dispatch / Stop Button */}
            {isStreaming ? (
              <button
                onClick={onStop}
                className="flex items-center gap-1.5 bg-rose-600 hover:bg-rose-700 text-white px-4 py-2.5 rounded-xl text-xs font-semibold shadow-sm transition-all active:scale-95"
              >
                <Square className="w-3.5 h-3.5 fill-current" />
                <span>停止生成</span>
              </button>
            ) : (
              <button
                onClick={handleSubmit}
                disabled={!prompt.trim() || activeModelCount === 0}
                className={`w-10 h-10 rounded-full flex items-center justify-center transition-transform active:scale-95 ${
                  !prompt.trim() || activeModelCount === 0
                    ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                    : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-md shadow-indigo-500/30'
                }`}
                title={`一键并发发送至 ${activeModelCount} 个模型`}
              >
                <Send className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Footer Quick Info */}
        <div className="flex items-center justify-between text-[11px] text-slate-400 px-1">
          <div className="flex items-center gap-2">
            <span>⚡ 并发调度中枢</span>
            <span>•</span>
            <span>多轮连续对话上下文同步</span>
            <span>•</span>
            <span className="text-emerald-600 font-medium">就绪 ({activeModelCount} 模型)</span>
          </div>
          <div className="text-slate-400 hidden sm:block">
            OmniCompare Chrome Extension Protocol v1.0
          </div>
        </div>
      </div>
    </div>
  );
};
