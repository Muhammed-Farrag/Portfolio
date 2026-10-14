import { useCallback, useEffect, useRef, useState, type CSSProperties, type KeyboardEvent, type PointerEvent } from 'react';
import { useMotionPaused } from '../../features/motion/motion';

/** Game rules from the HELIOS README (docs/CONTENT_APPROVAL.md). */
const MAGAZINE = 10;
const RELOAD_MS = 1000;
const COMBO_MS = 1000;
/** Hit radius around the target centre, as a fraction of the view's width. */
const HIT_RADIUS = 0.075;

interface Point {
  x: number;
  y: number;
}

const randomTarget = (): Point => ({ x: 0.2 + Math.random() * 0.6, y: 0.25 + Math.random() * 0.5 });

/**
 * A simulation of HELIOS's gesture logic: Point (A) to aim, Pinch (F) to fire, hold Fist (R) to
 * reload. Inside the view the reticle follows a mouse; from the keyboard, aiming locks onto the
 * target. No camera is used.
 */
export function HeliosConsole() {
  const paused = useMotionPaused();
  const viewRef = useRef<HTMLDivElement>(null);
  const [aiming, setAiming] = useState(false);
  const [rounds, setRounds] = useState(MAGAZINE);
  const [combo, setCombo] = useState(0);
  const [hits, setHits] = useState(0);
  const [target, setTarget] = useState<Point>({ x: 0.62, y: 0.42 });
  const [reticle, setReticle] = useState<Point | null>(null);
  const [reloading, setReloading] = useState(false);
  const [flash, setFlash] = useState<'hit' | 'miss' | null>(null);
  const [status, setStatus] = useState('Point to aim.');
  const lastHit = useRef(0);
  const reloadTimer = useRef(0);
  const flashTimer = useRef(0);

  useEffect(
    () => () => {
      clearTimeout(reloadTimer.current);
      clearTimeout(flashTimer.current);
    },
    [],
  );

  const point = useCallback(() => {
    setAiming(true);
    setStatus(rounds ? `Aiming. ${rounds} of ${MAGAZINE} rounds.` : 'Aiming. Magazine empty: make a fist to reload.');
  }, [rounds]);

  const fire = useCallback(() => {
    if (reloading) return;
    if (!aiming) return setStatus('Point first, then pinch to fire.');
    if (!rounds) return setStatus('Magazine empty: make a fist to reload.');
    const aim = reticle ?? target;
    const hit = Math.hypot(aim.x - target.x, (aim.y - target.y) * 0.625) < HIT_RADIUS;
    const left = rounds - 1;
    setRounds(left);
    clearTimeout(flashTimer.current);
    setFlash(hit ? 'hit' : 'miss');
    flashTimer.current = window.setTimeout(() => setFlash(null), 260);
    if (hit) {
      const now = performance.now();
      const nextCombo = now - lastHit.current <= COMBO_MS ? combo + 1 : 1;
      lastHit.current = now;
      setCombo(nextCombo);
      setHits((h) => h + 1);
      setTarget(randomTarget());
      setStatus(`Hit${nextCombo > 1 ? `, combo ×${nextCombo}` : ''}. ${left} of ${MAGAZINE} rounds.`);
    } else {
      setCombo(0);
      setStatus(`Miss. ${left} of ${MAGAZINE} rounds.`);
    }
  }, [aiming, combo, reloading, reticle, rounds, target]);

  const startReload = useCallback(() => {
    if (reloading || rounds === MAGAZINE) return;
    setReloading(true);
    setStatus('Hold the fist to reload…');
    reloadTimer.current = window.setTimeout(() => {
      setReloading(false);
      setRounds(MAGAZINE);
      setStatus(`Reloaded. ${MAGAZINE} of ${MAGAZINE} rounds.`);
    }, RELOAD_MS);
  }, [reloading, rounds]);

  const cancelReload = useCallback(() => {
    if (!reloading) return;
    clearTimeout(reloadTimer.current);
    setReloading(false);
    setStatus('Reload cancelled: hold the fist for about a second.');
  }, [reloading]);

  const onKeyDown = (e: KeyboardEvent) => {
    if (e.repeat || e.altKey || e.ctrlKey || e.metaKey) return;
    const key = e.key.toLowerCase();
    if (key === 'a') point();
    else if (key === 'f') fire();
    else if (key === 'r') startReload();
    else return;
    e.preventDefault();
  };
  const onKeyUp = (e: KeyboardEvent) => e.key.toLowerCase() === 'r' && cancelReload();

  const track = (e: PointerEvent<HTMLDivElement>) => {
    if (e.pointerType !== 'mouse' || paused) return;
    const box = e.currentTarget.getBoundingClientRect();
    setReticle({ x: (e.clientX - box.left) / box.width, y: (e.clientY - box.top) / box.height });
    if (!aiming) setAiming(true);
  };

  const shown = aiming ? (reticle ?? target) : null;

  return (
    <div className="helios theme-deep" onKeyDown={onKeyDown} onKeyUp={onKeyUp}>
      <div
        ref={viewRef}
        className="helios__view"
        data-flash={flash ?? undefined}
        onPointerMove={track}
        onPointerLeave={() => setReticle(null)}
        onClick={(e) => (e.nativeEvent as globalThis.PointerEvent).pointerType === 'mouse' && fire()}
        aria-hidden="true"
      >
        <div className="helios__horizon" />
        <div className="helios__sun" style={{ left: `${target.x * 100}%`, top: `${target.y * 100}%` }}>
          {Array.from({ length: 24 }, (_, k) => (
            <i key={k} style={{ '--k': k } as CSSProperties} />
          ))}
        </div>
        {shown && <div className="helios__reticle" data-locked={!reticle || undefined} style={{ left: `${shown.x * 100}%`, top: `${shown.y * 100}%` }} />}
        <div className="helios__hud mono">
          <span>{aiming ? 'Aim · on' : 'Aim · off'}</span>
          <span>Hits {hits}</span>
          <span data-hot={combo > 1 || undefined}>Combo ×{combo}</span>
        </div>
      </div>
      <div className="helios__gauge" aria-hidden="true">
        {Array.from({ length: MAGAZINE }, (_, k) => (
          <i key={k} data-full={k < rounds || undefined} />
        ))}
        <span className="helios__reload" data-active={reloading || undefined} />
      </div>
      <div className="helios__controls" role="group" aria-label="Gestures">
        <button type="button" className="helios__gesture" onClick={point} aria-keyshortcuts="A">
          <span className="helios__key" aria-hidden="true">A</span> Point to aim
        </button>
        <button type="button" className="helios__gesture" onClick={fire} aria-keyshortcuts="F">
          <span className="helios__key" aria-hidden="true">F</span> Pinch to fire
        </button>
        <button
          type="button"
          className="helios__gesture"
          aria-keyshortcuts="R"
          onPointerDown={startReload}
          onPointerUp={cancelReload}
          onPointerLeave={cancelReload}
          onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && !e.repeat && (e.preventDefault(), startReload())}
          onKeyUp={(e) => (e.key === 'Enter' || e.key === ' ') && cancelReload()}
        >
          <span className="helios__key" aria-hidden="true">R</span> Hold fist to reload
        </button>
      </div>
      <p className="helios__status" role="status">
        {rounds} of {MAGAZINE} rounds. {status}
      </p>
      <p className="helios__note mono">Simulation of the game’s gesture logic. No camera is used on this page.</p>
    </div>
  );
}
