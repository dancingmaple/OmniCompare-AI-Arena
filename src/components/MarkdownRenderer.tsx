import React, { useState } from 'react';
import { Copy, Check, Terminal, ExternalLink } from 'lucide-react';

interface MarkdownRendererProps {
  content: string;
  isStreaming?: boolean;
}

export const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({ content, isStreaming }) => {
  const [copiedCodeIndex, setCopiedCodeIndex] = useState<number | null>(null);

  const handleCopyCode = (code: string, index: number) => {
    navigator.clipboard.writeText(code);
    setCopiedCodeIndex(index);
    setTimeout(() => setCopiedCodeIndex(null), 2000);
  };

  // Simple, robust Markdown parser that supports headings, bold, code blocks, lists, math, and tables
  const renderFormattedMarkdown = (raw: string) => {
    // Split by code blocks first
    const parts = raw.split(/(```[\s\S]*?```)/g);
    let codeIndex = 0;

    return parts.map((part, pIdx) => {
      if (part.startsWith('```')) {
        const firstLineEnd = part.indexOf('\n');
        const language = firstLineEnd !== -1 ? part.slice(3, firstLineEnd).trim() : '';
        const code = firstLineEnd !== -1 ? part.slice(firstLineEnd + 1, -3) : part.slice(3, -3);
        const currentIdx = codeIndex++;

        return (
          <div key={pIdx} className="my-2.5 rounded-xl overflow-hidden border border-slate-800 bg-slate-900 shadow-xs">
            <div className="flex items-center justify-between px-3.5 py-1.5 bg-slate-950/80 border-b border-slate-800 text-[11px] text-slate-400">
              <span className="flex items-center gap-1.5 font-mono">
                <Terminal className="w-3.5 h-3.5 text-indigo-400" />
                <span>{language || 'code'}</span>
              </span>
              <button
                onClick={() => handleCopyCode(code, currentIdx)}
                className="flex items-center gap-1 text-slate-400 hover:text-slate-200 px-2 py-0.5 rounded hover:bg-slate-800 transition-colors"
                title="复制代码"
              >
                {copiedCodeIndex === currentIdx ? (
                  <>
                    <Check className="w-3 h-3 text-emerald-400" />
                    <span className="text-emerald-400">已复制</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3 h-3" />
                    <span>复制</span>
                  </>
                )}
              </button>
            </div>
            <pre className="p-3 text-xs font-mono text-emerald-300 overflow-x-auto leading-relaxed bg-slate-900">
              <code>{code}</code>
            </pre>
          </div>
        );
      }

      // Process regular markdown lines
      const lines = part.split('\n');
      return (
        <div key={pIdx} className="space-y-1.5">
          {lines.map((line, lIdx) => {
            // Heading 3 ###
            if (line.startsWith('### ')) {
              return (
                <h3 key={lIdx} className="text-sm font-bold text-slate-900 mt-3 mb-1 border-b border-slate-100 pb-0.5">
                  {renderInlineFormatting(line.slice(4))}
                </h3>
              );
            }
            // Heading 2 ##
            if (line.startsWith('## ')) {
              return (
                <h2 key={lIdx} className="text-base font-bold text-indigo-900 mt-3.5 mb-1.5">
                  {renderInlineFormatting(line.slice(3))}
                </h2>
              );
            }
            // Heading 1 #
            if (line.startsWith('# ')) {
              return (
                <h1 key={lIdx} className="text-lg font-extrabold text-slate-900 mt-4 mb-2">
                  {renderInlineFormatting(line.slice(2))}
                </h1>
              );
            }
            // Bullet list - or *
            if (/^(\s*)[-*]\s+/.test(line)) {
              const text = line.replace(/^(\s*)[-*]\s+/, '');
              return (
                <div key={lIdx} className="flex items-start gap-2 pl-1.5 text-slate-700 text-[13px] leading-relaxed">
                  <span className="text-indigo-500 mt-1 text-[10px]">●</span>
                  <span>{renderInlineFormatting(text)}</span>
                </div>
              );
            }
            // Numbered list
            if (/^(\s*)\d+\.\s+/.test(line)) {
              const match = line.match(/^(\s*)(\d+)\.\s+(.*)/);
              if (match) {
                return (
                  <div key={lIdx} className="flex items-start gap-2 pl-1.5 text-slate-700 text-[13px] leading-relaxed">
                    <span className="font-semibold text-indigo-600 min-w-4 text-xs mt-0.5">{match[2]}.</span>
                    <span>{renderInlineFormatting(match[3])}</span>
                  </div>
                );
              }
            }
            // Blockquote
            if (line.startsWith('> ')) {
              return (
                <blockquote key={lIdx} className="border-l-2 border-indigo-500 pl-3 py-1 my-1.5 bg-indigo-50/50 text-slate-700 italic text-[13px] rounded-r">
                  {renderInlineFormatting(line.slice(2))}
                </blockquote>
              );
            }
            // Empty line
            if (!line.trim()) {
              return <div key={lIdx} className="h-1.5" />;
            }
            // Normal paragraph
            return (
              <p key={lIdx} className="text-[13px] text-slate-800 leading-relaxed">
                {renderInlineFormatting(line)}
              </p>
            );
          })}
        </div>
      );
    });
  };

  const renderInlineFormatting = (text: string) => {
    // Math formulas $...$
    let processed = text;
    
    // Split by inline code `...`
    const codeSegments = processed.split(/(`[^`]+`)/g);

    return codeSegments.map((seg, sIdx) => {
      if (seg.startsWith('`') && seg.endsWith('`') && seg.length > 2) {
        return (
          <code key={sIdx} className="bg-slate-100 text-indigo-700 px-1.5 py-0.5 rounded text-xs font-mono mx-0.5 border border-slate-200">
            {seg.slice(1, -1)}
          </code>
        );
      }

      // Handle bold **...**
      const boldSegments = seg.split(/(\*\*[^*]+\*\*)/g);
      return boldSegments.map((bSeg, bIdx) => {
        if (bSeg.startsWith('**') && bSeg.endsWith('**') && bSeg.length > 4) {
          return (
            <strong key={bIdx} className="font-bold text-slate-900">
              {bSeg.slice(2, -2)}
            </strong>
          );
        }

        // Handle italic *...*
        const italicSegments = bSeg.split(/(\*[^*]+\*)/g);
        return italicSegments.map((iSeg, iIdx) => {
          if (iSeg.startsWith('*') && iSeg.endsWith('*') && iSeg.length > 2) {
            return (
              <em key={iIdx} className="italic text-slate-700">
                {iSeg.slice(1, -1)}
              </em>
            );
          }
          return iSeg;
        });
      });
    });
  };

  return (
    <div className={`max-w-none text-slate-800 ${isStreaming ? 'streaming-cursor' : ''}`}>
      {renderFormattedMarkdown(content)}
    </div>
  );
};
