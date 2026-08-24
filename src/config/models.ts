import { AIModelConfig, PromptPreset } from '../types/arena';

export const SUPPORTED_MODELS: AIModelConfig[] = [
  {
    id: 'chatgpt',
    name: 'ChatGPT',
    subName: 'OpenAI',
    company: 'OpenAI',
    webUrl: 'https://chatgpt.com/',
    iconBg: 'from-emerald-500 to-teal-700',
    accentColor: '#10B981',
    borderColor: 'border-emerald-500/40',
    avatarText: 'GPT',
    description: 'OpenAI 旗舰全能多模态大模型，逻辑缜密，通用指令遵循能力极强。',
    defaultEnabled: true,
    hasThinkingProcess: false,
    apiVersion: 'gpt-4o',
    tags: ['通用全能', '代码专家', '多语言'],
    sampleLatencyMs: 650,
    sampleTokensPerSec: 72,
    domSelectors: {
      inputSelector: '#prompt-textarea, textarea#prompt-textarea, textarea[placeholder*="Message"], div[contenteditable="true"]',
      submitSelector: 'button[data-testid="send-button"], button[aria-label="Send prompt"], button[aria-label="Send message"]',
      responseSelector: 'div[data-message-author-role="assistant"] .markdown, div[data-message-author-role="assistant"], article [data-message-author-role="assistant"], div.markdown.prose, [data-message-model-slug]',
      stopButtonSelector: 'button[data-testid="stop-button"], button[aria-label="Stop generating"]',
      inputMethod: 'value',
    },
  },
  {
    id: 'gemini',
    name: 'Gemini',
    subName: 'Google',
    company: 'Google',
    webUrl: 'https://gemini.google.com/app',
    iconBg: 'from-blue-500 to-indigo-700',
    accentColor: '#3B82F6',
    borderColor: 'border-blue-500/40',
    avatarText: 'GEM',
    description: 'Google 最新前沿多模态大模型，具备高吞吐响应与混合思维推理机制。',
    defaultEnabled: true,
    hasThinkingProcess: true,
    apiVersion: 'gemini-3.7-flash',
    tags: ['实时搜索', '深度推理', '长上下文'],
    sampleLatencyMs: 420,
    sampleTokensPerSec: 110,
    domSelectors: {
      inputSelector: '.ql-editor, rich-textarea p, textarea[placeholder*="Ask"], div[contenteditable="true"]',
      submitSelector: 'button.send-button, button[aria-label="Send message"], button[aria-label="Submit"]',
      responseSelector: 'message-content, model-response, .model-response-text, .response-container',
      thinkingSelector: '.thought-container, .thinking-process, details',
      stopButtonSelector: 'button.stop-button, button[aria-label="Stop response"]',
      inputMethod: 'innerText',
    },
  },
  {
    id: 'deepseek',
    name: 'DeepSeek',
    subName: 'DeepSeek',
    company: 'DeepSeek 深度求索',
    webUrl: 'https://chat.deepseek.com/',
    iconBg: 'from-sky-500 to-blue-700',
    accentColor: '#0EA5E9',
    borderColor: 'border-sky-500/40',
    avatarText: 'DS',
    description: '开源推理巅峰模型，具备显式思维链（CoT）深度思考过程与卓越数理逻辑能力。',
    defaultEnabled: true,
    hasThinkingProcess: true,
    apiVersion: 'deepseek-r1',
    tags: ['开源之光', '深度思考', '数理逻辑'],
    sampleLatencyMs: 780,
    sampleTokensPerSec: 65,
    domSelectors: {
      inputSelector: '#chat-input, textarea[placeholder*="DeepSeek"], textarea',
      submitSelector: 'div[role="button"][aria-label="发送"], button[type="submit"], .send-btn',
      responseSelector: '.ds-markdown, .deepseek-response, [data-role="assistant"], div.ds-message-item',
      thinkingSelector: '.ds-think, .thinking-content, details.ds-thought',
      stopButtonSelector: 'div[role="button"][aria-label="停止"], button.stop-btn',
      inputMethod: 'value',
    },
  },
  {
    id: 'qwen',
    name: '通义千问',
    subName: 'Alibaba',
    company: '阿里云 / Alibaba',
    webUrl: 'https://chat.qwen.ai/',
    iconBg: 'from-purple-500 to-violet-700',
    accentColor: '#8B5CF6',
    borderColor: 'border-purple-500/40',
    avatarText: '千问',
    description: '阿里巴巴旗舰级开源大模型，中文综合理解与专业知识问答极佳。',
    defaultEnabled: true,
    hasThinkingProcess: false,
    apiVersion: 'qwen-max',
    tags: ['中文旗舰', '知识库', '长文创作'],
    sampleLatencyMs: 520,
    sampleTokensPerSec: 85,
    domSelectors: {
      inputSelector: 'textarea.ant-input, textarea, .chat-input textarea',
      submitSelector: '.send-btn, button[type="submit"], button.ant-btn-primary',
      responseSelector: '.qwen-bubble-assistant .bubble-content, .chat-message-assistant .markdown-body, .qwen-bubble-assistant, div[class*="bubble-content"], .markdown-body',
      stopButtonSelector: '.stop-btn, button[aria-label="停止生成"]',
      inputMethod: 'value',
    },
  },
  {
    id: 'kimi',
    name: 'Kimi',
    subName: 'Moonshot',
    company: '月之暗面 Moonshot',
    webUrl: 'https://kimi.moonshot.cn/',
    iconBg: 'from-slate-600 to-zinc-900',
    accentColor: '#E2E8F0',
    borderColor: 'border-slate-400/40',
    avatarText: 'Kimi',
    description: '超长无损上下文与智能搜索先驱，擅长海量资料归纳、研报分析与长文写作。',
    defaultEnabled: true,
    hasThinkingProcess: false,
    apiVersion: 'moonshot-v1-128k',
    tags: ['超长文本', '联网研报', '文档总结'],
    sampleLatencyMs: 590,
    sampleTokensPerSec: 78,
    domSelectors: {
      inputSelector: '.chat-input-editor, div[contenteditable="true"], textarea',
      submitSelector: '.send-button, button[aria-label="发送"], .send-icon',
      responseSelector: '.markdown-body, .segment-assistant, .chat-content, .markdown',
      stopButtonSelector: '.stop-button',
      inputMethod: 'innerText',
    },
  },
  {
    id: 'doubao',
    name: '豆包',
    subName: 'ByteDance',
    company: '字节跳动 ByteDance',
    webUrl: 'https://www.doubao.com/chat/',
    iconBg: 'from-cyan-500 to-blue-600',
    accentColor: '#06B6D4',
    borderColor: 'border-cyan-500/40',
    avatarText: '豆包',
    description: '字节跳动自研对话大模型，响应疾速，口语化表达自然，生活与办公助手。',
    defaultEnabled: true,
    hasThinkingProcess: false,
    apiVersion: 'doubao-pro-32k',
    tags: ['超低延迟', '自然对话', '日常助手'],
    sampleLatencyMs: 380,
    sampleTokensPerSec: 120,
    domSelectors: {
      inputSelector: 'textarea, div[contenteditable="true"], .semi-input-textarea',
      submitSelector: 'button[data-testid="chat_input_send_button"], button.send-btn, button[type="submit"]',
      responseSelector: '.flow-markdown-body, div[data-testid="message-text-content"], div[class*="flow-markdown"], [data-testid="chat-message"] .flow-markdown-body',
      stopButtonSelector: 'button[data-testid="stop_button"]',
      inputMethod: 'value',
    },
  },
  {
    id: 'zai',
    name: '智谱清言',
    subName: 'GLM',
    company: '智谱 AI',
    webUrl: 'https://z.ai/',
    iconBg: 'from-amber-500 to-orange-700',
    accentColor: '#F59E0B',
    borderColor: 'border-amber-500/40',
    avatarText: 'GLM',
    description: '清华系全自研基座模型，中英双语表现拔尖，具备出色的工具调用与数理分析。',
    defaultEnabled: true,
    hasThinkingProcess: false,
    apiVersion: 'glm-4-plus',
    tags: ['中英双语', '清华学术', '数据分析'],
    sampleLatencyMs: 610,
    sampleTokensPerSec: 80,
    domSelectors: {
      inputSelector: 'textarea.input-box, textarea, div[contenteditable="true"]',
      submitSelector: '.send-btn, button.submit-btn, button[type="submit"]',
      responseSelector: '.message-answer, .markdown-content, .markdown-body, .chat-item-answer',
      stopButtonSelector: '.stop-btn',
      inputMethod: 'value',
    },
  },
  {
    id: 'claude',
    name: 'Claude',
    subName: 'Anthropic',
    company: 'Anthropic',
    webUrl: 'https://claude.ai/',
    iconBg: 'from-amber-600 to-stone-800',
    accentColor: '#D97706',
    borderColor: 'border-amber-600/40',
    avatarText: 'CLD',
    description: 'Anthropic 标杆模型，具备极高安全边界与顶尖的代码架构与文学洞察力。',
    defaultEnabled: false,
    hasThinkingProcess: true,
    apiVersion: 'claude-3-7-sonnet',
    tags: ['编程架构', '精细写作', '深度逻辑'],
    sampleLatencyMs: 710,
    sampleTokensPerSec: 68,
    domSelectors: {
      inputSelector: 'div[contenteditable="true"], fieldset textarea, div.ProseMirror',
      submitSelector: 'button[aria-label="Send Message"], button[type="submit"]',
      responseSelector: 'div.font-claude-message, .prose, div[data-is-streaming="false"]',
      thinkingSelector: '.thought-process, details summary',
      stopButtonSelector: 'button[aria-label="Stop Response"]',
      inputMethod: 'innerText',
    },
  }
];

export const PROMPT_PRESETS: PromptPreset[] = [
  {
    id: 'coding-refactor',
    category: 'coding',
    categoryLabel: '代码重构与优化',
    title: '高并发异步队列与重试机制设计',
    description: '对比各模型编写 TypeScript / Node.js 异步任务调度器的架构设计与代码质量',
    tags: ['TypeScript', '并发调度', '单元测试'],
    isBuiltIn: true,
    prompt: `请用 TypeScript 设计一个工业级的通用异步任务调度器（TaskScheduler）。
要求：
1. 支持配置最大并发数 concurrency（例如 3）；
2. 支持失败自动重试策略（带指数退避与最大重试次数配置）；
3. 支持任务优先级队列（High, Normal, Low）；
4. 提供简洁优雅的链式调用 API 与完整的单元测试用例。`
  },
  {
    id: 'math-logic',
    category: 'math',
    categoryLabel: '数理与思维链',
    title: '三门问题变体与概率博弈推演',
    description: '评测模型深度思考 (DeepSeek R1 / Gemini Thinking) 对概率反直觉题目的严谨推演',
    tags: ['概率论', '贝叶斯', '博弈论'],
    isBuiltIn: true,
    prompt: `有 3 个盒子 A、B、C。其中一个装有 100 万元奖金，另外两个是空的。
你随机选择了盒子 A。
此时主持人（知道奖金在哪）在剩下的 B、C 中打开了空的盒子 B。
但此时主持人提出了一个变体规则：“如果你坚持选择 A，若中奖可以获得 100% 奖金；如果你换选 C 且中奖，奖金需要扣除 15% 的手续费（即 85 万）。”
请问：
1. 此时换选 C 还是坚持选 A 的数学期望更高？
2. 请给出严格的条件概率（贝叶斯公式）推导过程与最终期望数值对比。`
  },
  {
    id: 'system-arch',
    category: 'arch',
    categoryLabel: '系统架构设计',
    title: '亿级日活分布式秒杀与防刷风控架构',
    description: '考察模型在微服务高可用、多级缓存、分布式锁与消息削峰上的系统设计深度',
    tags: ['架构设计', 'Redis', '高可用', '微服务'],
    isBuiltIn: true,
    prompt: `请作为资深互联网架构师，为电商平台设计一个支持 10 万 QPS 瞬时峰值的“分布式秒杀与风控系统”。
请详细输出：
1. 总体架构拓扑图（文字 ASCII / Markdown 清晰表达）与流量链路（CDN -> 网关 -> 多级缓存 -> 消息队列 -> 数据库）；
2. 如何通过 Redis Lua 脚本原子扣减库存并彻底解决超卖与少卖问题；
3. 防脚本机刷与黄牛的动态风控策略（IP 限流、滑块验证码、用户画像评分与令牌桶算法）；
4. 数据库最终一致性兜底方案。`
  },
  {
    id: 'writing-critique',
    category: 'writing',
    categoryLabel: '创意与文案写作',
    title: 'AI 时代产品定位与极简官网文案',
    description: '对比各模型的中文修辞、品牌定位叙事与文案抓人程度',
    tags: ['产品文案', '品牌定位', '社交媒体'],
    isBuiltIn: true,
    prompt: `我们正在开发一款面向开发者的“多模型聚合对比 Chrome 浏览器插件”，名为 OmniCompare。
请为这款产品撰写：
1. 一个极具穿透力、乔布斯风格的 Hero Slogan（主标题 + 副标题）；
2. 3 个核心特性提炼（每个包含一句话痛点 + 解决方案）；
3. 针对技术开发者的 Twitter / 即刻 风格的发布通告推文（带 emoji）。`
  },
  {
    id: 'eval-bench',
    category: 'eval',
    categoryLabel: '语义与反讽辨析',
    title: '中文成语典故与职场反讽语义消歧',
    description: '考察多模型在隐喻、幽默与复杂中文上下文下的理解精准度与情商分析',
    tags: ['中文理解', '隐喻消歧', '高情商沟通'],
    isBuiltIn: true,
    prompt: `请分析并解释以下场景中的语义与人物真实心理状态：
小王连续加班两周完成了项目，在庆功会上，领导拍着小王的肩膀说：“小王啊，你可真是咱们部门的‘及时雨’，要是大家都能像你一样把公司当成家，咱们公司的电费估计能省下一半！”
请问：
1. 这句话中的“及时雨”和“电费省下一半”分别有什么言外之意？
2. 这体现了领导怎样的说话艺术和潜台词？
3. 假设你是小王，如何在保持得体情商的前提下幽默回应？`
  },
  {
    id: 'translation-localization',
    category: 'translation',
    categoryLabel: '多语言与学术翻译',
    title: 'MoE 架构顶会论文信达雅学术翻译',
    description: '对比各模型在专业 AI 论文摘要的翻译流畅度与行业术语规范度',
    tags: ['学术论文', '信达雅', '专业术语'],
    isBuiltIn: true,
    prompt: `Please translate the following technical excerpt into high-level, fluent, natural Chinese (信达雅 style for AI research paper):

"Mixture of Experts (MoE) architectures dynamically route token representations through a sparse gate, activating only a sub-network of parameters per forward pass. While this decouples model capacity from computational FLOPs, it introduces challenging distributed training bottlenecks, notably all-to-all communication overhead and expert load imbalance."

请输出：
1. 官方权威专业学术中文翻译；
2. 关键专业名词中英文对照解释表；
3. 通俗易懂的一句话大白话解释（供非技术人员理解）。`
  },
  {
    id: 'legal-risk',
    category: 'legal',
    categoryLabel: '商业与法律合规',
    title: 'SaaS 企业级服务采购合同风险审查',
    description: '评测模型对知识产权、SLA 违约赔偿责任、数据出境等法务条款的敏锐度',
    tags: ['合同审查', 'SLA', '法律合规'],
    isBuiltIn: true,
    prompt: `作为企业法务专家，请审查以下软件采购核心条款并指出其中的法律陷阱与修改建议：
条款：“乙方保证系统全年可用率达到 99.9%，若因不可抗力或第三方云服务商宕机导致服务中断，乙方不承担任何赔偿责任。甲方在平台内生成的所有衍生数据，乙方享有免费用于训练 AI 模型的不可撤销许可。”
请指出：
1. 存在哪 3 个对甲方极度不利的条款漏洞？
2. 提供专业、严密、可供商务谈判使用的修订条款对照版。`
  }
];
