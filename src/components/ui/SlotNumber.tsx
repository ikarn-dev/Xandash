'use client';

import React, { useEffect, useState, useRef, useCallback } from 'react';
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

  useEffect(() => {
    // Skip animation on first render
    if (isFirstRender.current) {
      isFirstRender.current = false;
      prevValueRef.current = stringValue;
      // Use setTimeout to avoid setState in effect
      const timer = setTimeout(() => setDisplayValue(stringValue), 0);
      return () => clearTimeout(timer);
    }

    // Only animate if value actually changed
    if (prevValueRef.current !== stringValue) {
      // Use setTimeout to avoid setState in effect
      const timer = setTimeout(() => {
        setAnimationState('exit');
        
        // After exit animation, update value and start enter animation
        const exitTimer = setTimeout(() => {
          setDisplayValue(stringValue);
          setAnimationState('enter');
          prevValueRef.current = stringValue;
        }, 150);
        
        // Reset to idle after enter animation
        const enterTimer = setTimeout(() => {
          setAnimationState('idle');
        }, 300);
        
        return () => {
          clearTimeout(exitTimer);
          clearTimeout(enterTimer);
        };
      }, 0);
      return () => clearTimeout(timer);
    }
  }, [stringValue]);

  // Update display value immediately if it's the same (no animation needed)
  useEffect(() => {
    if (animationState === 'idle' && displayValue !== stringValue) {
      // Use setTimeout to avoid setState in effect
      const timer = setTimeout(() => setDisplayValue(stringValue), 0);
      return () => clearTimeout(timer);
    }
  }, [stringValue, animationState, displayValue]);

  const getAnimationClasses = () => {
    switch (animationState) {
      case 'exit':
        return 'transform -translate-y-2 opacity-0 scale-90';
      case 'enter':
        return 'transform translate-y-0 opacity-100 scale-100';
      default:
        return 'transform translate-y-0 opacity-100 scale-100';
    }
  };

  return (
    <span 
      className={cn(
        'inline-block transition-all duration-150 ease-out',
        getAnimationClasses(),
        className
      )}
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
      
      // Roll through random digits
      const isNumber = /\d/.test(digit);
      if (isNumber) {
        let count = 0;
        const maxRolls = 5;
        
        const rollInterval = setInterval(() => {
          setCurrentDigit(String(Math.floor(Math.random() * 10)));
          count++;
          
          if (count >= maxRolls) {
            clearInterval(rollInterval);
            setCurrentDigit(digit);
            setIsRolling(false);
            prevDigitRef.current = digit;
          }
        }, 50);
        
        return () => clearInterval(rollInterval);
      } else {
        // For non-digits, just flip
        setTimeout(() => {
          setCurrentDigit(digit);
          setIsRolling(false);
          prevDigitRef.current = digit;
        }, delay + 100);
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
