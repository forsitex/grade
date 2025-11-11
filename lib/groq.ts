import Groq from 'groq-sdk';

const apiKey = process.env.GROQ_API_KEY || 'dummy-key-for-build';

if (!process.env.GROQ_API_KEY && process.env.NODE_ENV !== 'production') {
  console.warn('⚠️ GROQ_API_KEY is not set. Using dummy key for build.');
}

export const groq = new Groq({
  apiKey: apiKey,
});

export const GROQ_MODELS = {
  LLAMA_3_3_70B: 'llama-3.3-70b-versatile',
  LLAMA_3_1_8B: 'llama-3.1-8b-instant',
  MIXTRAL_8X7B: 'mixtral-8x7b-32768',
  GEMMA_2_9B: 'gemma2-9b-it',
} as const;

export const DEFAULT_MODEL = GROQ_MODELS.LLAMA_3_1_8B;

export interface GroqChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export async function chatWithGroq(
  messages: GroqChatMessage[],
  model: string = DEFAULT_MODEL,
  options?: {
    temperature?: number;
    maxTokens?: number;
  }
) {
  try {
    const completion = await groq.chat.completions.create({
      messages,
      model,
      temperature: options?.temperature ?? 0.7,
      max_tokens: options?.maxTokens ?? 1024,
      stream: false,
    });

    if ('choices' in completion) {
      return {
        success: true,
        content: completion.choices[0]?.message?.content || '',
        usage: completion.usage,
        model: completion.model,
      };
    }

    return {
      success: false,
      error: 'Invalid response format',
      content: '',
    };
  } catch (error: any) {
    console.error('Groq API Error:', error);
    return {
      success: false,
      error: error.message || 'Unknown error occurred',
      content: '',
    };
  }
}

export function calculateGroqCost(inputTokens: number, outputTokens: number, model: string): number {
  const pricing: Record<string, { input: number; output: number }> = {
    [GROQ_MODELS.LLAMA_3_3_70B]: { input: 0.59, output: 0.79 },
    [GROQ_MODELS.LLAMA_3_1_8B]: { input: 0.05, output: 0.08 },
    [GROQ_MODELS.MIXTRAL_8X7B]: { input: 0.24, output: 0.24 },
    [GROQ_MODELS.GEMMA_2_9B]: { input: 0.07, output: 0.07 },
  };

  const modelPricing = pricing[model] || pricing[GROQ_MODELS.LLAMA_3_1_8B];
  
  const inputCost = (inputTokens / 1_000_000) * modelPricing.input;
  const outputCost = (outputTokens / 1_000_000) * modelPricing.output;
  
  return inputCost + outputCost;
}

export function isGroqConfigured(): boolean {
  return !!process.env.GROQ_API_KEY && process.env.GROQ_API_KEY !== 'dummy-key-for-build';
}
