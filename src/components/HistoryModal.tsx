import React, { useState } from 'react';
import { SavedSessionHistory, AIModelId } from '../types/arena';
import { SUPPORTED_MODELS } from '../config/models';
import {
  History,
  X,
  Trash2,
  ExternalLink,
  Copy,
  Check,
  RotateCcw,
  Search,
  Calendar,
  MessageSquare,
  Share2,
  Globe,
  ChevronDown,
  ChevronUp
} from 'lucide-react';

interface HistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  historyList: SavedSessionHistory[];
  onRestoreSession: (session: SavedSessionHistory) => void;
  onDeleteSession: (sessionId: string) => void;
  onClearAllHistory: () => void;
  onExportSession: (session: SavedSessionHistory) => void;
  onNavigateToModel?: (modelId: AIModelId, url?: string) => void;
}

export const HistoryModal: React.FC<HistoryModalProps> = ({
  isOpen,
  onClose,
  historyList,
  onRestoreSession,
  onDeleteSession,
  onClearAllHistory,
  onExportSession,
  onNavigateToModel,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [copiedUrl, setCopiedUrl] = useState<string | null>(null);
  const [expandedSessionId, setExpandedSessionId] = useState<string | null>(null);

  if (!isOpen) return null;

  const filteredHistory = historyList.filter(item => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    const matchesTitle = item.title.toLowerCase().includes(q);
    const matchesPrompts = item.rounds.some(r => r.userPrompt.toLowerCase().includes(q));
    const matchesModels = item.models.some(m => {
      const config = SUPPORTED_MODELS.find(cfg => cfg.id === m);
      return config?.name.toLowerCase().includes(q) || m.toLowerCase().includes(q);
    });
    return matchesTitle || matchesPrompts || matchesModels;
  });

  const handleCopyUrl = (url: string) => {
    navigator.clipboard.writeText(url);
    setCopiedUrl(url);
    setTimeout(() => setCopiedUrl(null), 2000);
  };

  const toggleExpand = (id: string) => {
    setExpandedSessionId(prev => (prev === id ? null : id));
  };

  const handleModelClick = (modelId: AIModelId, url?: string) => {
    if (onNavigateToModel) {
      onNavigateToModel(modelId, url);
    } else if (url) {
      window.open(url, '_blank');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-in fade-in duration-150">
      <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-4xl max-h-[85vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 bg-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 border border-indigo-200 flex items-center justify-center shadow-xs">
              <History className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-base text-slate-900">会话历史与官网直达链接</h3>
                <span className="text-xs bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded-full font-semibold">
                  共 {historyList.length} 条存档
                </span>
              </div>
              <p className="text-xs text-slate-500">
                已自动记录每次并发评测提示词与各模型对话后的地址栏链接，方便随时回顾与导出
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {historyList.length > 0 && (
              <button
                onClick={() => {
                  if (confirm('确定要清空全部会话历史记录吗？此操作无法撤销。')) {
                    onClearAllHistory();
                  }
                }}
                className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium text-rose-600 hover:bg-rose-50 border border-rose-200/60 transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>清空历史</span>
              </button>
            )}

            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Search Bar */}
        <div className="px-6 py-3 bg-slate-50 border-b border-slate-200 flex items-center gap-3 shrink-0">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="搜索历史提示词、模型名称或会话标题..."
              className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/10"
            />
          </div>
        </div>

        {/* List Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-slate-50">
          {filteredHistory.length === 0 ? (
            <div className="h-64 flex flex-col items-center justify-center text-center text-slate-400">
              <div className="w-12 h-12 rounded-2xl bg-white border border-slate-200 flex items-center justify-center mb-3 text-slate-400 shadow-2xs">
                <History className="w-6 h-6" />
              </div>
              <h4 className="font-semibold text-slate-700 text-sm mb-1">
                {searchQuery ? '没有找到匹配的历史记录' : '暂无会话历史记录'}
              </h4>
              <p className="text-xs text-slate-500 max-w-sm">
                在主界面或插件中并发发起对话后，系统会自动将提示词与各模型地址栏生成的会话链接保存在此。
              </p>
            </div>
          ) : (
            filteredHistory.map(session => {
              const isExpanded = expandedSessionId === session.id;
              const dateStr = new Date(session.createdAt).toLocaleString();
              const latestPrompt = session.rounds[session.rounds.length - 1]?.userPrompt || '未命名对话';

              return (
                <div
                  key={session.id}
                  className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs hover:border-slate-300 transition-all"
                >
                  {/* Card Header */}
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                        <span className="font-bold text-sm text-slate-800 truncate">
                          {session.title || '多模型并发评测会话'}
                        </span>
                        <span className="text-[11px] font-mono text-slate-400 flex items-center gap-1">
                          <Calendar className="w-3 h-3 text-slate-400" />
                          {dateStr}
                        </span>
                        <span className="text-[11px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded font-medium">
                          {session.roundsCount} 轮对话
                        </span>
                        <span className="text-[11px] bg-indigo-50 text-indigo-700 border border-indigo-100 px-2 py-0.5 rounded font-medium">
                          {session.models.length} 个模型
                        </span>
                      </div>

                      {/* Latest Prompt preview */}
                      <p className="text-xs text-slate-600 line-clamp-2 mb-2 font-mono bg-slate-50 p-2 rounded-lg border border-slate-100">
                        💬 <strong>最新提示词：</strong> {latestPrompt}
                      </p>

                      {/* Models and Captured Links Pills */}
                      <div className="flex flex-wrap gap-2 pt-1">
                        {session.models.map(modelId => {
                          const config = SUPPORTED_MODELS.find(m => m.id === modelId);
                          // Find latest response URL if available
                          let capturedUrl: string | undefined = undefined;
                          for (let i = session.rounds.length - 1; i >= 0; i--) {
                            const resp = session.rounds[i]?.responses[modelId];
                            if (resp?.conversationUrl) {
                              capturedUrl = resp.conversationUrl;
                              break;
                            }
                          }
                          const finalUrl = capturedUrl || config?.webUrl;

                          return (
                            <div
                              key={modelId}
                              className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1 text-xs"
                            >
                              <div
                                className={`w-3.5 h-3.5 rounded text-[8px] font-bold text-white flex items-center justify-center bg-gradient-to-tr ${
                                  config?.iconBg || 'from-indigo-500 to-indigo-600'
                                }`}
                              >
                                {config?.avatarText?.slice(0, 2) || modelId.slice(0, 2).toUpperCase()}
                              </div>
                              <span className="font-semibold text-slate-700">{config?.name || modelId}</span>

                              {finalUrl && (
                                <div className="flex items-center gap-1 ml-1 pl-1 border-l border-slate-200">
                                  <button
                                    onClick={() => handleModelClick(modelId as AIModelId, finalUrl)}
                                    className="text-indigo-600 hover:text-indigo-800 flex items-center gap-0.5 font-medium hover:underline text-[11px] cursor-pointer bg-indigo-50/80 px-1.5 py-0.5 rounded border border-indigo-200/60"
                                    title={`在内嵌界面或新标签页定位到 ${config?.name} 对话: ${finalUrl}`}
                                  >
                                    <Globe className="w-3 h-3 text-indigo-600" />
                                    <span>定位会话</span>
                                    <ExternalLink className="w-2.5 h-2.5 text-indigo-500" />
                                  </button>

                                  <button
                                    onClick={() => handleCopyUrl(finalUrl)}
                                    className="text-slate-400 hover:text-slate-700 p-0.5 rounded transition-colors"
                                    title="复制会话链接"
                                  >
                                    {copiedUrl === finalUrl ? (
                                      <Check className="w-3 h-3 text-emerald-600" />
                                    ) : (
                                      <Copy className="w-3 h-3" />
                                    )}
                                  </button>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        onClick={() => onRestoreSession(session)}
                        className="flex items-center gap-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 px-3 py-1.5 rounded-lg text-xs font-semibold shadow-2xs transition-colors"
                        title="恢复此会话到主屏幕"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                        <span>恢复对话</span>
                      </button>

                      <button
                        onClick={() => onExportSession(session)}
                        className="flex items-center gap-1 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 px-3 py-1.5 rounded-lg text-xs font-semibold shadow-2xs transition-colors"
                        title="导出包含官方会话链接的报告"
                      >
                        <Share2 className="w-3.5 h-3.5 text-slate-500" />
                        <span>导出报告</span>
                      </button>

                      <button
                        onClick={() => onDeleteSession(session.id)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                        title="删除此条记录"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>

                      <button
                        onClick={() => toggleExpand(session.id)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
                        title={isExpanded ? '收起详情' : '展开多轮详情'}
                      >
                        {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  {/* Expanded Multi-Round Details */}
                  {isExpanded && (
                    <div className="mt-4 pt-4 border-t border-slate-100 space-y-3">
                      <h5 className="font-bold text-xs text-slate-700">各轮次对话与模型回答记录：</h5>
                      {session.rounds.map((r, rIdx) => (
                        <div key={rIdx} className="bg-slate-50 rounded-lg p-3 border border-slate-200/80 space-y-2">
                          <div className="flex items-center justify-between text-xs font-semibold text-slate-700">
                            <span className="flex items-center gap-1.5">
                              <MessageSquare className="w-3.5 h-3.5 text-indigo-600" />
                              <span>第 {r.roundIndex || rIdx + 1} 轮提问</span>
                            </span>
                            <span className="text-[11px] font-mono text-slate-400">
                              {r.timestamp ? new Date(r.timestamp).toLocaleTimeString() : ''}
                            </span>
                          </div>
                          <p className="text-xs text-slate-800 font-mono bg-white p-2 rounded border border-slate-100">
                            {r.userPrompt}
                          </p>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 pt-1">
                            {Object.entries(r.responses || {}).map(([mId, rawResp]) => {
                              const resp = rawResp as { content?: string; conversationUrl?: string; thinking?: string; latencyMs?: number };
                              const cfg = SUPPORTED_MODELS.find(m => m.id === mId);
                              const respUrl = resp?.conversationUrl || cfg?.webUrl;

                              return (
                                <div key={mId} className="bg-white p-2.5 rounded-lg border border-slate-200 text-xs">
                                  <div className="flex items-center justify-between mb-1">
                                    <span className="font-bold text-slate-800">{cfg?.name || mId}</span>
                                    {respUrl && (
                                      <button
                                        onClick={() => handleModelClick(mId as AIModelId, respUrl)}
                                        className="text-[11px] text-indigo-600 hover:text-indigo-800 bg-indigo-50/80 px-2 py-0.5 rounded border border-indigo-200/60 flex items-center gap-1 font-medium hover:underline cursor-pointer"
                                        title={`直接定位并打开 ${cfg?.name} 历史会话`}
                                      >
                                        <Globe className="w-3 h-3 text-indigo-600" />
                                        <span>定位原会话</span>
                                        <ExternalLink className="w-2.5 h-2.5 text-indigo-500" />
                                      </button>
                                    )}
                                  </div>
                                  <p className="text-slate-600 line-clamp-3 text-[11px] leading-relaxed">
                                    {resp?.content || '（等待抓取中）'}
                                  </p>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
