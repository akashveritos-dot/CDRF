'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import styles from './WordTypingEffect.module.css';

export interface WordConfig {
  text: string;
  isItalic?: boolean;
  newLine?: boolean;
}

interface CharInfo {
  char: string;
  globalIndex: number;
}

interface WordGroup {
  wordText: string;
  isItalic: boolean;
  newLine: boolean;
  chars: CharInfo[];
  spaceInfo: CharInfo | null;
}

interface WordTypingEffectProps {
  words?: WordConfig[];
  delayMs?: number;
}

const defaultWords: WordConfig[] = [
  { text: "Building", isItalic: false, newLine: false },
  { text: "Resilience", isItalic: true, newLine: false },
  { text: "Through", isItalic: false, newLine: true },
  { text: "Knowledge,", isItalic: false, newLine: false },
  { text: "Convergence", isItalic: false, newLine: true },
  { text: "&", isItalic: false, newLine: false },
  { text: "Action", isItalic: false, newLine: false }
];

export default function WordTypingEffect({
  words = defaultWords,
  delayMs = 600
}: WordTypingEffectProps) {
  const [visibleCount, setVisibleCount] = useState(0);
  const [isComplete, setIsComplete] = useState(false);

  // Parse words structure into grouped words and chars synchronously for initial state
  const [wordGroups, setWordGroups] = useState<WordGroup[]>(() => {
    let globalIndex = 0;
    return words.map((word, wordIdx) => {
      const chars: CharInfo[] = word.text.split("").map((c) => ({
        char: c,
        globalIndex: globalIndex++
      }));

      const hasTrailingSpace = wordIdx < words.length - 1 && !words[wordIdx + 1].newLine;
      const spaceInfo = hasTrailingSpace ? {
        char: " ",
        globalIndex: globalIndex++
      } : null;

      return {
        wordText: word.text,
        isItalic: !!word.isItalic,
        newLine: !!word.newLine,
        chars,
        spaceInfo
      };
    });
  });

  const [totalCharsCount, setTotalCharsCount] = useState<number>(() => {
    let globalIndex = 0;
    words.forEach((word, wordIdx) => {
      globalIndex += word.text.length;
      const hasTrailingSpace = wordIdx < words.length - 1 && !words[wordIdx + 1].newLine;
      if (hasTrailingSpace) {
        globalIndex++;
      }
    });
    return globalIndex;
  });

  // Handle words prop dynamic updates
  useEffect(() => {
    let globalIndex = 0;
    const groups: WordGroup[] = words.map((word, wordIdx) => {
      const chars: CharInfo[] = word.text.split("").map((c) => ({
        char: c,
        globalIndex: globalIndex++
      }));

      const hasTrailingSpace = wordIdx < words.length - 1 && !words[wordIdx + 1].newLine;
      const spaceInfo = hasTrailingSpace ? {
        char: " ",
        globalIndex: globalIndex++
      } : null;

      return {
        wordText: word.text,
        isItalic: !!word.isItalic,
        newLine: !!word.newLine,
        chars,
        spaceInfo
      };
    });

    setWordGroups(groups);
    setTotalCharsCount(globalIndex);
  }, [words]);

  // Realistic human typewriter effect simulation
  useEffect(() => {
    if (totalCharsCount === 0 || wordGroups.length === 0) return;

    // Create a flat array in sequence of globalIndex to evaluate character timing rules
    const flatCharsList: { char: string; isPunctuation: boolean; isSpace: boolean; isNewLine: boolean }[] = [];
    wordGroups.forEach((group) => {
      group.chars.forEach((cInfo, charIdx) => {
        flatCharsList.push({
          char: cInfo.char,
          isPunctuation: cInfo.char === ',' || cInfo.char === '&',
          isSpace: false,
          isNewLine: charIdx === 0 && group.newLine
        });
      });
      if (group.spaceInfo) {
        flatCharsList.push({
          char: " ",
          isPunctuation: false,
          isSpace: true,
          isNewLine: false
        });
      }
    });

    let timeoutId: NodeJS.Timeout;
    let index = 0;

    const typeNextChar = () => {
      if (index >= totalCharsCount) {
        setIsComplete(true);
        return;
      }

      setVisibleCount(index + 1);
      const typedChar = flatCharsList[index];
      index++;

      // Compute human-like variable delay
      let delay = 50; // base letter-by-letter typing delay in ms

      if (typedChar) {
        if (typedChar.isNewLine) {
          delay = 80; // short pause on line break transitions
        } else if (typedChar.isPunctuation) {
          delay = 80; // short pause on punctuation (comma, & symbol)
        } else if (typedChar.isSpace) {
          delay = 70; // short pause at word boundaries (spacing)
        } else {
          // Jitter/variation between keypresses to feel organic (between 45ms and 75ms)
          delay = 45 + Math.random() * 30;
        }
      }

      timeoutId = setTimeout(typeNextChar, delay);
    };

    // Kickoff typing after starting delay
    const startTimeout = setTimeout(typeNextChar, delayMs);

    return () => {
      clearTimeout(startTimeout);
      clearTimeout(timeoutId);
    };
  }, [totalCharsCount, wordGroups, delayMs]);

  return (
    <span className={styles.container}>
      {visibleCount === 0 && (
        <span className={styles.initialCursorWrapper}>
          <span className={styles.cursor}>|</span>
        </span>
      )}
      
      {wordGroups.map((group, groupIdx) => (
        <React.Fragment key={groupIdx}>
          {group.newLine && <br />}
          
          <span className={styles.wordWrapper}>
            {group.chars.map((charInfo) => {
              const isVisible = charInfo.globalIndex < visibleCount;
              const isLastVisible = charInfo.globalIndex === visibleCount - 1;

              return (
                <span key={charInfo.globalIndex} className={styles.charWrapper}>
                  <motion.span
                    className={`${group.isItalic ? styles.italicChar : ""} ${
                      isVisible ? styles.visibleChar : styles.hiddenChar
                    }`}
                    initial={{ opacity: 0, y: 4 }}
                    animate={
                      isVisible 
                        ? { opacity: 1, y: 0 } 
                        : { opacity: 0, y: 4 }
                    }
                    transition={{ 
                      duration: 0.12, 
                      ease: "easeOut" 
                    }}
                  >
                    {group.isItalic ? <em>{charInfo.char}</em> : charInfo.char}
                  </motion.span>
                  
                  {isLastVisible && (
                    <span className={`${styles.cursor} ${isComplete ? styles.cursorCompleted : ""}`}>
                      |
                    </span>
                  )}
                </span>
              );
            })}
          </span>

          {group.spaceInfo && (() => {
            const spaceVisible = group.spaceInfo.globalIndex < visibleCount;
            const isSpaceLastVisible = group.spaceInfo.globalIndex === visibleCount - 1;
            return (
              <span className={styles.spaceWrapper}>
                <span className={spaceVisible ? styles.visibleChar : styles.hiddenChar}>
                  {" "}
                </span>
                {isSpaceLastVisible && (
                  <span className={`${styles.cursor} ${isComplete ? styles.cursorCompleted : ""}`}>
                    |
                  </span>
                )}
              </span>
            );
          })()}
        </React.Fragment>
      ))}
    </span>
  );
}
