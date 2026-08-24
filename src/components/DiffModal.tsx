import React, { useState } from 'react';
import { AIModelId, ModelSession } from '../types/arena';
import { SUPPORTED_MODELS } from '../config/models';
import { X, GitCompare, Copy, Check, ArrowRightLeft } from 'lucide-react';

interface DiffModalProps {
  isOpen: boolean;
  onClose: () => void;
  sessions: Record<AIModelId, ModelSession>;
  selectedModelIds: AIModelId[];
  activeRound: number;
}

export const DiffModal: React.FC<DiffModalProps> = ({
  isOpen,
  onClose,
  sessions,
  selectedModelIds,
  activeRound,
}) => {
  const [modelA, setModelA] = useState<AIModelId>(selectedModelIds[0] || 'chatgpt');
  const [modelB, setModelB] = useState<AIModelId>(selectedModelIds[1] || selectedModelIds[0] || 'gemini');
  const [selectedRound, setSelectedRound] = useState<number>(activeRound || 1);
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const sessionA = sessions[modelA];
  const sessionB = sessions[modelB];

  const msgA = sessionA?.messages.filter(m => m.role === 'assistant')[selectedRound - 1]?.content || '（暂无第 ' + selectedRound + ' 轮回答）';
  const msgB = sessionB?.messages.filter(m => m.role === 'assistant')[selectedRound - 1]?.content || '（暂无第 ' + selectedRound + ' 轮回答）';

  const configA = SUPPORTED_MODELS.find(m => m.id === modelA);
  const configB = SUPPORTED_MODELS.find(m => m.id === modelB);

  // Compute simple word-level diff
  const computeDiffLines = (textA: string, textB: string) => {
    const linesA = textA.split('\n');
    const linesB = textB.split('\n');
    const maxLen = Math.max(linesA.length, linesB.length);
    const rows = [];

    for (let i = 0; i < maxLen; i++) {
      const lineA = linesA[i] || '';
      const lineB = linesB[i] || '';
      const isDifferent = lineA !== lineB;
      rows.push({ lineA, lineB, isDifferent, lineNum: i + 1 });
    }
    return rows;
  };

  const diffRows = computeDiffLines(msgA, msgB);

  // Similarity metric approximation
  const totalChars = Math.max(1, msgA.length + msgB.length);
  let matchedChars = 0;
  diffRows.forEach(r => {
    if (!r.isDifferent) matchedChars += r.lineA.length * 2;
  });
  const similarityScore = Math.min(100, Math.round((matchedChars / totalChars) * 100));

  const handleSwap = () => {
    const temp = modelA;
    setModelA(modelB);
    setModelB(temp);
  };

  const handleCopyDiff = () => {
    const report = `# OmniCompare 模型 Diff 对比报告 (第 ${selectedRound} 轮)

## 【${configA?.name}】 vs 【${configB?.name}】
- 相似度预估: ${similarityScore}%
- ${configA?.name} 字数: ${msgA.length} 字
- ${configB?.name} 字数: ${msgB.length} 字

### === ${configA?.name} 回答 ===
${msgA}

### === ${configB?.name} 回答 ===
${msgB}
`;
    navigator.clipboard.writeText(report);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-in fade-in duration-150">
      <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-5xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-100 bg-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 border border-indigo-200 flex items-center justify-center">
              <GitCompare className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-base text-slate-900">双模型输出 Diff 差异比对器</h3>
              <p className="text-xs text-slate-500">逐行对比任意两个模型的回答差异与结构异同</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleCopyDiff}
              className="flex items-center gap-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors border border-slate-200"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 text-slate-500" />}
              <span>{copied ? '已复制对比' : '复制对比结果'}</span>
            </button>

            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Model & Round Selector Bar */}
        <div className="px-6 py-3 border-b border-slate-100 bg-slate-50 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-3">
            {/* Model A Select */}
            <div className="flex items-center gap-1.5">
              <span className="text-slate-600 font-medium">基准模型 A:</span>
              <select
                value={modelA}
                onChange={e => setModelA(e.target.value as AIModelId)}
                className="bg-white border border-slate-200 rounded-lg px-2.5 py-1 text-slate-800 focus:outline-none focus:ring-1 focus:ring-indigo-500 font-semibold"
              >
                {SUPPORTED_MODELS.map(m => (
                  <option key={m.id} value={m.id}>
                    {m.name} ({m.subName})
                  </option>
                ))}
              </select>
            </div>

            {/* Swap Button */}
            <button
              onClick={handleSwap}
              className="p-1.5 rounded-lg bg-white border border-slate-200 hover:bg-slate-100 text-slate-600 transition-colors"
              title="互换模型 A 与 B"
            >
              <ArrowRightLeft className="w-3.5 h-3.5" />
            </button>

            {/* Model B Select */}
            <div className="flex items-center gap-1.5">
              <span className="text-slate-600 font-medium">对比模型 B:</span>
              <select
                value={modelB}
                onChange={e => setModelB(e.target.value as AIModelId)}
                className="bg-white border border-slate-200 rounded-lg px-2.5 py-1 text-slate-800 focus:outline-none focus:ring-1 focus:ring-indigo-500 font-semibold"
              >
                {SUPPORTED_MODELS.map(m => (
                  <option key={m.id} value={m.id}>
                    {m.name} ({m.subName})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Round Selector */}
          <div className="flex items-center gap-2">
            <span className="text-slate-600 font-medium">对话轮次:</span>
            <div className="flex items-center gap-1">
              {Array.from({ length: Math.max(1, activeRound) }, (_, i) => i + 1).map(round => (
                <button
                  key={round}
                  onClick={() => setSelectedRound(round)}
                  className={`px-2.5 py-1 rounded-md font-mono text-xs ${
                    selectedRound === round
                      ? 'bg-indigo-600 text-white font-bold shadow-xs'
                      : 'bg-white text-slate-600 hover:bg-slate-200/60 border border-slate-200'
                  }`}
                >
                  R{round}
                </button>
              ))}
            </div>
            <span className="text-slate-500 ml-2">文本相似度: <strong className="text-indigo-600 font-mono">{similarityScore}%</strong></span>
          </div>
        </div>

        {/* Side by Side Diff Grid */}
        <div className="flex-1 overflow-y-auto p-4 grid grid-cols-1 md:grid-cols-2 gap-4 bg-[#F8FAFC] font-mono text-xs">
          {/* Column A */}
          <div className="flex flex-col bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
            <div className="px-3.5 py-2 bg-slate-50 border-b border-slate-100 font-sans font-bold text-slate-800 flex items-center justify-between">
              <span>{configA?.name} (基准)</span>
              <span className="text-[11px] text-slate-500 font-mono">{msgA.length} 字符</span>
            </div>
            <div className="p-3.5 overflow-y-auto flex-1 space-y-1 text-slate-800 whitespace-pre-wrap leading-relaxed">
              {diffRows.map((row, idx) => (
                <div
                  key={idx}
                  className={`px-1.5 py-0.5 rounded ${
                    row.isDifferent ? 'bg-rose-50 text-rose-800 border-l-2 border-rose-500' : 'text-slate-700'
                  }`}
                >
                  <span className="text-slate-400 select-none mr-2 font-mono text-[10px]">{row.lineNum}</span>
                  {row.lineA || <span className="text-slate-400 italic">（空行）</span>}
                </div>
              ))}
            </div>
          </div>

          {/* Column B */}
          <div className="flex flex-col bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
            <div className="px-3.5 py-2 bg-slate-50 border-b border-slate-100 font-sans font-bold text-slate-800 flex items-center justify-between">
              <span>{configB?.name} (对比)</span>
              <span className="text-[11px] text-slate-500 font-mono">{msgB.length} 字符</span>
            </div>
            <div className="p-3.5 overflow-y-auto flex-1 space-y-1 text-slate-800 whitespace-pre-wrap leading-relaxed">
              {diffRows.map((row, idx) => (
                <div
                  key={idx}
                  className={`px-1.5 py-0.5 rounded ${
                    row.isDifferent ? 'bg-emerald-50 text-emerald-800 border-l-2 border-emerald-500' : 'text-slate-700'
                  }`}
                >
                  <span className="text-slate-400 select-none mr-2 font-mono text-[10px]">{row.lineNum}</span>
                  {row.lineB || <span className="text-slate-400 italic">（空行）</span>}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
