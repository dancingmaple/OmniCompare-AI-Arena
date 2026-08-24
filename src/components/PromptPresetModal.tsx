import React, { useState, useEffect, useRef } from 'react';
import { PROMPT_PRESETS } from '../config/models';
import { PromptPreset } from '../types/arena';
import {
  X,
  Sparkles,
  Search,
  ArrowRight,
  Plus,
  Edit2,
  Trash2,
  Copy,
  Check,
  RotateCcw,
  Download,
  Upload,
  Send,
  PenTool,
  Bookmark,
  Tag,
  SlidersHorizontal,
  FileText
} from 'lucide-react';

interface PromptPresetModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectPrompt: (prompt: string, systemPrompt?: string) => void;
  onFillPrompt?: (prompt: string, systemPrompt?: string) => void;
}

const STORAGE_KEY = 'omnicompare_custom_prompt_templates_v2';

const DEFAULT_CATEGORIES = [
  { id: 'all', label: '全部场景' },
  { id: 'custom', label: '⭐ 我的自定义' },
  { id: 'coding', label: '代码重构' },
  { id: 'math', label: '数理逻辑' },
  { id: 'arch', label: '系统架构' },
  { id: 'writing', label: '创意文案' },
  { id: 'eval', label: '语义辨析' },
  { id: 'translation', label: '学术翻译' },
  { id: 'legal', label: '法律合规' },
];

export const PromptPresetModal: React.FC<PromptPresetModalProps> = ({
  isOpen,
  onClose,
  onSelectPrompt,
  onFillPrompt,
}) => {
  const [templates, setTemplates] = useState<PromptPreset[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchKeyword, setSearchKeyword] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Edit / Create State
  const [isEditing, setIsEditing] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<Partial<PromptPreset> | null>(null);
  const [editFormErrors, setEditFormErrors] = useState<{ title?: string; prompt?: string }>({});

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Initialize templates from localStorage or fallback to default PROMPT_PRESETS
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setTemplates(parsed);
          return;
        }
      }
    } catch (e) {}
    setTemplates(PROMPT_PRESETS);
  }, [isOpen]);

  // Save templates to localStorage
  const saveTemplatesToStorage = (list: PromptPreset[]) => {
    setTemplates(list);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
    } catch (e) {}
  };

  if (!isOpen) return null;

  // Filtered Templates
  const filteredTemplates = templates.filter(p => {
    const matchCat =
      selectedCategory === 'all'
        ? true
        : selectedCategory === 'custom'
        ? !p.isBuiltIn || p.category === 'custom'
        : p.category === selectedCategory;

    const query = searchKeyword.trim().toLowerCase();
    const matchSearch =
      !query ||
      p.title.toLowerCase().includes(query) ||
      p.prompt.toLowerCase().includes(query) ||
      p.description.toLowerCase().includes(query) ||
      p.categoryLabel.toLowerCase().includes(query) ||
      (p.tags && p.tags.some(t => t.toLowerCase().includes(query)));

    return matchCat && matchSearch;
  });

  // Handle Copy Prompt
  const handleCopyPrompt = (preset: PromptPreset, e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(preset.prompt);
    setCopiedId(preset.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Handle Fill Prompt (Without sending immediately)
  const handleFillPromptOnly = (preset: PromptPreset, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (onFillPrompt) {
      onFillPrompt(preset.prompt, preset.systemPrompt);
    } else {
      onSelectPrompt(preset.prompt, preset.systemPrompt);
    }
    onClose();
  };

  // Handle Fill & Send Immediately
  const handleSendPromptImmediately = (preset: PromptPreset, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    onSelectPrompt(preset.prompt, preset.systemPrompt);
    onClose();
  };

  // Handle Open Create New Template
  const handleOpenCreateModal = () => {
    setEditingTemplate({
      id: `custom-${Date.now()}`,
      title: '',
      category: selectedCategory !== 'all' && selectedCategory !== 'custom' ? selectedCategory : 'custom',
      categoryLabel: selectedCategory !== 'all' && selectedCategory !== 'custom' ? (DEFAULT_CATEGORIES.find(c => c.id === selectedCategory)?.label || '自定义') : '自定义场景',
      description: '',
      prompt: '',
      systemPrompt: '',
      tags: [],
      isBuiltIn: false,
      updatedAt: Date.now(),
    });
    setEditFormErrors({});
    setIsEditing(true);
  };

  // Handle Open Edit Template
  const handleOpenEditModal = (preset: PromptPreset, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingTemplate({
      ...preset,
      // If builtIn, clone it as a custom one when editing or allow override
      id: preset.isBuiltIn ? `custom-fork-${Date.now()}` : preset.id,
      title: preset.isBuiltIn ? `${preset.title} (副本)` : preset.title,
      isBuiltIn: false,
      updatedAt: Date.now(),
    });
    setEditFormErrors({});
    setIsEditing(true);
  };

  // Handle Delete Template
  const handleDeleteTemplate = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (window.confirm('确定要删除该提示词模板吗？')) {
      const updated = templates.filter(t => t.id !== id);
      saveTemplatesToStorage(updated);
    }
  };

  // Handle Save Template Form
  const handleSaveForm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTemplate) return;

    const errors: { title?: string; prompt?: string } = {};
    if (!editingTemplate.title?.trim()) {
      errors.title = '请输入模板标题';
    }
    if (!editingTemplate.prompt?.trim()) {
      errors.prompt = '请输入提示词内容';
    }

    if (Object.keys(errors).length > 0) {
      setEditFormErrors(errors);
      return;
    }

    const catObj = DEFAULT_CATEGORIES.find(c => c.id === editingTemplate.category);
    const categoryLabel = catObj ? catObj.label : (editingTemplate.categoryLabel || '自定义场景');

    const finalized: PromptPreset = {
      id: editingTemplate.id || `custom-${Date.now()}`,
      title: editingTemplate.title!.trim(),
      category: editingTemplate.category || 'custom',
      categoryLabel,
      description: editingTemplate.description?.trim() || '自定义提示词模板',
      prompt: editingTemplate.prompt!.trim(),
      systemPrompt: editingTemplate.systemPrompt?.trim() || undefined,
      tags: Array.isArray(editingTemplate.tags) ? editingTemplate.tags : [],
      isBuiltIn: false,
      updatedAt: Date.now(),
    };

    const existsIdx = templates.findIndex(t => t.id === finalized.id);
    let updated: PromptPreset[];
    if (existsIdx >= 0) {
      updated = [...templates];
      updated[existsIdx] = finalized;
    } else {
      updated = [finalized, ...templates];
    }

    saveTemplatesToStorage(updated);
    setIsEditing(false);
    setEditingTemplate(null);
  };

  // Reset to Defaults
  const handleResetToDefaults = () => {
    if (window.confirm('确定要重置为默认官方预设场景库吗？（自定义模板将被覆盖）')) {
      saveTemplatesToStorage(PROMPT_PRESETS);
    }
  };

  // Export Templates JSON
  const handleExportTemplates = () => {
    const jsonStr = JSON.stringify(templates, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `OmniCompare_Prompt_Templates_${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Import Templates JSON
  const handleImportFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = event => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        if (Array.isArray(parsed)) {
          // Merge imported templates
          const merged = [...parsed, ...templates.filter(t => !parsed.some((p: PromptPreset) => p.id === t.id))];
          saveTemplatesToStorage(merged);
          alert(`成功导入 ${parsed.length} 个提示词模板！`);
        } else {
          alert('文件格式错误：必须为 JSON 提示词数组');
        }
      } catch (err) {
        alert('解析 JSON 文件失败');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-in fade-in duration-150">
      <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-4xl max-h-[88vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-white shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 border border-indigo-200 flex items-center justify-center shadow-2xs">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-base text-slate-900">提示词模板与评测场景库</h3>
                <span className="text-xs bg-indigo-50 text-indigo-700 font-semibold px-2 py-0.5 rounded-full border border-indigo-200/60">
                  {templates.length} 个模板
                </span>
              </div>
              <p className="text-xs text-slate-500">
                支持新增、修改、删除、搜索、一键复制与填充到对话框，快速检验多模型综合实力
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleOpenCreateModal}
              className="flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-1.5 rounded-xl text-xs font-semibold shadow-xs transition-all active:scale-95"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>新建模板</span>
            </button>

            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Toolbar: Category Filters & Search */}
        <div className="px-6 py-3 border-b border-slate-100 bg-slate-50/70 flex flex-wrap items-center justify-between gap-3 shrink-0">
          {/* Categories Horizontal Scroll */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0 max-w-full">
            {DEFAULT_CATEGORIES.map(cat => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors whitespace-nowrap ${
                  selectedCategory === cat.id
                    ? 'bg-indigo-600 text-white shadow-xs font-semibold'
                    : 'bg-white text-slate-600 hover:bg-slate-200/60 border border-slate-200'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>

          {/* Search Input & Action Buttons */}
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <div className="relative flex-1 sm:w-64">
              <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-slate-400" />
              <input
                type="text"
                value={searchKeyword}
                onChange={e => setSearchKeyword(e.target.value)}
                placeholder="搜索标题、内容、场景标签..."
                className="w-full bg-white border border-slate-200 rounded-lg pl-8 pr-7 py-1.5 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
              />
              {searchKeyword && (
                <button
                  onClick={() => setSearchKeyword('')}
                  className="absolute right-2 top-2 text-slate-400 hover:text-slate-600"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>

            {/* Export & Import Tools */}
            <div className="flex items-center gap-1 shrink-0">
              <button
                onClick={handleExportTemplates}
                className="p-1.5 bg-white border border-slate-200 hover:bg-slate-100 text-slate-600 rounded-lg text-xs"
                title="导出所有模板为 JSON"
              >
                <Download className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => fileInputRef.current?.click()}
                className="p-1.5 bg-white border border-slate-200 hover:bg-slate-100 text-slate-600 rounded-lg text-xs"
                title="导入 JSON 模板文件"
              >
                <Upload className="w-3.5 h-3.5" />
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept=".json"
                onChange={handleImportFileChange}
                className="hidden"
              />
              <button
                onClick={handleResetToDefaults}
                className="p-1.5 bg-white border border-slate-200 hover:bg-slate-100 text-slate-600 rounded-lg text-xs"
                title="重置恢复内置官方模板"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>

        {/* Templates Grid / Cards List */}
        <div className="flex-1 overflow-y-auto p-6 space-y-3.5 bg-[#F8FAFC]">
          {filteredTemplates.length === 0 ? (
            <div className="text-center py-16 bg-white rounded-2xl border border-slate-200/80 shadow-2xs">
              <FileText className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <h4 className="text-sm font-bold text-slate-700 mb-1">未找到匹配的提示词模板</h4>
              <p className="text-xs text-slate-400 mb-4 max-w-sm mx-auto">
                可尝试更换搜索关键词，或点击右上角「+ 新建模板」快速创建专属于您的评测场景
              </p>
              <button
                onClick={handleOpenCreateModal}
                className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-xs font-semibold hover:bg-indigo-700"
              >
                新建第一个自定义模板
              </button>
            </div>
          ) : (
            filteredTemplates.map(preset => {
              const isCopied = copiedId === preset.id;
              return (
                <div
                  key={preset.id}
                  className="group border border-slate-200 bg-white hover:border-indigo-300 hover:shadow-md rounded-xl p-4.5 transition-all shadow-2xs relative"
                >
                  {/* Top Row: Category, Title & Action Toolbar */}
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <div className="flex items-center gap-2 flex-wrap min-w-0">
                      <span className="text-[11px] font-semibold text-indigo-700 bg-indigo-50 border border-indigo-200 px-2 py-0.5 rounded">
                        {preset.categoryLabel}
                      </span>
                      {preset.isBuiltIn && (
                        <span className="text-[10px] bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded font-mono">
                          官方预置
                        </span>
                      )}
                      <h4 className="font-bold text-sm text-slate-900 group-hover:text-indigo-600 transition-colors">
                        {preset.title}
                      </h4>
                    </div>

                    {/* Quick Card Action Buttons */}
                    <div className="flex items-center gap-1 shrink-0">
                      {/* Copy Prompt Button */}
                      <button
                        onClick={e => handleCopyPrompt(preset, e)}
                        className={`flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium transition-colors ${
                          isCopied
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 font-bold'
                            : 'text-slate-600 hover:text-indigo-600 hover:bg-slate-100 border border-slate-200'
                        }`}
                        title="复制提示词内容"
                      >
                        {isCopied ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                        <span>{isCopied ? '已复制' : '复制'}</span>
                      </button>

                      {/* Edit Button */}
                      <button
                        onClick={e => handleOpenEditModal(preset, e)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 border border-slate-200"
                        title={preset.isBuiltIn ? '基于此模板编辑副本' : '编辑此模板'}
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>

                      {/* Delete Button (If custom) */}
                      {!preset.isBuiltIn && (
                        <button
                          onClick={e => handleDeleteTemplate(preset.id, e)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 border border-slate-200"
                          title="删除模板"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}

                      {/* Fill Only Button */}
                      <button
                        onClick={e => handleFillPromptOnly(preset, e)}
                        className="flex items-center gap-1 bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-300 px-2.5 py-1 rounded-lg text-xs font-medium transition-colors"
                        title="填入对话框（不自动发起，可继续编辑）"
                      >
                        <PenTool className="w-3 h-3 text-indigo-600" />
                        <span>填入对话框</span>
                      </button>

                      {/* Fill & Send Button */}
                      <button
                        onClick={e => handleSendPromptImmediately(preset, e)}
                        className="flex items-center gap-1 bg-indigo-600 hover:bg-indigo-700 text-white px-2.5 py-1 rounded-lg text-xs font-bold shadow-2xs transition-all active:scale-95"
                        title="填入并立即并发发送至所有模型"
                      >
                        <Send className="w-3 h-3" />
                        <span>并发发送</span>
                      </button>
                    </div>
                  </div>

                  {/* Description */}
                  {preset.description && (
                    <p className="text-xs text-slate-500 mb-2.5 leading-relaxed">{preset.description}</p>
                  )}

                  {/* Prompt Text Box */}
                  <div className="bg-slate-50 rounded-lg p-3 text-xs text-slate-700 font-mono border border-slate-200 whitespace-pre-wrap leading-relaxed max-h-36 overflow-y-auto">
                    {preset.prompt}
                  </div>

                  {/* System Prompt (If present) */}
                  {preset.systemPrompt && (
                    <div className="mt-2 bg-indigo-50/50 rounded-lg p-2 text-[11px] text-indigo-900 border border-indigo-100 flex items-start gap-1.5">
                      <SlidersHorizontal className="w-3 h-3 text-indigo-600 mt-0.5 shrink-0" />
                      <span>
                        <strong>预设 System Prompt:</strong> {preset.systemPrompt}
                      </span>
                    </div>
                  )}

                  {/* Tags Pill List */}
                  {preset.tags && preset.tags.length > 0 && (
                    <div className="mt-2.5 flex items-center gap-1.5 flex-wrap">
                      <Tag className="w-3 h-3 text-slate-400" />
                      {preset.tags.map((tag, tIdx) => (
                        <span
                          key={tIdx}
                          className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full"
                        >
                          #{tag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Create / Edit Template Modal Drawer */}
      {isEditing && editingTemplate && (
        <div className="fixed inset-0 z-60 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-in fade-in duration-150">
          <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-xl shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95">
            {/* Drawer Header */}
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-white">
              <div className="flex items-center gap-2">
                <Bookmark className="w-5 h-5 text-indigo-600" />
                <h3 className="font-bold text-base text-slate-900">
                  {templates.some(t => t.id === editingTemplate.id) ? '修改提示词模板' : '新建提示词模板'}
                </h3>
              </div>
              <button
                onClick={() => setIsEditing(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Form Content */}
            <form onSubmit={handleSaveForm} className="p-6 space-y-4 overflow-y-auto max-h-[75vh]">
              {/* Title & Category */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    模板标题 <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={editingTemplate.title || ''}
                    onChange={e => setEditingTemplate({ ...editingTemplate, title: e.target.value })}
                    placeholder="例如：高并发架构设计评测"
                    className={`w-full bg-slate-50 border rounded-xl px-3 py-2 text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500 ${
                      editFormErrors.title ? 'border-rose-400 bg-rose-50/30' : 'border-slate-200'
                    }`}
                  />
                  {editFormErrors.title && (
                    <span className="text-[11px] text-rose-500 mt-1 block">{editFormErrors.title}</span>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">场景分类</label>
                  <select
                    value={editingTemplate.category || 'custom'}
                    onChange={e => {
                      const val = e.target.value;
                      const catObj = DEFAULT_CATEGORIES.find(c => c.id === val);
                      setEditingTemplate({
                        ...editingTemplate,
                        category: val,
                        categoryLabel: catObj ? catObj.label : '自定义场景',
                      });
                    }}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  >
                    {DEFAULT_CATEGORIES.filter(c => c.id !== 'all').map(c => (
                      <option key={c.id} value={c.id}>
                        {c.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">场景与评测说明</label>
                <input
                  type="text"
                  value={editingTemplate.description || ''}
                  onChange={e => setEditingTemplate({ ...editingTemplate, description: e.target.value })}
                  placeholder="例如：考察多模型在微服务高并发与 Redis 削峰方案上的回答质量"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              {/* Prompt Content */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-bold text-slate-700">
                    提示词正文 (Prompt) <span className="text-rose-500">*</span>
                  </label>
                  <span className="text-[11px] text-slate-400 font-mono">
                    {(editingTemplate.prompt || '').length} 字符
                  </span>
                </div>
                <textarea
                  rows={6}
                  value={editingTemplate.prompt || ''}
                  onChange={e => setEditingTemplate({ ...editingTemplate, prompt: e.target.value })}
                  placeholder="在此输入完整的提示词内容，支持多行排版与代码块..."
                  className={`w-full bg-slate-50 border rounded-xl p-3 text-xs font-mono text-slate-900 focus:bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500 leading-relaxed ${
                    editFormErrors.prompt ? 'border-rose-400 bg-rose-50/30' : 'border-slate-200'
                  }`}
                />
                {editFormErrors.prompt && (
                  <span className="text-[11px] text-rose-500 mt-1 block">{editFormErrors.prompt}</span>
                )}
              </div>

              {/* Optional System Prompt */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  统一系统设定 (System Prompt, 可选)
                </label>
                <input
                  type="text"
                  value={editingTemplate.systemPrompt || ''}
                  onChange={e => setEditingTemplate({ ...editingTemplate, systemPrompt: e.target.value })}
                  placeholder="例如：你是一位资深全栈架构师，请严谨指出代码漏洞..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              {/* Tags */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  标签 (以英文逗号分隔，如: TypeScript, 架构, 并发)
                </label>
                <input
                  type="text"
                  value={editingTemplate.tags ? editingTemplate.tags.join(', ') : ''}
                  onChange={e => {
                    const raw = e.target.value;
                    const parsed = raw
                      .split(/[,，]/)
                      .map(t => t.trim())
                      .filter(Boolean);
                    setEditingTemplate({ ...editingTemplate, tags: parsed });
                  }}
                  placeholder="TypeScript, 架构, 并发"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              {/* Drawer Footer Actions */}
              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="px-4 py-2 rounded-xl text-xs font-medium text-slate-600 hover:bg-slate-100 transition-colors"
                >
                  取消
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-xs transition-colors"
                >
                  保存模板
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
