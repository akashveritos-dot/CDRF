import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { query } from '@/lib/db';
import fs from 'fs';
import path from 'path';

export const dynamic = 'force-dynamic';

const isProduction = process.env.NODE_ENV === 'production';

// Helper to read NVIDIA_API_KEY directly from .env file if it's not loaded in process.env yet
function getApiKeyFromEnvFile(): string | null {
  try {
    const envPath = path.join(process.cwd(), '.env');
    if (fs.existsSync(envPath)) {
      const content = fs.readFileSync(envPath, 'utf8');
      const match = content.match(/^NVIDIA_API_KEY\s*=\s*(.+)$/m);
      if (match && match[1]) {
        return match[1].trim().replace(/^['"]|['"]$/g, '');
      }
    }
  } catch (e) {
    console.error('Failed to read .env file directly:', e);
  }
  return null;
}

// Offline fallback logic for DCRF when both LLM providers fail
function getOfflineFallbackResponse(messageText: string): string {
  const queryText = messageText.toLowerCase();

  if (queryText.includes('join') || queryText.includes('apply') || queryText.includes('membership')) {
    return `I am currently operating in offline fallback mode, but I can guide you: You can apply to join the Disaster & Climate Resilience Federation (DCRF) by visiting our [Join DCRF](/membership#join) page. We welcome organizations and individuals committed to disaster resilience!`;
  }
  if (queryText.includes('conclave') || queryText.includes('register') || queryText.includes('event') || queryText.includes('dcrc')) {
    return `I am currently operating in offline fallback mode: Registration for the DCRC 2026 Conclave is open. You can register and secure your passes directly on our [Register Conclave](/event#register) page.`;
  }
  if (queryText.includes('news') || queryText.includes('update') || queryText.includes('newsletter')) {
    let response = `I am currently operating in offline fallback mode. Here is the latest news from our database:\n\n`;
    if (cachedNewsText && !cachedNewsText.includes('No recent news')) {
      response += cachedNewsText;
    } else {
      response += `- Stay tuned for upcoming emergency news and updates.`;
    }
    response += `\n\nRead more details on our [Read News](/news) page.`;
    return response;
  }
  if (queryText.includes('report') || queryText.includes('publication') || queryText.includes('document')) {
    let response = `I am currently operating in offline fallback mode. Here are the latest publications from our database:\n\n`;
    if (cachedReportsText && !cachedReportsText.includes('No recent reports')) {
      response += cachedReportsText;
    } else {
      response += `- Check back soon for new climate resilience research publications.`;
    }
    response += `\n\nBrowse all reports on our [Browse Reports](/reports) page.`;
    return response;
  }
  if (queryText.includes('council') || queryText.includes('governing') || queryText.includes('secretariat')) {
    return `DCRF is guided by our Governing Council and Secretariat based in New Delhi, India. Learn more about our leadership structure on our [Governing Council](/council) page.`;
  }
  if (queryText.includes('about') || queryText.includes('who') || queryText.includes('what')) {
    return `The Disaster & Climate Resilience Federation (DCRF) is a joint venture between TCUIF and DiCAF established under Indian Law. We focus on enhancing community resilience to climate disasters. Read more [About DCRF](/about).`;
  }

  return `I am currently operating in offline fallback mode because the Cloud Nvidia NIM and Local Ollama services are temporarily unavailable.

However, I can help you find what you need:
- To join the federation, visit [Join DCRF](/membership#join)
- To register for the conclave, visit [Register Conclave](/event#register)
- To read recent updates, see [Read News](/news)
- To view publications, check out [Browse Reports](/reports)
- To learn about our organization, visit [About DCRF](/about)`;
}

// Initialize clients (will be dynamically adjusted if API keys load later)
const nvidiaClient = new OpenAI({
  apiKey: process.env.NVIDIA_API_KEY || getApiKeyFromEnvFile() || 'ollama',
  baseURL: 'https://integrate.api.nvidia.com/v1',
});

const ollamaClient = new OpenAI({
  apiKey: 'ollama',
  baseURL: 'http://127.0.0.1:11434/v1',
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
                `- [${n.category.toUpperCase()}] ${n.headline}: ${n.excerpt} (Source: ${n.source}, Date: ${n.published_date
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
                `- [${r.category.toUpperCase()} - Severity: ${r.severity_level}] ${r.title} (${r.year}): ${r.description
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
    const systemPrompt = `Your name is Dcrf. You are the AI assistant for the Disaster & Climate Resilience Federation (DCRF).

Role and Persona Guidelines:
- Talk like a real, genuine human, not a cold machine. Be friendly, empathetic, warm, and natural in your conversation.
- Understand what the user wants and what they are trying to ask. Listen closely to their intent and give highly relevant, targeted answers.
- You have expert knowledge of overall India disaster news, disaster preparedness, mitigation, and climate resilience.
- Keep your answers a medium length (typically 2 to 4 sentences or a couple of short paragraphs)—neither too long nor too short. Tailor the length dynamically to match the user's query.

Useful Navigation Links (Use EXACTLY these markdown link formats if relevant to the user's query, and include at most 1 relevant link per response):
- Apply/Join Federation: [Join DCRF](/membership#join)
- Conclave Registration: [Register Conclave](/event#register)
- News & Updates: [Read News](/news)
- Publications/Reports: [Browse Reports](/reports)
- Governing Council: [Governing Council](/council)
- About Us: [About DCRF](/about)

If the user asks about news, newsletters, or reports, reference this database context:
NEWS:
${cachedNewsText}

REPORTS:
${cachedReportsText}

Current user page: ${pathname || '/'}`;

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
          let completion: any;
          let activeProvider = '';

          // Determine preferred order based on NVIDIA_API_KEY presence (dynamic check)
          const nvidiaKey = process.env.NVIDIA_API_KEY || getApiKeyFromEnvFile();
          const hasNvidiaKey = Boolean(nvidiaKey);

          if (hasNvidiaKey) {
            try {
              console.log('[DEBUG CHAT] Attempting to connect to Nvidia NIM (Primary)...');
              // Create dynamic client instance to pick up key if it was loaded from file
              const dynamicNvidiaClient = new OpenAI({
                apiKey: nvidiaKey || 'ollama',
                baseURL: 'https://integrate.api.nvidia.com/v1',
              });
              completion = await dynamicNvidiaClient.chat.completions.create({
                model: 'meta/llama-3.1-8b-instruct',
                messages: chatMessages,
                temperature: 0.7,
                top_p: 0.95,
                stream: true,
              });
              activeProvider = 'Nvidia NIM';
            } catch (err: any) {
              console.warn('[DEBUG CHAT] Nvidia NIM failed. Error:', err.message || err);
              console.log('[DEBUG CHAT] Falling back to local Ollama (Secondary)...');
              completion = await ollamaClient.chat.completions.create({
                model: 'llama3.1:8b',
                messages: chatMessages,
                temperature: 0.7,
                top_p: 0.95,
                stream: true,
              });
              activeProvider = 'Local Ollama';
            }
          } else {
            try {
              console.log('[DEBUG CHAT] Attempting to connect to local Ollama (Primary)...');
              completion = await ollamaClient.chat.completions.create({
                model: 'llama3.1:8b',
                messages: chatMessages,
                temperature: 0.7,
                top_p: 0.95,
                stream: true,
              });
              activeProvider = 'Local Ollama';
            } catch (err: any) {
              console.warn('[DEBUG CHAT] Local Ollama failed. Error:', err.message || err);
              console.log('[DEBUG CHAT] Falling back to Nvidia NIM (Secondary)...');
              const dynamicNvidiaClient = new OpenAI({
                apiKey: nvidiaKey || 'ollama',
                baseURL: 'https://integrate.api.nvidia.com/v1',
              });
              completion = await dynamicNvidiaClient.chat.completions.create({
                model: 'meta/llama-3.1-8b-instruct',
                messages: chatMessages,
                temperature: 0.7,
                top_p: 0.95,
                stream: true,
              });
              activeProvider = 'Nvidia NIM';
            }
          }

          console.log(`[DEBUG CHAT] Successfully established stream with ${activeProvider}`);

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
          console.error('[DEBUG CHAT] All LLM providers failed. Triggering offline fallback response. Error:', err.message || err);
          try {
            // Get the last user message to generate a relevant offline response
            const lastUserMsg = messages[messages.length - 1]?.content || '';
            const offlineResponse = getOfflineFallbackResponse(lastUserMsg);

            // Stream the offline response in small chunks to simulate typing
            const encoder = new TextEncoder();
            const words = offlineResponse.split(' ');
            for (let i = 0; i < words.length; i++) {
              const content = words[i] + (i === words.length - 1 ? '' : ' ');
              controller.enqueue(
                encoder.encode(
                  `data: ${JSON.stringify({ type: 'content', content })}\n\n`
                )
              );
              // Small delay to simulate streaming (e.g. 20ms per word)
              await new Promise((resolve) => setTimeout(resolve, 20));
            }
          } catch (fallbackErr) {
            console.error('[DEBUG CHAT] Offline fallback failed:', fallbackErr);
            controller.enqueue(
              new TextEncoder().encode(
                `data: ${JSON.stringify({
                  type: 'error',
                  content: 'I am currently unable to connect to my AI model. Please try again in a few moments.',
                })}\n\n`
              )
            );
          }
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
      { error: 'An unexpected error occurred while processing your message. Please try again.' },
      { status: 500 }
    );
  }
}
