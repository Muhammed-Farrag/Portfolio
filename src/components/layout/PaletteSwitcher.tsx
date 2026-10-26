import { useEffect, useId, useRef, useState } from 'react';
import { PALETTES, setPalette, usePalette, type PaletteId } from '../../features/palette/palette';
import './PaletteSwitcher.css';

/**
 * The colour palette choice in the header: a button showing the current palette's swatches opens
 * a small panel of radio buttons (arrow keys move between them, as for any radio group). Escape,
 * a click outside or choosing closes it, and focus returns to the button.
 */
export function PaletteSwitcher() {
  const current = usePalette();
  const [open, setOpen] = useState(false);
  const panelId = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const active = PALETTES.find((p) => p.id === current)!;

  useEffect(() => {
    if (!open) return;
    rootRef.current?.querySelector<HTMLInputElement>('input:checked')?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return;
      setOpen(false);
      buttonRef.current?.focus();
    };
    const onDown = (e: PointerEvent) => !rootRef.current?.contains(e.target as Node) && setOpen(false);
    document.addEventListener('keydown', onKey);
    document.addEventListener('pointerdown', onDown);
    return () => {
      document.removeEventListener('keydown', onKey);
      document.removeEventListener('pointerdown', onDown);
    };
  }, [open]);

  const choose = (id: PaletteId) => setPalette(id);
  const done = () => {
    setOpen(false);
    buttonRef.current?.focus();
  };

  return (
    <div ref={rootRef} className="palette">
      <button
        ref={buttonRef}
        type="button"
        className="palette__button"
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => setOpen((v) => !v)}
      >
        <Swatches colors={active.swatches} />
        <span className="visually-hidden">Colour palette: {active.name}</span>
      </button>
      <div id={panelId} className="palette__panel theme-deep" hidden={!open}>
        <fieldset>
          <legend className="palette__legend mono">Palette</legend>
          {PALETTES.map((p) => (
            <label key={p.id} className="palette__option">
              <input
                type="radio"
                name={`${panelId}-palette`}
                value={p.id}
                checked={p.id === current}
                onChange={() => choose(p.id)}
                onClick={(e) => e.detail > 0 && done()}
                onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && done()}
              />
              <Swatches colors={p.swatches} />
              <span className="palette__text">
                <span className="palette__name">{p.name}</span>
                <span className="palette__note">{p.note}</span>
              </span>
            </label>
          ))}
        </fieldset>
      </div>
    </div>
  );
}

function Swatches({ colors }: { colors: readonly string[] }) {
  return (
    <span className="palette__swatches" aria-hidden="true">
      {colors.map((c) => (
        <span key={c} style={{ background: c }} />
      ))}
    </span>
  );
}
