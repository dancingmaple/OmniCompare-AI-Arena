import React, { useState } from 'react';
import { AIModelId, ModelSession, ExportSessionData, SavedSessionHistory } from '../types/arena';
import { SUPPORTED_MODELS } from '../config/models';
import {
  X,
  Download,
  FileText,
  Table,
  FileCode,
  Check,
  Copy,
  Upload,
  Globe,
  Layout,
  ExternalLink
} from 'lucide-react';

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  sessions: Record<AIModelId, ModelSession>;
  selectedModelIds: AIModelId[];
  activeRound: number;
  onImportSession?: (data: ExportSessionData) => void;
  sessionToExport?: SavedSessionHistory | null;
}

export const ExportModal: React.FC<ExportModalProps> = ({
  isOpen,
  onClose,
  sessions,
  selectedModelIds,
  activeRound,
  onImportSession,
  sessionToExport,
}) => {
  const [copiedType, setCopiedType] = useState<string | null>(null);

  if (!isOpen) return null;

  // Determine models and rounds from either sessionToExport or current state
  const targetModelIds = sessionToExport ? sessionToExport.models : selectedModelIds;
  const targetRoundsCount = sessionToExport ? sessionToExport.roundsCount : Math.max(1, activeRound);

  // Helper to get response and conversation URL for a model at a round
  const getRoundData = (rIndex: number, modelId: AIModelId) => {
    if (sessionToExport) {
      const round = sessionToExport.rounds[rIndex - 1];
      const userPrompt = round?.userPrompt || `第 ${rIndex} 轮提示词`;
      const resp = round?.responses[modelId];
      const config = SUPPORTED_MODELS.find(m => m.id === modelId);
      return {
        userPrompt,
        content: resp?.content || '',
        thinking: resp?.thinking,
        latencyMs: resp?.latencyMs,
        tokensPerSec: resp?.tokensPerSec,
        score: resp?.score,
        conversationUrl: resp?.conversationUrl || config?.webUrl,
      };
    } else {
      const firstSession = sessions[targetModelIds[0]];
      const userPrompt = firstSession?.messages.filter(m => m.role === 'user')[rIndex - 1]?.content || `Round ${rIndex} Prompt`;
      const session = sessions[modelId];
      const assistantMsg = session?.messages.filter(m => m.role === 'assistant')[rIndex - 1];
      const config = SUPPORTED_MODELS.find(m => m.id === modelId);
      return {
        userPrompt,
        content: assistantMsg?.content || '',
        thinking: assistantMsg?.thinkingContent,
        latencyMs: assistantMsg?.latencyMs || session?.lastLatencyMs || config?.sampleLatencyMs,
        tokensPerSec: assistantMsg?.tokensPerSec || session?.lastTokensPerSec || config?.sampleTokensPerSec,
        score: assistantMsg?.score,
        conversationUrl: assistantMsg?.conversationUrl || session?.conversationUrl || config?.webUrl,
      };
    }
  };

  // Build Markdown format with conversation URLs attached
  const generateMarkdownReport = () => {
    let md = `# ⚡ OmniCompare 多模型并发评测报告\n\n`;
    md += `> 生成时间：${new Date().toLocaleString()} | 对话轮次：${targetRoundsCount} 轮 | 参与模型数：${targetModelIds.length}\n\n`;

    md += `## 📊 评测总览表格\n\n`;
    md += `| 模型名称 | 所属厂商 | 平均延迟 | 吞吐速率 | 官网会话直达链接 |\n`;
    md += `| :--- | :--- | :--- | :--- | :--- |\n`;

    targetModelIds.forEach(id => {
      const config = SUPPORTED_MODELS.find(m => m.id === id);
      const round1 = getRoundData(1, id);
      const linkText = round1.conversationUrl ? `[🔗 点击直达官网会话](${round1.conversationUrl})` : `[🔗 官方主页](${config?.webUrl})`;
      md += `| **${config?.name || id}** | ${config?.company || '-'} | ${round1.latencyMs || 500}ms | ${round1.tokensPerSec || 80}t/s | ${linkText} |\n`;
    });

    md += `\n---\n\n## 📝 多轮对话详细比对记录 (附各模型对话源链接)\n\n`;

    for (let r = 1; r <= targetRoundsCount; r++) {
      const firstData = getRoundData(r, targetModelIds[0]);

      md += `### 🔹 第 ${r} 轮用户提问\n`;
      md += `\`\`\`text\n${firstData.userPrompt}\n\`\`\`\n\n`;

      targetModelIds.forEach(id => {
        const config = SUPPORTED_MODELS.find(m => m.id === id);
        const data = getRoundData(r, id);

        md += `#### 【${config?.name}】 (${config?.company}) 回答\n`;
        if (data.conversationUrl) {
          md += `> 🔗 **官方对话源链接：** [${data.conversationUrl}](${data.conversationUrl})\n\n`;
        }
        if (data.latencyMs) {
          md += `*⏱️ 耗时：${data.latencyMs}ms | 🚀 吞吐：${data.tokensPerSec || '-'} t/s*\n\n`;
        }
        if (data.thinking) {
          md += `<details><summary>🧠 展开思考推理过程 (Thinking CoT)</summary>\n\n\`\`\`\n${data.thinking}\n\`\`\`\n</details>\n\n`;
        }
        md += `${data.content || '（暂无回答内容）'}\n\n`;
      });

      md += `---\n\n`;
    }

    return md;
  };

  // Build Standalone HTML Report with responsive CSS & links
  const generateHTMLReport = () => {
    let html = `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>OmniCompare 多模型并发评测报告</title>
  <style>
    :root {
      --primary: #4F46E5;
      --bg: #F8FAFC;
      --card-bg: #FFFFFF;
      --text: #0F172A;
      --text-muted: #64748B;
      --border: #E2E8F0;
    }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      background-color: var(--bg);
      color: var(--text);
      line-height: 1.6;
      margin: 0;
      padding: 32px 16px;
    }
    .container {
      max-width: 1100px;
      margin: 0 auto;
    }
    .header-card {
      background: white;
      border: 1px solid var(--border);
      border-radius: 16px;
      padding: 24px;
      margin-bottom: 24px;
      box-shadow: 0 1px 3px rgba(0,0,0,0.05);
    }
    .title {
      font-size: 24px;
      font-weight: 800;
      color: var(--primary);
      margin: 0 0 8px 0;
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .meta {
      font-size: 13px;
      color: var(--text-muted);
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin: 16px 0;
      background: white;
      border-radius: 12px;
      overflow: hidden;
      border: 1px solid var(--border);
    }
    th, td {
      padding: 12px 16px;
      text-align: left;
      border-bottom: 1px solid var(--border);
      font-size: 13px;
    }
    th {
      background: #F1F5F9;
      font-weight: 700;
      color: #334155;
    }
    .link-btn {
      display: inline-flex;
      align-items: center;
      gap: 4px;
      color: var(--primary);
      text-decoration: none;
      font-weight: 600;
      background: #EEF2FF;
      padding: 4px 10px;
      border-radius: 6px;
      font-size: 12px;
    }
    .link-btn:hover {
      background: #E0E7FF;
    }
    .round-card {
      background: white;
      border: 1px solid var(--border);
      border-radius: 16px;
      padding: 24px;
      margin-bottom: 24px;
      box-shadow: 0 1px 3px rgba(0,0,0,0.05);
    }
    .prompt-box {
      background: #F1F5F9;
      border-left: 4px solid var(--primary);
      padding: 12px 16px;
      border-radius: 0 8px 8px 0;
      font-family: monospace;
      font-size: 14px;
      margin-bottom: 20px;
    }
    .responses-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
      gap: 16px;
    }
    .model-box {
      border: 1px solid var(--border);
      border-radius: 12px;
      padding: 16px;
      background: #FAF5FF;
    }
    .model-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 12px;
      border-bottom: 1px solid var(--border);
      padding-bottom: 8px;
    }
    .model-name {
      font-weight: 700;
      font-size: 14px;
    }
    .thinking-details {
      background: #F3F4F6;
      border: 1px solid #E5E7EB;
      border-radius: 8px;
      padding: 8px 12px;
      margin-bottom: 12px;
      font-size: 12px;
      color: #4B5563;
      font-family: monospace;
      white-space: pre-wrap;
    }
    .content-box {
      font-size: 13px;
      color: #1E293B;
      white-space: pre-wrap;
      line-height: 1.6;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header-card">
      <h1 class="title">⚡ OmniCompare 多模型并发评测报告</h1>
      <div class="meta">生成时间：${new Date().toLocaleString()} | 对话轮次：${targetRoundsCount} 轮 | 参与模型数：${targetModelIds.length}</div>

      <h3>📊 评测总览与官方对话链接</h3>
      <table>
        <thead>
          <tr>
            <th>模型名称</th>
            <th>所属厂商</th>
            <th>平均延迟</th>
            <th>吞吐速率</th>
            <th>官方会话直达链接</th>
          </tr>
        </thead>
        <tbody>
`;

    targetModelIds.forEach(id => {
      const config = SUPPORTED_MODELS.find(m => m.id === id);
      const rData = getRoundData(1, id);
      const url = rData.conversationUrl || config?.webUrl;
      html += `          <tr>
            <td><strong>${config?.name || id}</strong></td>
            <td>${config?.company || '-'}</td>
            <td>${rData.latencyMs || 500}ms</td>
            <td>${rData.tokensPerSec || 80}t/s</td>
            <td><a href="${url}" target="_blank" class="link-btn">🔗 官方直达链接</a></td>
          </tr>\n`;
    });

    html += `        </tbody>
      </table>
    </div>
`;

    for (let r = 1; r <= targetRoundsCount; r++) {
      const firstData = getRoundData(r, targetModelIds[0]);
      html += `    <div class="round-card">
      <h2>🔹 第 ${r} 轮用户提示词</h2>
      <div class="prompt-box">${firstData.userPrompt.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</div>

      <div class="responses-grid">
`;

      targetModelIds.forEach(id => {
        const config = SUPPORTED_MODELS.find(m => m.id === id);
        const data = getRoundData(r, id);
        const url = data.conversationUrl || config?.webUrl;

        html += `        <div class="model-box">
          <div class="model-header">
            <span class="model-name">${config?.name || id}</span>
            <a href="${url}" target="_blank" class="link-btn">🔗 会话源链接</a>
          </div>
`;
        if (data.thinking) {
          html += `          <details>
            <summary style="font-size:12px; color:#6366F1; cursor:pointer; font-weight:600; margin-bottom:8px;">🧠 展开思考过程 (CoT)</summary>
            <div class="thinking-details">${data.thinking.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</div>
          </details>
`;
        }

        html += `          <div class="content-box">${data.content.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</div>
        </div>
`;
      });

      html += `      </div>
    </div>
`;
    }

    html += `  </div>
</body>
</html>`;

    return html;
  };

  // Build CSV format with Conversation_URL
  const generateCSVReport = () => {
    let csv = `\uFEFFRound,User_Prompt,Model_Name,Company,Latency_ms,Tokens_per_sec,Conversation_URL,Thinking_Length,Response_Length\n`;

    for (let r = 1; r <= targetRoundsCount; r++) {
      const firstData = getRoundData(r, targetModelIds[0]);
      const userMsg = firstData.userPrompt.replace(/"/g, '""');

      targetModelIds.forEach(id => {
        const config = SUPPORTED_MODELS.find(m => m.id === id);
        const data = getRoundData(r, id);

        const modelName = (config?.name || id).replace(/"/g, '""');
        const company = (config?.company || '').replace(/"/g, '""');
        const latency = data.latencyMs || 0;
        const tps = data.tokensPerSec || 0;
        const convUrl = (data.conversationUrl || config?.webUrl || '').replace(/"/g, '""');
        const thinkingLen = data.thinking?.length || 0;
        const respLen = data.content?.length || 0;

        csv += `"${r}","${userMsg}","${modelName}","${company}","${latency}","${tps}","${convUrl}","${thinkingLen}","${respLen}"\n`;
      });
    }

    return csv;
  };

  // Build JSON format with conversation URLs
  const generateJSONReport = (): ExportSessionData => {
    const rounds = [];
    for (let r = 1; r <= targetRoundsCount; r++) {
      const firstData = getRoundData(r, targetModelIds[0]);
      const responses: any = {};

      targetModelIds.forEach(id => {
        const data = getRoundData(r, id);
        responses[id] = {
          content: data.content,
          thinking: data.thinking,
          latencyMs: data.latencyMs,
          tokensPerSec: data.tokensPerSec,
          score: data.score,
          conversationUrl: data.conversationUrl,
        };
      });

      rounds.push({ roundIndex: r, userPrompt: firstData.userPrompt, responses });
    }

    return {
      title: sessionToExport?.title || `OmniCompare-Session-${new Date().toISOString().slice(0, 10)}`,
      createdAt: sessionToExport ? new Date(sessionToExport.createdAt).toISOString() : new Date().toISOString(),
      models: targetModelIds,
      rounds,
    };
  };

  const handleDownloadFile = (content: string, filename: string, type: string) => {
    const blob = new Blob([content], { type });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleCopy = (content: string, type: string) => {
    navigator.clipboard.writeText(content);
    setCopiedType(type);
    setTimeout(() => setCopiedType(null), 2000);
  };

  const handleFileImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = event => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        if (parsed && parsed.rounds && onImportSession) {
          onImportSession(parsed);
          onClose();
        }
      } catch (err) {
        alert('导入失败：无效的 JSON 存档文件');
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-in fade-in duration-150">
      <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-2xl flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 bg-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 border border-indigo-200 flex items-center justify-center shadow-xs">
              <Download className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-base text-slate-900">导出多模型评测文档 (附官方会话链接)</h3>
              <p className="text-xs text-slate-500">
                支持 Markdown 报告、HTML 独立网页、CSV 结构化表格与全量 JSON 存档
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Options List */}
        <div className="p-6 space-y-3 bg-[#F8FAFC]">
          {/* 1. Markdown (.md) */}
          <div className="flex items-center justify-between bg-white border border-slate-200 rounded-xl p-3.5 hover:border-indigo-300 hover:shadow-xs transition-all">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-indigo-50 text-indigo-600 border border-indigo-100 flex items-center justify-center">
                <FileText className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-bold text-sm text-slate-800">Markdown 完整报告 (.md)</h4>
                <p className="text-xs text-slate-500">包含多模型对比表格、思维链及各模型官方会话直达链接</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => handleCopy(generateMarkdownReport(), 'md')}
                className="px-3 py-1.5 rounded-lg text-xs bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium transition-colors"
              >
                {copiedType === 'md' ? <Check className="w-3.5 h-3.5 text-emerald-600 inline mr-1" /> : <Copy className="w-3.5 h-3.5 inline mr-1 text-slate-500" />}
                <span>复制</span>
              </button>
              <button
                onClick={() => handleDownloadFile(generateMarkdownReport(), `OmniCompare-Report-${Date.now()}.md`, 'text/markdown')}
                className="px-3.5 py-1.5 rounded-lg text-xs bg-indigo-600 hover:bg-indigo-700 text-white font-semibold shadow-xs transition-colors"
              >
                下载 .md
              </button>
            </div>
          </div>

          {/* 2. Standalone HTML (.html) */}
          <div className="flex items-center justify-between bg-white border border-slate-200 rounded-xl p-3.5 hover:border-blue-300 hover:shadow-xs transition-all">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-blue-50 text-blue-600 border border-blue-100 flex items-center justify-center">
                <Layout className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-bold text-sm text-slate-800">HTML 精美网页文档 (.html)</h4>
                <p className="text-xs text-slate-500">独立单文件网页，排版美观，内置会话链接与折叠思维链</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => handleDownloadFile(generateHTMLReport(), `OmniCompare-Doc-${Date.now()}.html`, 'text/html')}
                className="px-3.5 py-1.5 rounded-lg text-xs bg-blue-600 hover:bg-blue-700 text-white font-semibold shadow-xs transition-colors"
              >
                下载 .html
              </button>
            </div>
          </div>

          {/* 3. CSV (.csv) */}
          <div className="flex items-center justify-between bg-white border border-slate-200 rounded-xl p-3.5 hover:border-emerald-300 hover:shadow-xs transition-all">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-emerald-50 text-emerald-600 border border-emerald-100 flex items-center justify-center">
                <Table className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-bold text-sm text-slate-800">Excel / CSV 结构化数据 (.csv)</h4>
                <p className="text-xs text-slate-500">包含 Conversation_URL 列，适合导入飞书多维表格或 Excel</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => handleCopy(generateCSVReport(), 'csv')}
                className="px-3 py-1.5 rounded-lg text-xs bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium transition-colors"
              >
                {copiedType === 'csv' ? <Check className="w-3.5 h-3.5 text-emerald-600 inline mr-1" /> : <Copy className="w-3.5 h-3.5 inline mr-1 text-slate-500" />}
                <span>复制</span>
              </button>
              <button
                onClick={() => handleDownloadFile(generateCSVReport(), `OmniCompare-Data-${Date.now()}.csv`, 'text/csv;charset=utf-8;')}
                className="px-3.5 py-1.5 rounded-lg text-xs bg-emerald-600 hover:bg-emerald-700 text-white font-semibold shadow-xs transition-colors"
              >
                下载 .csv
              </button>
            </div>
          </div>

          {/* 4. JSON (.json) */}
          <div className="flex items-center justify-between bg-white border border-slate-200 rounded-xl p-3.5 hover:border-purple-300 hover:shadow-xs transition-all">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-purple-50 text-purple-600 border border-purple-100 flex items-center justify-center">
                <FileCode className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-bold text-sm text-slate-800">JSON 全量会话存档 (.json)</h4>
                <p className="text-xs text-slate-500">完整保存多轮对话状态及链接，可随时导入恢复</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => handleDownloadFile(JSON.stringify(generateJSONReport(), null, 2), `OmniCompare-Session-${Date.now()}.json`, 'application/json')}
                className="px-3.5 py-1.5 rounded-lg text-xs bg-purple-600 hover:bg-purple-700 text-white font-semibold shadow-xs transition-colors"
              >
                下载 .json
              </button>
            </div>
          </div>

          {/* Import Session section */}
          {onImportSession && (
            <div className="border-t border-slate-200 pt-3 flex items-center justify-between">
              <div className="text-xs text-slate-500">
                需要恢复历史评测记录？
              </div>
              <label className="cursor-pointer flex items-center gap-1.5 text-xs bg-white hover:bg-slate-50 text-slate-700 px-3 py-1.5 rounded-lg border border-slate-200 shadow-2xs transition-colors">
                <Upload className="w-3.5 h-3.5 text-slate-500" />
                <span>导入历史 JSON 存档</span>
                <input
                  type="file"
                  accept=".json"
                  onChange={handleFileImport}
                  className="hidden"
                />
              </label>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
