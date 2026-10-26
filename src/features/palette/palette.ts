// The visitor's colour palette. The palettes themselves are CSS (the --p-* slots under
// :root[data-palette] in src/styles/tokens.css); this sets the attribute, remembers the choice in
// this browser, recolours the still space backdrops, and gives the canvases (portrait, stars, event
// scenes) the current slot colours, since they cannot use CSS variables directly. index.html
// applies a stored choice before the first paint, so the page never flashes the default palette.
import { useSyncExternalStore } from 'react';
import { paintBackdrops } from './backdrops';

export const PALETTE_KEY = 'portfolio:palette';

/** The switcher's choices. `note` says where it comes from; the swatches are ground, accent, light ground. */
export const PALETTES = [
  { id: 'desert', name: 'Desert Titanium', note: 'The night-sky original', swatches: ['#15120f', '#bfa48f', '#e8dccb'] },
  { id: 'jade', name: 'Jade Pavilion', note: 'Forest and jade roofs', swatches: ['#121c17', '#8fb09b', '#dde6d8'] },
  { id: 'misty', name: 'Misty Ridge', note: 'Mountains in the haze', swatches: ['#161d25', '#9fb1c3', '#e1e7ec'] },
  { id: 'imperial', name: 'Imperial Wall', note: 'Temple red and sandstone', swatches: ['#1f1512', '#d0976a', '#efe0cf'] },
  { id: 'lake', name: 'Summer Lake', note: 'Kunming Lake teal', swatches: ['#111d1f', '#8eaca8', '#dde7e4'] },
] as const;

export type PaletteId = (typeof PALETTES)[number]['id'];
export const DEFAULT_PALETTE: PaletteId = 'desert';

const isPalette = (value: unknown): value is PaletteId => PALETTES.some((p) => p.id === value);

type Listener = () => void;
const listeners = new Set<Listener>();

function readStored(): PaletteId {
  try {
    const value = localStorage.getItem(PALETTE_KEY);
    return isPalette(value) ? value : DEFAULT_PALETTE;
  } catch {
    return DEFAULT_PALETTE;
  }
}

let current: PaletteId = readStored();

export function getPalette(): PaletteId {
  return current;
}

/** Applies a palette everywhere and remembers it in this browser. */
export function setPalette(id: PaletteId): void {
  current = id;
  applyPalette(id);
  try {
    localStorage.setItem(PALETTE_KEY, id);
  } catch {
    // Storage can be unavailable (private mode, blocked site data); the choice then lasts for this page.
  }
  for (const listener of listeners) listener();
}

/** Sets the root attribute, theme-color and backdrops for `id` without remembering it. */
export function applyPalette(id: PaletteId): void {
  const root = document.documentElement;
  if (id === DEFAULT_PALETTE) delete root.dataset.palette;
  else root.dataset.palette = id;
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', slot('deep'));
  void paintBackdrops(id === DEFAULT_PALETTE ? null : slot);
}

export function onPaletteChange(listener: Listener): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function usePalette(): PaletteId {
  return useSyncExternalStore(onPaletteChange, getPalette);
}

export type Slot = 'deep' | 'mid' | 'raised' | 'accent' | 'soft' | 'softer' | 'paper' | 'panel' | 'edge' | 'nebula' | 'nebula-2';
export type Rgb = [number, number, number];

/** The current value of a palette slot as a CSS colour (#rrggbb, as written in tokens.css). */
export function slot(name: Slot): string {
  return getComputedStyle(document.documentElement).getPropertyValue(`--p-${name}`).trim();
}

/** The current value of a palette slot as 0-255 channels, for WebGL. */
export function slotRgb(name: Slot): Rgb {
  const hex = slot(name);
  return [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16)) as Rgb;
}

/** A slot with alpha, for 2D canvas styles. */
export function slotAlpha(name: Slot, alpha: number): string {
  const [r, g, b] = slotRgb(name);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

/** `a` mixed with `b` (amount of `a`, 0..1), as #rrggbb. */
export function mixSlots(a: Slot, b: Slot, amount: number): string {
  const x = slotRgb(a);
  const y = slotRgb(b);
  return '#' + x.map((v, i) => Math.round(v * amount + y[i]! * (1 - amount)).toString(16).padStart(2, '0')).join('');
}
