import React from 'react';
import {
  Sparkles,
  Grid,
  Maximize2,
  Minimize2,
  BarChart3,
  GitCompare,
  Share2,
  Settings,
  Link2,
  Unlink2,
  Chrome,
  Globe,
  Columns,
  SplitSquareVertical,
  History
} from 'lucide-react';
import { LayoutMode, ViewMode } from '../types/arena';

interface NavbarProps {
  roundCount: number;
  layoutMode: LayoutMode;
  setLayoutMode: (mode: LayoutMode) => void;
  viewMode: ViewMode;
  setViewMode: (mode: ViewMode) => void;
  syncScroll: boolean;
  setSyncScroll: (sync: boolean) => void;
  isFullscreen: boolean;
  toggleFullscreen: () => void;
  onOpenExtensionModal: () => void;
  onOpenEvaluationModal: () => void;
  onOpenDiffModal: () => void;
  onOpenExportModal: () => void;
  onOpenHistoryModal: () => void;
  onOpenSettingsModal: () => void;
  activeModelCount: number;
  totalModelCount: number;
  historyCount?: number;
}

export const Navbar: React.FC<NavbarProps> = ({
  roundCount,
  layoutMode,
  setLayoutMode,
  viewMode,
  setViewMode,
  syncScroll,
  setSyncScroll,
  isFullscreen,
  toggleFullscreen,
  onOpenExtensionModal,
  onOpenEvaluationModal,
  onOpenDiffModal,
  onOpenExportModal,
  onOpenHistoryModal,
  onOpenSettingsModal,
  activeModelCount,
  totalModelCount,
  historyCount = 0,
}) => {
  return (
    <header className="h-16 bg-white border-b border-slate-200 px-6 flex items-center justify-between z-30 sticky top-0 shadow-2xs">
      {/* Brand & Active Status Badge */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white font-bold shadow-md shadow-indigo-500/20">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <h1 className="text-base font-bold text-slate-900 leading-tight">
              OmniCompare <span className="text-indigo-600">AI</span>
            </h1>
            <p className="text-[11px] text-slate-400 font-medium hidden sm:block">IFrame 内嵌网页自动化与多模型并发评测</p>
          </div>
        </div>

        {/* Status Pill */}
        <div className="hidden lg:flex items-center gap-2 px-3 py-1 bg-slate-100/90 border border-slate-200/80 rounded-full text-xs font-medium text-slate-600">
          <span className="flex items-center gap-1.5 text-emerald-600 font-semibold">
            <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></span>
            {activeModelCount} 模型已激活
          </span>
          <span className="text-slate-300">|</span>
          <span className="text-slate-500">第 <strong className="text-slate-800 font-mono">{roundCount}</strong> 轮</span>
        </div>
      </div>

      {/* Center: View Mode (IFrame vs Split vs Cards) & Layout */}
      <div className="flex items-center gap-3">
        {/* Core View Mode Switcher */}
        <div className="flex items-center gap-1 bg-indigo-50/70 p-1 rounded-xl border border-indigo-200/80 shadow-2xs">
          <button
            onClick={() => setViewMode('iframe')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              viewMode === 'iframe'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'text-indigo-900 hover:bg-indigo-100/60'
            }`}
            title="实时 IFrame 内嵌网页与自动化操作模式（找输入框、填充 Prompt、发送并抓取）"
          >
            <Globe className="w-3.5 h-3.5" />
            <span>IFrame 自动化</span>
          </button>

          <button
            onClick={() => setViewMode('split')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              viewMode === 'split'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'text-indigo-900 hover:bg-indigo-100/60'
            }`}
            title="左侧结构化解析卡片 + 右侧实时 IFrame 网页"
          >
            <SplitSquareVertical className="w-3.5 h-3.5" />
            <span>分屏联动</span>
          </button>

          <button
            onClick={() => setViewMode('cards')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              viewMode === 'cards'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'text-indigo-900 hover:bg-indigo-100/60'
            }`}
            title="解析卡片视图（支持 Markdown、思维链展开、LaTeX与代码高亮）"
          >
            <Columns className="w-3.5 h-3.5" />
            <span>解析卡片</span>
          </button>
        </div>

        {/* Sync Scroll Toggle */}
        <button
          onClick={() => setSyncScroll(!syncScroll)}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
            syncScroll
              ? 'bg-indigo-50 text-indigo-700 border border-indigo-200 shadow-2xs font-semibold'
              : 'bg-slate-50 text-slate-600 border border-slate-200 hover:bg-slate-100 hover:text-slate-900'
          }`}
          title={syncScroll ? '已启用联动滚动：滑动任一模型，其余模型同步滚动' : '已关闭联动滚动'}
        >
          {syncScroll ? <Link2 className="w-3.5 h-3.5 text-indigo-600" /> : <Unlink2 className="w-3.5 h-3.5 text-slate-400" />}
          <span className="hidden sm:inline">联动滚动</span>
        </button>

        {/* Layout Modes */}
        <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg border border-slate-200">
          <button
            onClick={() => setLayoutMode('2-col')}
            className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${
              layoutMode === '2-col' ? 'bg-white text-slate-900 font-bold shadow-2xs' : 'text-slate-600 hover:text-slate-900'
            }`}
            title="双栏对比模式"
          >
            2 栏
          </button>
          <button
            onClick={() => setLayoutMode('3-col')}
            className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${
              layoutMode === '3-col' ? 'bg-white text-slate-900 font-bold shadow-2xs' : 'text-slate-600 hover:text-slate-900'
            }`}
            title="三栏并排"
          >
            3 栏
          </button>
          <button
            onClick={() => setLayoutMode('4-col')}
            className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors hidden sm:block ${
              layoutMode === '4-col' ? 'bg-white text-slate-900 font-bold shadow-2xs' : 'text-slate-600 hover:text-slate-900'
            }`}
            title="四栏并排"
          >
            4 栏
          </button>
          <button
            onClick={() => setLayoutMode('6-col')}
            className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors hidden xl:block ${
              layoutMode === '6-col' ? 'bg-white text-slate-900 font-bold shadow-2xs' : 'text-slate-600 hover:text-slate-900'
            }`}
            title="全屏 6 栏超宽竞技"
          >
            6 栏
          </button>
          <button
            onClick={() => setLayoutMode('grid')}
            className={`p-1.5 rounded-md text-xs font-medium transition-colors ${
              layoutMode === 'grid' ? 'bg-white text-slate-900 font-bold shadow-2xs' : 'text-slate-600 hover:text-slate-900'
            }`}
            title="响应式网格布局"
          >
            <Grid className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Right Action Buttons */}
      <div className="flex items-center gap-2">
        {/* Diff Comparator */}
        <button
          onClick={onOpenDiffModal}
          className="hidden md:flex items-center gap-1.5 px-3 py-1.5 border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-lg text-xs font-medium transition-colors shadow-2xs"
          title="双模型文本 Diff 差异比对"
        >
          <GitCompare className="w-3.5 h-3.5 text-indigo-600" />
          <span>Diff 比对</span>
        </button>

        {/* Evaluation & Elo Leaderboard */}
        <button
          onClick={onOpenEvaluationModal}
          className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-lg text-xs font-medium transition-colors shadow-2xs"
          title="多模型效果评测矩阵与天梯榜"
        >
          <BarChart3 className="w-3.5 h-3.5 text-indigo-600" />
          <span>效果评估</span>
        </button>

        {/* History Modal */}
        <button
          onClick={onOpenHistoryModal}
          className="flex items-center gap-1.5 px-3 py-1.5 border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-lg text-xs font-medium transition-colors shadow-2xs"
          title="查看多轮会话历史与官网直达链接"
        >
          <History className="w-3.5 h-3.5 text-indigo-600" />
          <span>历史会话</span>
          {historyCount > 0 && (
            <span className="text-[10px] bg-indigo-50 text-indigo-700 font-bold px-1.5 py-0.2 rounded-full">
              {historyCount}
            </span>
          )}
        </button>

        {/* Export Modal */}
        <button
          onClick={onOpenExportModal}
          className="flex items-center gap-1.5 px-3 py-1.5 border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-lg text-xs font-medium transition-colors shadow-2xs"
          title="导出 CSV / Markdown / HTML 对比报告"
        >
          <Share2 className="w-3.5 h-3.5 text-slate-500" />
          <span className="hidden sm:inline">导出</span>
        </button>

        {/* Chrome Extension Packager */}
        <button
          onClick={onOpenExtensionModal}
          className="flex items-center gap-1.5 px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold shadow-sm shadow-indigo-500/20 transition-all active:scale-95"
          title="一键打包生成 Chrome 浏览器插件 (.zip)"
        >
          <Chrome className="w-3.5 h-3.5" />
          <span>Chrome 插件</span>
        </button>

        {/* Settings */}
        <button
          onClick={onOpenSettingsModal}
          className="p-2 border border-slate-200 hover:bg-slate-50 text-slate-600 hover:text-slate-900 rounded-lg transition-colors shadow-2xs"
          title="全局配置与 API 密钥"
        >
          <Settings className="w-4 h-4" />
        </button>

        {/* Fullscreen Toggle */}
        <button
          onClick={toggleFullscreen}
          className="p-2 border border-slate-200 hover:bg-slate-50 text-slate-600 hover:text-slate-900 rounded-lg transition-colors shadow-2xs"
          title={isFullscreen ? '退出全屏' : '全屏竞技场展示'}
        >
          {isFullscreen ? <Minimize2 className="w-4 h-4 text-indigo-600" /> : <Maximize2 className="w-4 h-4" />}
        </button>
      </div>
    </header>
  );
};
