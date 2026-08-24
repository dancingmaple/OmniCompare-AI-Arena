import React from 'react';
import { AIModelId, AIModelConfig } from '../types/arena';
import { SUPPORTED_MODELS } from '../config/models';
import { Check, Plus, ExternalLink, RotateCw, Layers } from 'lucide-react';

interface ModelSelectorBarProps {
  selectedModelIds: AIModelId[];
  onToggleModel: (id: AIModelId) => void;
  onSelectAll: () => void;
  onSelectRecommended: () => void;
  modelStreamingStatus: Record<AIModelId, boolean>;
}

export const ModelSelectorBar: React.FC<ModelSelectorBarProps> = ({
  selectedModelIds,
  onToggleModel,
  onSelectAll,
  onSelectRecommended,
  modelStreamingStatus,
}) => {
  return (
    <div className="bg-white/80 backdrop-blur-sm border-b border-slate-200/90 px-6 py-2 flex flex-wrap items-center justify-between gap-2 text-xs">
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0 scrollbar-none">
        <span className="text-slate-500 font-semibold whitespace-nowrap mr-1 flex items-center gap-1">
          <Layers className="w-3.5 h-3.5 text-indigo-500" />
          并发模型:
        </span>

        {SUPPORTED_MODELS.map(model => {
          const isSelected = selectedModelIds.includes(model.id);
          const isStreaming = modelStreamingStatus[model.id];

          return (
            <div
              key={model.id}
              className={`group flex items-center rounded-lg transition-all border ${
                isSelected
                  ? 'bg-indigo-50/80 text-indigo-950 border-indigo-300 shadow-2xs ring-1 ring-indigo-500/10'
                  : 'bg-slate-50/80 text-slate-600 border-slate-200 hover:bg-slate-100 hover:text-slate-900'
              }`}
            >
              {/* Main Toggle Button */}
              <button
                onClick={() => onToggleModel(model.id)}
                className="flex items-center gap-2 px-2.5 py-1.5 focus:outline-none"
              >
                {/* Avatar Icon */}
                <div
                  className={`w-4 h-4 rounded text-[9px] font-bold flex items-center justify-center bg-gradient-to-tr ${model.iconBg} text-white shadow-xs`}
                >
                  {model.avatarText.slice(0, 2)}
                </div>

                <span className="font-semibold text-xs">{model.name}</span>

                {/* Status Indicator */}
                {isStreaming ? (
                  <RotateCw className="w-3 h-3 text-indigo-600 animate-spin" />
                ) : isSelected ? (
                  <Check className="w-3 h-3 text-indigo-600 stroke-[3]" />
                ) : (
                  <Plus className="w-3 h-3 text-slate-400" />
                )}
              </button>

              {/* Web Portal Link */}
              <a
                href={model.webUrl}
                target="_blank"
                rel="noreferrer"
                className="pr-2 pl-0.5 py-1 text-slate-400 hover:text-indigo-600 transition-colors opacity-60 group-hover:opacity-100"
                title={`打开 ${model.name} 官方网页 (${model.webUrl})`}
              >
                <ExternalLink className="w-2.5 h-2.5" />
              </a>
            </div>
          );
        })}
      </div>

      {/* Quick Selection Shortcuts */}
      <div className="flex items-center gap-2.5 text-[11px] text-slate-500 shrink-0">
        <button
          onClick={onSelectAll}
          className="hover:text-indigo-600 transition-colors underline decoration-dotted font-medium"
        >
          全选所有
        </button>
        <span className="text-slate-300">|</span>
        <button
          onClick={onSelectRecommended}
          className="hover:text-indigo-600 transition-colors underline decoration-dotted font-medium"
        >
          推荐主力 4 模型 (GPT/Gemini/DeepSeek/Qwen)
        </button>
      </div>
    </div>
  );
};
