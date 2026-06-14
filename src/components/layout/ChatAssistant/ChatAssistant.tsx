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

export default function ChatAssistant() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [streamContent, setStreamContent] = useState('');
  const [showTooltip, setShowTooltip] = useState(true);
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

  // Focus input
  useEffect(() => {
    if (isOpen && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 150);
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
      const response = await fetch('/api/chat', {
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
    if (path.startsWith('/news')) return 'Emergency News';
    if (path.startsWith('/reports')) return 'Publications Library';
    if (path.startsWith('/membership')) return 'Membership Desk';
    if (path.startsWith('/council')) return 'Governing Council';
    if (path.startsWith('/event')) return 'DCRC Conclave 2026';
    if (path.startsWith('/about')) return 'About DCRF';
    if (path.startsWith('/admin')) return 'Admin Center';
    return path;
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
            {messages.map((msg) => (
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
                    {renderMessageText(msg.content)}
                  </div>
                </div>

                {/* Render suggested actions directly below the welcome bubble inside the chat */}
                {msg.id === 'welcome' && (
                  <div className={styles.inlineSuggestions}>
                    {SUGGESTIONS.map((s) => (
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
            ))}

            {/* Streaming Message */}
            {isLoading && typewriterText && (
              <div className={`${styles.messageRow} ${styles.messageRowAssistant}`}>
                <div className={`${styles.bubble} ${styles.bubbleAssistant}`}>
                  {renderMessageText(typewriterText)}
                </div>
              </div>
            )}

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
