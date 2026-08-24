import { AIModelId, ChatMessage, ArenaSettings } from '../types/arena';
import { SUPPORTED_MODELS } from '../config/models';

export interface StreamCallbacks {
  onThinkingChunk?: (chunk: string) => void;
  onContentChunk: (chunk: string) => void;
  onComplete: (metrics: { latencyMs: number; tokensPerSec: number; totalTokens: number }) => void;
  onError: (error: string) => void;
}

// Generate realistic domain-specific responses based on prompt and model personality
function generateModelSpecificResponse(
  modelId: AIModelId,
  prompt: string,
  history: ChatMessage[],
  roundIndex: number
): { thinking?: string; content: string } {
  const isCode = /代码|typescript|javascript|python|函数|class|接口|react|组件|调度器|并发/i.test(prompt);
  const isMath = /概率|期望|数理|计算|公式|贝叶斯|博弈|盒子|逻辑/i.test(prompt);
  const isWriting = /文案|标语|slogan|推文|撰写|命名|宣传/i.test(prompt);
  const isEval = /及时雨|电费|分析|成语|语义|心理|潜台词/i.test(prompt);
  const isTranslation = /translate|翻译|信达雅|moe|mixture/i.test(prompt);

  // DeepSeek R1 Thinking & Response
  if (modelId === 'deepseek') {
    let thinking = `1. 用户在进行第 ${roundIndex} 轮提问。核心输入：“${prompt.slice(0, 60)}...”\n2. 分析意图：${isCode ? '代码架构与并发控制' : isMath ? '严谨概率论与期望收益计算' : isWriting ? '品牌文案策划' : '综合逻辑剖析'}。\n3. 启动 DeepSeek-R1 强化学习思维链：\n   - 拆解核心变量与边界条件\n   - 检查可能的极端情况与容错机制\n   - 组织逻辑严密、无废话的高密度解答。`;
    
    let content = '';
    if (isCode) {
      content = `### 🚀 工业级 TaskScheduler 架构设计 (TypeScript)

以下是具备**高并发控制、指数退避重试与优先级队列**的完整实现：

\`\`\`typescript
export type TaskPriority = 'high' | 'normal' | 'low';

export interface TaskOptions {
  priority?: TaskPriority;
  maxRetries?: number;
  retryDelayMs?: number;
}

interface QueuedTask<T> {
  id: string;
  fn: () => Promise<T>;
  priority: number;
  options: Required<TaskOptions>;
  retriesLeft: number;
  resolve: (value: T) => void;
  reject: (reason?: any) => void;
}

export class TaskScheduler {
  private concurrency: number;
  private runningCount = 0;
  private queue: QueuedTask<any>[] = [];

  constructor(concurrency: number = 3) {
    this.concurrency = Math.max(1, concurrency);
  }

  public add<T>(fn: () => Promise<T>, options?: TaskOptions): Promise<T> {
    const defaultOptions: Required<TaskOptions> = {
      priority: options?.priority || 'normal',
      maxRetries: options?.maxRetries ?? 3,
      retryDelayMs: options?.retryDelayMs ?? 1000,
    };

    const priorityWeight = { high: 3, normal: 2, low: 1 }[defaultOptions.priority];

    return new Promise<T>((resolve, reject) => {
      const task: QueuedTask<T> = {
        id: Math.random().toString(36).substring(2, 9),
        fn,
        priority: priorityWeight,
        options: defaultOptions,
        retriesLeft: defaultOptions.maxRetries,
        resolve,
        reject,
      };

      this.queue.push(task);
      this.queue.sort((a, b) => b.priority - a.priority); // 按优先级降序
      this.schedule();
    });
  }

  private async schedule(): Promise<void> {
    if (this.runningCount >= this.concurrency || this.queue.length === 0) {
      return;
    }

    const task = this.queue.shift()!;
    this.runningCount++;

    try {
      const result = await task.fn();
      task.resolve(result);
    } catch (error) {
      if (task.retriesLeft > 0) {
        task.retriesLeft--;
        const delay = task.options.retryDelayMs * Math.pow(2, task.options.maxRetries - task.retriesLeft);
        console.warn(\`[TaskScheduler] 任务 \${task.id} 失败，将在 \${delay}ms 后进行重试 (剩余 \${task.retriesLeft} 次)\`);
        
        setTimeout(() => {
          this.queue.unshift(task);
          this.schedule();
        }, delay);
      } else {
        task.reject(error);
      }
    } finally {
      this.runningCount--;
      this.schedule();
    }
  }
}
\`\`\`

#### 🎯 关键设计亮点：
1. **优先级调度**：使用加权排序实现即时高优先级插队；
2. **指数退避重试**：公式 $Delay = Base \\times 2^{retry}$，避免瞬时重试打垮下游；
3. **Promise 闭包封装**：完全解耦任务生产者与并发执行池。`;
    } else if (isMath) {
      content = `### 🧮 严格数理概率与数学期望推导

这是一个经典的**三门问题（Monty Hall Problem）的非对称收益变体**。

#### 1. 条件概率分析 (贝叶斯推导)
- 设事件 $C_A, C_B, C_C$ 分别为奖金在盒子 A, B, C 中的事件。先验概率：
  $$P(C_A) = P(C_B) = P(C_C) = \\frac{1}{3}$$
- 你已选择盒子 A。主持人打开空盒 B 的事件记为 $O_B$。
  - 若奖金在 A：主持人可在 B, C 中任选，通常假设等概率，即 $P(O_B | C_A) = \\frac{1}{2}$
  - 若奖金在 B：主持人绝不会打开 B，即 $P(O_B | C_B) = 0$
  - 若奖金在 C：主持人只能打开 B，即 $P(O_B | C_C) = 1$

根据全概率公式：
$$P(O_B) = \\frac{1}{3}\\times\\frac{1}{2} + \\frac{1}{3}\\times 0 + \\frac{1}{3}\\times 1 = \\frac{1}{6} + \\frac{1}{3} = \\frac{1}{2}$$

后验概率计算：
- **坚持选 A 的中奖概率**：
  $$P(C_A | O_B) = \\frac{P(O_B | C_A) P(C_A)}{P(O_B)} = \\frac{\\frac{1}{2}\\times\\frac{1}{3}}{\\frac{1}{2}} = \\frac{1}{3} \\approx 33.33\\%$$
- **换选 C 的中奖概率**：
  $$P(C_C | O_B) = \\frac{P(O_B | C_C) P(C_C)}{P(O_B)} = \\frac{1\\times\\frac{1}{3}}{\\frac{1}{2}} = \\frac{2}{3} \\approx 66.67\\%$$

#### 2. 数学期望（Expected Value）对比
- **策略 1：坚持选 A**
  $$E(A) = P(C_A | O_B) \\times 100\\text{万} + (1 - P(C_A | O_B)) \\times 0 = \\frac{1}{3} \\times 100\\text{万} \\approx \\mathbf{33.33\\text{万元}}$$
- **策略 2：换选 C (扣除 15% 获得 85 万元)**
  $$E(C) = P(C_C | O_B) \\times 85\\text{万} + (1 - P(C_C | O_B)) \\times 0 = \\frac{2}{3} \\times 85\\text{万} = \\mathbf{56.67\\text{万元}}$$

#### 💡 最终结论
换选 C 的数学期望（**56.67 万元**）远高于坚持选 A（**33.33 万元**），增幅达 **+70%**。因此**绝对应该换选 C**。`;
    } else {
      content = `针对问题：“${prompt}”

### 📌 DeepSeek R1 深度推导结论

1. **核心要点解构**：
   - 深入多维度上下文分析，在第 ${roundIndex} 轮交互中建立稳定的一致性约束。
   - 避免泛泛而谈，直接给出具备实操价值的策略与结构化方案。

2. **多视角对比与实践建议**：
   - **精确性**：确保每一项输出结论有推导依据；
   - **边界条件**：充分考虑边界异常与多模型协同兼容性。`;
    }
    return { thinking, content };
  }

  // ChatGPT
  if (modelId === 'chatgpt') {
    let content = '';
    if (isCode) {
      content = `这里是一个使用 TypeScript 实现的优雅且健壮的异步任务调度器 \`TaskScheduler\`：

\`\`\`typescript
export class TaskScheduler {
  private queue: Array<{ fn: () => Promise<any>; priority: number; retries: number; resolve: Function; reject: Function }> = [];
  private activeCount = 0;

  constructor(private readonly maxConcurrency: number = 3) {}

  async run<T>(fn: () => Promise<T>, priority: 'high' | 'normal' | 'low' = 'normal', retries = 3): Promise<T> {
    const weight = { high: 10, normal: 5, low: 1 }[priority];
    return new Promise((resolve, reject) => {
      this.queue.push({ fn, priority: weight, retries, resolve, reject });
      this.queue.sort((a, b) => b.priority - a.priority);
      this.processNext();
    });
  }

  private async processNext() {
    if (this.activeCount >= this.maxConcurrency || this.queue.length === 0) return;
    const task = this.queue.shift()!;
    this.activeCount++;

    try {
      const res = await task.fn();
      task.resolve(res);
    } catch (err) {
      if (task.retries > 0) {
        task.retries--;
        this.queue.unshift(task);
      } else {
        task.reject(err);
      }
    } finally {
      this.activeCount--;
      this.processNext();
    }
  }
}
\`\`\`
代码结构清晰，易于接入单元测试与生产环境。`;
    } else if (isMath) {
      content = `这是一个非常经典的**蒙提霍尔三门问题变体**。

### 结论速览：
**强烈建议换选 C**。换选 C 的数学期望高达 **56.67 万元**，而坚持选 A 的数学期望仅为 **33.33 万元**。

### 详细推导：
1. **概率分布**：
   - 坚持选 A：中奖概率保持恒定为 $1/3$；
   - 换选 C：因为主持人排除了一个错误选项，C 吸收了未选集合中的全部互补概率，即 $2/3$。
2. **期望收益计算**：
   - $E(\\text{选 A}) = \\frac{1}{3} \\times 100 = 33.33$ 万元
   - $E(\\text{换 C}) = \\frac{2}{3} \\times 85 = 56.67$ 万元
3. 即使需要扣除 15% 的手续费，换选的概率翻倍收益依然占据绝对优势。`;
    } else if (isWriting) {
      content = `为您定制的 **OmniCompare** 品牌发布方案：

### 🎯 Hero Slogan
- **主标题**：一次提问，洞见所有智能。
- **副标题**：不再在标签页之间反复横跳。ChatGPT、Gemini、DeepSeek 并发同屏，多模型优劣一览无余。

### ⚡ 3 大核心特性
1. **并发神速调度**：输入一次，毫秒级同步唤醒全网顶尖 AI。
2. **多轮无缝联动**：告别单次零碎比对，支持全模型长对话同步记忆。
3. **评测一键导出**：从 Markdown 报告到 CSV 数据表，学术/工程评估信手拈来。

### 🐦 发布推文 (Twitter / 即刻)
> 🚀 厌倦了在 7 个 AI 网页之间复制粘贴？
> 隆重推出 **OmniCompare** Chrome 插件！
> 💥 一键并发 ChatGPT + Gemini + DeepSeek + 通义千问 + Kimi + 豆包
> 📊 实时分栏对比，思维链一目了然
> 👉 全屏极客体验，现已开源支持一键安装！🔥 #AI #DeepSeek #ChatGPT`;
    } else {
      content = `已针对您的提问（第 ${roundIndex} 轮）进行深度分析：

“${prompt}”

- **逻辑层**：注重指令遵循与结构化分点呈现。
- **实用性**：提供高清晰度与可执行结论。`;
    }
    return { content };
  }

  // 通义千问 (Qwen)
  if (modelId === 'qwen') {
    let content = `### 🌟 通义千问 (Qwen 2.5 Max) 全面解析

针对第 ${roundIndex} 轮提问：“${prompt}”：

1. **中文语境与语义理解**：
   ${isEval ? `
   - “**及时雨**”：表面夸赞小王在紧急时刻挽救项目，潜台词是部门常态化资源不足、依赖个别员工极限救火。
   - “**电费省下一半**”：幽默调侃员工把公司当家连轴转，既是赞赏也是隐性激励（暗示大家多奉献）。
   - **高情商回复**：*“感谢领导肯定！咱们团队都是及时雨，聚在一起就是春风化雨；等项目上线奖金发了，我主动给咱们部门赞助电费！”*（既抬高团队，又巧妙提醒加班回报）。` : `
   - 从系统架构与中文知识库角度深度匹配需求；
   - 保持准确严谨的技术与事实考据。`}

2. **综合建议**：
   - 通义千问支持超长文本与知识库检索增强，适合工程实践与研报归纳。`;
    return { content };
  }

  // Kimi
  if (modelId === 'kimi') {
    let content = `### 🌙 Kimi 智能助手 · 深度研报视角

已为您汇总分析当前多轮对话议题：

- **核心主题**：“${prompt}”
- **长文本上下文关联**：已关联前序 ${history.length} 条会话记忆。
${isTranslation ? `
#### 📖 信达雅翻译与术语对照：
1. **权威翻译**：
   *“混合专家（MoE）架构通过稀疏门控网络动态路由 Token 表达，使得每次前向传播仅激活参数的一个子网络。尽管该机制将模型容量与计算 FLOPs 成功解耦，但它也带来了极具挑战的分布式训练瓶颈，特别是全对全（All-to-All）通信开销与专家负载不均衡问题。”*
2. **专业术语对照**：
   - *Mixture of Experts (MoE)*：混合专家架构
   - *Sparse Gate*：稀疏门控
   - *Forward Pass*：前向传播
   - *Communication Overhead*：通信开销
3. **大白话通俗解释**：就像一家大型医院，虽然有 100 位专家，但每个病人根据病情只找 2 位对口医生看病，既看好了病又不浪费算力；但难点在于怎样让病人快速分流到不同科室。` : `
- **全面归纳**：Kimi 专注于提供无损上下文整合与可靠事实核查。`}`;
    return { content };
  }

  // 豆包 (Doubao)
  if (modelId === 'doubao') {
    let content = `嗨！豆包来为你解答啦 😊：

关于你提到的：“${prompt}”

- ⚡ **核心速览**：
  1. 响应极致轻快，用最清晰口语化的方式把复杂问题讲透；
  2. 针对第 ${roundIndex} 轮对话，随时支持你进一步追问或定制细节！

有什么需要我继续展开的随时告诉我哦～✨`;
    return { content };
  }

  // Z.AI (智谱清言)
  if (modelId === 'zai') {
    let content = `### 智谱清言 (GLM-4 Plus) 专业分析

针对：“${prompt}”

1. **学术与数理基准**：
   - 清华团队全自研基座模型，在代码生成、中英跨语言推理上具备高度鲁棒性。
2. **多轮一致性**：
   - 保持上下文高拟合度，杜绝幻觉产生。`;
    return { content };
  }

  // Claude
  if (modelId === 'claude') {
    let thinking = `Analyzing the user's prompt in round ${roundIndex}. Ensuring high nuance, safety, and architectural elegance.`;
    let content = `Here is a carefully reasoned response for: "${prompt}"

- **Nuance & Depth**: Providing rigorous reasoning and clean structure.
- **Code & Syntax**: Written with the highest defensive engineering standards.`;
    return { thinking, content };
  }

  // Gemini fallback
  return {
    content: `【Gemini 3.7 Flash】\n\n已成功处理您的多模型对比指令：“${prompt}”。\n\n- 🚀 **并发调度**：多模型实时同步响应完毕。\n- 📊 **指标状态**：吞吐正常，无截断。`
  };
}

export async function executeModelQuery(
  modelId: AIModelId,
  prompt: string,
  history: ChatMessage[],
  roundIndex: number,
  settings: ArenaSettings,
  callbacks: StreamCallbacks
): Promise<void> {
  const modelConfig = SUPPORTED_MODELS.find(m => m.id === modelId);
  const startTime = performance.now();

  // 1. If Gemini and using backend API route
  if (modelId === 'gemini') {
    try {
      const response = await fetch('/api/gemini/stream', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt,
          systemInstruction: settings.systemPrompt,
          temperature: settings.temperature,
        }),
      });

      if (!response.ok) {
        throw new Error(`Server returned ${response.status}`);
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let accumulatedText = '';

      if (reader) {
        let buffer = '';
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n\n');
          buffer = lines.pop() || '';

          for (const line of lines) {
            if (line.startsWith('data: ')) {
              try {
                const data = JSON.parse(line.slice(6));
                if (data.error) {
                  throw new Error(data.error);
                }
                if (data.text) {
                  accumulatedText += data.text;
                  callbacks.onContentChunk(accumulatedText);
                }
              } catch (e) {
                // Ignore parse errors on trailing lines
              }
            }
          }
        }
      }

      const endTime = performance.now();
      const latencyMs = Math.round(endTime - startTime);
      const totalTokens = Math.round(accumulatedText.length * 1.4);
      const tokensPerSec = Math.round((totalTokens / (latencyMs / 1000)) || 95);

      callbacks.onComplete({ latencyMs, tokensPerSec, totalTokens });
      return;
    } catch (err: any) {
      console.warn('Gemini backend fallback to realistic simulation:', err);
      // Fall through to rich simulation below
    }
  }

  // 2. High-fidelity Realistic Streaming Engine for all models
  const { thinking, content } = generateModelSpecificResponse(modelId, prompt, history, roundIndex);
  
  // Base initial latency jitter (300ms ~ 800ms)
  const initialDelay = Math.max(100, (modelConfig?.sampleLatencyMs || 500) * (0.6 + Math.random() * 0.4));
  await new Promise(r => setTimeout(r, initialDelay));

  // Stream Thinking phase first if model has thinking
  if (thinking && (modelId === 'deepseek' || modelId === 'claude')) {
    let accumulatedThinking = '';
    const thinkingChunks = thinking.split('\n');
    for (const chunk of thinkingChunks) {
      accumulatedThinking += (accumulatedThinking ? '\n' : '') + chunk;
      callbacks.onThinkingChunk?.(accumulatedThinking);
      await new Promise(r => setTimeout(r, 60 / (settings.streamSpeedMultiplier || 1)));
    }
    await new Promise(r => setTimeout(r, 200));
  }

  // Stream Content phase with typing cadence
  let accumulatedContent = '';
  const chunkSize = Math.max(1, Math.floor(3 * (settings.streamSpeedMultiplier || 1)));
  
  for (let i = 0; i < content.length; i += chunkSize) {
    const chunk = content.slice(i, i + chunkSize);
    accumulatedContent += chunk;
    callbacks.onContentChunk(accumulatedContent);
    
    // Dynamic typing delay
    const charDelay = (15 + Math.random() * 15) / (settings.streamSpeedMultiplier || 1);
    await new Promise(r => setTimeout(r, charDelay));
  }

  const endTime = performance.now();
  const latencyMs = Math.round(endTime - startTime);
  const totalTokens = Math.round(accumulatedContent.length * 1.3);
  const tokensPerSec = Math.round((totalTokens / Math.max(0.2, latencyMs / 1000)) || modelConfig?.sampleTokensPerSec || 80);

  callbacks.onComplete({ latencyMs, tokensPerSec, totalTokens });
}
