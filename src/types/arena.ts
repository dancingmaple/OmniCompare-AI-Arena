export type AIModelId =
  | 'chatgpt'
  | 'gemini'
  | 'qwen'
  | 'deepseek'
  | 'zai'
  | 'kimi'
  | 'doubao'
  | 'claude';

export interface DOMSelectorConfig {
  inputSelector: string;
  submitSelector: string;
  responseSelector: string;
  thinkingSelector?: string;
  stopButtonSelector?: string;
  inputMethod: 'value' | 'innerText' | 'execCommand' | 'inputEvent';
}

export type AutomationStep =
  | 'idle'
  | 'finding_input'
  | 'filling_prompt'
  | 'submitting'
  | 'waiting_response'
  | 'scraping_result'
  | 'completed'
  | 'error';

export interface ModelAutomationState {
  modelId: AIModelId;
  currentStep: AutomationStep;
  progressPercent: number;
  statusMessage: string;
  isIframeLoaded: boolean;
  iframeKey: number;
  inputFound: boolean;
  lastScrapedContent?: string;
  lastScrapedThinking?: string;
  retryCount?: number; // 0, 1, 2, 3
  nextRetrySeconds?: number; // countdown seconds to next retry (e.g. 60, 59...)
  isRetrying?: boolean;
  conversationUrl?: string;
  logs: { time: string; text: string; type: 'info' | 'success' | 'warn' | 'error' }[];
}

export type ViewMode = 'iframe' | 'split' | 'cards';

export interface AIModelConfig {
  id: AIModelId;
  name: string;
  subName: string;
  company: string;
  webUrl: string;
  iconBg: string;
  accentColor: string;
  borderColor: string;
  avatarText: string;
  description: string;
  defaultEnabled: boolean;
  hasThinkingProcess: boolean;
  apiVersion: string;
  tags: string[];
  sampleLatencyMs: number;
  sampleTokensPerSec: number;
  domSelectors: DOMSelectorConfig;
}

export type MessageRole = 'user' | 'assistant' | 'system';

export interface ChatMessage {
  id: string;
  role: MessageRole;
  content: string;
  thinkingContent?: string;
  thinkingTimeMs?: number;
  timestamp: number;
  roundIndex: number;
  latencyMs?: number;
  tokensPerSec?: number;
  totalTokens?: number;
  wordCount?: number;
  status: 'idle' | 'pending' | 'streaming' | 'completed' | 'error';
  errorMessage?: string;
  score?: number; // 1 to 5
  userFeedback?: 'like' | 'dislike' | null;
  isEloWinner?: boolean;
  conversationUrl?: string; // Captured chat URL on the official platform
}

export interface ModelSession {
  modelId: AIModelId;
  messages: ChatMessage[];
  isStreaming: boolean;
  status: 'idle' | 'streaming' | 'completed' | 'error';
  lastLatencyMs?: number;
  lastTokensPerSec?: number;
  conversationUrl?: string; // Latest captured URL for this model
  ratingScores?: {
    speed: number;
    accuracy: number;
    reasoning: number;
    formatting: number;
    creativity: number;
  };
}

export type LayoutMode = '2-col' | '3-col' | '4-col' | '6-col' | 'grid' | 'focused';

export interface PromptPreset {
  id: string;
  category: string;
  categoryLabel: string;
  title: string;
  prompt: string;
  systemPrompt?: string;
  description: string;
  tags?: string[];
  isBuiltIn?: boolean;
  updatedAt?: number;
}

export interface IFrameCardStyleConfig {
  borderWidth: number; // 0, 1, 2, 3, 4
  borderColorMode: 'default' | 'accent' | 'indigo' | 'dark' | 'glow';
  borderRadius: number; // 0, 8, 12, 16, 24
  cardHeight: 'compact' | 'standard' | 'tall' | 'full';
  shadowStyle: 'none' | 'sm' | 'md' | 'lg';
}

export interface ArenaSettings {
  temperature: number;
  systemPrompt: string;
  syncScroll: boolean;
  enableThinking: boolean;
  enableWebSearch: boolean;
  streamSpeedMultiplier: number;
  theme: 'dark' | 'midnight' | 'light';
  apiKeys: Partial<Record<AIModelId, string>>;
  requestMode: 'smart_dispatch' | 'direct_api' | 'extension_bridge';
}

export interface ExportSessionData {
  title: string;
  createdAt: string;
  models: AIModelId[];
  rounds: {
    roundIndex: number;
    userPrompt: string;
    timestamp?: number;
    responses: Partial<Record<AIModelId, {
      content: string;
      thinking?: string;
      latencyMs?: number;
      tokensPerSec?: number;
      score?: number;
      conversationUrl?: string;
    }>>;
  }[];
}

export interface SavedSessionHistory {
  id: string;
  title: string;
  createdAt: number;
  roundsCount: number;
  models: AIModelId[];
  rounds: {
    roundIndex: number;
    userPrompt: string;
    timestamp: number;
    responses: Partial<Record<AIModelId, {
      content: string;
      thinking?: string;
      latencyMs?: number;
      tokensPerSec?: number;
      score?: number;
      conversationUrl?: string;
    }>>;
  }[];
}
