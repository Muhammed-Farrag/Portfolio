import { useCallback, useEffect, useId, useRef, useState } from 'react';
import { nav, profile } from '../../content/site';
import './SiteHeader.css';

const DESKTOP = '(min-width: 900px)';

export function SiteHeader() {
  const [open, setOpen] = useState(false);
  const menuId = useId();
  const toggleRef = useRef<HTMLButtonElement>(null);

  const close = useCallback((returnFocus: boolean) => {
    setOpen(false);
    if (returnFocus) toggleRef.current?.focus();
  }, []);

  // Escape closes the menu; switching to the desktop layout closes it too.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && close(true);
    const mq = matchMedia(DESKTOP);
    const onChange = () => mq.matches && close(false);
    document.addEventListener('keydown', onKey);
    mq.addEventListener('change', onChange);
    return () => {
      document.removeEventListener('keydown', onKey);
      mq.removeEventListener('change', onChange);
    };
  }, [open, close]);

  return (
    <header className="site-header theme-deep" data-open={open || undefined}>
      <div className="container site-header__bar">
        <a className="site-header__brand" href="#top" onClick={() => close(false)}>
          <span className="site-header__mark" aria-hidden="true">MF</span>
          <span className="site-header__name">{profile.name}</span>
        </a>
        <button
          ref={toggleRef}
          type="button"
          className="site-header__toggle"
          aria-expanded={open}
          aria-controls={menuId}
          onClick={() => setOpen((v) => !v)}
        >
          {open ? 'Close' : 'Menu'}
        </button>
        <nav id={menuId} className="site-header__nav" aria-label="Primary">
          <ul>
            {nav.map((item) => (
              <li key={item.id}>
                <a href={`#${item.id}`} onClick={() => close(false)}>
                  {item.label}
                </a>
              </li>
            ))}
            <li>
              <a href={profile.github} rel="noopener noreferrer" target="_blank">
                GitHub <span aria-hidden="true">↗</span>
                <span className="visually-hidden"> (opens in a new tab)</span>
              </a>
            </li>
          </ul>
        </nav>
      </div>
    </header>
  );
}
