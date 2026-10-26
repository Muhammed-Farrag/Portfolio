import { useEffect, useId, useRef } from 'react';
import { monthYear, type Certificate } from '../../content/certificates';
import './CertificateDialog.css';

/**
 * The full certificate in a modal dialog, with Previous and Next through `list` (wrapping round).
 * `open` is the certificate shown, or null; `onOpen` moves to another or closes (null).
 */
export function CertificateDialog({ list, open, onOpen }: { list: Certificate[]; open: Certificate | null; onOpen: (c: Certificate | null) => void }) {
  const ref = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  const index = open ? list.indexOf(open) : -1;

  useEffect(() => {
    const d = ref.current!;
    if (open && !d.open) d.showModal();
    if (!open && d.open) d.close();
  }, [open]);

  const step = (by: number) => onOpen(list[(index + by + list.length) % list.length]!);

  return (
    <dialog ref={ref} className="certs__dialog theme-deep" aria-labelledby={titleId} onClose={() => onOpen(null)} onClick={(e) => e.target === e.currentTarget && onOpen(null)}>
      {open && (
        <figure className="certs__figure">
          <img src={open.full} alt={`Certificate: ${open.title}, ${open.issuer}, ${monthYear(open.date)}.`} width={open.width} height={open.height} />
          <figcaption>
            <span className="cert__sticker mono" data-topic={open.topic}>
              {open.topic}
            </span>
            <h3 id={titleId} className="certs__dialog-title">
              {open.title}
            </h3>
            <p className="mono certs__dialog-meta">
              {open.issuer} · {open.platform} · {monthYear(open.date)}
              {list.length > 1 && ` · ${index + 1} / ${list.length}`}
            </p>
          </figcaption>
          <div className="certs__nav">
            {list.length > 1 && (
              <>
                <button type="button" className="button" onClick={() => step(-1)}>
                  <span aria-hidden="true">←</span> Previous
                </button>
                <button type="button" className="button" onClick={() => step(1)}>
                  Next <span aria-hidden="true">→</span>
                </button>
              </>
            )}
            <button type="button" className="button certs__close" onClick={() => onOpen(null)} autoFocus>
              Close
            </button>
          </div>
        </figure>
      )}
    </dialog>
  );
}
