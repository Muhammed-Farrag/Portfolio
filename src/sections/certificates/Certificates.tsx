import { useState, type CSSProperties } from 'react';
import { certificates, monthYear, type Certificate } from '../../content/certificates';
import type { SectionDef } from '../../content/site';
import { Starfield } from '../../components/Starfield';
import { useMotionPaused } from '../../features/motion/motion';
import { CertificateDialog } from './CertificateDialog';
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
  const [open, setOpen] = useState<Certificate | null>(null);

  return (
    <section id={s.id} className={`section certs has-stars theme-${s.theme}`} data-motion-state={paused ? 'paused' : 'playing'} aria-labelledby={`${s.id}-title`}>
      <Starfield tone="light" />
      <div className="container certs__header">
        <p className="eyebrow">{s.eyebrow}</p>
        <h2 id={`${s.id}-title`} className="display section__title">
          {s.title}
        </h2>
        <p className="section__lead">
          {certificates.length} certificates from {issuers} institutions, newest first. Open any card to see it in full.
        </p>
      </div>

      <div className="certs__rows">
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

      <CertificateDialog list={certificates} open={open} onOpen={setOpen} />
    </section>
  );
}
