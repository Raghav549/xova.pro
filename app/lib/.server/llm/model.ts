import { createAnthropic } from '@ai-sdk/anthropic';
import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { createOpenAI } from '@ai-sdk/openai';

export type ProviderId = 'anthropic' | 'openai' | 'google' | 'openai-compatible';

export interface LlmConfig {
  provider: ProviderId;
  model: string;
  apiKey?: string;
  baseURL?: string;
}

export interface ProviderPreset {
  id: ProviderId;
  label: string;
  envKey: string;
  defaultModel: string;
  models: string[];
  baseURL?: string;
  hint: string;
}

export const PROVIDERS: ProviderPreset[] = [
  {
    id: 'anthropic',
    label: 'Anthropic',
    envKey: 'ANTHROPIC_API_KEY',
    defaultModel: 'claude-3-5-sonnet-20240620',
    models: ['claude-3-5-sonnet-20240620', 'claude-3-5-haiku-20241022', 'claude-3-opus-20240229'],
    hint: 'Best for large, multi-file generations.',
  },
  {
    id: 'openai',
    label: 'OpenAI',
    envKey: 'OPENAI_API_KEY',
    defaultModel: 'gpt-4o',
    models: ['gpt-4o', 'gpt-4o-mini', 'gpt-4-turbo'],
    hint: 'Fast streaming, strong tool use.',
  },
  {
    id: 'google',
    label: 'Google Gemini',
    envKey: 'GOOGLE_GENERATIVE_AI_API_KEY',
    defaultModel: 'gemini-1.5-pro-latest',
    models: ['gemini-1.5-pro-latest', 'gemini-1.5-flash-latest'],
    hint: 'Very long context windows.',
  },
  {
    id: 'openai-compatible',
    label: 'OpenAI-compatible (Groq, OpenRouter, Ollama…)',
    envKey: 'XOVA_COMPATIBLE_API_KEY',
    defaultModel: 'llama-3.3-70b-versatile',
    models: ['llama-3.3-70b-versatile', 'deepseek-chat', 'qwen-2.5-coder-32b', 'mistral-large-latest'],
    hint: 'Any /v1/chat/completions endpoint — set a base URL.',
  },
];

export function providerPreset(id: ProviderId): ProviderPreset {
  return PROVIDERS.find((preset) => preset.id === id) ?? PROVIDERS[0];
}

export function isProviderId(value: string | undefined): value is ProviderId {
  return PROVIDERS.some((preset) => preset.id === value);
}

/**
 * The AI SDK provider packages pin their own `@ai-sdk/provider` minor version, which
 * makes a shared `LanguageModel` type structurally incompatible across providers.
 * The runtime contract is identical, so the union is erased here deliberately.
 */

export function getModel(config: LlmConfig): any {
  if (!config.apiKey) {
    throw new Error(`Missing API key for provider "${config.provider}"`);
  }

  switch (config.provider) {
    case 'anthropic': {
      return createAnthropic({ apiKey: config.apiKey })(config.model);
    }
    case 'google': {
      return createGoogleGenerativeAI({ apiKey: config.apiKey })(config.model);
    }
    case 'openai': {
      return createOpenAI({ apiKey: config.apiKey })(config.model);
    }
    case 'openai-compatible': {
      const openai = createOpenAI({
        apiKey: config.apiKey,
        baseURL: config.baseURL || 'https://api.groq.com/openai/v1',
      });

      return openai(config.model);
    }
    default: {
      throw new Error(`Unsupported provider "${String(config.provider)}"`);
    }
  }
}
