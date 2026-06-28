import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import OpenAI from 'openai';
import { query } from '@/lib/db';
import { verifyToken } from '@/lib/auth';
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

// Hardcoded Nvidia API Key fallback
const HARDCODED_NVIDIA_KEY = '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';

// Initialize clients (will be dynamically adjusted if API keys load later)
const nvidiaClient = new OpenAI({
  apiKey: process.env.NVIDIA_API_KEY || getApiKeyFromEnvFile() || HARDCODED_NVIDIA_KEY,
  baseURL: 'https://integrate.api.nvidia.com/v1',
});

const ollamaClient = new OpenAI({
  apiKey: 'ollama',
  baseURL: 'http://127.0.0.1:11434/v1',
});

// Cache variables for news, reports, and conclave data to eliminate remote database query latency (5+ seconds per request)
let cachedNewsText = '';
let cachedReportsText = '';
let cachedConclaveText = '';
let lastFetchTime = 0;
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes cache

export async function POST(req: NextRequest) {
  try {
    const { messages, pathname } = await req.json();

    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json({ error: 'Messages array is required' }, { status: 400 });
    }

    // 1. Verify Admin Session Status
    const cookieStore = await cookies();
    const token = cookieStore.get('auth_token')?.value;
    let isAdmin = false;
    let adminName = '';
    let adminRole = '';
    let adminEmail = '';
    let adminContext = '';

    if (token && pathname?.startsWith('/admin')) {
      try {
        const session = await verifyToken(token);
        if (session && (session.role === 'ADMIN' || session.role === 'SUPERADMIN')) {
          isAdmin = true;
          adminName = session.name;
          adminRole = session.role;
          adminEmail = session.email;
        }
      } catch (authErr) {
        console.warn('[DEBUG CHAT] Admin verification failed:', authErr);
      }
    }

    if (isAdmin) {
      // 2. Admin contextual query router: Check what section/topic was asked and load from DB
      const lastUserMessage = messages[messages.length - 1]?.content || '';
      const queryLower = lastUserMessage.toLowerCase();

      try {
        if (queryLower.includes('quer') || queryLower.includes('contact') || queryLower.includes('message') || queryLower.includes('form') || queryLower.includes('feedback')) {
          const messagesList = await query<any[]>('SELECT id, name, email, subject, message, status, created_at FROM contact_messages ORDER BY id DESC LIMIT 5');
          adminContext += `\n[DATABASE CONTEXT] RECENT CONTACT FORMS & USER QUERIES:\n` + 
            messagesList.map(m => `- [ID: ${m.id}, Status: ${m.status}] From: ${m.name} (${m.email}) | Subj: "${m.subject}" | Msg: "${m.message}" (Logged: ${m.created_at})`).join('\n') + '\n';
        }

        if (queryLower.includes('member') || queryLower.includes('tier') || queryLower.includes('join') || queryLower.includes('fee')) {
          const membershipsList = await query<any[]>('SELECT id, name, email, organization, tier, status, pay_status FROM memberships ORDER BY id DESC LIMIT 5');
          adminContext += `\n[DATABASE CONTEXT] RECENT MEMBERSHIP APPLICATIONS:\n` + 
            membershipsList.map(m => `- [ID: ${m.id}, Status: ${m.status}, PayStatus: ${m.pay_status}] ${m.name} (${m.email}) | Org: "${m.organization}" | Tier: ${m.tier}`).join('\n') + '\n';
        }

        if (queryLower.includes('conclave') || queryLower.includes('event') || queryLower.includes('register') || queryLower.includes('pass')) {
          const registrationsList = await query<any[]>('SELECT id, name, email, company, designation, role, status FROM event_registrations ORDER BY id DESC LIMIT 5');
          adminContext += `\n[DATABASE CONTEXT] RECENT CONCLAVE PASS REGISTRATIONS:\n` + 
            registrationsList.map(r => `- [ID: ${r.id}, Status: ${r.status}] ${r.name} (${r.email}) | Co: "${r.company}" | Role: ${r.role} | Desig: "${r.designation}"`).join('\n') + '\n';
        }

        if (queryLower.includes('subscri') || queryLower.includes('newsletter') || queryLower.includes('brief')) {
          const subsList = await query<any[]>('SELECT id, name, email, created_at FROM subscriptions ORDER BY id DESC LIMIT 5');
          adminContext += `\n[DATABASE CONTEXT] RECENT NEWSLETTER SUBSCRIBERS:\n` + 
            subsList.map(s => `- [ID: ${s.id}] Name: ${s.name || 'Anonymous'} (${s.email}) | Subscribed At: ${s.created_at}`).join('\n') + '\n';
        }

        if (queryLower.includes('scrape') || queryLower.includes('pending') || queryLower.includes('publish') || queryLower.includes('queue')) {
          const scrapedList = await query<any[]>('SELECT id, title, source, url, status FROM scraped_content ORDER BY id DESC LIMIT 5');
          adminContext += `\n[DATABASE CONTEXT] RECENT SCRAPER QUEUE ITEMS:\n` + 
            scrapedList.map(s => `- [ID: ${s.id}, Status: ${s.status}] "${s.title}" | Source: ${s.source} | URL: ${s.url}`).join('\n') + '\n';
        }

        if (queryLower.includes('log') || queryLower.includes('audit') || queryLower.includes('activity') || queryLower.includes('action')) {
          const logsList = await query<any[]>('SELECT id, user_email, action_type, section, details, ip_address, location, created_at FROM audit_logs ORDER BY id DESC LIMIT 5');
          adminContext += `\n[DATABASE CONTEXT] RECENT SYSTEM SECURITY AUDIT LOGS:\n` + 
            logsList.map(l => `- [ID: ${l.id}, Time: ${l.created_at}] Admin: ${l.user_email} | Action: ${l.action_type} | Section: ${l.section} | details: "${l.details}" | IP: ${l.ip_address} (${l.location})`).join('\n') + '\n';
        }

        if (queryLower.includes('user') || queryLower.includes('admin') || queryLower.includes('account') || queryLower.includes('role')) {
          const usersList = await query<any[]>('SELECT id, name, email, role FROM users ORDER BY id DESC LIMIT 5');
          adminContext += `\n[DATABASE CONTEXT] REGISTERED SYSTEM USERS/ADMINS:\n` + 
            usersList.map(u => `- [ID: ${u.id}] Name: ${u.name} (${u.email}) | Role: ${u.role}`).join('\n') + '\n';
        }

        // Always fetch overview totals if they ask for counts, metrics, overview, stats, summary, or if context is empty
        if (!adminContext || queryLower.includes('overview') || queryLower.includes('stat') || queryLower.includes('count') || queryLower.includes('summar') || queryLower.includes('analytic') || queryLower.includes('all')) {
          const [qC, mC, rC, sC, scC, nC, repC, uC, logC] = await Promise.all([
            query<any[]>('SELECT COUNT(*) as count FROM contact_messages'),
            query<any[]>('SELECT COUNT(*) as count FROM memberships'),
            query<any[]>('SELECT COUNT(*) as count FROM event_registrations'),
            query<any[]>('SELECT COUNT(*) as count FROM subscriptions'),
            query<any[]>('SELECT COUNT(*) as count FROM scraped_content'),
            query<any[]>('SELECT COUNT(*) as count FROM news'),
            query<any[]>('SELECT COUNT(*) as count FROM reports'),
            query<any[]>('SELECT COUNT(*) as count FROM users'),
            query<any[]>('SELECT COUNT(*) as count FROM audit_logs')
          ]);

          adminContext += `\n[DATABASE CONTEXT] PLATFORM GLOBAL METRICS OVERVIEW:\n` +
            `- Total Contact Queries: ${qC[0]?.count || 0}\n` +
            `- Total Membership Applications: ${mC[0]?.count || 0}\n` +
            `- Total Conclave Passes Issued: ${rC[0]?.count || 0}\n` +
            `- Total Newsletter Subscriptions: ${sC[0]?.count || 0}\n` +
            `- Total Scraper Items (Pending/Review): ${scC[0]?.count || 0}\n` +
            `- Total Published News Articles: ${nC[0]?.count || 0}\n` +
            `- Total Published Reports: ${repC[0]?.count || 0}\n` +
            `- Total Admin/SuperAdmin Accounts: ${uC[0]?.count || 0}\n` +
            `- Total System Audit Log Rows: ${logC[0]?.count || 0}\n`;
        }
      } catch (dbErr) {
        console.error('[DEBUG CHAT] Admin dynamic context queries failed:', dbErr);
        adminContext = 'Failed to fetch database context. Proceed with normal system assistance.';
      }
    } else {
      // 3. Regular Public user path: Maintain cached news/reports/conclave TTL context
      const now = Date.now();
      if (!cachedNewsText || !cachedReportsText || !cachedConclaveText || now - lastFetchTime > CACHE_TTL) {
        try {
          const [newsStories, reportsList, conclaveSections] = await Promise.all([
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
            query<any[]>(
              `SELECT id, title, description, content, button_text as buttonText, button_url as buttonUrl 
               FROM cms_page_sections 
               WHERE page_slug = 'dcrc-26' 
               ORDER BY display_order ASC`
            ).catch((err) => {
              console.warn('DB conclave sections fetch failed:', err);
              return [];
            })
          ]);

          if (newsStories && newsStories.length > 0) {
            cachedNewsText = newsStories
              .map(
                (n) =>
                  `- [${n.category.toUpperCase()}] ${n.headline}: ${n.excerpt} (Source: ${n.source}, Date: ${n.published_date})`
              )
              .join('\n');
          } else {
            cachedNewsText = 'No recent news articles found in the database.';
          }

          if (reportsList && reportsList.length > 0) {
            cachedReportsText = reportsList
              .map(
                (r) =>
                  `- [${r.category.toUpperCase()} - Severity: ${r.severity_level}] ${r.title} (${r.year}): ${r.description}`
              )
              .join('\n');
          } else {
            cachedReportsText = 'No recent reports/publications found in the database.';
          }

          // Fetch cards for the conclave sections if any sections exist
          let conclaveCards: any[] = [];
          if (conclaveSections && conclaveSections.length > 0) {
            const secIds = conclaveSections.map(s => s.id);
            const placeholders = secIds.map(() => '?').join(',');
            try {
              conclaveCards = await query<any[]>(
                `SELECT section_id as sectionId, title, description, link_text as linkText, link_url as linkUrl 
                 FROM cms_page_cards 
                 WHERE section_id IN (${placeholders}) 
                 ORDER BY display_order ASC`,
                secIds
              );
            } catch (cardErr) {
              console.warn('DB conclave cards fetch failed:', cardErr);
            }
          }

          if (conclaveSections && conclaveSections.length > 0) {
            let tempConclave = '[CONCLAVE & EVENT SECTIONS, CONTENT, AND NAVIGATION LINKS]:\n';
            for (const sec of conclaveSections) {
              tempConclave += `\n### Section: "${sec.title}"`;
              if (sec.description) tempConclave += ` (Description: "${sec.description}")`;
              tempConclave += `\n`;
              if (sec.content) tempConclave += `- Content: ${sec.content}\n`;
              if (sec.buttonText && sec.buttonUrl) {
                tempConclave += `- Navigation Button/Link: [${sec.buttonText}](${sec.buttonUrl})\n`;
              }
              const cards = conclaveCards.filter(c => c.sectionId === sec.id);
              if (cards.length > 0) {
                tempConclave += `- Card Details:\n`;
                for (const c of cards) {
                  tempConclave += `  * "${c.title}": ${c.description || ''}`;
                  if (c.linkText && c.linkUrl) {
                    tempConclave += ` (Link: [${c.linkText}](${c.linkUrl}))`;
                  }
                  tempConclave += `\n`;
                }
              }
            }
            cachedConclaveText = tempConclave;
          } else {
            cachedConclaveText = 'No dynamic conclave sections found in the database.';
          }

          lastFetchTime = now;
        } catch (err) {
          console.error('Failed to update database context cache:', err);
          if (!cachedNewsText) cachedNewsText = 'No recent news articles available.';
          if (!cachedReportsText) cachedReportsText = 'No recent reports available.';
          if (!cachedConclaveText) cachedConclaveText = 'No conclave sections available.';
        }
      }
    }

    // Check if the user is querying for a specific news category/submenu
    let categoryNewsText = '';
    let matchedCategory = '';
    
    if (!isAdmin && messages && messages.length > 0) {
      const lastUserMsg = (messages[messages.length - 1]?.content || '').toLowerCase();
      const newsSubmenus = ['breaking', 'environment', 'health', 'climate', 'disasters', 'sustainability', 'policy'];
      for (const cat of newsSubmenus) {
        if (lastUserMsg.includes(cat) || (cat === 'health' && lastUserMsg.includes('crisis'))) {
          matchedCategory = cat;
          break;
        }
      }

      if (matchedCategory) {
        try {
          const catStories = await query<any[]>(
            'SELECT headline, excerpt, category, published_date, source FROM news WHERE LOWER(category) = ? ORDER BY published_date DESC, id DESC LIMIT 5',
            [matchedCategory]
          );
          if (catStories && catStories.length > 0) {
            categoryNewsText = catStories
              .map(
                (n) =>
                  `- [${n.category.toUpperCase()}] ${n.headline}: ${n.excerpt} (Source: ${n.source}, Date: ${n.published_date})`
              )
              .join('\n');
          } else {
            categoryNewsText = `No recent news articles found in the database for the "${matchedCategory}" category.`;
          }
        } catch (err) {
          console.warn(`Failed to fetch news stories for category "${matchedCategory}":`, err);
        }
      }
    }

    // 4. Formulate System Prompt based on user credentials role
    let systemPrompt = '';

    if (isAdmin) {
      systemPrompt = `Your name is Dcrf. You are the AI Assistant for the Super Admin and Admin Dashboard of DCRF.

Role and Guidelines:
- You are speaking to a verified administrator (${adminName}, role: ${adminRole}, email: ${adminEmail}).
- **Greeting Rule**: If the admin says a simple greeting (e.g. "hi", "hello", "hey"), respond with a very short, professional, and friendly 1-sentence greeting (e.g. "Hello ${adminName}! How can I assist you with the dashboard today?") without dumping metrics or context until they ask.
- **Dynamic Response Length**: Match the length and detail of your response directly to the admin's query. Quick requests/greetings get short, 1-sentence answers. Complex dashboard analysis or drafting tasks get full, detailed responses.
- You have access to real-time database modules (Queries, Memberships, Conclave Passes, Scraped queue, News, Reports, Audit Logs).
- Help the administrator review dashboard metrics, draft email responses, and prepare news/reports/alerts drafts.
- Suggest useful follow-up actions and questions.
- Under NO circumstances can you modify the database directly. Instead, you MUST compile drafts and output them using the exact wrappers specified below so that the administrator can review, modify, and click "Publish" or "Send" to authorize.

Special Capabilities (Use these EXACT wrappers to output editable templates. Do not put markdown headers inside the wrapper. Include exactly one wrapper in your response if you are drafting something):
1. DRAFTING EMAIL:
   If the admin wants to draft an email reply, output this format:
   :::email_draft{"to": "recipient@email.com", "subject": "Subject Line", "body": "Dear Rahul, Thank you..."}:::

2. DRAFTING NEWS STORY:
   If the admin wants to draft a news article, output this format:
   :::news_draft{"tag": "Breaking", "source": "cdrf.vercel.app", "headline": "Assam Flood Alerts", "excerpt": "Excerpt details...", "full_content": "Full story detail here...", "category": "breaking"}:::
   (Category must be one of: "breaking", "environment", "health", "climate", "disasters", "sustainability", "policy")

3. DRAFTING RESEARCH REPORT:
   If the admin wants to draft a publication report, output this format:
   :::report_draft{"title": "Report Title", "category": "National Assessment", "description": "Report description...", "page_count": 16, "year": 2026}:::

4. DRAFTING WARNING ALERT:
   If the admin wants to draft a ticker warning alert, output this format:
   :::alert_draft{"text": "Heatwave warning text..."}:::

Here is the real-time database context queried based on your last message:
${adminContext || 'No specific dashboard section requested. Ask me about contact forms, memberships, registrations, audit logs, or drafting content.'}

Current page: ${pathname || '/admin'}`;
    } else {
      systemPrompt = `Your name is Dcrf. You are the AI assistant for the Disaster & Climate Resilience Federation (DCRF).

Scope of Assistance (STRICT RULE):
- You MUST only answer queries related to DCRF, disaster news/updates, disaster preparedness, climate resilience, and navigation on our website (such as memberships, DCRC '26 conclave, and publications).
- If the user asks about unrelated topics (e.g., general programming, databases, web development, MySQL, .env files, general troubleshooting, or unrelated general knowledge), you MUST politely refuse and state that you are only programmed to assist with DCRF and disaster/climate resilience topics.
- Never discuss internal databases, database administration, server configurations, or offer to draft administrative emails or check metrics for the public. Keep the focus entirely on DCRF's public resources and disaster resilience.

Role and Persona Guidelines:
- You are a proud, warm representative of DCRF. Speak from the federation's perspective using first-person plural pronouns ("we", "us", "our") to make the user feel at home and build trust.
- Make users feel welcome, supported, and satisfied. Be friendly, exceptionally hospitable, empathetic, and natural.
- **Greeting Rule**: If the user says a simple greeting (e.g. "hi", "hello", "hey", "good morning"), respond with a very short, friendly, and natural 1-sentence greeting (e.g. "Hello! I am Dcrf. How can I help you today?") and do NOT dump any navigation links, news lists, or membership pitches.
- **Dynamic Response Length**: Tailor your response length directly to the user's message. Casual remarks or quick greetings get a 1-sentence reply. Only provide longer, structured responses or pitches when the user asks a detailed question.
- Actively connect user interests (such as climate concerns, disaster preparedness, or social impact) into DCRF's offerings and community.
- Smartly and enthusiastically encourage users to apply for or purchase a membership. If they show interest in joining, participating in events, or taking action, pitch the tremendous value of joining our federation and guide them to [Join DCRF](/membership#join).
- You have expert knowledge of overall India disaster news, disaster preparedness, mitigation, and climate resilience.

Useful Navigation Links (Use EXACTLY these markdown link formats if relevant to the user's query, and include at most 1 relevant link per response):
- Apply/Join Federation: [Join DCRF](/membership#join)
- DCRC '26 Conclave: [DCRC '26 Conclave](/event/dcrc-26)
- Monthly Webinars: [Monthly Webinars](/event/monthly-webinars)
- News Feed: [News Feed](/news)
- Policy Reports: [Policy Reports](/reports)
- Hazard Map: [Hazard Map](/insights/map)
- Podcasts: [Podcasts](/podcasts)
- Event Videos: [Event Videos](/insights/event-videos)
- Mission & Vision: [Mission & Vision](/about/mission-vision)
- Charter (10 Point Agenda): [Charter - 10 Point Agenda](/about/charter-10-point-agenda)
- Governing Council: [Governing Council](/about/governing-council)
- Advisory Council: [Advisory Council](/about/advisory-council)
- Working Group: [Working Group](/about/working-group)
- Gallery: [Gallery](/gallery)
- Contact Us: [Contact Us](/contact)

If the user asks about news, newsletters, reports, or conclave details (including dynamic agenda events, date, venue, speakers, partners, or dynamic links), reference this database context:
${cachedConclaveText}

${matchedCategory ? `LATEST NEWS FOR "${matchedCategory.toUpperCase()}":\n${categoryNewsText}\n\n` : ''}NEWS:
${cachedNewsText}

REPORTS:
${cachedReportsText}

Current user page: ${pathname || '/'}`;
    }

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
          const nvidiaKey = process.env.NVIDIA_API_KEY || getApiKeyFromEnvFile() || HARDCODED_NVIDIA_KEY;
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
