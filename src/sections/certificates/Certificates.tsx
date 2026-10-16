import { useEffect, useRef, useState, type CSSProperties } from 'react';
import { certificates, monthYear, type Certificate } from '../../content/certificates';
import type { SectionDef } from '../../content/site';
import { useMotionPaused } from '../../features/motion/motion';
import './Certificates.css';

const ROWS = [certificates.filter((_, i) => i % 2 === 0), certificates.filter((_, i) => i % 2 === 1)];
const issuers = new Set(certificates.map((c) => c.issuer)).size;

function Card({ c, tilt, onOpen, copy }: { c: Certificate; tilt: number; onOpen: (c: Certificate) => void; copy: boolean }) {
  return (
    <li className="cert" style={{ '--tilt': `${tilt}deg` } as CSSProperties} aria-hidden={copy || undefined}>
      <button type="button" className="cert__button" onClick={() => onOpen(c)} tabIndex={copy ? -1 : undefined} aria-label={`${c.title}, ${c.issuer}, ${monthYear(c.date)}. Open the certificate.`}>
        <span className="cert__sticker mono" data-topic={c.topic}>
          {c.topic}
        </span>
        <img src={c.card} alt="" width={560} height={Math.round((560 * c.height) / c.width)} loading="lazy" decoding="async" />
        <span className="cert__title">{c.title}</span>
        <span className="cert__meta mono">
          {c.issuer} · {monthYear(c.date)}
        </span>
      </button>
    </li>
  );
}

/**
 * Certificates: two rows of cards drifting in opposite directions. Hovering or focusing a row stops
 * it; a card opens the full certificate in a dialog. With motion paused the rows stand still and
 * scroll sideways instead.
 */
export function Certificates({ s }: { s: SectionDef }) {
  const paused = useMotionPaused();
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [open, setOpen] = useState<Certificate | null>(null);
  const index = open ? certificates.indexOf(open) : -1;

  useEffect(() => {
    const d = dialogRef.current!;
    if (open && !d.open) d.showModal();
    if (!open && d.open) d.close();
  }, [open]);

  const step = (by: number) => setOpen(certificates[(index + by + certificates.length) % certificates.length]!);

  return (
    <section id={s.id} className={`section certs theme-${s.theme}`} data-beat="Certificates" data-beat-min="9000" data-beat-effect="cards" data-motion-state={paused ? 'paused' : 'playing'} aria-labelledby={`${s.id}-title`}>
      <div className="container certs__header">
        <p className="eyebrow">{s.eyebrow}</p>
        <h2 id={`${s.id}-title`} className="display section__title">
          {s.title}
        </h2>
        <p className="section__lead">
          {certificates.length} certificates from {issuers} institutions, newest first. Open any card to see it in full.
        </p>
      </div>

      <div className="certs__rows" data-cinema-skip="">
        {ROWS.map((row, r) => (
          <div key={r} className="certs__row" data-direction={r ? 'right' : 'left'} style={{ '--count': row.length } as CSSProperties}>
            <ul className="certs__track" aria-label={r ? 'Certificates, second row' : 'Certificates, first row'}>
              {row.map((c, i) => (
                <Card key={c.id} c={c} tilt={((i + r) % 3) - 1} onOpen={setOpen} copy={false} />
              ))}
              {/* A second pass of the same cards makes the drift seamless; it is hidden from assistive tech. */}
              {!paused && row.map((c, i) => <Card key={`${c.id}-copy`} c={c} tilt={((i + r) % 3) - 1} onOpen={setOpen} copy />)}
            </ul>
          </div>
        ))}
      </div>

      <dialog ref={dialogRef} className="certs__dialog theme-deep" aria-labelledby="cert-dialog-title" onClose={() => setOpen(null)} onClick={(e) => e.target === e.currentTarget && setOpen(null)}>
        {open && (
          <figure className="certs__figure">
            <img src={open.full} alt={`Certificate: ${open.title}, ${open.issuer}, ${monthYear(open.date)}.`} width={open.width} height={open.height} />
            <figcaption>
              <span className="cert__sticker mono" data-topic={open.topic}>
                {open.topic}
              </span>
              <h3 id="cert-dialog-title" className="certs__dialog-title">
                {open.title}
              </h3>
              <p className="mono certs__dialog-meta">
                {open.issuer} · {open.platform} · {monthYear(open.date)} · {index + 1} / {certificates.length}
              </p>
            </figcaption>
            <div className="certs__nav">
              <button type="button" className="button" onClick={() => step(-1)}>
                <span aria-hidden="true">←</span> Previous
              </button>
              <button type="button" className="button" onClick={() => step(1)}>
                Next <span aria-hidden="true">→</span>
              </button>
              <button type="button" className="button certs__close" onClick={() => setOpen(null)} autoFocus>
                Close
              </button>
            </div>
          </figure>
        )}
      </dialog>
    </section>
  );
}
