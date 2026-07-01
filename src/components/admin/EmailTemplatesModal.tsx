'use client';

import React, { useState, useEffect } from 'react';
import { FileText, Save, X, Eye, Edit2, Loader2, Info } from 'lucide-react';

interface EmailTemplatesModalProps {
  isOpen: boolean;
  onClose: () => void;
  toast: {
    success: (title: string, message: string) => void;
    warning: (title: string, message: string) => void;
    error: (title: string, message: string) => void;
  };
}

export default function EmailTemplatesModal({
  isOpen,
  onClose,
  toast
}: EmailTemplatesModalProps) {
  const [templates, setTemplates] = useState<any[]>([]);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>('');
  
  // Fields for editing
  const [name, setName] = useState('');
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [isPreviewMode, setIsPreviewMode] = useState(false);

  const fetchTemplates = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/email-templates');
      if (res.ok) {
        const data = await res.json();
        if (data.success && Array.isArray(data.templates)) {
          setTemplates(data.templates);
          if (data.templates.length > 0) {
            // Pre-select first template
            const first = data.templates[0];
            setSelectedTemplateId(String(first.id));
            setName(first.name || '');
            setSubject(first.subject || '');
            setBody(first.body || '');
          }
        }
      }
    } catch (err) {
      console.error('Failed to load email templates:', err);
      toast.error('Load Error', 'Failed to fetch templates from the server.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchTemplates();
      setIsPreviewMode(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  const handleTemplateChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const id = e.target.value;
    setSelectedTemplateId(id);
    const template = templates.find(t => String(t.id) === id);
    if (template) {
      setName(template.name || '');
      setSubject(template.subject || '');
      setBody(template.body || '');
    }
  };

  const handleSave = async () => {
    if (!selectedTemplateId) return;
    if (!subject.trim() || !body.trim() || !name.trim()) {
      toast.warning('Validation Error', 'Template Name, Subject, and HTML Body are required.');
      return;
    }

    setSaving(true);
    try {
      const res = await fetch('/api/admin/email-templates', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: selectedTemplateId,
          name,
          subject,
          body
        })
      });

      if (res.ok) {
        toast.success('Template Saved', 'The email template configuration was successfully updated.');
        // Refresh local cache
        const updatedTemplates = templates.map(t => 
          String(t.id) === selectedTemplateId 
            ? { ...t, name, subject, body } 
            : t
        );
        setTemplates(updatedTemplates);
      } else {
        const data = await res.json();
        throw new Error(data.error || 'Failed to update template.');
      }
    } catch (err: any) {
      toast.error('Save Error', err.message || 'Network error saving template.');
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div style={modalStyles.backdrop}>
      <div style={modalStyles.container}>
        {/* Header */}
        <div style={modalStyles.header}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <FileText size={22} style={{ color: 'var(--wine-red-primary)' }} />
            <h2 style={modalStyles.title}>Manage Email Templates</h2>
          </div>
          <button onClick={onClose} style={modalStyles.closeBtn} aria-label="Close modal">
            <X size={18} />
          </button>
        </div>

        {/* Content split into template list & editor */}
        <div style={modalStyles.body}>
          {loading ? (
            <div style={modalStyles.loaderBlock}>
              <Loader2 size={32} className="spin" />
              <span>Fetching email templates...</span>
            </div>
          ) : (
            <>
              {/* Left Selector & Help panel */}
              <div style={modalStyles.leftPanel}>
                <h3 style={modalStyles.panelTitle}>Email Templates</h3>
                <select
                  value={selectedTemplateId}
                  onChange={handleTemplateChange}
                  style={modalStyles.select}
                >
                  {templates.map(t => (
                    <option key={t.id} value={t.id}>{t.name}</option>
                  ))}
                </select>

                <div style={modalStyles.helpCard}>
                  <div style={{ display: 'flex', gap: '6px', color: 'var(--wine-red-primary)', marginBottom: '8px' }}>
                    <Info size={16} />
                    <span style={{ fontSize: '12px', fontWeight: 700 }}>Dynamic Placeholders</span>
                  </div>
                  <p style={{ margin: '0 0 6px', fontSize: '11px', lineHeight: '1.4', color: '#64748b' }}>
                    You can use curly brace variables in templates. The system substitutes them dynamically on dispatch:
                  </p>
                  <ul style={{ margin: 0, paddingLeft: '16px', fontSize: '11px', color: '#475569', lineHeight: '1.5' }}>
                    <li><code>{"{{name}}"}</code> - Full Name</li>
                    <li><code>{"{{email}}"}</code> - Email address</li>
                    <li><code>{"{{tier}}"}</code> - Membership tier</li>
                    <li><code>{"{{organization}}"}</code> - Institution</li>
                  </ul>
                </div>
              </div>

              {/* Right Editor panel */}
              <div style={modalStyles.rightPanel}>
                <div style={{ display: 'flex', gap: '12px', width: '100%' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', flex: 1 }}>
                    <label style={modalStyles.label}>Template Label Name</label>
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      style={modalStyles.input}
                      disabled={isPreviewMode}
                    />
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', flex: 2 }}>
                    <label style={modalStyles.label}>Default Subject Line</label>
                    <input
                      type="text"
                      value={subject}
                      onChange={(e) => setSubject(e.target.value)}
                      style={modalStyles.input}
                      disabled={isPreviewMode}
                    />
                  </div>
                </div>

                {/* HTML Body Editor & Preview */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', flex: 1, minHeight: '300px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                    <label style={modalStyles.label}>HTML Email Body</label>
                    <button
                      type="button"
                      onClick={() => setIsPreviewMode(!isPreviewMode)}
                      style={modalStyles.toggleModeBtn}
                    >
                      {isPreviewMode ? <Edit2 size={12} /> : <Eye size={12} />}
                      <span>{isPreviewMode ? 'Edit Code' : 'Branded Preview'}</span>
                    </button>
                  </div>

                  {isPreviewMode ? (
                    <div style={modalStyles.previewContainer}>
                      <iframe
                        title="HTML Template Preview"
                        srcDoc={body || '<p style="color:#64748b;padding:20px;text-align:center;">No template content.</p>'}
                        style={modalStyles.previewIframe}
                      />
                    </div>
                  ) : (
                    <textarea
                      value={body}
                      onChange={(e) => setBody(e.target.value)}
                      style={modalStyles.textarea}
                    />
                  )}
                </div>
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div style={modalStyles.footer}>
          <button onClick={onClose} style={modalStyles.cancelBtn}>Close</button>
          {selectedTemplateId && !loading && (
            <button onClick={handleSave} disabled={saving} style={modalStyles.sendBtn}>
              {saving ? <Loader2 size={14} className="spin" /> : <Save size={14} />}
              <span>Save Template Changes</span>
            </button>
          )}
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
    maxWidth: '980px',
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
    justifyContent: 'center'
  },
  loaderBlock: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '12px',
    color: '#64748b',
    fontSize: '14px'
  },
  body: {
    flex: 1,
    display: 'flex',
    overflow: 'hidden',
    boxSizing: 'border-box'
  },
  leftPanel: {
    width: '280px',
    borderRight: '1px solid rgba(0, 0, 0, 0.08)',
    padding: '20px',
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
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
    fontSize: '12px',
    fontWeight: 700,
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
    color: '#475569',
    margin: 0
  },
  select: {
    padding: '10px 12px',
    borderRadius: '8px',
    border: '1px solid rgba(0,0,0,0.12)',
    fontSize: '13px',
    outline: 'none',
    backgroundColor: '#ffffff',
    cursor: 'pointer',
    width: '100%'
  },
  helpCard: {
    border: '1px solid rgba(0,0,0,0.06)',
    borderRadius: '8px',
    padding: '12px',
    backgroundColor: '#ffffff',
    boxShadow: '0 1px 3px rgba(0,0,0,0.02)'
  },
  label: {
    fontSize: '12px',
    fontWeight: 700,
    color: '#334155'
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
