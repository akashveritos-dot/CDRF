'use client';
import React from 'react';
import styles from './KanbanColumns.module.css';

export interface KanbanCard {
  title: string;
  description: string;
  tag?: string;
  tagColor?: string;
  icon?: React.ReactNode;
}

export interface KanbanColumn {
  heading: string;
  accent: string;
  cards: KanbanCard[];
}

interface KanbanColumnsProps {
  columns: KanbanColumn[];
}

export default function KanbanColumns({ columns }: KanbanColumnsProps) {
  return (
    <div className={styles.board}>
      {columns.map((col, ci) => (
        <div
          key={ci}
          className={styles.column}
          style={{ '--accent': col.accent, animationDelay: `${ci * 0.12}s` } as React.CSSProperties}
        >
          <div className={styles.colHeader}>
            <span className={styles.colDot} />
            <h3 className={styles.colTitle}>{col.heading}</h3>
          </div>
          <div className={styles.cards}>
            {col.cards.map((card, ki) => (
              <div
                key={ki}
                className={styles.card}
                style={{ animationDelay: `${ci * 0.12 + ki * 0.07}s` }}
              >
                {card.icon && <div className={styles.cardIcon}>{card.icon}</div>}
                <div className={styles.cardBody}>
                  {card.tag && (
                    <span className={styles.tag} style={{ background: `${card.tagColor || col.accent}18`, color: card.tagColor || col.accent, borderColor: `${card.tagColor || col.accent}30` }}>
                      {card.tag}
                    </span>
                  )}
                  <h4 className={styles.cardTitle}>{card.title}</h4>
                  <p className={styles.cardDesc}>{card.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
