// Exposes the engine to the lifecycle tests: repeated create/dispose on one canvas, the way
// React StrictMode and hot reload will exercise it in later phases.
import portraitUrl from '../../legacy/particle-portrait/portrait.png';
import { PORTFOLIO_BACKGROUND, createParticleRenderer, type ParticleRenderer } from '../../src/features/particle-portrait';

const canvas = document.getElementById('canvas') as HTMLCanvasElement;
const status = document.getElementById('status')!;
const image = new Image();
let current: ParticleRenderer | null = null;

function mount(): ParticleRenderer {
  current?.dispose();
  const result = createParticleRenderer(canvas, image, { settings: { tone: 'moonlight', background: PORTFOLIO_BACKGROUND } });
  if ('fallback' in result) throw new Error(`fallback: ${result.fallback}`);
  current = result;
  return result;
}

function unmount(): void {
  current?.dispose();
  current = null;
}

image.onload = () => {
  mount();
  status.textContent = 'ready';
};
image.src = portraitUrl;

Object.assign(window, {
  __lifecycle: {
    mount: () => mount().pointCount,
    unmount,
    get running() {
      return current?.running ?? false;
    },
    get pointCount() {
      return current?.pointCount ?? 0;
    },
    get glError() {
      return canvas.getContext('webgl')?.getError() ?? -1;
    },
  },
});
