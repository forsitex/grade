/**
 * Anthropic Claude Client Configuration
 * 
 * Acest fișier configurează clientul Anthropic pentru întreaga aplicație.
 * API Key-ul este încărcat automat din .env.local
 */

import Anthropic from '@anthropic-ai/sdk';

// La build time, key-ul poate lipsi (va fi setat în Vercel)
// La runtime, dacă lipsește, API-urile vor returna eroare
const apiKey = process.env.ANTHROPIC_API_KEY || 'dummy-key-for-build';

export const anthropic = new Anthropic({
  apiKey: apiKey,
});

// Helper pentru verificare la runtime
export function checkAnthropicApiKey() {
  if (!process.env.ANTHROPIC_API_KEY || process.env.ANTHROPIC_API_KEY === 'dummy-key-for-build') {
    throw new Error(
      'ANTHROPIC_API_KEY lipsește din variabilele de mediu. ' +
      'Adaugă-l în .env.local sau Vercel Environment Variables.'
    );
  }
}

/**
 * Modele disponibile
 */
export const CLAUDE_MODELS = {
  SONNET_3_5: 'claude-3-5-sonnet-20241022', // Cel mai bun pentru analiză documente
  OPUS_3: 'claude-3-opus-20240229', // Cel mai inteligent (mai scump)
  HAIKU_3: 'claude-3-haiku-20240307', // Cel mai rapid și ieftin
} as const;

/**
 * Costuri estimate per 1M tokens
 */
export const CLAUDE_COSTS = {
  SONNET_3_5_INPUT: 3.00,
  SONNET_3_5_OUTPUT: 15.00,
  OPUS_3_INPUT: 15.00,
  OPUS_3_OUTPUT: 75.00,
  HAIKU_3_INPUT: 0.25,
  HAIKU_3_OUTPUT: 1.25,
} as const;

/**
 * Calculează costul estimat pentru un request Claude
 */
export function estimateClaudeCost(inputTokens: number, outputTokens: number, model: string = CLAUDE_MODELS.SONNET_3_5): number {
  let inputCost = 0;
  let outputCost = 0;

  if (model === CLAUDE_MODELS.SONNET_3_5) {
    inputCost = (inputTokens / 1_000_000) * CLAUDE_COSTS.SONNET_3_5_INPUT;
    outputCost = (outputTokens / 1_000_000) * CLAUDE_COSTS.SONNET_3_5_OUTPUT;
  } else if (model === CLAUDE_MODELS.OPUS_3) {
    inputCost = (inputTokens / 1_000_000) * CLAUDE_COSTS.OPUS_3_INPUT;
    outputCost = (outputTokens / 1_000_000) * CLAUDE_COSTS.OPUS_3_OUTPUT;
  } else if (model === CLAUDE_MODELS.HAIKU_3) {
    inputCost = (inputTokens / 1_000_000) * CLAUDE_COSTS.HAIKU_3_INPUT;
    outputCost = (outputTokens / 1_000_000) * CLAUDE_COSTS.HAIKU_3_OUTPUT;
  }

  return inputCost + outputCost;
}
