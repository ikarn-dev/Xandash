'use client';

import { useEffect, useRef, useState } from 'react';

interface UseScrollAnimationOptions {
  threshold?: number;
  rootMargin?: string;
  triggerOnce?: boolean;
}

export const useScrollAnimation = <T extends HTMLElement = HTMLElement>(options: UseScrollAnimationOptions = {}) => {
  const {
    threshold = 0.1,
    rootMargin = '0px 0px -50px 0px',
    triggerOnce = true
  } = options;

  const [isVisible, setIsVisible] = useState(false);
  const elementRef = useRef<T>(null);

  useEffect(() => {
    const element = elementRef.current;
    if (!element) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          if (triggerOnce) {
            observer.unobserve(element);
          }
        } else if (!triggerOnce) {
          setIsVisible(false);
        }
      },
      {
        threshold,
        rootMargin,
      }
    );

    observer.observe(element);

    return () => {
      observer.unobserve(element);
    };
  }, [threshold, rootMargin, triggerOnce]);

  return { elementRef, isVisible };
};

// Hook for animating multiple elements with staggered delays
export const useStaggeredScrollAnimation = <T extends HTMLElement = HTMLElement>(
  itemCount: number,
  options: UseScrollAnimationOptions = {}
) => {
  const { elementRef, isVisible } = useScrollAnimation<T>(options);
  const [animatedItems, setAnimatedItems] = useState<Set<number>>(new Set());

  useEffect(() => {
    if (isVisible && animatedItems.size === 0) {
      // Trigger animations with staggered delays
      for (let i = 0; i < itemCount; i++) {
        setTimeout(() => {
          setAnimatedItems(prev => new Set([...prev, i]));
        }, i * 50); // 50ms delay between each item
      }
    }
  }, [isVisible, itemCount, animatedItems.size]);

  const shouldAnimate = (index: number) => animatedItems.has(index);

  return { elementRef, isVisible, shouldAnimate };
};
