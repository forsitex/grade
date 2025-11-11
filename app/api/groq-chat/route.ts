import { NextRequest, NextResponse } from 'next/server';
import { chatWithGroq, calculateGroqCost, isGroqConfigured, GROQ_MODELS } from '@/lib/groq';

export const runtime = 'nodejs';
export const maxDuration = 60;

export async function POST(request: NextRequest) {
  try {
    if (!isGroqConfigured()) {
      return NextResponse.json(
        { error: 'Groq API key not configured' },
        { status: 500 }
      );
    }

    const body = await request.json();
    const { messages, model, temperature, maxTokens } = body;

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json(
        { error: 'Messages array is required' },
        { status: 400 }
      );
    }

    const result = await chatWithGroq(
      messages,
      model || GROQ_MODELS.LLAMA_3_1_8B,
      {
        temperature: temperature ?? 0.7,
        maxTokens: maxTokens ?? 1024,
      }
    );

    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: 500 }
      );
    }

    const cost = result.usage
      ? calculateGroqCost(
          result.usage.prompt_tokens,
          result.usage.completion_tokens,
          result.model
        )
      : 0;

    return NextResponse.json({
      success: true,
      content: result.content,
      usage: result.usage,
      model: result.model,
      cost: cost.toFixed(6),
    });
  } catch (error: any) {
    console.error('Groq Chat API Error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
