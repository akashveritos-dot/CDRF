'use client';
import React, { useState } from 'react';
import styles from './NumberedAccordion.module.css';
import { ChevronDown } from 'lucide-react';

export interface AccordionItem {
  number: string | number;
  title: string;
  body: string;
}

interface NumberedAccordionProps {
  items: AccordionItem[];
  accentColor?: string;
}

export default function NumberedAccordion({ items, accentColor = '#b91c1c' }: NumberedAccordionProps) {
  const [open, setOpen] = useState<number | null>(0);

  return (
    <div className={styles.accordion}>
      {items.map((item, idx) => {
        const isOpen = open === idx;
        return (
          <div
            key={idx}
            className={`${styles.item} ${isOpen ? styles.itemOpen : ''}`}
            style={{ '--accent': accentColor } as React.CSSProperties}
          >
            <button
              className={styles.trigger}
              onClick={() => setOpen(isOpen ? null : idx)}
              aria-expanded={isOpen}
            >
              <span className={styles.number}>{String(item.number).padStart(2, '0')}</span>
              <span className={styles.triggerTitle}>{item.title}</span>
              <ChevronDown size={18} className={`${styles.chevron} ${isOpen ? styles.chevronOpen : ''}`} />
            </button>
            <div className={styles.body} style={{ maxHeight: isOpen ? '400px' : '0' }}>
              <div className={styles.bodyInner} dangerouslySetInnerHTML={{ __html: item.body }} />
            </div>
          </div>
        );
      })}
    </div>
  );
}
