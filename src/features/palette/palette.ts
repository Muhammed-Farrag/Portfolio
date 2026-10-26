// The palette's slot colours for canvases. Every colour on the site is one of the --p-* slots in
// src/styles/tokens.css (Jade Pavilion since v3); CSS uses them directly, while a canvas (the
// star fields, the event scenes) cannot read CSS variables and asks here instead.

export type Slot = 'deep' | 'mid' | 'raised' | 'accent' | 'soft' | 'softer' | 'paper' | 'panel' | 'edge';
export type Rgb = [number, number, number];

/** The current value of a palette slot as a CSS colour (#rrggbb, as written in tokens.css). */
export function slot(name: Slot): string {
  return getComputedStyle(document.documentElement).getPropertyValue(`--p-${name}`).trim();
}

/** The current value of a palette slot as 0-255 channels. */
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
