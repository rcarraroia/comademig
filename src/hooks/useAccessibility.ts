
import { useEffect, useState } from 'react';

export const useAccessibility = () => {
  const [isReducedMotion, setIsReducedMotion] = useState(false);
  const [isHighContrast, setIsHighContrast] = useState(false);

  useEffect(() => {
    // Check for reduced motion preference
    const mediaQueryReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
    setIsReducedMotion(mediaQueryReducedMotion.matches);

    const handleReducedMotionChange = (e: MediaQueryListEvent) => {
      setIsReducedMotion(e.matches);
    };

    mediaQueryReducedMotion.addEventListener('change', handleReducedMotionChange);

    // Check for high contrast preference
    const mediaQueryHighContrast = window.matchMedia('(prefers-contrast: high)');
    setIsHighContrast(mediaQueryHighContrast.matches);

    const handleHighContrastChange = (e: MediaQueryListEvent) => {
      setIsHighContrast(e.matches);
    };

    mediaQueryHighContrast.addEventListener('change', handleHighContrastChange);

    return () => {
      mediaQueryReducedMotion.removeEventListener('change', handleReducedMotionChange);
      mediaQueryHighContrast.removeEventListener('change', handleHighContrastChange);
    };
  }, []);

  const announceToScreenReader = (message: string) => {
    const announcement = document.createElement('div');
    announcement.setAttribute('aria-live', 'polite');
    announcement.setAttribute('aria-atomic', 'true');
    announcement.className = 'sr-only';
    announcement.textContent = message;
    
    document.body.appendChild(announcement);
    
    setTimeout(() => {
      document.body.removeChild(announcement);
    }, 1000);
  };

  const focusElement = (elementId: string) => {
    const element = document.getElementById(elementId);
    if (element) {
      element.focus();
    }
  };

  return {
    isReducedMotion,
    isHighContrast,
    announceToScreenReader,
    focusElement,
  };
};
