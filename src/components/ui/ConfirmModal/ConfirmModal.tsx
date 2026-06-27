import React from 'react';
import { AlertTriangle } from 'lucide-react';
import styles from './ConfirmModal.module.css';

interface ConfirmModalProps {
  isOpen: boolean;
  title?: string;
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
  confirmText?: string;
  cancelText?: string;
  isDanger?: boolean;
}

export default function ConfirmModal({
  isOpen,
  title = 'Confirm Action',
  message,
  onConfirm,
  onCancel,
  confirmText = 'Yes, Delete',
  cancelText = 'Cancel',
  isDanger = true
}: ConfirmModalProps) {
  if (!isOpen) return null;

  return (
    <div className={styles.overlay}>
      <div className={styles.modalCard}>
        <div className={styles.header}>
          <div className={isDanger ? styles.dangerIconContainer : styles.infoIconContainer}>
            <AlertTriangle size={24} className={isDanger ? styles.dangerIcon : styles.infoIcon} />
          </div>
          <h3>{title}</h3>
        </div>
        <p className={styles.message}>{message}</p>
        <div className={styles.actions}>
          <button type="button" onClick={onCancel} className={styles.cancelBtn}>
            {cancelText}
          </button>
          <button type="button" onClick={onConfirm} className={isDanger ? styles.dangerConfirmBtn : styles.confirmBtn}>
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}
