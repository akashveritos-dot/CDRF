'use client';

import React, { ReactNode } from 'react';
import { motion } from 'framer-motion';

interface AnimeRevealProps {
  children: ReactNode;
  direction?: 'up' | 'down' | 'left' | 'right' | 'none';
  delay?: number;
  duration?: number;
  className?: string;
  amount?: 'some' | 'all' | number;
}

export default function AnimeReveal({
  children,
  direction = 'up',
  delay = 0,
  duration = 0.6,
  className = '',
  amount = 0.1
}: AnimeRevealProps) {
  const getVariants = () => {
    const hidden = {
      opacity: 0,
      x: 0,
      y: 0,
      scale: 1
    };

    const visible = {
      opacity: 1,
      x: 0,
      y: 0,
      scale: 1,
      transition: {
        duration,
        delay,
        ease: [0.16, 1, 0.3, 1] as any
      }
    };

    switch (direction) {
      case 'up':
        hidden.y = 30;
        break;
      case 'down':
        hidden.y = -30;
        break;
      case 'left':
        hidden.x = 30;
        break;
      case 'right':
        hidden.x = -30;
        break;
      case 'none':
      default:
        break;
    }

    return { hidden, visible };
  };

  const variants = getVariants();

  return (
    <motion.div
      className={className}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, amount }}
      variants={variants}
    >
      {children}
    </motion.div>
  );
}
