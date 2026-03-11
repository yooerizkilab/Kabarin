import OpenAI from 'openai';
import Anthropic from '@anthropic-ai/sdk';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { logger } from '../utils/logger';

/**
 * Call an AI provider with the given message and return the text response.
 */
export async function callAI(
    provider: string,
    model: string,
    systemPrompt: string,
    userMessage: string
): Promise<string> {
    // logger.debug(`[AI] Calling provider: ${provider}, model: ${model}`);
    switch (provider.toLowerCase()) {
        case 'openai':
            return callOpenAI(model, systemPrompt, userMessage);
        case 'anthropic':
            return callAnthropic(model, systemPrompt, userMessage);
        case 'gemini':
            return callGemini(model, systemPrompt, userMessage);
        default:
            throw new Error(`Unknown AI provider: ${provider}`);
    }
}

async function callOpenAI(model: string, systemPrompt: string, userMessage: string): Promise<string> {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) throw new Error('OPENAI_API_KEY is not set in environment variables');

    try {
        const client = new OpenAI({ apiKey });
        const response = await client.chat.completions.create({
            model: model || 'gpt-4o-mini',
            messages: [
                { role: 'system', content: systemPrompt || 'You are a helpful WhatsApp assistant. Reply concisely.' },
                { role: 'user', content: userMessage },
            ],
            max_tokens: 500,
        });

        const reply = response.choices[0]?.message?.content?.trim() || 'Sorry, I could not generate a response.';
        // logger.debug(`[AI] OpenAI replied successfully.`);
        return reply;
    } catch (error: any) {
        logger.error(`[AI] OpenAI Error:`, error.message);
        throw error;
    }
}

async function callAnthropic(model: string, systemPrompt: string, userMessage: string): Promise<string> {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) throw new Error('ANTHROPIC_API_KEY is not set in environment variables');

    try {
        const client = new Anthropic({ apiKey });
        const response = await client.messages.create({
            model: model || 'claude-3-haiku-20240307',
            max_tokens: 500,
            system: systemPrompt || 'You are a helpful WhatsApp assistant. Reply concisely.',
            messages: [{ role: 'user', content: userMessage }],
        });

        const block = response.content[0];
        if (block.type === 'text') {
            // logger.debug(`[AI] Anthropic replied successfully.`);
            return block.text.trim();
        }
        return 'Sorry, I could not generate a response.';
    } catch (error: any) {
        logger.error(`[AI] Anthropic Error:`, error.message);
        throw error;
    }
}

async function callGemini(model: string, systemPrompt: string, userMessage: string): Promise<string> {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) throw new Error('GEMINI_API_KEY is not set in environment variables');

    try {
        // logger.debug(`[AI] Gemini target model: ${model || 'gemini-flash-latest'}`);
        const genAI = new GoogleGenerativeAI(apiKey);
        const geminiModel = genAI.getGenerativeModel({
            model: model || 'gemini-flash-latest',
            systemInstruction: systemPrompt || 'You are a helpful WhatsApp assistant. Reply concisely.',
        });

        const result = await geminiModel.generateContent(userMessage);
        const reply = result.response.text().trim() || 'Sorry, I could not generate a response.';
        // logger.debug(`[AI] Gemini replied successfully.`);
        return reply;
    } catch (error: any) {
        logger.error(`[AI] Gemini Error:`, error.message);
        throw error;
    }
}
