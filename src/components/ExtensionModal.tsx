import React, { useState } from 'react';
import { downloadExtensionZip, generateExtensionFiles } from '../services/extensionPackager';
import { X, Chrome, Download, CheckCircle2, FileCode, ShieldCheck, Sparkles, RefreshCw, Zap } from 'lucide-react';
import { ExtensionIcon } from './ExtensionIcon';

interface ExtensionModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ExtensionModal: React.FC<ExtensionModalProps> = ({ isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState<'install' | 'files'>('install');
  const [isDownloading, setIsDownloading] = useState(false);
  const [selectedFileIdx, setSelectedFileIdx] = useState(0);

  if (!isOpen) return null;

  const extensionFiles = generateExtensionFiles();

  const handleDownload = async () => {
    setIsDownloading(true);
    try {
      await downloadExtensionZip();
    } catch (err) {
      console.error('Download error:', err);
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-in fade-in duration-150">
      <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 bg-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl overflow-hidden shadow-md shadow-indigo-500/20 flex items-center justify-center bg-slate-900 shrink-0">
              <ExtensionIcon size={40} className="w-full h-full" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-base text-slate-900">Chrome 浏览器扩展插件打包生成器</h3>
                <span className="text-[10px] bg-indigo-50 text-indigo-700 border border-indigo-200 px-1.5 py-0.5 rounded font-mono font-bold">
                  Manifest V3
                </span>
                <span className="text-[10px] bg-emerald-50 text-emerald-700 border border-emerald-200 px-1.5 py-0.5 rounded font-semibold">
                  已内置高清图标 & 1/2/3分自动轮询
                </span>
              </div>
              <p className="text-xs text-slate-500">打包下载原生 Chrome 扩展程序，自动解除 ChatGPT/Gemini/DeepSeek 嵌入限制并支持阶梯式重试抓取</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleDownload}
              disabled={isDownloading}
              className="flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white px-3.5 py-1.5 rounded-lg text-xs font-semibold shadow-xs transition-all active:scale-95"
            >
              <Download className="w-3.5 h-3.5" />
              <span>{isDownloading ? '打包中...' : '一键下载插件 ZIP'}</span>
            </button>

            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Tab switcher */}
        <div className="px-6 py-2.5 border-b border-slate-100 bg-slate-50 flex items-center gap-2 text-xs">
          <button
            onClick={() => setActiveTab('install')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium transition-colors ${
              activeTab === 'install' ? 'bg-indigo-600 text-white font-bold shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>15秒极速安装指南</span>
          </button>
          <button
            onClick={() => setActiveTab('files')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium transition-colors ${
              activeTab === 'files' ? 'bg-indigo-600 text-white font-bold shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <FileCode className="w-3.5 h-3.5" />
            <span>查看扩展源码文件 ({extensionFiles.length})</span>
          </button>
        </div>

        {/* Tab Content */}
        <div className="flex-1 overflow-y-auto p-6 bg-[#F8FAFC]">
          {activeTab === 'install' ? (
            <div className="space-y-5">
              {/* Highlight Banner */}
              <div className="bg-indigo-50/70 border border-indigo-100 rounded-xl p-4 flex items-center justify-between">
                <div>
                  <h4 className="font-bold text-sm text-indigo-900 mb-1">
                    🎉 已为您自动生成完整的 Manifest V3 扩展包
                  </h4>
                  <p className="text-xs text-indigo-700/80 leading-relaxed">
                    内置针对 ChatGPT、Gemini、通义千问、DeepSeek、Kimi、豆包、Z.AI 等页面的专用 DOM 抓取与并发调度注入脚本。
                  </p>
                </div>
                <button
                  onClick={handleDownload}
                  className="shrink-0 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-xs font-bold shadow-xs transition-all active:scale-95 ml-4"
                >
                  立即下载 .zip
                </button>
              </div>

              {/* 3 Steps */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-2 relative shadow-xs">
                  <div className="w-7 h-7 rounded-full bg-indigo-50 text-indigo-600 font-bold text-sm flex items-center justify-center border border-indigo-200">
                    1
                  </div>
                  <h4 className="font-bold text-sm text-slate-800">解压下载的 ZIP</h4>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    点击右上角按钮下载 <code className="bg-slate-100 text-slate-700 px-1 rounded font-mono">OmniCompare-Chrome-Extension.zip</code> 并解压到电脑任意文件夹。
                  </p>
                </div>

                <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-2 relative shadow-xs">
                  <div className="w-7 h-7 rounded-full bg-indigo-50 text-indigo-600 font-bold text-sm flex items-center justify-center border border-indigo-200">
                    2
                  </div>
                  <h4 className="font-bold text-sm text-slate-800">打开扩展管理页</h4>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    在 Chrome 地址栏输入 <code className="bg-slate-100 text-indigo-600 px-1 rounded font-mono">chrome://extensions/</code>，并开启右上角的<strong>「开发者模式」</strong>。
                  </p>
                </div>

                <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-2 relative shadow-xs">
                  <div className="w-7 h-7 rounded-full bg-indigo-50 text-indigo-600 font-bold text-sm flex items-center justify-center border border-indigo-200">
                    3
                  </div>
                  <h4 className="font-bold text-sm text-slate-800">加载已解压的扩展</h4>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    点击左上角<strong>「加载已解压的扩展程序」 (Load unpacked)</strong>，选中刚才解压的文件夹即可立即启用！
                  </p>
                </div>
              </div>

              {/* Supported Host Platforms */}
              <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
                <h5 className="font-bold text-xs text-slate-700 mb-3 flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  <span>已配置并测试支持的网页注入通道 (Content Scripts)</span>
                </h5>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                  <div className="bg-slate-50 border border-slate-200 px-2.5 py-1.5 rounded text-slate-700">
                    🟢 chatgpt.com
                  </div>
                  <div className="bg-slate-50 border border-slate-200 px-2.5 py-1.5 rounded text-slate-700">
                    🔵 gemini.google.com
                  </div>
                  <div className="bg-slate-50 border border-slate-200 px-2.5 py-1.5 rounded text-slate-700">
                    🟣 chat.qwen.ai
                  </div>
                  <div className="bg-slate-50 border border-slate-200 px-2.5 py-1.5 rounded text-slate-700">
                    🔷 chat.deepseek.com
                  </div>
                  <div className="bg-slate-50 border border-slate-200 px-2.5 py-1.5 rounded text-slate-700">
                    🌙 kimi.moonshot.cn
                  </div>
                  <div className="bg-slate-50 border border-slate-200 px-2.5 py-1.5 rounded text-slate-700">
                    🔴 doubao.com/chat
                  </div>
                  <div className="bg-slate-50 border border-slate-200 px-2.5 py-1.5 rounded text-slate-700">
                    🟠 z.ai (智谱清言)
                  </div>
                  <div className="bg-slate-50 border border-slate-200 px-2.5 py-1.5 rounded text-slate-700">
                    🟤 claude.ai
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex h-[420px] bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
              {/* File Tree */}
              <div className="w-56 bg-slate-50 border-r border-slate-200 p-2 overflow-y-auto space-y-1">
                <div className="text-[10px] text-slate-400 font-bold px-2 py-1 uppercase tracking-wider">
                  扩展程序文件目录
                </div>
                {extensionFiles.map((file, fIdx) => (
                  <button
                    key={file.path}
                    onClick={() => setSelectedFileIdx(fIdx)}
                    className={`w-full text-left px-2.5 py-1.5 rounded text-xs font-mono truncate transition-colors ${
                      selectedFileIdx === fIdx
                        ? 'bg-indigo-50 text-indigo-700 font-semibold border border-indigo-200'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
                    }`}
                  >
                    {file.path}
                  </button>
                ))}
              </div>

              {/* File Content Preview */}
              <div className="flex-1 flex flex-col bg-white">
                <div className="px-4 py-2 bg-slate-50 border-b border-slate-200 flex items-center justify-between text-xs font-mono text-slate-500">
                  <span>{extensionFiles[selectedFileIdx]?.path}</span>
                  <span>{extensionFiles[selectedFileIdx]?.content.length} bytes</span>
                </div>
                <pre className="flex-1 p-4 text-xs font-mono text-slate-800 overflow-auto whitespace-pre leading-relaxed bg-[#F8FAFC]">
                  <code>{extensionFiles[selectedFileIdx]?.content}</code>
                </pre>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
