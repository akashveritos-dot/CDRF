'use client';

import React, { useState, useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';
import { MessageSquare, X, Send, Sparkles } from 'lucide-react';
import styles from './ChatAssistant.module.css';

interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
}

const SUGGESTIONS = [
  { label: 'Join DCRF', query: 'How do I apply to join the DCRF federation?' },
  { label: 'DCRC ’26 Conclave', query: 'Tell me about the DCRC 2026 Conclave.' },
  { label: 'Latest News', query: 'What is the latest disaster news from the website?' },
  { label: 'Subscribe', query: 'How do I subscribe to the newsletter?' }
];

// Parser to extract drafts from AI messages
function parseAssistantDrafts(content: string) {
  let cleanContent = content;
  let draftData: {
    type: 'email' | 'news' | 'report' | 'alert';
    data: any;
  } | null = null;

  const emailRegex = /:::email_draft(\{[\s\S]*?\}):::/;
  const newsRegex = /:::news_draft(\{[\s\S]*?\}):::/;
  const reportRegex = /:::report_draft(\{[\s\S]*?\}):::/;
  const alertRegex = /:::alert_draft(\{[\s\S]*?\}):::/;

  let match;
  if ((match = content.match(emailRegex))) {
    try {
      draftData = { type: 'email', data: JSON.parse(match[1]) };
      cleanContent = content.replace(emailRegex, '').trim();
    } catch (e) {
      console.error('Failed to parse email draft JSON:', e);
    }
  } else if ((match = content.match(newsRegex))) {
    try {
      draftData = { type: 'news', data: JSON.parse(match[1]) };
      cleanContent = content.replace(newsRegex, '').trim();
    } catch (e) {
      console.error('Failed to parse news draft JSON:', e);
    }
  } else if ((match = content.match(reportRegex))) {
    try {
      draftData = { type: 'report', data: JSON.parse(match[1]) };
      cleanContent = content.replace(reportRegex, '').trim();
    } catch (e) {
      console.error('Failed to parse report draft JSON:', e);
    }
  } else if ((match = content.match(alertRegex))) {
    try {
      draftData = { type: 'alert', data: JSON.parse(match[1]) };
      cleanContent = content.replace(alertRegex, '').trim();
    } catch (e) {
      console.error('Failed to parse alert draft JSON:', e);
    }
  }

  return { cleanContent, draftData };
}

// Editable card for Reviewing and Approving Admin actions
interface DraftCardProps {
  type: 'email' | 'news' | 'report' | 'alert';
  initialData: any;
}

function DraftCard({ type, initialData }: DraftCardProps) {
  const [formData, setFormData] = useState(initialData);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [msg, setMsg] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setStatus('idle');
    setMsg('');

    try {
      let endpoint = '';
      let payload = {};

      if (type === 'email') {
        endpoint = '/api/admin/send-email';
        payload = { to: formData.to, subject: formData.subject, body: formData.body };
      } else if (type === 'news') {
        endpoint = '/api/news';
        payload = {
          tag: formData.tag || 'Breaking',
          source: formData.source || 'cdrf.vercel.app',
          headline: formData.headline,
          excerpt: formData.excerpt,
          full_content: formData.full_content || '',
          published_date: formData.published_date || new Date().toISOString().split('T')[0],
          author: formData.author || 'AI Assistant',
          external_link: formData.external_link || '',
          thumbnail_emoji: formData.thumbnail_emoji || '📰',
          image_url: formData.image_url || '',
          category: formData.category
        };
      } else if (type === 'report') {
        endpoint = '/api/reports';
        payload = {
          title: formData.title,
          category: formData.category,
          description: formData.description,
          page_count: formData.page_count || 10,
          year: formData.year || new Date().getFullYear(),
          download_url: formData.download_url || '#',
          accent_color: formData.accent_color || '#FDECEA',
          icon: formData.icon || '📙',
          image_url: formData.image_url || ''
        };
      } else if (type === 'alert') {
        endpoint = '/api/admin/alerts';
        payload = { text: formData.text };
      }

      const res = await fetch(`https://cdrf.vercel.app${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      if (res.ok) {
        setStatus('success');
        setMsg(data.message || 'Published successfully!');
      } else {
        setStatus('error');
        setMsg(data.error || 'Operation failed');
      }
    } catch (err) {
      console.error(err);
      setStatus('error');
      setMsg('An unexpected network error occurred.');
    } finally {
      setLoading(false);
    }
  };

  if (status === 'success') {
    return (
      <div className={styles.draftCardSuccess}>
        <div className={styles.successIcon}>✓</div>
        <div>
          <h4 className={styles.successTitle}>Action Completed</h4>
          <p className={styles.successMessage}>{msg}</p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.draftCard}>
      <div className={styles.draftCardHeader}>
        <span className={styles.draftCardBadge}>
          {type === 'email' ? '✉ Email Draft' : type === 'news' ? '📰 News Draft' : type === 'report' ? '📙 Report Draft' : '⚠️ Alert Draft'}
        </span>
        <span className={styles.draftCardActionLabel}>Super Admin Review Required</span>
      </div>

      <form onSubmit={handleSubmit} className={styles.draftForm}>
        {type === 'email' && (
          <>
            <label className={styles.draftLabel}>
              Recipient Email (To)
              <input
                type="email"
                value={formData.to || ''}
                onChange={e => setFormData({ ...formData, to: e.target.value })}
                required
                className={styles.draftInput}
              />
            </label>
            <label className={styles.draftLabel}>
              Subject
              <input
                type="text"
                value={formData.subject || ''}
                onChange={e => setFormData({ ...formData, subject: e.target.value })}
                required
                className={styles.draftInput}
              />
            </label>
            <label className={styles.draftLabel}>
              Email Body
              <textarea
                value={formData.body || ''}
                onChange={e => setFormData({ ...formData, body: e.target.value })}
                required
                rows={5}
                className={styles.draftTextarea}
              />
            </label>
          </>
        )}

        {type === 'news' && (
          <>
            <label className={styles.draftLabel}>
              Headline
              <input
                type="text"
                value={formData.headline || ''}
                onChange={e => setFormData({ ...formData, headline: e.target.value })}
                required
                className={styles.draftInput}
              />
            </label>
            <div className={styles.draftRow}>
              <label className={styles.draftLabel}>
                Category
                <select
                  value={formData.category || 'breaking'}
                  onChange={e => setFormData({ ...formData, category: e.target.value })}
                  required
                  className={styles.draftSelect}
                >
                  <option value="breaking">Breaking</option>
                  <option value="environment">Environment</option>
                  <option value="health">Health Crisis</option>
                  <option value="climate">Climate</option>
                  <option value="disasters">Disasters</option>
                  <option value="sustainability">Sustainability</option>
                  <option value="policy">Policy</option>
                </select>
              </label>
              <label className={styles.draftLabel}>
                Tag
                <input
                  type="text"
                  value={formData.tag || 'Breaking'}
                  onChange={e => setFormData({ ...formData, tag: e.target.value })}
                  className={styles.draftInput}
                />
              </label>
            </div>
            <label className={styles.draftLabel}>
              Excerpt
              <input
                type="text"
                value={formData.excerpt || ''}
                onChange={e => setFormData({ ...formData, excerpt: e.target.value })}
                required
                className={styles.draftInput}
              />
            </label>
            <label className={styles.draftLabel}>
              Full Content
              <textarea
                value={formData.full_content || ''}
                onChange={e => setFormData({ ...formData, full_content: e.target.value })}
                rows={4}
                className={styles.draftTextarea}
              />
            </label>
          </>
        )}

        {type === 'report' && (
          <>
            <label className={styles.draftLabel}>
              Report Title
              <input
                type="text"
                value={formData.title || ''}
                onChange={e => setFormData({ ...formData, title: e.target.value })}
                required
                className={styles.draftInput}
              />
            </label>
            <div className={styles.draftRow}>
              <label className={styles.draftLabel}>
                Category
                <input
                  type="text"
                  value={formData.category || 'National Assessment'}
                  onChange={e => setFormData({ ...formData, category: e.target.value })}
                  required
                  className={styles.draftInput}
                />
              </label>
              <label className={styles.draftLabel}>
                Publication Year
                <input
                  type="number"
                  value={formData.year || 2026}
                  onChange={e => setFormData({ ...formData, year: parseInt(e.target.value, 10) || 2026 })}
                  required
                  className={styles.draftInput}
                />
              </label>
            </div>
            <label className={styles.draftLabel}>
              Description
              <textarea
                value={formData.description || ''}
                onChange={e => setFormData({ ...formData, description: e.target.value })}
                required
                rows={3}
                className={styles.draftTextarea}
              />
            </label>
          </>
        )}

        {type === 'alert' && (
          <>
            <label className={styles.draftLabel}>
              Ticker Alert Text
              <textarea
                value={formData.text || ''}
                onChange={e => setFormData({ ...formData, text: e.target.value })}
                required
                rows={3}
                className={styles.draftTextarea}
              />
            </label>
          </>
        )}

        {status === 'error' && (
          <div className={styles.draftError}>
            <span>⚠️ {msg}</span>
          </div>
        )}

        <button type="submit" disabled={loading} className={styles.draftSubmitBtn}>
          {loading ? 'Processing...' : type === 'email' ? 'Send Email' : 'Publish to Portal'}
        </button>
      </form>
    </div>
  );
}

export default function ChatAssistant() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [streamContent, setStreamContent] = useState('');
  const [showTooltip, setShowTooltip] = useState(false);
  const [typewriterText, setTypewriterText] = useState('');

  const latestStreamRef = useRef('');
  const typewriterLengthRef = useRef(0);
  const pathname = usePathname();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Typewriter effect to make stream rendering smooth character-by-character
  useEffect(() => {
    let intervalId: NodeJS.Timeout | null = null;
    if (isLoading) {
      setTypewriterText('');
      typewriterLengthRef.current = 0;
      intervalId = setInterval(() => {
        const target = latestStreamRef.current;
        setTypewriterText((prev) => {
          if (prev.length < target.length) {
            const remaining = target.length - prev.length;
            const step = remaining > 40 ? 6 : (remaining > 15 ? 3 : 1);
            const nextText = target.substring(0, prev.length + step);
            typewriterLengthRef.current = nextText.length;
            return nextText;
          }
          return prev;
        });
      }, 20);
    } else {
      setTypewriterText('');
      typewriterLengthRef.current = 0;
      latestStreamRef.current = '';
    }
    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [isLoading]);

  // Initialize welcome message
  useEffect(() => {
    setMessages([
      {
        id: 'welcome',
        role: 'assistant',
        content: "Hi! I'm the DCRF Assistant. How can I help you today?"
      }
    ]);
  }, []);

  // Scroll to bottom (only when messages count changes or chat is opened)
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen]);

  // Show tooltip only on homepage, and auto-dismiss after 4 seconds
  useEffect(() => {
    if (pathname === '/') {
      setShowTooltip(true);
      const timer = setTimeout(() => {
        setShowTooltip(false);
      }, 4000); // 4 seconds
      return () => clearTimeout(timer);
    } else {
      setShowTooltip(false);
    }
  }, [pathname]);

  // Focus input (desktop only to prevent mobile virtual keyboard from auto-opening)
  useEffect(() => {
    if (isOpen && inputRef.current) {
      const isMobile = window.matchMedia('(max-width: 768px)').matches;
      if (!isMobile) {
        setTimeout(() => inputRef.current?.focus(), 150);
      }
    }
  }, [isOpen]);

  const handleSendMessage = async (textToSend: string) => {
    if (!textToSend.trim() || isLoading) return;

    const userMessage: Message = {
      id: `msg-${Date.now()}-user`,
      role: 'user',
      content: textToSend.trim()
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);
    setStreamContent('');

    const chatHistory = [...messages, userMessage].map((m) => ({
      role: m.role,
      content: m.content
    }));

    // Reset typewriter state
    latestStreamRef.current = '';
    typewriterLengthRef.current = 0;

    try {
      const response = await fetch('https://cdrf.vercel.app/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: chatHistory,
          pathname: pathname || '/'
        })
      });

      if (!response.ok) {
        throw new Error('Failed to reach local assistant model');
      }

      const reader = response.body?.getReader();
      if (!reader) throw new Error('Readable stream not supported');

      const decoder = new TextDecoder();
      let buffer = '';
      let accumulatedContent = '';

      const readChunk = async (): Promise<void> => {
        const { done, value } = await reader.read();
        if (done) return;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (line.trim().startsWith('data: ')) {
            try {
              const data = JSON.parse(line.trim().substring(6));
              if (data.type === 'content') {
                accumulatedContent += data.content;
                latestStreamRef.current = accumulatedContent;
                setStreamContent(accumulatedContent);
              } else if (data.type === 'error') {
                throw new Error(data.content);
              }
            } catch (err) {
              // Ignore incomplete chunks
            }
          }
        }
        return readChunk();
      };
      await readChunk();

      // Wait for typewriter to fully catch up to the accumulated text
      const waitForTypewriter = async (): Promise<void> => {
        if (typewriterLengthRef.current < accumulatedContent.length) {
          await new Promise<void>((resolve) => {
            setTimeout(resolve, 30);
          });
          return waitForTypewriter();
        }
      };
      await waitForTypewriter();

      const assistantMessage: Message = {
        id: `msg-${Date.now()}-assistant`,
        role: 'assistant',
        content: accumulatedContent
      };
      setMessages((prev) => [...prev, assistantMessage]);

    } catch (err: any) {
      console.error('Chat error:', err);
      const errorMessage: Message = {
        id: `msg-${Date.now()}-error`,
        role: 'assistant',
        content: "⚠️ Sorry, we're having trouble connecting to the Assistant right now. Please try again in a few moments."
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
      setStreamContent('');
    }
  };

  const renderMessageText = (content: string) => {
    const lines = content.split('\n');
    return lines.map((line, idx) => {
      const trimmed = line.trim();
      const isListItem = trimmed.startsWith('-') || trimmed.startsWith('*');
      const textToParse = isListItem ? trimmed.replace(/^[-*]\s+/, '') : line;

      const boldRegex = /\*\*(.*?)\*\*/g;
      const linkRegex = /\[([^\]]+)\]\(([^)]+)\)/g;

      const parseLinks = (txt: string, lineKey: string): React.ReactNode => {
        const segments: React.ReactNode[] = [];
        let lastIdx = 0;
        let match;
        linkRegex.lastIndex = 0;

        while ((match = linkRegex.exec(txt)) !== null) {
          if (match.index > lastIdx) {
            segments.push(
              <span key={`${lineKey}-txt-${lastIdx}`}>
                {txt.substring(lastIdx, match.index)}
              </span>
            );
          }
          const [, label, url] = match;
          const isInternal = url.startsWith('/') || url.startsWith('#');

          segments.push(
            isInternal || url === '#' ? (
              <a
                key={`${lineKey}-link-${match.index}`}
                href={url}
                onClick={(e) => {
                  if (url === '#') {
                    e.preventDefault();
                    setIsOpen(false);
                    const subBtn = document.querySelector('button[class*="subscribeBtn"]') as HTMLButtonElement;
                    if (subBtn) subBtn.click();
                  } else if (url.includes('#')) {
                    const [path, hash] = url.split('#');
                    if (window.location.pathname === path || (!path && hash)) {
                      e.preventDefault();
                      setIsOpen(false);
                      document.getElementById(hash)?.scrollIntoView({ behavior: 'smooth' });
                    }
                  }
                }}
              >
                {label}
              </a>
            ) : (
              <a key={`${lineKey}-link-ext-${match.index}`} href={url} target="_blank" rel="noopener noreferrer">
                {label}
              </a>
            )
          );
          lastIdx = linkRegex.lastIndex;
        }

        if (lastIdx < txt.length) {
          segments.push(
            <span key={`${lineKey}-txt-end-${lastIdx}`}>
              {txt.substring(lastIdx)}
            </span>
          );
        }
        return segments.length > 0 ? <React.Fragment key={`${lineKey}-fr`}>{segments}</React.Fragment> : txt;
      };

      const parseBoldAndLinks = (txt: string, lineKey: string): React.ReactNode => {
        const segments: React.ReactNode[] = [];
        let lastIdx = 0;
        let match;
        boldRegex.lastIndex = 0;

        while ((match = boldRegex.exec(txt)) !== null) {
          if (match.index > lastIdx) {
            segments.push(
              <React.Fragment key={`${lineKey}-bold-pre-${lastIdx}`}>
                {parseLinks(txt.substring(lastIdx, match.index), `${lineKey}-pre-${lastIdx}`)}
              </React.Fragment>
            );
          }
          segments.push(
            <strong key={`${lineKey}-bold-${match.index}`}>
              {parseLinks(match[1], `${lineKey}-bold-inner-${match.index}`)}
            </strong>
          );
          lastIdx = boldRegex.lastIndex;
        }

        if (lastIdx < txt.length) {
          segments.push(
            <React.Fragment key={`${lineKey}-bold-post-${lastIdx}`}>
              {parseLinks(txt.substring(lastIdx), `${lineKey}-post-${lastIdx}`)}
            </React.Fragment>
          );
        }
        return segments.length > 0 ? <React.Fragment key={`${lineKey}-root`}>{segments}</React.Fragment> : parseLinks(txt, `${lineKey}-direct`);
      };

      const element = parseBoldAndLinks(textToParse, `line-${idx}`);

      if (isListItem) {
        return (
          <li key={idx} style={{ marginLeft: '12px', marginBottom: '2px', listStyleType: 'disc' }}>
            {element}
          </li>
        );
      }

      return (
        <p key={idx} style={{ marginBottom: '6px', minHeight: '1em' }}>
          {element}
        </p>
      );
    });
  };

  const getPageTitle = (path: string) => {
    if (path === '/') return 'Home Dashboard';
    if (path.startsWith('/admin')) return 'Admin Center';
    if (path.startsWith('/news')) return 'Emergency News';
    if (path.startsWith('/reports')) return 'Publications Library';
    if (path.startsWith('/membership')) return 'Membership Desk';
    if (path.startsWith('/about/governing-council')) return 'Governing Council';
    if (path.startsWith('/about/advisory-council')) return 'Advisory Council';
    if (path.startsWith('/about/working-group')) return 'Working Group';
    if (path.startsWith('/about/charter-10-point-agenda')) return 'Charter 10-Point Agenda';
    if (path.startsWith('/about/mission-vision')) return 'Mission & Vision';
    if (path.startsWith('/about')) return 'About DCRF';
    if (path.startsWith('/event/monthly-webinars')) return 'Monthly Webinars';
    if (path.startsWith('/event/dcrc-26')) return 'DCRC Conclave 2026';
    if (path.startsWith('/event')) return 'Events';
    if (path.startsWith('/insights/map')) return 'Hazard Map';
    if (path.startsWith('/insights/event-videos')) return 'Event Videos';
    if (path.startsWith('/podcasts')) return 'Podcasts';
    if (path.startsWith('/gallery')) return 'Gallery';
    if (path.startsWith('/contact')) return 'Contact Us';
    return path;
  };
  const getSuggestions = () => {
    if (pathname?.startsWith('/admin')) {
      return [
        { label: 'Admin Metrics', query: 'Show platform global metrics overview' },
        { label: 'Form Queries', query: 'Show recent contact forms and user queries' },
        { label: 'Memberships', query: 'Show recent membership applications' },
        { label: 'Draft News', query: 'Draft a breaking news story about Assam monsoon flood updates' }
      ];
    }
    return SUGGESTIONS;
  };

  return (
    <div className={styles.chatWidget}>
      {/* Expanded Chat Window */}
      {isOpen && (
        <div className={styles.chatWindow}>
          {/* Header */}
          <div className={styles.header}>
            <div className={styles.title}>DCRF Assistant</div>
            <button className={styles.closeButton} onClick={() => setIsOpen(false)} aria-label="Close Chat">
              <X size={16} />
            </button>
          </div>

          {/* Messages Area */}
          <div className={styles.messageArea}>
            {messages.map((msg) => {
              const { cleanContent, draftData } = msg.role === 'assistant'
                ? parseAssistantDrafts(msg.content)
                : { cleanContent: msg.content, draftData: null };

              return (
                <React.Fragment key={msg.id}>
                  <div
                    className={`${styles.messageRow} ${
                      msg.role === 'user' ? styles.messageRowUser : styles.messageRowAssistant
                    }`}
                  >
                    <div
                      className={`${styles.bubble} ${
                        msg.role === 'user' ? styles.bubbleUser : styles.bubbleAssistant
                      }`}
                    >
                      {renderMessageText(cleanContent)}
                    </div>
                  </div>

                  {draftData && (
                    <div style={{ width: '100%', display: 'flex', justifyContent: 'flex-start', marginBottom: '8px' }}>
                      <DraftCard type={draftData.type} initialData={draftData.data} />
                    </div>
                  )}

                  {/* Render suggested actions directly below the welcome bubble inside the chat */}
                  {msg.id === 'welcome' && (
                    <div className={styles.inlineSuggestions}>
                      {getSuggestions().map((s) => (
                        <button
                          key={s.label}
                          className={styles.inlineSuggestionBtn}
                          onClick={() => handleSendMessage(s.query)}
                        >
                          {s.label}
                        </button>
                      ))}
                    </div>
                  )}
                </React.Fragment>
              );
            })}

            {/* Streaming Message */}
            {isLoading && typewriterText && (() => {
              const { cleanContent } = parseAssistantDrafts(typewriterText);
              return (
                <div className={`${styles.messageRow} ${styles.messageRowAssistant}`}>
                  <div className={`${styles.bubble} ${styles.bubbleAssistant}`}>
                    {renderMessageText(cleanContent)}
                  </div>
                </div>
              );
            })()}

            {/* Loading Indicator */}
            {isLoading && !typewriterText && (
              <div className={`${styles.messageRow} ${styles.messageRowAssistant}`}>
                <div className={`${styles.bubble} ${styles.bubbleAssistant}`}>
                  <div className={styles.typingIndicator}>
                    <span className={styles.typingDot} />
                    <span className={styles.typingDot} />
                    <span className={styles.typingDot} />
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Form */}
          <form
            className={styles.inputForm}
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage(input);
            }}
          >
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask a question..."
              className={styles.inputField}
              disabled={isLoading}
            />
            <button
              type="submit"
              className={styles.sendButton}
              disabled={isLoading || !input.trim()}
              aria-label="Send"
            >
              <Send size={14} />
            </button>
          </form>
        </div>
      )}

      {/* Floating Greeting Tooltip */}
      {!isOpen && showTooltip && (
        <div className={styles.greetingTooltip} onClick={() => setIsOpen(true)}>
          <div className={styles.tooltipContent}>
            <div className={styles.aiIconWrapper}>
              <Sparkles size={11} className={styles.aiIcon} />
            </div>
            <span className={styles.tooltipText}>Need help? Ask about memberships or conclave passes!</span>
          </div>
          <button
            className={styles.tooltipClose}
            onClick={(e) => {
              e.stopPropagation();
              setShowTooltip(false);
            }}
            aria-label="Dismiss tooltip"
          >
            <X size={11} />
          </button>
          <div className={styles.tooltipArrow} />
        </div>
      )}

      {/* Floating Action Button (FAB) */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`${styles.floatingButton} ${isOpen ? styles.floatingButtonActive : ''}`}
        aria-label="Help Assistant Chat"
      >
        {isOpen ? (
          <X size={22} />
        ) : (
          <div className={styles.sonarEmitter}>
            <div className={styles.sonarPulse} />
            <MessageSquare size={22} style={{ position: 'relative', zIndex: 2 }} />
          </div>
        )}
      </button>
    </div>
  );
}
