'use client';

import React, {
  createContext,
  useCallback,
  useContext,
  useState,
  useRef,
  ReactNode
} from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import styles from './Toast.module.css';
import { CheckCircle, XCircle, AlertTriangle, Info, Download, X } from 'lucide-react';

// ─── Types ────────────────────────────────────────────────────────────────────

export type ToastVariant = 'success' | 'error' | 'warning' | 'info' | 'download';

export interface ToastItem {
  id: string;
  variant: ToastVariant;
  title: string;
  message?: string;
  duration?: number; // ms, 0 = persist until closed
}

interface ToastContextValue {
  toast: (item: Omit<ToastItem, 'id'>) => void;
  success: (title: string, message?: string) => void;
  error: (title: string, message?: string) => void;
  warning: (title: string, message?: string) => void;
  info: (title: string, message?: string) => void;
  download: (title: string, message?: string) => void;
  dismiss: (id: string) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

// ─── Icon map ─────────────────────────────────────────────────────────────────

const ICONS: Record<ToastVariant, ReactNode> = {
  success: <CheckCircle size={18} />,
  error: <XCircle size={18} />,
  warning: <AlertTriangle size={18} />,
  info: <Info size={18} />,
  download: <Download size={18} />
};

// ─── Provider ─────────────────────────────────────────────────────────────────

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const counter = useRef(0);

  const dismiss = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  const toast = useCallback((item: Omit<ToastItem, 'id'>) => {
    const id = `toast-${++counter.current}`;
    const newToast: ToastItem = { duration: 4000, ...item, id };
    setToasts(prev => [...prev, newToast]);

    if (newToast.duration && newToast.duration > 0) {
      setTimeout(() => dismiss(id), newToast.duration);
    }
  }, [dismiss]);

  const success = useCallback((title: string, message?: string) => toast({ variant: 'success', title, message }), [toast]);
  const error   = useCallback((title: string, message?: string) => toast({ variant: 'error', title, message, duration: 6000 }), [toast]);
  const warning = useCallback((title: string, message?: string) => toast({ variant: 'warning', title, message }), [toast]);
  const info    = useCallback((title: string, message?: string) => toast({ variant: 'info', title, message }), [toast]);
  const download = useCallback((title: string, message?: string) => toast({ variant: 'download', title, message }), [toast]);

  return (
    <ToastContext.Provider value={{ toast, success, error, warning, info, download, dismiss }}>
      {children}

      {/* Toast portal — fixed top-right */}
      <div className={styles.portal} aria-live="polite" aria-atomic="false">
        <AnimatePresence initial={false}>
          {toasts.map(t => (
            <motion.div
              key={t.id}
              layout
              initial={{ opacity: 0, x: 60, scale: 0.92 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: 60, scale: 0.92 }}
              transition={{ type: 'spring', stiffness: 380, damping: 32 }}
              className={`${styles.toast} ${styles[t.variant]}`}
              role="alert"
            >
              <span className={styles.icon}>{ICONS[t.variant]}</span>
              <div className={styles.body}>
                <p className={styles.toastTitle}>{t.title}</p>
                {t.message && <p className={styles.toastMsg}>{t.message}</p>}
              </div>
              <button
                className={styles.close}
                onClick={() => dismiss(t.id)}
                aria-label="Dismiss notification"
              >
                <X size={14} />
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used inside <ToastProvider>');
  return ctx;
}
