import OpenAI from 'openai';
import Anthropic from '@anthropic-ai/sdk';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { logger } from '../utils/logger';

/**
 * Helper to retry transient errors with exponential backoff
 * Handles 503 (busy) and temporary 429 (rate limits)
 */
async function withRetry<T>(fn: () => Promise<T>, retries = 2, delay = 2000): Promise<T> {
    try {
        return await fn();
    } catch (error: any) {
        const errorMessage = error.message?.toLowerCase() || '';
        
        // 503 is always transient. 429 can be transient (rate limit) or permanent (quota exhausted)
        const isTransient = 
            errorMessage.includes('503') || 
            errorMessage.includes('high demand') ||
            errorMessage.includes('service unavailable');

        if (isTransient && retries > 0) {
            logger.warn(`[AI] Transient error detected: "${error.message}". Retrying in ${delay}ms... (${retries} retries left)`);
            await new Promise(resolve => setTimeout(resolve, delay));
            return withRetry(fn, retries - 1, delay * 2);
        }
        throw error;
    }
}

/**
 * Call an AI provider with the given message and return the text response.
 * Includes a fallback mechanism if the primary provider fails due to quota limits.
 */
export async function callAI(
    provider: string,
    model: string,
    systemPrompt: string,
    userMessage: string
): Promise<string> {
    try {
        // Try the primary provider with retries for transient errors
        return await withRetry(async () => {
            switch (provider.toLowerCase()) {
                case 'openai':
                    return callOpenAI(model, systemPrompt, userMessage);
                case 'anthropic':
                    return callAnthropic(model, systemPrompt, userMessage);
                case 'gemini':
                default:
                    return callGemini(model, systemPrompt, userMessage);
            }
        });
    } catch (error: any) {
        const errorMessage = error.message?.toLowerCase() || '';
        const isQuotaError = errorMessage.includes('429') || errorMessage.includes('quota exceeded') || errorMessage.includes('too many requests');

        // Fallback Logic: If Gemini fails with a Quota error, try OpenAI as a backup
        if (isQuotaError && provider.toLowerCase() === 'gemini') {
            const hasOpenAI = !!process.env.OPENAI_API_KEY;
            if (hasOpenAI) {
                logger.warn(`[AI] Gemini quota exhausted. Falling back to OpenAI...`);
                return callOpenAI('gpt-4o-mini', systemPrompt, userMessage);
            }
        }

        logger.error(`[AI] Error in callAI (Provider: ${provider}):`, error.message);
        throw error;
    }
}

async function callOpenAI(model: string, systemPrompt: string, userMessage: string): Promise<string> {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) throw new Error('OPENAI_API_KEY is not set in environment variables');

    const client = new OpenAI({ apiKey });
    const response = await client.chat.completions.create({
        model: model || 'gpt-4o-mini',
        messages: [
            { role: 'system', content: systemPrompt || 'You are a helpful WhatsApp assistant. Reply concisely.' },
            { role: 'user', content: userMessage },
        ],
        max_tokens: 500,
    });

    return response.choices[0]?.message?.content?.trim() || 'Sorry, I could not generate a response.';
}

async function callAnthropic(model: string, systemPrompt: string, userMessage: string): Promise<string> {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) throw new Error('ANTHROPIC_API_KEY is not set in environment variables');

    const client = new Anthropic({ apiKey });
    const response = await client.messages.create({
        model: model || 'claude-3-haiku-20240307',
        max_tokens: 500,
        system: systemPrompt || 'You are a helpful WhatsApp assistant. Reply concisely.',
        messages: [{ role: 'user', content: userMessage }],
    });

    const block = response.content[0];
    if (block.type === 'text') {
        return block.text.trim();
    }
    return 'Sorry, I could not generate a response.';
}

async function callGemini(model: string, systemPrompt: string, userMessage: string): Promise<string> {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) throw new Error('GEMINI_API_KEY is not set in environment variables');

    const genAI = new GoogleGenerativeAI(apiKey);
    const geminiModel = genAI.getGenerativeModel({
        model: model || 'gemini-1.5-flash',
        systemInstruction: systemPrompt || 'You are a helpful WhatsApp assistant. Reply concisely.',
    });

    const result = await geminiModel.generateContent(userMessage);
    return result.response.text().trim() || 'Sorry, I could not generate a response.';
}
