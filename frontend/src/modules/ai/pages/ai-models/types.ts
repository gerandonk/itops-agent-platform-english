export interface AIModel {
  id: string;
  name: string;
  provider_type: 'volcengine' | 'openai' | 'aliyun' | 'deepseek' | 'zhipu' | 'local';
  api_key?: string;
  api_base?: string;
  model_id: string;
  enabled: number;
  sort_order: number;
  is_default: number;
  tags?: string[];
  last_test_status?: string;
  last_test_time?: string;
  created_at: string;
  updated_at: string;
}

export interface ProviderPreset {
  value: 'volcengine' | 'openai' | 'aliyun' | 'deepseek' | 'zhipu' | 'local';
  label: string;
  icon: string;
  color: string;
  defaultBase: string;
  defaultModels: string[];
  needApiKey: boolean;
  description?: string;
}

export const PROVIDER_PRESETS: ProviderPreset[] = [
  {
    value: 'volcengine',
    label: 'Volcano Engine (Ark)',
    icon: '🔥',
    color: 'blue',
    defaultBase: 'https://ark.cn-beijing.volces.com/api/v3',
    defaultModels: ['doubao-1-5-lite-32k-250115', 'doubao-1-5-pro-32k-250115', 'deepseek-v3-250324'],
    needApiKey: true,
    description: 'Supports Doubao, DeepSeek, and other models',
  },
  {
    value: 'deepseek',
    label: 'DeepSeek',
    icon: '🐳',
    color: 'cyan',
    defaultBase: 'https://api.deepseek.com/v1',
    defaultModels: ['deepseek-chat', 'deepseek-reasoner'],
    needApiKey: true,
    description: 'DeepSeek official API',
  },
  {
    value: 'aliyun',
    label: 'Alibaba Cloud (Bailian)',
    icon: '☁️',
    color: 'orange',
    defaultBase: 'https://dashscope.aliyuncs.com/compatible-mode/v1',
    defaultModels: ['qwen-plus', 'qwen-turbo', 'qwen-max', 'qwen-long'],
    needApiKey: true,
    description: 'Qwen series models',
  },
  {
    value: 'zhipu',
    label: 'Zhipu AI',
    icon: '🧠',
    color: 'purple',
    defaultBase: 'https://open.bigmodel.cn/api/paas/v4',
    defaultModels: ['glm-4-plus', 'glm-4', 'glm-4-flash', 'glm-3-turbo'],
    needApiKey: true,
    description: 'GLM series models',
  },
  {
    value: 'openai',
    label: 'OpenAI',
    icon: '🟢',
    color: 'green',
    defaultBase: 'https://api.openai.com/v1',
    defaultModels: ['gpt-4o', 'gpt-4o-mini', 'gpt-3.5-turbo'],
    needApiKey: true,
    description: 'OpenAI Official API',
  },
  {
    value: 'local',
    label: 'Local AI (Ollama/LM Studio)',
    icon: '💻',
    color: 'slate',
    defaultBase: 'http://host.docker.internal:11434/v1',
    defaultModels: ['qwen2.5:7b', 'llama3.1:8b', 'codellama:7b'],
    needApiKey: false,
    description: 'Locally deployed open-source models',
  },
];

export type AIModelFormData = {
  name: string;
  provider_type: 'volcengine' | 'openai' | 'aliyun' | 'deepseek' | 'zhipu' | 'local';
  model_id: string;
  api_key: string;
  api_base: string;
  tags: string;
};

export type UpdateModelPayload = {
  name?: string;
  provider_type?: 'volcengine' | 'openai' | 'aliyun' | 'deepseek' | 'zhipu' | 'local';
  model_id?: string;
  api_key?: string | null;
  api_base?: string | null;
  enabled?: number;
  is_default?: number;
  tags?: string[];
};

export function getProviderLabel(type: string) {
  switch (type) {
    case 'volcengine':
      return 'Volcano Engine';
    case 'deepseek':
      return 'DeepSeek';
    case 'aliyun':
      return 'Alibaba Cloud';
    case 'zhipu':
      return 'Zhipu AI';
    case 'openai':
      return 'OpenAI';
    case 'local':
      return 'Local AI';
    default:
      return type;
  }
}

export function getProviderColor(type: string) {
  switch (type) {
    case 'volcengine':
      return 'bg-blue-500/10 text-blue-400';
    case 'deepseek':
      return 'bg-cyan-500/10 text-cyan-400';
    case 'aliyun':
      return 'bg-orange-500/10 text-orange-400';
    case 'zhipu':
      return 'bg-purple-500/10 text-purple-400';
    case 'openai':
      return 'bg-green-500/10 text-green-400';
    case 'local':
      return 'bg-slate-500/10 text-slate-400';
    default:
      return 'bg-gray-500/10 text-gray-400';
  }
}

export function getProviderPreset(type: 'volcengine' | 'openai' | 'aliyun' | 'deepseek' | 'zhipu' | 'local') {
  return PROVIDER_PRESETS.find(p => p.value === type);
}
