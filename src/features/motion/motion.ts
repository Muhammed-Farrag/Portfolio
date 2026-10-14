// The site-wide "Pause motion" preference (WCAG 2.2.2). It follows prefers-reduced-motion until
// the visitor makes an explicit choice, which is remembered in this browser. Every animated
// feature (the Hero portrait now, the story particle scenes later) reads it from here.
import { useSyncExternalStore } from 'react';

const KEY = 'portfolio:motion';
type Listener = () => void;

const reduced = matchMedia('(prefers-reduced-motion: reduce)');
const listeners = new Set<Listener>();

function readStored(): boolean | null {
  try {
    const value = localStorage.getItem(KEY);
    return value === 'paused' ? true : value === 'playing' ? false : null;
  } catch {
    return null;
  }
}

let explicit = readStored();

const emit = () => {
  for (const listener of listeners) listener();
};

reduced.addEventListener('change', () => {
  if (explicit === null) emit();
});

/** True when animation should stand still: the visitor paused it, or asked for reduced motion. */
export function isMotionPaused(): boolean {
  return explicit ?? reduced.matches;
}

export function setMotionPaused(paused: boolean): void {
  explicit = paused;
  try {
    localStorage.setItem(KEY, paused ? 'paused' : 'playing');
  } catch {
    // Storage can be unavailable (private mode, blocked site data); the choice then lasts for this page.
  }
  emit();
}

export function onMotionChange(listener: Listener): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function useMotionPaused(): boolean {
  return useSyncExternalStore(onMotionChange, isMotionPaused);
}
