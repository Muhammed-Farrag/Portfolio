// The Particle Portrait renderer as a framework-independent module.
//
// Every number and formula in draw(), tick(), scatter() and the pointer mapping is carried over
// from legacy/particle-portrait/portrait.js. What is new is lifecycle only: settings arrive
// through set() instead of being read from DOM controls each frame, listeners are scoped to an
// AbortController and released by dispose(), rendering stops while the canvas is off-screen,
// state is emitted only when it changes, and a lost WebGL context is rebuilt on restore.
// Two hooks for the site's Hero add nothing to the legacy maths and are inert by default:
// assemble() plays the reform half of the legacy scatter curve, and setExit() adds a
// scroll-driven offset to uBurst.

import { FRAGMENT, VERTEX } from './shaders';
import { DEFAULT_THRESHOLD, POINT_STRIDE, SAMPLE_SIZE, rasterise, samplePortrait, type SampleStep } from './sampling';

export type Rgb = readonly [number, number, number];
export type Tone = 'amber' | 'ivory' | 'green' | 'moonlight';

export interface TonePalette {
  low: Rgb;
  high: Rgb;
  accentLow: Rgb;
  accentHigh: Rgb;
}

export interface PortraitSettings {
  /** Sampling stride: 2 Ultra, 3 Fine, 4 Soft (legacy select values). */
  step: SampleStep;
  /** Pointer reaction, 0..1 (legacy slider value / 100). */
  force: number;
  tone: Tone;
  threshold: number;
  /** Canvas clear colour, 0..255 per channel. */
  background: Rgb;
  palette: TonePalette;
}

export type PortraitState =
  | 'responding'
  | 'scattering'
  | 'reforming'
  | 'paused'
  | 'inactive'
  | 'context-lost'
  | 'failed';

export type FallbackReason = 'no-webgl' | 'shader-error' | 'tainted-image';

export interface RendererOptions {
  /** Element whose pointer movement displaces particles. Defaults to the canvas's parent. */
  pointerTarget?: HTMLElement;
  /** Element whose box sets the canvas size. Defaults to the canvas's parent. */
  sizeTarget?: HTMLElement;
  paused?: boolean;
  settings?: Partial<PortraitSettings>;
}

/** The prototype's warm-black stage colour (#110E0A). */
export const LEGACY_BACKGROUND: Rgb = [17, 14, 10];
/** Oxford Blue, the portfolio background. */
export const PORTFOLIO_BACKGROUND: Rgb = [0x02, 0x12, 0x2f];
/** Steel → Moonlight, with Steel → Frost Blue as the cool highlight on the tie. */
export const PORTFOLIO_PALETTE: TonePalette = {
  low: [0x49, 0x5b, 0x7d],
  high: [0xf0, 0xec, 0xdd],
  accentLow: [0x49, 0x5b, 0x7d],
  accentHigh: [0x8b, 0xa3, 0xc5],
};

export const DEFAULT_SETTINGS: PortraitSettings = {
  step: 2,
  force: 0.55,
  tone: 'amber',
  threshold: DEFAULT_THRESHOLD,
  background: LEGACY_BACKGROUND,
  palette: PORTFOLIO_PALETTE,
};

const TONE_INDEX: Record<Tone, number> = { amber: 0, ivory: 1, green: 2, moonlight: 3 };
const UNIFORMS = ['uResolution', 'uScale', 'uPoint', 'uTime', 'uBurst', 'uForce', 'uTone', 'uMouse', 'uLow', 'uHigh', 'uAccLow', 'uAccHigh'] as const;
type UniformName = (typeof UNIFORMS)[number];
const OFF: [number, number] = [-9, -9];
/** Length of a scatter-and-reform pulse in seconds. */
const PULSE = 2.6;

type Listener = (state: PortraitState) => void;

/**
 * The renderer's WebGL context attributes. A caller that probes a canvas for WebGL before
 * creating the renderer must use these, because the first getContext() call fixes them.
 */
export const CONTEXT_ATTRIBUTES: WebGLContextAttributes = { alpha: false, antialias: false };

export function createParticleRenderer(
  canvas: HTMLCanvasElement,
  image: CanvasImageSource,
  options: RendererOptions = {},
): ParticleRenderer | { fallback: FallbackReason; error?: unknown } {
  const gl = canvas.getContext('webgl', CONTEXT_ATTRIBUTES);
  if (!gl) return { fallback: 'no-webgl' };
  let pixels: Uint8ClampedArray;
  try {
    pixels = rasterise(image);
  } catch (error) {
    return { fallback: 'tainted-image', error };
  }
  try {
    return new ParticleRenderer(canvas, gl, pixels, options);
  } catch (error) {
    return { fallback: 'shader-error', error };
  }
}

export class ParticleRenderer {
  private settings: PortraitSettings;
  private program: WebGLProgram | null = null;
  private buffer: WebGLBuffer | null = null;
  private uniforms = {} as Record<UniformName, WebGLUniformLocation | null>;
  private points: Float32Array = new Float32Array();
  private loaded = false;
  private disposed = false;
  private paused: boolean;
  private active = true;
  private inView = true;
  private raf = 0;
  private last = 0;
  private time = 0;
  private burst = 0;
  private pulse = 0;
  private exit = 0;
  private pulseScale = 1;
  private mouse: [number, number] = [...OFF];
  private target: [number, number] = [...OFF];
  private inside = false;
  private current: PortraitState | null = null;
  private readonly listeners = new Set<Listener>();
  private readonly abort = new AbortController();
  private readonly resizeObserver: ResizeObserver;
  private readonly intersectionObserver: IntersectionObserver;
  private readonly pointerTarget: HTMLElement;
  private readonly sizeTarget: HTMLElement;

  constructor(
    private readonly canvas: HTMLCanvasElement,
    private readonly gl: WebGLRenderingContext,
    private readonly pixels: Uint8ClampedArray,
    options: RendererOptions,
  ) {
    const parent = canvas.parentElement ?? canvas;
    this.pointerTarget = options.pointerTarget ?? parent;
    this.sizeTarget = options.sizeTarget ?? parent;
    this.settings = { ...DEFAULT_SETTINGS, ...options.settings };
    this.paused = options.paused ?? false;

    this.initGL();
    this.loaded = true;
    this.resample();
    this.resize();

    const signal = this.abort.signal;
    this.pointerTarget.addEventListener('pointermove', (e) => this.onPointerMove(e), { signal });
    this.pointerTarget.addEventListener('pointerleave', () => this.release(), { signal });
    document.addEventListener('visibilitychange', () => (document.hidden ? this.stop() : this.start()), { signal });
    window.addEventListener('resize', () => this.resize(), { signal });
    canvas.addEventListener('webglcontextlost', (e) => this.onContextLost(e), { signal });
    canvas.addEventListener('webglcontextrestored', () => this.onContextRestored(), { signal });
    this.resizeObserver = new ResizeObserver(() => this.resize());
    this.resizeObserver.observe(this.sizeTarget);
    this.intersectionObserver = new IntersectionObserver((entries) => {
      const entry = entries[entries.length - 1];
      if (!entry) return;
      this.inView = entry.isIntersecting;
      if (this.inView) this.start();
      else this.stop();
    });
    this.intersectionObserver.observe(canvas);

    if (this.paused) this.pause();
    else this.start();
  }

  get pointCount(): number {
    return this.points.length / POINT_STRIDE;
  }

  get state(): PortraitState | null {
    return this.current;
  }

  /** True while an animation frame is scheduled. */
  get running(): boolean {
    return this.raf !== 0;
  }

  getSettings(): Readonly<PortraitSettings> {
    return this.settings;
  }

  on(event: 'state', listener: Listener): () => void {
    if (event !== 'state') throw new Error(`unknown event ${event}`);
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  set(partial: Partial<PortraitSettings>): void {
    const resample =
      (partial.step !== undefined && partial.step !== this.settings.step) ||
      (partial.threshold !== undefined && partial.threshold !== this.settings.threshold);
    this.settings = { ...this.settings, ...partial };
    if (resample) this.resample();
    this.draw();
  }

  pause(): void {
    this.paused = true;
    this.stop();
    this.pulse = this.burst = 0;
    this.mouse = [...OFF];
    this.target = [...OFF];
    this.emit('paused', true);
    this.draw();
  }

  resume(): void {
    this.paused = false;
    this.start();
  }

  /** Inactive while another view (the static source image) is shown in place of the canvas. */
  setActive(active: boolean): void {
    this.active = active;
    if (active) {
      this.start();
    } else {
      this.stop();
      this.emit('inactive', true);
    }
  }

  /** Starts the 2.6 s scatter-and-reform pulse. Returns false when paused or not ready. */
  scatter(): boolean {
    if (!this.loaded || this.paused) return false;
    this.pulse = PULSE;
    this.pulseScale = 1;
    this.start();
    return true;
  }

  /**
   * Starts scattered and reforms along the second half of the legacy pulse (1.3 s), as an
   * entrance. `strength` scales the legacy burst (1 = as far as a full scatter). Returns false
   * when paused or not ready.
   */
  assemble(strength = 1): boolean {
    if (!this.loaded || this.paused) return false;
    this.pulse = PULSE / 2;
    this.pulseScale = Math.max(0, Math.min(1, strength));
    this.start();
    return true;
  }

  /** Extra scatter, added to uBurst while the canvas is drawn (0 = none). Ignored while paused. */
  setExit(amount: number): void {
    const next = Math.max(0, Math.min(1, amount));
    if (next === this.exit) return;
    this.exit = next;
    if (!this.paused && !this.running) this.draw();
  }

  /** Clears any running pulse and pointer influence (legacy Reset). */
  resetMotion(): void {
    this.pulse = this.burst = 0;
    this.mouse = [...OFF];
    this.target = [...OFF];
  }

  /** Pointer position in CSS pixels relative to the viewport. */
  pointer(clientX: number, clientY: number): void {
    const r = this.pointerTarget.getBoundingClientRect();
    const s = Math.min(r.width, r.height) * 0.98;
    this.target = [(clientX - r.left - r.width / 2) / s, -(clientY - r.top - r.height / 2) / s];
    if (!this.inside) {
      this.mouse = [...this.target];
      this.inside = true;
    }
  }

  release(): void {
    this.target = [...OFF];
    this.inside = false;
  }

  redraw(): void {
    this.draw();
  }

  resize(): void {
    if (this.disposed) return;
    const d = Math.min(window.devicePixelRatio || 1, 2);
    const r = this.sizeTarget.getBoundingClientRect();
    const width = Math.round(r.width * d);
    const height = Math.round(r.height * d);
    if (this.canvas.width !== width || this.canvas.height !== height) {
      this.canvas.width = width;
      this.canvas.height = height;
    }
    if (this.loaded) {
      this.gl.viewport(0, 0, this.canvas.width, this.canvas.height);
      this.draw();
    }
  }

  dispose(): void {
    if (this.disposed) return;
    this.disposed = true;
    this.stop();
    this.abort.abort();
    this.resizeObserver.disconnect();
    this.intersectionObserver.disconnect();
    this.listeners.clear();
    if (!this.gl.isContextLost()) {
      this.gl.deleteBuffer(this.buffer);
      this.gl.deleteProgram(this.program);
    }
    this.loaded = false;
    // The context itself is left alive on purpose: a renderer re-created on the same canvas
    // (React StrictMode, hot reload) receives the same context from getContext().
  }

  private initGL(): void {
    const gl = this.gl;
    const program = gl.createProgram();
    if (!program) throw new Error('createProgram failed');
    const vertex = this.compile(gl.VERTEX_SHADER, VERTEX);
    const fragment = this.compile(gl.FRAGMENT_SHADER, FRAGMENT);
    gl.attachShader(program, vertex);
    gl.attachShader(program, fragment);
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(program) ?? 'link failed');
    gl.deleteShader(vertex);
    gl.deleteShader(fragment);
    gl.useProgram(program);
    const buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    for (const [name, size, offset] of [['aPosition', 2, 0], ['aColor', 3, 8]] as const) {
      const loc = gl.getAttribLocation(program, name);
      gl.enableVertexAttribArray(loc);
      gl.vertexAttribPointer(loc, size, gl.FLOAT, false, POINT_STRIDE * 4, offset);
    }
    for (const name of UNIFORMS) this.uniforms[name] = gl.getUniformLocation(program, name);
    this.program = program;
    this.buffer = buffer;
  }

  private compile(type: number, source: string): WebGLShader {
    const gl = this.gl;
    const shader = gl.createShader(type);
    if (!shader) throw new Error('createShader failed');
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(shader) ?? 'compile failed');
    return shader;
  }

  private resample(): void {
    this.points = samplePortrait(this.pixels, SAMPLE_SIZE, this.settings.step, this.settings.threshold);
    this.upload();
  }

  private upload(): void {
    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.buffer);
    this.gl.bufferData(this.gl.ARRAY_BUFFER, this.points, this.gl.STATIC_DRAW);
  }

  private draw(): void {
    if (!this.loaded) return;
    const gl = this.gl;
    const u = this.uniforms;
    const { step, force, tone, background, palette } = this.settings;
    const scale = Math.min(this.canvas.width, this.canvas.height) * 0.98;
    gl.clearColor(background[0] / 255, background[1] / 255, background[2] / 255, 1);
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.uniform2f(u.uResolution, this.canvas.width, this.canvas.height);
    gl.uniform1f(u.uScale, scale);
    gl.uniform1f(u.uPoint, Math.max(0.8, (scale / 600) * step * 1.08));
    gl.uniform1f(u.uTime, this.paused ? 0 : this.time);
    gl.uniform1f(u.uBurst, this.burst + (this.paused ? 0 : this.exit));
    gl.uniform1f(u.uForce, this.paused ? 0 : force);
    gl.uniform1f(u.uTone, TONE_INDEX[tone]);
    gl.uniform2fv(u.uMouse, this.mouse);
    gl.uniform3f(u.uLow, palette.low[0] / 255, palette.low[1] / 255, palette.low[2] / 255);
    gl.uniform3f(u.uHigh, palette.high[0] / 255, palette.high[1] / 255, palette.high[2] / 255);
    gl.uniform3f(u.uAccLow, palette.accentLow[0] / 255, palette.accentLow[1] / 255, palette.accentLow[2] / 255);
    gl.uniform3f(u.uAccHigh, palette.accentHigh[0] / 255, palette.accentHigh[1] / 255, palette.accentHigh[2] / 255);
    gl.drawArrays(gl.POINTS, 0, this.pointCount);
  }

  private readonly tick = (now: number): void => {
    this.raf = 0;
    if (!this.canRun()) return;
    const dt = Math.min((now - this.last) / 1000, 0.04);
    this.last = now;
    this.time += dt;
    if (this.pulse > 0) {
      this.pulse = Math.max(0, this.pulse - dt);
      this.burst = Math.sin(Math.PI * (1 - this.pulse / PULSE)) ** 2 * 0.82 * this.pulseScale;
      this.emit(this.pulse > 1.3 ? 'scattering' : 'reforming');
    } else {
      this.burst = 0;
      this.emit('responding');
    }
    for (let i = 0; i < 2; i++) this.mouse[i]! += (this.target[i]! - this.mouse[i]!) * 0.16;
    this.draw();
    this.raf = requestAnimationFrame(this.tick);
  };

  private canRun(): boolean {
    return this.loaded && !this.disposed && !this.paused && this.active && this.inView && !document.hidden;
  }

  private start(): void {
    if (this.raf || !this.canRun()) return;
    this.last = performance.now();
    this.raf = requestAnimationFrame(this.tick);
  }

  private stop(): void {
    if (this.raf) cancelAnimationFrame(this.raf);
    this.raf = 0;
  }

  private onPointerMove(e: PointerEvent): void {
    this.pointer(e.clientX, e.clientY);
  }

  private onContextLost(e: Event): void {
    e.preventDefault();
    this.loaded = false;
    this.stop();
    this.emit('context-lost', true);
  }

  private onContextRestored(): void {
    if (this.disposed) return;
    try {
      this.initGL();
      this.upload();
      this.loaded = true;
      this.resize();
      if (this.paused) this.pause();
      else {
        this.current = null;
        this.start();
      }
    } catch (error) {
      console.error(error);
      this.emit('failed', true);
    }
  }

  private emit(state: PortraitState, force = false): void {
    if (!force && state === this.current) return;
    this.current = state;
    for (const listener of this.listeners) listener(state);
  }
}
