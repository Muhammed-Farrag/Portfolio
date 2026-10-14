// Portrait Lab controller. Mirrors the event wiring of legacy/particle-portrait/portrait.js,
// but drives the maintained ParticleRenderer module instead of global state.
// Fixes against the legacy page:
//   - Reset (or any switch back to particles) can no longer hide the static fallback image.
//   - Reset is disabled together with the other particle controls in fallback.
//   - A lost WebGL context shows the static image temporarily and recovers on restore.

import {
  createParticleRenderer,
  type ParticleRenderer,
  type PortraitState,
  type SampleStep,
  type Tone,
} from '../../src/features/particle-portrait';

const $ = <T extends HTMLElement = HTMLElement>(id: string) => {
  const el = document.getElementById(id);
  if (!el) throw new Error(`#${id} missing`);
  return el as T;
};

const stage = $('stage');
const canvas = $<HTMLCanvasElement>('canvas');
const density = $<HTMLSelectElement>('density');
const force = $<HTMLInputElement>('force');
const tone = $<HTMLSelectElement>('tone');
const stateEl = $('state');
const label = document.querySelector<HTMLElement>('.stage-label')!;
const source = document.querySelector<HTMLImageElement>('.source')!;
const PARTICLE_CONTROLS = ['particles', 'density', 'force', 'tone', 'scatter', 'pause', 'reset'];
const TONES: Tone[] = ['amber', 'ivory', 'green', 'botanical'];
const STATE_TEXT: Record<PortraitState, string> = {
  responding: 'RESPONDING',
  scattering: 'SCATTERING',
  reforming: 'REFORMING',
  paused: 'PAUSED',
  inactive: 'SOURCE IMAGE',
  'context-lost': 'CONTEXT LOST',
  failed: 'CONTEXT LOST',
};

const reduced = matchMedia('(prefers-reduced-motion: reduce)');
let paused = reduced.matches;
let photo = false;
let renderer: ParticleRenderer | null = null;

function settingsFromControls() {
  return {
    step: Number(density.value) as SampleStep,
    force: Number(force.value) / 100,
    tone: TONES[Number(tone.value)] ?? 'amber',
  };
}

function setControlsDisabled(disabled: boolean) {
  for (const id of PARTICLE_CONTROLS) ($(id) as HTMLButtonElement).disabled = disabled;
}

function fallback(state: string) {
  renderer?.dispose();
  renderer = null;
  stage.classList.add('photo');
  $('renderer').textContent = 'IMAGE';
  stateEl.textContent = state;
  $('count').textContent = '—';
  $('hint').textContent = 'STATIC PORTRAIT';
  setControlsDisabled(true);
}

function updatePause() {
  $('pause').setAttribute('aria-pressed', String(paused));
  $('pause').textContent = paused ? 'Resume motion' : 'Pause motion';
  if (!renderer) return;
  if (paused) renderer.pause();
  else renderer.resume();
}

function mode(showSource: boolean) {
  // Without a live renderer the static image is the only content: never hide it.
  if (!renderer) showSource = true;
  photo = showSource;
  stage.classList.toggle('photo', showSource);
  $('particles').setAttribute('aria-pressed', String(!showSource));
  $('photo').setAttribute('aria-pressed', String(showSource));
  if (!renderer) return;
  $('hint').textContent = showSource ? 'STATIC SOURCE / GENERATED PORTRAIT' : 'MOVE TO DISTURB · CLICK TO SCATTER';
  if (showSource) {
    renderer.setActive(false);
  } else {
    renderer.setActive(true);
    updatePause();
    renderer.redraw();
  }
}

function scatter() {
  if (!renderer) return;
  mode(false);
  if (paused) {
    stateEl.textContent = 'PAUSED — RESUME TO SCATTER';
    return;
  }
  renderer.scatter();
}

function updateCount() {
  $('count').textContent = renderer ? renderer.pointCount.toLocaleString() : '—';
}

let contextLost = false;

function onState(state: PortraitState) {
  if (state === 'failed') return fallback('CONTEXT LOST');
  if (state === 'context-lost') {
    contextLost = true;
    stage.classList.add('photo');
    $('renderer').textContent = 'IMAGE';
    setControlsDisabled(true);
  } else if (contextLost) {
    contextLost = false;
    $('renderer').textContent = 'WEBGL';
    setControlsDisabled(false);
    stage.classList.toggle('photo', photo);
  }
  stateEl.textContent = STATE_TEXT[state];
}

function init(image: HTMLImageElement) {
  const result = createParticleRenderer(canvas, image, {
    pointerTarget: stage,
    sizeTarget: stage,
    paused,
    settings: settingsFromControls(),
  });
  if ('fallback' in result) {
    if (result.error) console.error(result.error);
    fallback('STATIC FALLBACK');
    return;
  }
  renderer = result;
  renderer.on('state', onState);
  if (renderer.state) onState(renderer.state);
  updateCount();
  updatePause();
  if (import.meta.env.DEV) Object.assign(window, { __portraitLab: { get renderer() { return renderer; } } });
}

stage.addEventListener('click', () => {
  if (!photo) scatter();
});
$('scatter').onclick = scatter;
$('photo').onclick = () => mode(true);
$('particles').onclick = () => mode(false);
$('pause').onclick = () => {
  paused = !paused;
  updatePause();
};
density.onchange = () => {
  renderer?.set({ step: Number(density.value) as SampleStep });
  updateCount();
};
tone.onchange = () => {
  label.textContent = 'FIG. 001 / ' + (tone.selectedOptions[0]?.text ?? '').toUpperCase();
  renderer?.set({ tone: TONES[Number(tone.value)] ?? 'amber' });
};
force.oninput = () => {
  $('force-value').textContent = force.value + '%';
  renderer?.set({ force: Number(force.value) / 100 });
};
$('reset').onclick = () => {
  density.value = '2';
  tone.value = '0';
  force.value = '55';
  $('force-value').textContent = '55%';
  label.textContent = 'FIG. 001 / AMBER';
  paused = reduced.matches;
  if (renderer) {
    renderer.resetMotion();
    renderer.set(settingsFromControls());
    updateCount();
  }
  mode(false);
};
$('about').onclick = () => $<HTMLDialogElement>('dialog').showModal();
$('close').onclick = () => $<HTMLDialogElement>('dialog').close();
reduced.addEventListener('change', (e) => {
  paused = e.matches;
  updatePause();
});

const image = new Image();
image.onload = () => init(image);
image.onerror = () => fallback('IMAGE UNAVAILABLE');
image.src = source.src;
