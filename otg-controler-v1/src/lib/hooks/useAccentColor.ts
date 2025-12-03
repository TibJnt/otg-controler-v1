'use client';

import { useState, useEffect, useCallback } from 'react';

export type AccentColor = 'emerald' | 'blue' | 'violet';

interface AccentConfig {
  color: string;
  hover: string;
  glow: string;
  muted: string;
}

const ACCENT_CONFIGS: Record<AccentColor, AccentConfig> = {
  emerald: {
    color: '#10B981',
    hover: '#0d9668',
    glow: 'rgba(16, 185, 129, 0.4)',
    muted: 'rgba(16, 185, 129, 0.15)',
  },
  blue: {
    color: '#3B82F6',
    hover: '#2563eb',
    glow: 'rgba(59, 130, 246, 0.4)',
    muted: 'rgba(59, 130, 246, 0.15)',
  },
  violet: {
    color: '#8B5CF6',
    hover: '#7c3aed',
    glow: 'rgba(139, 92, 246, 0.4)',
    muted: 'rgba(139, 92, 246, 0.15)',
  },
};

const STORAGE_KEY = 'otg-accent-color';

export function useAccentColor() {
  const [accent, setAccentState] = useState<AccentColor>('emerald');

  // Load from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY) as AccentColor | null;
    if (stored && ACCENT_CONFIGS[stored]) {
      setAccentState(stored);
      applyAccent(stored);
    }
  }, []);

  const applyAccent = useCallback((color: AccentColor) => {
    const config = ACCENT_CONFIGS[color];
    const root = document.documentElement;
    root.style.setProperty('--accent', config.color);
    root.style.setProperty('--accent-hover', config.hover);
    root.style.setProperty('--accent-glow', config.glow);
    root.style.setProperty('--accent-muted', config.muted);
  }, []);

  const setAccent = useCallback((color: AccentColor) => {
    setAccentState(color);
    localStorage.setItem(STORAGE_KEY, color);
    applyAccent(color);
  }, [applyAccent]);

  return {
    accent,
    setAccent,
    config: ACCENT_CONFIGS[accent],
  };
}
