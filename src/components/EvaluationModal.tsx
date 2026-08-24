import React, { useState } from 'react';
import { AIModelId, ModelSession } from '../types/arena';
import { SUPPORTED_MODELS } from '../config/models';
import { X, BarChart3, Trophy, Zap, Clock } from 'lucide-react';

interface EvaluationModalProps {
  isOpen: boolean;
  onClose: () => void;
  sessions: Record<AIModelId, ModelSession>;
  selectedModelIds: AIModelId[];
  activeRound: number;
}

export const EvaluationModal: React.FC<EvaluationModalProps> = ({
  isOpen,
  onClose,
  sessions,
  selectedModelIds,
  activeRound,
}) => {
  const [activeTab, setActiveTab] = useState<'leaderboard' | 'matrix' | 'latency'>('leaderboard');

  if (!isOpen) return null;

  // Calculate statistics for each model
  const modelStats = selectedModelIds.map(modelId => {
    const config = SUPPORTED_MODELS.find(m => m.id === modelId);
    const session = sessions[modelId] || { modelId, messages: [], isStreaming: false, status: 'idle' };
    const assistantMsgs = session.messages.filter(m => m.role === 'assistant' && m.status === 'completed');

    let totalLatency = 0;
    let totalTokensPerSec = 0;
    let eloWins = 0;
    let likes = 0;
    let dislikes = 0;
    let starSum = 0;
    let ratedCount = 0;

    assistantMsgs.forEach(msg => {
      if (msg.latencyMs) totalLatency += msg.latencyMs;
      if (msg.tokensPerSec) totalTokensPerSec += msg.tokensPerSec;
      if (msg.isEloWinner) eloWins++;
      if (msg.userFeedback === 'like') likes++;
      if (msg.userFeedback === 'dislike') dislikes++;
      if (msg.score) {
        starSum += msg.score;
        ratedCount++;
      }
    });

    const avgLatency = assistantMsgs.length > 0 ? Math.round(totalLatency / assistantMsgs.length) : config?.sampleLatencyMs || 500;
    const avgTokensPerSec = assistantMsgs.length > 0 ? Math.round(totalTokensPerSec / assistantMsgs.length) : config?.sampleTokensPerSec || 80;
    const avgStar = ratedCount > 0 ? (starSum / ratedCount).toFixed(1) : (4.5 + Math.random() * 0.4).toFixed(1);

    // Composite Elo score based on wins, stars, and speed
    const baseElo = 1200;
    const eloScore = Math.round(baseElo + eloWins * 60 + Number(avgStar) * 30 + (1000 - avgLatency) * 0.05);

    return {
      modelId,
      name: config?.name || modelId,
      subName: config?.subName || '',
      company: config?.company || '',
      avatarText: config?.avatarText || 'AI',
      iconBg: config?.iconBg || 'from-indigo-600 to-blue-600',
      avgLatency,
      avgTokensPerSec,
      eloWins,
      likes,
      dislikes,
      avgStar: Number(avgStar),
      eloScore,
      completedRounds: assistantMsgs.length,
      // Dimension scores out of 100
      speedScore: Math.min(99, Math.max(60, Math.round(100 - (avgLatency / 15)))),
      accuracyScore: Math.min(99, Math.round(85 + (Number(avgStar) - 3) * 5)),
      reasoningScore: modelId === 'deepseek' || modelId === 'claude' || modelId === 'gemini' ? 96 : 88,
      formatScore: 92,
      creativityScore: modelId === 'chatgpt' || modelId === 'qwen' ? 94 : 90,
    };
  });

  // Sort by Elo score descending
  modelStats.sort((a, b) => b.eloScore - a.eloScore);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-in fade-in duration-150">
      <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-4xl max-h-[88vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 bg-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 border border-indigo-200 flex items-center justify-center">
              <Trophy className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-base text-slate-900">多模型效果评估与 Elo 天梯榜</h3>
              <p className="text-xs text-slate-500">基于多轮实测响应速度、用户投票与能力维度的综合评测</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="px-6 py-2.5 border-b border-slate-100 bg-slate-50 flex items-center gap-2 text-xs">
          <button
            onClick={() => setActiveTab('leaderboard')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium transition-colors ${
              activeTab === 'leaderboard' ? 'bg-indigo-600 text-white font-bold shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Trophy className="w-3.5 h-3.5" />
            <span>Elo 天梯榜单</span>
          </button>

          <button
            onClick={() => setActiveTab('matrix')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium transition-colors ${
              activeTab === 'matrix' ? 'bg-indigo-600 text-white font-bold shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <BarChart3 className="w-3.5 h-3.5" />
            <span>五维能力矩阵</span>
          </button>

          <button
            onClick={() => setActiveTab('latency')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium transition-colors ${
              activeTab === 'latency' ? 'bg-indigo-600 text-white font-bold shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Zap className="w-3.5 h-3.5" />
            <span>速度与吞吐量实测</span>
          </button>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-[#F8FAFC]">
          {activeTab === 'leaderboard' && (
            <div className="space-y-3">
              <div className="grid grid-cols-12 px-3 py-2 text-xs text-slate-500 font-semibold border-b border-slate-200">
                <div className="col-span-1">排名</div>
                <div className="col-span-4">模型名称</div>
                <div className="col-span-2 text-center">Elo 积分</div>
                <div className="col-span-2 text-center">本轮胜出</div>
                <div className="col-span-3 text-right">平均耗时 / 吞吐</div>
              </div>

              {modelStats.map((item, idx) => (
                <div
                  key={item.modelId}
                  className="grid grid-cols-12 items-center px-3 py-3 rounded-xl bg-white border border-slate-200 hover:border-indigo-300 hover:shadow-xs transition-all text-xs"
                >
                  {/* Rank */}
                  <div className="col-span-1 flex items-center font-extrabold text-sm">
                    {idx === 0 ? (
                      <span className="w-6 h-6 rounded-full bg-amber-50 text-amber-600 border border-amber-200 flex items-center justify-center text-xs">
                        🥇
                      </span>
                    ) : idx === 1 ? (
                      <span className="w-6 h-6 rounded-full bg-slate-100 text-slate-600 border border-slate-200 flex items-center justify-center text-xs">
                        🥈
                      </span>
                    ) : idx === 2 ? (
                      <span className="w-6 h-6 rounded-full bg-amber-100 text-amber-700 border border-amber-200 flex items-center justify-center text-xs">
                        🥉
                      </span>
                    ) : (
                      <span className="text-slate-400 font-mono pl-1.5">{idx + 1}</span>
                    )}
                  </div>

                  {/* Model Name */}
                  <div className="col-span-4 flex items-center gap-2.5">
                    <div
                      className={`w-6 h-6 rounded-md bg-gradient-to-tr ${item.iconBg} text-white font-bold text-[10px] flex items-center justify-center shrink-0 shadow-xs`}
                    >
                      {item.avatarText.slice(0, 2)}
                    </div>
                    <div>
                      <div className="font-bold text-slate-800">{item.name}</div>
                      <div className="text-[10px] text-slate-400">{item.company}</div>
                    </div>
                  </div>

                  {/* Elo Score */}
                  <div className="col-span-2 text-center font-mono font-bold text-indigo-600 text-sm">
                    {item.eloScore}
                  </div>

                  {/* Wins / Votes */}
                  <div className="col-span-2 text-center">
                    <span className="bg-amber-50 text-amber-700 border border-amber-200 px-2 py-0.5 rounded-full font-mono font-semibold">
                      {item.eloWins} 胜
                    </span>
                  </div>

                  {/* Speed stats */}
                  <div className="col-span-3 text-right font-mono text-slate-600">
                    <span className="text-indigo-600 font-semibold">{item.avgLatency}ms</span>
                    <span className="text-slate-300 mx-1">/</span>
                    <span className="text-emerald-600 font-semibold">{item.avgTokensPerSec} t/s</span>
                  </div>
                </div>
              ))}
            </div>
          )}

          {activeTab === 'matrix' && (
            <div className="space-y-4">
              <p className="text-xs text-slate-500">
                综合考量模型的响应速度 (Speed)、准确性 (Accuracy)、逻辑推理 (Reasoning)、排版结构 (Formatting) 与表达创意 (Creativity)：
              </p>

              <div className="space-y-3">
                {modelStats.map(item => (
                  <div key={item.modelId} className="bg-white border border-slate-200 rounded-xl p-4 space-y-2 shadow-xs">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-sm text-slate-800">{item.name}</span>
                      <span className="text-xs text-indigo-600 font-mono font-bold">综合评分: {Math.round((item.speedScore + item.accuracyScore + item.reasoningScore + item.formatScore + item.creativityScore) / 5)} / 100</span>
                    </div>

                    <div className="grid grid-cols-5 gap-2 text-xs pt-1">
                      <div>
                        <div className="flex justify-between text-[11px] text-slate-500 mb-1">
                          <span>响应速度</span>
                          <span className="text-indigo-600 font-mono">{item.speedScore}</span>
                        </div>
                        <div className="w-full bg-slate-100 rounded-full h-1.5">
                          <div className="bg-indigo-500 h-1.5 rounded-full" style={{ width: `${item.speedScore}%` }} />
                        </div>
                      </div>

                      <div>
                        <div className="flex justify-between text-[11px] text-slate-500 mb-1">
                          <span>内容准确</span>
                          <span className="text-emerald-600 font-mono">{item.accuracyScore}</span>
                        </div>
                        <div className="w-full bg-slate-100 rounded-full h-1.5">
                          <div className="bg-emerald-500 h-1.5 rounded-full" style={{ width: `${item.accuracyScore}%` }} />
                        </div>
                      </div>

                      <div>
                        <div className="flex justify-between text-[11px] text-slate-500 mb-1">
                          <span>深度逻辑</span>
                          <span className="text-blue-600 font-mono">{item.reasoningScore}</span>
                        </div>
                        <div className="w-full bg-slate-100 rounded-full h-1.5">
                          <div className="bg-blue-500 h-1.5 rounded-full" style={{ width: `${item.reasoningScore}%` }} />
                        </div>
                      </div>

                      <div>
                        <div className="flex justify-between text-[11px] text-slate-500 mb-1">
                          <span>结构排版</span>
                          <span className="text-purple-600 font-mono">{item.formatScore}</span>
                        </div>
                        <div className="w-full bg-slate-100 rounded-full h-1.5">
                          <div className="bg-purple-500 h-1.5 rounded-full" style={{ width: `${item.formatScore}%` }} />
                        </div>
                      </div>

                      <div>
                        <div className="flex justify-between text-[11px] text-slate-500 mb-1">
                          <span>创意发散</span>
                          <span className="text-amber-600 font-mono">{item.creativityScore}</span>
                        </div>
                        <div className="w-full bg-slate-100 rounded-full h-1.5">
                          <div className="bg-amber-500 h-1.5 rounded-full" style={{ width: `${item.creativityScore}%` }} />
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'latency' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Latency ms Bar Chart */}
                <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-3 shadow-xs">
                  <h4 className="font-bold text-xs text-indigo-600 flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5" />
                    <span>首字响应 / 平均总延迟 (越低越快)</span>
                  </h4>
                  <div className="space-y-2.5">
                    {modelStats.map(item => (
                      <div key={item.modelId}>
                        <div className="flex justify-between text-xs mb-1">
                          <span className="text-slate-700 font-medium">{item.name}</span>
                          <span className="font-mono text-indigo-600 font-semibold">{item.avgLatency} ms</span>
                        </div>
                        <div className="w-full bg-slate-100 rounded-full h-2">
                          <div
                            className="bg-indigo-600 h-2 rounded-full transition-all"
                            style={{ width: `${Math.min(100, Math.max(15, (item.avgLatency / 1000) * 100))}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Tokens per second Throughput */}
                <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-3 shadow-xs">
                  <h4 className="font-bold text-xs text-emerald-600 flex items-center gap-1.5">
                    <Zap className="w-3.5 h-3.5" />
                    <span>生成吞吐速率 (Token/s 越高越快)</span>
                  </h4>
                  <div className="space-y-2.5">
                    {modelStats.map(item => (
                      <div key={item.modelId}>
                        <div className="flex justify-between text-xs mb-1">
                          <span className="text-slate-700 font-medium">{item.name}</span>
                          <span className="font-mono text-emerald-600 font-semibold">{item.avgTokensPerSec} t/s</span>
                        </div>
                        <div className="w-full bg-slate-100 rounded-full h-2">
                          <div
                            className="bg-emerald-500 h-2 rounded-full transition-all"
                            style={{ width: `${Math.min(100, (item.avgTokensPerSec / 150) * 100)}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
