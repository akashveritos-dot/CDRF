import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { query } from '@/lib/db';

export const dynamic = 'force-dynamic';

const isProduction = process.env.NODE_ENV === 'production' || !!process.env.NVIDIA_API_KEY;

// Use local Ollama in dev, cloud Nvidia in production (Vercel)
const client = new OpenAI({
  apiKey: isProduction
    ? (process.env.NVIDIA_API_KEY || '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')
    : 'ollama',
  baseURL: isProduction
    ? 'https://integrate.api.nvidia.com/v1'
    : 'http://127.0.0.1:11434/v1',
});

// Cache variables for news and reports to eliminate remote database query latency (5+ seconds per request)
let cachedNewsText = '';
let cachedReportsText = '';
let lastFetchTime = 0;
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes cache

export async function POST(req: NextRequest) {
  try {
    const { messages, pathname } = await req.json();

    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json({ error: 'Messages array is required' }, { status: 400 });
    }

    const now = Date.now();
    // Refresh the cache if empty or expired
    if (!cachedNewsText || !cachedReportsText || now - lastFetchTime > CACHE_TTL) {
      console.log('[DEBUG CHAT] Context cache expired or empty. Fetching news & reports from remote DB...');
      try {
        // Query database in parallel to optimize performance
        const [newsStories, reportsList] = await Promise.all([
          query<any[]>(
            'SELECT headline, excerpt, category, published_date, source FROM news ORDER BY published_date DESC, id DESC LIMIT 5'
          ).catch((err) => {
            console.warn('DB news fetch failed, using fallback:', err);
            return [];
          }),
          query<any[]>(
            'SELECT title, description, category, severity_level, year FROM reports ORDER BY id DESC LIMIT 5'
          ).catch((err) => {
            console.warn('DB reports fetch failed, using fallback:', err);
            return [];
          }),
        ]);

        if (newsStories && newsStories.length > 0) {
          cachedNewsText = newsStories
            .map(
              (n) =>
                `- [${n.category.toUpperCase()}] ${n.headline}: ${n.excerpt} (Source: ${n.source}, Date: ${
                  n.published_date
                })`
            )
            .join('\n');
        } else {
          cachedNewsText = 'No recent news articles found in the database.';
        }

        if (reportsList && reportsList.length > 0) {
          cachedReportsText = reportsList
            .map(
              (r) =>
                `- [${r.category.toUpperCase()} - Severity: ${r.severity_level}] ${r.title} (${r.year}): ${
                  r.description
                }`
            )
            .join('\n');
        } else {
          cachedReportsText = 'No recent reports/publications found in the database.';
        }

        lastFetchTime = now;
      } catch (err) {
        console.error('Failed to update database context cache:', err);
        if (!cachedNewsText) cachedNewsText = 'No recent news articles available.';
        if (!cachedReportsText) cachedReportsText = 'No recent reports available.';
      }
    } else {
      console.log('[DEBUG CHAT] Using cached database context (0ms latency).');
    }

    // 3. Formulate the system instructions
    const systemPrompt = `You are the DCRF AI Assistant. Keep responses smart, engaging, and extremely brief (max 1-2 sentences). 
Only answer what the user directly asks. No fluff, no introductory or concluding chatter.

Links:
- Apply to DCRF: [Join DCRF](/membership#join)
- Conclave registration: [Register Conclave](/event#register)
- News feeds: [Read News](/news)
- Publications: [Browse Reports](/reports)
- Council: [Governing Council](/council)
- About: [About DCRF](/about)

If the user asks about news, newsletters, or reports, answer using this database context:
NEWS:
${cachedNewsText}

REPORTS:
${cachedReportsText}

Current user page: ${pathname || '/'}

Rule: Provide exactly 1 relatable link if appropriate. Be ultra-concise and answer strictly in 1-2 sentences.`;

    const chatMessages = [
      { role: 'system', content: systemPrompt },
      ...messages.map((m: any) => ({
        role: m.role,
        content: m.content,
      })),
    ];

    const stream = new ReadableStream({
      async start(controller) {
        try {
          const completion: any = await client.chat.completions.create({
            model: isProduction ? 'meta/llama-3.1-8b-instruct' : 'llama3.1:8b',
            messages: chatMessages,
            temperature: 0.7,
            top_p: 0.95,
            stream: true,
          });

          for await (const chunk of completion) {
            const content = chunk.choices[0]?.delta?.content;
            if (content !== null && content !== undefined) {
              controller.enqueue(
                new TextEncoder().encode(
                  `data: ${JSON.stringify({ type: 'content', content })}\n\n`
                )
              );
            }
          }
        } catch (err: any) {
          console.error('Streaming completion error from Ollama:', err);
          controller.enqueue(
            new TextEncoder().encode(
              `data: ${JSON.stringify({
                type: 'error',
                content: err.message || 'Error communicating with Ollama local model. Make sure Ollama is running (`ollama run llama3.1:8b`)',
              })}\n\n`
            )
          );
        } finally {
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream; charset=utf-8',
        'Cache-Control': 'no-cache, no-transform',
        'X-Accel-Buffering': 'no',
        Connection: 'keep-alive',
      },
    });
  } catch (error: any) {
    console.error('Chat API Error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal Server Error' },
      { status: 500 }
    );
  }
}
