import { useCallback, useEffect, useId, useRef, useState, type FocusEvent, type SyntheticEvent } from 'react';
import { nav, profile } from '../../content/site';
import { PaletteSwitcher } from './PaletteSwitcher';
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

  // The glass takes the tone of the section underneath: light glass with Deep text over a light
  // section, so the links stay readable (a dark tint over a light ground would turn grey).
  const headerRef = useRef<HTMLElement>(null);
  useEffect(() => {
    const header = headerRef.current!;
    // The hero is dark; the observer takes over once a section passes under the bar.
    header.dataset.over = 'dark';
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) header.dataset.over = e.target.classList.contains('theme-light') ? 'light' : 'dark';
        }
      },
      // A thin band where the header floats.
      { rootMargin: '-40px 0px -94% 0px' },
    );
    document.querySelectorAll('main > section, footer').forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, []);

  // Desktop hover: one glass pill glides slowly to the link under the pointer (or keyboard focus).
  const glide = (e: SyntheticEvent<HTMLUListElement>) => {
    const link = (e.target as HTMLElement).closest('a');
    if (!link) return;
    const list = e.currentTarget;
    list.style.setProperty('--hx', `${link.offsetLeft}px`);
    list.style.setProperty('--hw', `${link.offsetWidth}px`);
    list.dataset.hover = '';
  };
  const rest = (e: SyntheticEvent<HTMLUListElement>) => {
    if (e.type === 'blur' && e.currentTarget.contains((e as FocusEvent<HTMLUListElement>).relatedTarget as Node)) return;
    delete e.currentTarget.dataset.hover;
  };

  return (
    <header ref={headerRef} className="site-header theme-deep" data-open={open || undefined}>
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
          <ul onPointerOver={glide} onFocus={glide} onPointerLeave={rest} onBlur={rest}>
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
        <PaletteSwitcher />
      </div>
    </header>
  );
}
