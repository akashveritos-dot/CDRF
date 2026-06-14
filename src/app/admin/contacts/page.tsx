'use client';

import React, { useState, useEffect } from 'react';
import { Loader2, Trash2, MailOpen, AlertTriangle } from 'lucide-react';
import styles from './page.module.css';

interface ContactMessage {
  id: number;
  name: string;
  email: string;
  subject?: string;
  message: string;
  createdAt: string;
}

export default function AdminContactsViewer() {
  const [messages, setMessages] = useState<ContactMessage[]>([]);
  const [selectedMessage, setSelectedMessage] = useState<ContactMessage | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const loadMessages = async (selectId?: number) => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/admin/contacts');
      if (res.ok) {
        const data = await res.json();
        setMessages(data);
        if (data.length > 0) {
          const toSelect = selectId
            ? data.find((m: ContactMessage) => m.id === selectId)
            : data[0];
          setSelectedMessage(toSelect || data[0]);
        } else {
          setSelectedMessage(null);
        }
      }
    } catch (err) {
      console.error('Failed to load contact messages:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadMessages();
  }, []);

  const handleDelete = async (id: number, e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent row selection triggers
    if (!confirm('Are you sure you want to delete this message?')) {
      return;
    }

    try {
      const res = await fetch(`/api/admin/contacts?id=${id}`, {
        method: 'DELETE'
      });

      if (res.ok) {
        // If we deleted the currently selected message, load and select the next one
        const nextIdx = messages.findIndex(m => m.id === id) + 1;
        const nextMessage = messages[nextIdx] || messages[nextIdx - 2];
        loadMessages(nextMessage?.id);
      } else {
        const data = await res.json();
        alert(data.error || 'Failed to delete message.');
      }
    } catch (err) {
      console.error('Failed to delete message:', err);
      alert('An error occurred during deletion.');
    }
  };

  if (isLoading && messages.length === 0) {
    return (
      <div className={styles.loadingWrapper}>
        <Loader2 size={36} className={styles.spinner} />
        <span>Loading Submissions Log...</span>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.title}>Contact Queries Log</h1>
        <p className={styles.subtitle}>Review simple query submissions and support requests filed by website visitors.</p>
      </div>

      {messages.length === 0 ? (
        <div className={styles.emptyState}>
          <MailOpen size={48} style={{ margin: '0 auto 16px', opacity: 0.5 }} />
          <h3 style={{ fontSize: '18px', fontWeight: 700 }}>No Messages Found</h3>
          <p style={{ color: 'var(--text-muted)', marginTop: '6px' }}>
            Submitted query form submissions will show up here.
          </p>
        </div>
      ) : (
        <div className={styles.workspace}>
          {/* Left Column: Messages Table */}
          <div className={styles.tablePanel}>
            <h3 className={styles.sectionTitle}>Inbox Log</h3>

            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Sender</th>
                  <th>Subject</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {messages.map((msg) => {
                  const dateStr = new Date(msg.createdAt).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric'
                  });
                  return (
                    <tr
                      key={msg.id}
                      onClick={() => setSelectedMessage(msg)}
                      className={selectedMessage?.id === msg.id ? styles.rowActive : ''}
                    >
                      <td className={styles.date}>{dateStr}</td>
                      <td>
                        <strong>{msg.name}</strong>
                        <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{msg.email}</div>
                      </td>
                      <td className={styles.subjectText}>{msg.subject || 'No Subject'}</td>
                      <td>
                        <button
                          onClick={(e) => handleDelete(msg.id, e)}
                          className={styles.deleteBtn}
                          style={{ padding: '4px 8px', border: 'none' }}
                        >
                          <Trash2 size={14} />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Right Column: Detail Preview Panel */}
          {selectedMessage ? (
            <div className={styles.previewPanel}>
              <div className={styles.previewHeader}>
                <h2 className={styles.previewSubject}>
                  {selectedMessage.subject || 'No Subject'}
                </h2>

                <div className={styles.senderMeta}>
                  <span>From: <strong>{selectedMessage.name}</strong> ({selectedMessage.email})</span>
                  <span>Received: {new Date(selectedMessage.createdAt).toLocaleString()}</span>
                </div>
              </div>

              <div className={styles.previewBody}>
                {selectedMessage.message}
              </div>

              <div className={styles.previewFooter}>
                <button
                  onClick={(e) => handleDelete(selectedMessage.id, e)}
                  className={styles.deleteBtn}
                >
                  <Trash2 size={14} />
                  Delete Message
                </button>
              </div>
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: '60px', background: 'var(--bg-surface)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-color)' }}>
              <p>Select a message log to preview details.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
