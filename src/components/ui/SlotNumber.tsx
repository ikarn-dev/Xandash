'use client';

import React, { useEffect, useState, useRef } from 'react';
import { cn } from '@/libs';

interface AnimatedValueProps {
  value: string | number;
  className?: string;
}

export const AnimatedValue: React.FC<AnimatedValueProps> = ({ value, className }) => {
  const stringValue = String(value);
  const [displayValue, setDisplayValue] = useState(stringValue);
  const [animationState, setAnimationState] = useState<'idle' | 'exit' | 'enter'>('idle');
  const prevValueRef = useRef(stringValue);
  const isFirstRender = useRef(true);
  const animationTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // Skip animation on first render
    if (isFirstRender.current) {
      isFirstRender.current = false;
      prevValueRef.current = stringValue;
      setDisplayValue(stringValue);
      return;
    }

    // Only animate if value actually changed
    if (prevValueRef.current !== stringValue) {
      // Clear any pending animation
      if (animationTimeoutRef.current) {
        clearTimeout(animationTimeoutRef.current);
      }

      setAnimationState('exit');

      // Batch the DOM updates to avoid layout thrashing
      animationTimeoutRef.current = setTimeout(() => {
        setDisplayValue(stringValue);
        setAnimationState('enter');
        prevValueRef.current = stringValue;

        // Reset to idle after enter animation
        animationTimeoutRef.current = setTimeout(() => {
          setAnimationState('idle');
        }, 150);
      }, 150);
    }

    return () => {
      if (animationTimeoutRef.current) {
        clearTimeout(animationTimeoutRef.current);
      }
    };
  }, [stringValue]);

  // Memoize animation classes to avoid recalculation
  const animationClasses = animationState === 'exit'
    ? 'transform -translate-y-2 opacity-0 scale-90'
    : 'transform translate-y-0 opacity-100 scale-100';

  return (
    <span
      className={cn(
        'inline-block transition-all duration-150 ease-out will-change-transform',
        animationClasses,
        className
      )}
      style={{ contain: 'layout style' }} // Prevent layout containment issues
    >
      {displayValue}
    </span>
  );
};

// Slot machine style number animation - each digit rolls independently
interface SlotDigitProps {
  digit: string;
  delay: number;
}

const SlotDigit: React.FC<SlotDigitProps> = ({ digit, delay }) => {
  const [currentDigit, setCurrentDigit] = useState(digit);
  const [isRolling, setIsRolling] = useState(false);
  const prevDigitRef = useRef(digit);
  const isFirstRender = useRef(true);

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      prevDigitRef.current = digit;
      return;
    }

    if (prevDigitRef.current !== digit) {
      setIsRolling(true);

      // Roll through random digits - reduced iterations and use rAF-friendly timing
      const isNumber = /\d/.test(digit);
      if (isNumber) {
        let count = 0;
        const maxRolls = 3; // Reduced from 5 to 3 for faster performance
        let lastTime = 0;
        let rafId: number;

        const rollAnimation = (time: number) => {
          if (time - lastTime >= 80) { // Increased from 50ms to 80ms
            setCurrentDigit(String(Math.floor(Math.random() * 10)));
            count++;
            lastTime = time;

            if (count >= maxRolls) {
              setCurrentDigit(digit);
              setIsRolling(false);
              prevDigitRef.current = digit;
              return;
            }
          }
          rafId = requestAnimationFrame(rollAnimation);
        };

        rafId = requestAnimationFrame(rollAnimation);
        return () => cancelAnimationFrame(rafId);
      } else {
        // For non-digits, just flip
        const timer = setTimeout(() => {
          setCurrentDigit(digit);
          setIsRolling(false);
          prevDigitRef.current = digit;
        }, delay + 100);
        return () => clearTimeout(timer);
      }
    }
  }, [digit, delay]);

  return (
    <span
      className={cn(
        'inline-block transition-transform duration-100',
        isRolling && 'text-white/70'
      )}
    >
      {currentDigit}
    </span>
  );
};

interface SlotNumberProps {
  value: string | number;
  className?: string;
}

export const SlotNumber: React.FC<SlotNumberProps> = ({ value, className }) => {
  const stringValue = String(value);
  const chars = stringValue.split('');

  return (
    <span className={cn('inline-flex', className)}>
      {chars.map((char, index) => (
        <SlotDigit
          key={`slot-${index}`}
          digit={char}
          delay={index * 30}
        />
      ))}
    </span>
  );
};
