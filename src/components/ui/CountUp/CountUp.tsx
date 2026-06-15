'use client';

import React, { useEffect, useState, useRef } from 'react';
import { useInView } from 'framer-motion';

interface CountUpProps {
  end: number;
  duration?: number; // in milliseconds
  suffix?: string;
  decimals?: number;
  className?: string;
}

export default function CountUp({
  end,
  duration = 1800,
  suffix = '',
  decimals = 0,
  className = ''
}: CountUpProps) {
  // Initialize to `end` to support SSR/SEO static HTML generation
  const [count, setCount] = useState(end);
  const ref = useRef<HTMLSpanElement>(null);
  const isInView = useInView(ref, { once: true, amount: 0.3 });
  const animationRef = useRef<number | null>(null);

  // Reset to 0 on mount so client-side animation starts from 0
  useEffect(() => {
    setCount(0);
  }, []);

  useEffect(() => {
    if (!isInView) return;

    let startTimestamp: number | null = null;
    const startVal = count;
    const endVal = end;
    const change = endVal - startVal;

    const step = (timestamp: number) => {
      if (!startTimestamp) startTimestamp = timestamp;
      const elapsed = timestamp - startTimestamp;
      const progress = Math.min(elapsed / duration, 1);
      
      // Smooth ease-out deceleration
      const easeProgress = progress * (2 - progress);
      const currentVal = startVal + change * easeProgress;
      
      setCount(currentVal);

      if (progress < 1) {
        animationRef.current = window.requestAnimationFrame(step);
      } else {
        setCount(endVal);
      }
    };

    animationRef.current = window.requestAnimationFrame(step);

    return () => {
      if (animationRef.current) {
        window.cancelAnimationFrame(animationRef.current);
      }
    };
  }, [isInView, end, duration]);

  const formattedValue = decimals > 0 
    ? count.toFixed(decimals) 
    : Math.floor(count).toString();

  return (
    <span ref={ref} className={className}>
      {formattedValue}
      {suffix}
    </span>
  );
}
