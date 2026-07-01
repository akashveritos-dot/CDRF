'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { Mail, Search, X, Loader2, Send, Eye, FileText, CheckCircle2, AlertCircle } from 'lucide-react';

interface Recipient {
  name: string;
  email: string;
}

interface EmailSenderModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialSelectedEmails: string[];
  allRecipients: Recipient[];
  toast: {
    success: (title: string, message: string) => void;
    warning: (title: string, message: string) => void;
    error: (title: string, message: string) => void;
  };
}

export default function EmailSenderModal({
  isOpen,
  onClose,
  initialSelectedEmails,
  allRecipients,
  toast
}: EmailSenderModalProps) {
  const [selectedEmails, setSelectedEmails] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [templates, setTemplates] = useState<any[]>([]);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>('');
  
  // Form fields
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  
  const [loadingTemplates, setLoadingTemplates] = useState(false);
  const [isPreviewMode, setIsPreviewMode] = useState(false);
  const [sending, setSending] = useState(false);

  // Sync initial emails on open
  useEffect(() => {
    if (isOpen) {
      setSelectedEmails([...initialSelectedEmails]);
      setSearchQuery('');
      setSelectedTemplateId('');
      setSubject('');
      setBody('');
      setIsPreviewMode(false);
      
      // Fetch dynamic templates
      setLoadingTemplates(true);
      fetch('/api/admin/email-templates')
        .then(res => res.json())
        .then(data => {
          if (data.success && Array.isArray(data.templates)) {
            setTemplates(data.templates);
          }
        })
        .catch(err => console.error('Failed to load templates:', err))
        .finally(() => setLoadingTemplates(false));
    }
  }, [isOpen, initialSelectedEmails]);

  // Filter recipients based on search
  const filteredRecipients = useMemo(() => {
    if (!searchQuery.trim()) return [];
    const queryLower = searchQuery.toLowerCase().trim();
    return allRecipients.filter(r => 
      (r.name && r.name.toLowerCase().includes(queryLower)) ||
      (r.email && r.email.toLowerCase().includes(queryLower))
    );
  }, [searchQuery, allRecipients]);

  const handleAddEmail = (email: string) => {
    if (!selectedEmails.includes(email)) {
      setSelectedEmails([...selectedEmails, email]);
    }
    setSearchQuery('');
  };

  const handleRemoveEmail = (email: string) => {
    setSelectedEmails(selectedEmails.filter(e => e !== email));
  };

  const handleSelectAllFiltered = () => {
    const emailsToAdd = allRecipients.map(r => r.email).filter(Boolean);
    const unique = Array.from(new Set([...selectedEmails, ...emailsToAdd]));
    setSelectedEmails(unique);
  };

  const handleTemplateChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const id = e.target.value;
    setSelectedTemplateId(id);
    if (!id) {
      setSubject('');
      setBody('');
      return;
    }
    const template = templates.find(t => String(t.id) === id);
    if (template) {
      setSubject(template.subject || '');
      setBody(template.body || '');
    }
  };

  const handleSend = async () => {
    if (selectedEmails.length === 0) {
      toast.warning('Validation Error', 'Please select or add at least one recipient.');
      return;
    }
    if (!subject.trim() || !body.trim()) {
      toast.warning('Validation Error', 'Email Subject and Message Body are required.');
      return;
    }

    setSending(true);

    try {
      // Fire-and-forget: Close modal instantly and send request in background
      fetch('/api/admin/send-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: selectedEmails,
          subject,
          body
        })
      });

      toast.success(
        'Dispatch Initiated',
        `Sending email to ${selectedEmails.length} recipient(s) in the background. You can continue working.`
      );
      onClose();
    } catch (err: any) {
      toast.error('Dispatch Failed', err.message || 'Failed to dispatch email.');
    } finally {
      setSending(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div style={modalStyles.backdrop}>
      <div style={modalStyles.container}>
        {/* Header */}
        <div style={modalStyles.header}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Mail size={22} style={{ color: 'var(--wine-red-primary)' }} />
            <h2 style={modalStyles.title}>Email Broadcast Dispatcher</h2>
          </div>
          <button onClick={onClose} style={modalStyles.closeBtn} aria-label="Close modal">
            <X size={18} />
          </button>
        </div>

        {/* Content splits into recipients list & composition form */}
        <div style={modalStyles.body}>
          {/* Left panel: Recipient Management */}
          <div style={modalStyles.leftPanel}>
            <h3 style={modalStyles.panelTitle}>Target Recipients ({selectedEmails.length})</h3>
            
            {/* Search and add users */}
            <div style={modalStyles.searchBox}>
              <Search size={14} style={modalStyles.searchIcon} />
              <input
                type="text"
                placeholder="Search users to add..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={modalStyles.searchInput}
              />
            </div>

            {/* Dropdown list of filtered search results */}
            {searchQuery.trim() && (
              <div style={modalStyles.searchResults}>
                {filteredRecipients.length > 0 ? (
                  filteredRecipients.map(r => (
                    <button
                      key={r.email}
                      onClick={() => handleAddEmail(r.email)}
                      style={modalStyles.searchResultRow}
                    >
                      <div style={{ fontWeight: 600, fontSize: '12px' }}>{r.name || 'No Name'}</div>
                      <div style={{ color: '#64748b', fontSize: '11px' }}>{r.email}</div>
                    </button>
                  ))
                ) : (
                  <div style={modalStyles.searchEmpty}>
                    <p style={{ margin: 0, fontSize: '11px' }}>No match. Click below to add manual email:</p>
                    {searchQuery.includes('@') && searchQuery.includes('.') && (
                      <button
                        onClick={() => handleAddEmail(searchQuery.trim())}
                        style={modalStyles.addManualBtn}
                      >
                        Add "{searchQuery.trim()}"
                      </button>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* List of selected emails */}
            <div style={modalStyles.selectedList}>
              {selectedEmails.length > 0 ? (
                selectedEmails.map(email => {
                  const recipient = allRecipients.find(r => r.email === email);
                  return (
                    <div key={email} style={modalStyles.chip}>
                      <div style={modalStyles.chipText}>
                        <div style={{ fontWeight: 600, fontSize: '12px', color: 'var(--text-default)' }}>
                          {recipient?.name || 'Manual Input'}
                        </div>
                        <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{email}</div>
                      </div>
                      <button onClick={() => handleRemoveEmail(email)} style={modalStyles.chipRemove}>
                        <X size={12} />
                      </button>
                    </div>
                  );
                })
              ) : (
                <div style={modalStyles.emptyState}>
                  <AlertCircle size={28} style={{ color: '#64748b', marginBottom: '8px' }} />
                  <span style={{ fontSize: '12px', color: '#64748b' }}>No recipients selected.</span>
                </div>
              )}
            </div>

            {selectedEmails.length === 0 && allRecipients.length > 0 && (
              <button onClick={handleSelectAllFiltered} style={modalStyles.selectAllBtn}>
                Add All Section Users ({allRecipients.length})
              </button>
            )}
          </div>

          {/* Right panel: Composition & Templates */}
          <div style={modalStyles.rightPanel}>
            <div style={modalStyles.templatesRow}>
              <label style={modalStyles.label}>Select Ready-made Template</label>
              <select
                value={selectedTemplateId}
                onChange={handleTemplateChange}
                disabled={loadingTemplates}
                style={modalStyles.select}
              >
                <option value="">-- Start from Scratch (Custom) --</option>
                {templates.map(t => (
                  <option key={t.id} value={t.id}>{t.name}</option>
                ))}
              </select>
            </div>

            {/* Form Fields */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', flex: 1 }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <label style={modalStyles.label}>Email Subject</label>
                <input
                  type="text"
                  placeholder="Enter email subject line..."
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  style={modalStyles.input}
                  disabled={isPreviewMode}
                />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', flex: 1, minHeight: '200px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                  <label style={modalStyles.label}>HTML Message Body</label>
                  <button
                    type="button"
                    onClick={() => setIsPreviewMode(!isPreviewMode)}
                    style={modalStyles.toggleModeBtn}
                  >
                    {isPreviewMode ? <FileText size={12} /> : <Eye size={12} />}
                    <span>{isPreviewMode ? 'Edit Content' : 'Branded Preview'}</span>
                  </button>
                </div>

                {isPreviewMode ? (
                  <div style={modalStyles.previewContainer}>
                    <iframe
                      title="Email Render Preview"
                      srcDoc={body || '<p style="color:#64748b;padding:20px;text-align:center;">No body content to preview.</p>'}
                      style={modalStyles.previewIframe}
                    />
                  </div>
                ) : (
                  <textarea
                    placeholder="Write your email content in HTML or plain text here..."
                    value={body}
                    onChange={(e) => setBody(e.target.value)}
                    style={modalStyles.textarea}
                  />
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div style={modalStyles.footer}>
          <p style={modalStyles.disclaimer}>
            Emails are processed in the background and will use your existing SMTP credentials.
          </p>
          <div style={{ display: 'flex', gap: '10px' }}>
            <button onClick={onClose} style={modalStyles.cancelBtn}>Cancel</button>
            <button onClick={handleSend} disabled={sending} style={modalStyles.sendBtn}>
              {sending ? <Loader2 size={14} className="spin" /> : <Send size={14} />}
              <span>Send Broadcast</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

const modalStyles: Record<string, React.CSSProperties> = {
  backdrop: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(15, 23, 42, 0.6)',
    backdropFilter: 'blur(4px)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 9999,
    padding: '20px',
    boxSizing: 'border-box'
  },
  container: {
    width: '100%',
    maxWidth: '960px',
    height: '90vh',
    maxHeight: '750px',
    backgroundColor: '#ffffff',
    borderRadius: '16px',
    boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden'
  },
  header: {
    padding: '16px 24px',
    borderBottom: '1px solid rgba(0, 0, 0, 0.08)',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#fafafa'
  },
  title: {
    fontSize: '16px',
    fontWeight: 700,
    color: '#0f172a',
    margin: 0
  },
  closeBtn: {
    background: 'none',
    border: 'none',
    color: '#64748b',
    cursor: 'pointer',
    padding: '4px',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'background 0.2s'
  },
  body: {
    flex: 1,
    display: 'flex',
    overflow: 'hidden',
    boxSizing: 'border-box'
  },
  leftPanel: {
    width: '320px',
    borderRight: '1px solid rgba(0, 0, 0, 0.08)',
    padding: '20px',
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
    backgroundColor: '#f8fafc',
    overflowY: 'auto'
  },
  rightPanel: {
    flex: 1,
    padding: '20px',
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
    overflowY: 'auto'
  },
  panelTitle: {
    fontSize: '13px',
    fontWeight: 700,
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
    color: '#475569',
    margin: 0
  },
  searchBox: {
    position: 'relative',
    display: 'flex',
    alignItems: 'center'
  },
  searchIcon: {
    position: 'absolute',
    left: '12px',
    color: '#64748b'
  },
  searchInput: {
    width: '100%',
    padding: '8px 12px 8px 32px',
    borderRadius: '8px',
    border: '1px solid rgba(0,0,0,0.12)',
    fontSize: '12px',
    outline: 'none',
    backgroundColor: '#ffffff'
  },
  searchResults: {
    maxHeight: '150px',
    overflowY: 'auto',
    border: '1px solid rgba(0,0,0,0.08)',
    borderRadius: '8px',
    backgroundColor: '#ffffff',
    boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)'
  },
  searchResultRow: {
    width: '100%',
    padding: '8px 12px',
    border: 'none',
    background: 'none',
    textAlign: 'left',
    cursor: 'pointer',
    borderBottom: '1px solid rgba(0,0,0,0.04)',
    display: 'flex',
    flexDirection: 'column',
    transition: 'background 0.2s'
  },
  searchEmpty: {
    padding: '10px',
    textAlign: 'center',
    color: '#64748b'
  },
  addManualBtn: {
    marginTop: '6px',
    backgroundColor: 'var(--wine-red-primary)',
    color: '#ffffff',
    border: 'none',
    borderRadius: '4px',
    padding: '4px 10px',
    fontSize: '10px',
    fontWeight: 600,
    cursor: 'pointer'
  },
  selectedList: {
    flex: 1,
    border: '1px solid rgba(0,0,0,0.08)',
    borderRadius: '8px',
    backgroundColor: '#ffffff',
    overflowY: 'auto',
    display: 'flex',
    flexDirection: 'column',
    padding: '6px'
  },
  emptyState: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '20px'
  },
  chip: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '6px 10px',
    borderBottom: '1px solid rgba(0,0,0,0.04)',
    backgroundColor: '#f8fafc',
    borderRadius: '6px',
    marginBottom: '4px'
  },
  chipText: {
    display: 'flex',
    flexDirection: 'column',
    textAlign: 'left'
  },
  chipRemove: {
    background: 'none',
    border: 'none',
    color: '#94a3b8',
    cursor: 'pointer',
    padding: '2px',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  },
  selectAllBtn: {
    width: '100%',
    padding: '8px',
    backgroundColor: '#ffffff',
    border: '1px dashed rgba(0,0,0,0.18)',
    borderRadius: '8px',
    fontSize: '12px',
    fontWeight: 600,
    color: 'var(--text-default)',
    cursor: 'pointer',
    textAlign: 'center',
    transition: 'background 0.2s'
  },
  templatesRow: {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px'
  },
  label: {
    fontSize: '12px',
    fontWeight: 700,
    color: '#334155'
  },
  select: {
    padding: '8px 12px',
    borderRadius: '8px',
    border: '1px solid rgba(0,0,0,0.12)',
    fontSize: '13px',
    outline: 'none',
    backgroundColor: '#ffffff',
    cursor: 'pointer'
  },
  input: {
    padding: '10px 14px',
    borderRadius: '8px',
    border: '1px solid rgba(0,0,0,0.12)',
    fontSize: '13px',
    outline: 'none'
  },
  toggleModeBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    background: 'none',
    border: 'none',
    color: 'var(--wine-red-primary)',
    fontWeight: 600,
    fontSize: '11px',
    cursor: 'pointer'
  },
  textarea: {
    flex: 1,
    padding: '14px',
    borderRadius: '8px',
    border: '1px solid rgba(0,0,0,0.12)',
    fontSize: '13px',
    fontFamily: 'monospace',
    outline: 'none',
    resize: 'none',
    backgroundColor: '#f8fafc'
  },
  previewContainer: {
    flex: 1,
    border: '1px solid rgba(0,0,0,0.12)',
    borderRadius: '8px',
    backgroundColor: '#f8fafc',
    overflow: 'hidden'
  },
  previewIframe: {
    width: '100%',
    height: '100%',
    border: 'none',
    backgroundColor: '#0a0f1d'
  },
  footer: {
    padding: '16px 24px',
    borderTop: '1px solid rgba(0, 0, 0, 0.08)',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#fafafa'
  },
  disclaimer: {
    fontSize: '11px',
    color: '#64748b',
    margin: 0,
    maxWidth: '50%'
  },
  cancelBtn: {
    padding: '8px 16px',
    backgroundColor: '#ffffff',
    border: '1px solid rgba(0,0,0,0.12)',
    borderRadius: '8px',
    fontSize: '13px',
    fontWeight: 600,
    color: '#475569',
    cursor: 'pointer'
  },
  sendBtn: {
    padding: '8px 18px',
    backgroundColor: 'var(--wine-red-primary)',
    color: '#ffffff',
    border: 'none',
    borderRadius: '8px',
    fontSize: '13px',
    fontWeight: 600,
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    boxShadow: '0 2px 4px rgba(185, 28, 28, 0.15)'
  }
};
