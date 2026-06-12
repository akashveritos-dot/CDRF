'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ShieldAlert, Lock, Mail, Loader2 } from 'lucide-react';
import styles from './page.module.css';

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // If already authenticated, redirect to /admin
  useEffect(() => {
    async function checkSession() {
      try {
        const res = await fetch('/api/auth/me');
        const data = await res.json();
        if (data.authenticated) {
          router.push('/admin');
        }
      } catch (err) {
        // Safe to ignore
      }
    }
    checkSession();
  }, [router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Login failed');
      }

      router.push('/admin');
    } catch (err: any) {
      setError(err.message || 'Invalid administrator credentials');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={styles.wrapper}>
      <div className={styles.card}>
        <div className={styles.header}>
          <div className={styles.logoWrap}>
            <ShieldAlert size={36} className={styles.logoIcon} />
          </div>
          <h1>DCRF Operations</h1>
          <p>Crisis Command Center Authentication</p>
        </div>

        {error && (
          <div className={styles.errorAlert}>
            <span className={styles.errorIcon}>⚠</span>
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.inputGroup}>
            <label htmlFor="email">Security Email</label>
            <div className={styles.inputWrap}>
              <Mail size={18} className={styles.fieldIcon} />
              <input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@dcrf.org"
                className={styles.input}
              />
            </div>
          </div>

          <div className={styles.inputGroup}>
            <label htmlFor="password">Command Authorization Key</label>
            <div className={styles.inputWrap}>
              <Lock size={18} className={styles.fieldIcon} />
              <input
                id="password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className={styles.input}
              />
            </div>
          </div>

          <button type="submit" disabled={isLoading} className={styles.submitBtn}>
            {isLoading ? (
              <>
                <Loader2 size={16} className={styles.spinner} />
                Establishing Session...
              </>
            ) : (
              'Initialize Command Session'
            )}
          </button>
        </form>

        <div className={styles.footer}>
          <span>AUTHORIZED PERSONNEL ONLY</span>
          <span className={styles.warningSub}>All connections logged and monitored.</span>
        </div>
      </div>
    </div>
  );
}
