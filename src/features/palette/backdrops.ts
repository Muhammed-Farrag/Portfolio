// The still space backdrops (src/styles/backdrops.css) are SVG files drawn in Desert Titanium. A
// background image cannot read CSS variables, so for any other palette each SVG is fetched once,
// its colours swapped for the palette's slots, and handed to the CSS as a data URL in a custom
// property (--bd-<name>). Without one, the CSS falls back to the original file.
import galaxy from '../../assets/backdrops/galaxy.svg?url';
import horizon from '../../assets/backdrops/horizon.svg?url';
import nebulaWisp from '../../assets/backdrops/nebula-wisp.svg?url';
import nebula from '../../assets/backdrops/nebula.svg?url';
import starfield from '../../assets/backdrops/starfield.svg?url';
import type { Slot } from './palette';

const FILES = { galaxy, horizon, 'nebula-wisp': nebulaWisp, nebula, starfield };

/** The Desert Titanium colours used in the SVGs, and the slot each one stands for. */
const COLOURS: Record<string, Slot> = {
  '#15120f': 'deep',
  '#bfa48f': 'accent',
  '#e8dccb': 'softer',
  '#f4eee4': 'paper',
  '#8c5e4a': 'nebula',
  '#4a3a5c': 'nebula-2',
};

const sources = new Map<string, Promise<string>>();
const source = (url: string) => {
  let s = sources.get(url);
  if (!s) sources.set(url, (s = fetch(url).then((r) => r.text())));
  return s;
};

let request = 0;

/** Recolours the backdrops with `slot`, or restores the original files when it is null. */
export async function paintBackdrops(slot: ((name: Slot) => string) | null): Promise<void> {
  const root = document.documentElement;
  const mine = ++request;
  if (!slot) {
    for (const name of Object.keys(FILES)) root.style.removeProperty(`--bd-${name}`);
    return;
  }
  const values = Object.fromEntries(Object.entries(COLOURS).map(([hex, s]) => [hex, slot(s)]));
  const svgs = await Promise.all(Object.values(FILES).map(source)).catch(() => null);
  // A later choice wins; without the sources the original files stay.
  if (!svgs || mine !== request) return;
  Object.keys(FILES).forEach((name, i) => {
    const svg = svgs[i]!.replace(/#[0-9a-f]{6}\b/gi, (hex) => values[hex.toLowerCase()] ?? hex);
    root.style.setProperty(`--bd-${name}`, `url("data:image/svg+xml,${encodeURIComponent(svg)}")`);
  });
}
