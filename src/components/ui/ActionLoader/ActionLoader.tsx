import React from 'react';
import { Loader2 } from 'lucide-react';
import styles from './ActionLoader.module.css';

interface ActionLoaderProps {
  message: string | null;
}

export default function ActionLoader({ message }: ActionLoaderProps) {
  if (!message) return null;

  return (
    <div className={styles.overlay}>
      <div className={styles.loaderCard}>
        <Loader2 className={styles.spinner} size={36} />
        <p className={styles.message}>{message}</p>
      </div>
    </div>
  );
}
