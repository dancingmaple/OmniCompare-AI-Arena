import React from 'react';
import { ArenaSettings } from '../types/arena';
import { X, Settings, Sliders, Shield, Zap, RotateCcw } from 'lucide-react';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: ArenaSettings;
  setSettings: React.Dispatch<React.SetStateAction<ArenaSettings>>;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  settings,
  setSettings,
}) => {
  if (!isOpen) return null;

  const handleReset = () => {
    setSettings({
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
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-in fade-in duration-150">
      <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-xl max-h-[88vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 bg-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 border border-indigo-200 flex items-center justify-center">
              <Settings className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-base text-slate-900">全局评测与调度配置</h3>
              <p className="text-xs text-slate-500">调整模型参数、并发响应速率与运行调度模式</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5 text-xs bg-[#F8FAFC]">
          {/* Temperature Slider */}
          <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-2 shadow-xs">
            <div className="flex justify-between items-center text-slate-800">
              <span className="font-semibold flex items-center gap-1.5">
                <Sliders className="w-3.5 h-3.5 text-indigo-600" />
                <span>生成多样性 (Temperature)</span>
              </span>
              <span className="font-mono text-indigo-600 font-bold">{settings.temperature}</span>
            </div>
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={settings.temperature}
              onChange={e => setSettings(prev => ({ ...prev, temperature: parseFloat(e.target.value) }))}
              className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
            />
            <div className="flex justify-between text-[10px] text-slate-400">
              <span>严谨逻辑 (0.0)</span>
              <span>平衡默认 (0.7)</span>
              <span>发散创意 (1.0)</span>
            </div>
          </div>

          {/* Stream Speed Multiplier */}
          <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-2.5 shadow-xs">
            <div className="flex justify-between items-center text-slate-800">
              <span className="font-semibold flex items-center gap-1.5">
                <Zap className="w-3.5 h-3.5 text-emerald-600" />
                <span>流式打印加速倍率 (Stream Speed)</span>
              </span>
              <span className="font-mono text-emerald-600 font-bold">{settings.streamSpeedMultiplier}x</span>
            </div>
            <div className="grid grid-cols-4 gap-2">
              {[1, 1.5, 2.5, 5].map(speed => (
                <button
                  key={speed}
                  onClick={() => setSettings(prev => ({ ...prev, streamSpeedMultiplier: speed }))}
                  className={`py-1.5 rounded-lg border text-xs font-semibold transition-colors ${
                    settings.streamSpeedMultiplier === speed
                      ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                      : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  {speed}x {speed === 5 ? '(疾速)' : ''}
                </button>
              ))}
            </div>
          </div>

          {/* Dispatch Mode */}
          <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-2.5 shadow-xs">
            <span className="font-semibold text-slate-800 flex items-center gap-1.5">
              <Shield className="w-3.5 h-3.5 text-indigo-600" />
              <span>请求并发调度通道</span>
            </span>
            <div className="grid grid-cols-1 gap-2">
              <div
                onClick={() => setSettings(prev => ({ ...prev, requestMode: 'smart_dispatch' }))}
                className={`p-3 rounded-xl border cursor-pointer transition-all ${
                  settings.requestMode === 'smart_dispatch'
                    ? 'bg-indigo-50/70 border-indigo-300 text-indigo-900'
                    : 'bg-slate-50 border-slate-200 text-slate-600 hover:border-slate-300'
                }`}
              >
                <div className="font-bold mb-0.5 text-slate-900">🚀 智能混合多路调度 (推荐)</div>
                <div className="text-[11px] text-slate-500">
                  优先直连官方 API / 深度思考模拟引擎，同时支持 Chrome 扩展后台通信。
                </div>
              </div>

              <div
                onClick={() => setSettings(prev => ({ ...prev, requestMode: 'extension_bridge' }))}
                className={`p-3 rounded-xl border cursor-pointer transition-all ${
                  settings.requestMode === 'extension_bridge'
                    ? 'bg-indigo-50/70 border-indigo-300 text-indigo-900'
                    : 'bg-slate-50 border-slate-200 text-slate-600 hover:border-slate-300'
                }`}
              >
                <div className="font-bold mb-0.5 text-slate-900">🧩 原生 Chrome 扩展标签页注入模式</div>
                <div className="text-[11px] text-slate-500">
                  通过已安装的扩展程序，直接在已登录的官方网页标签中注入并发请求。
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 border-t border-slate-100 bg-white flex items-center justify-between">
          <button
            onClick={handleReset}
            className="flex items-center gap-1 text-slate-500 hover:text-slate-800 text-xs transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>恢复默认设置</span>
          </button>
          <button
            onClick={onClose}
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-1.5 rounded-lg text-xs font-semibold shadow-xs transition-colors"
          >
            完成
          </button>
        </div>
      </div>
    </div>
  );
};
