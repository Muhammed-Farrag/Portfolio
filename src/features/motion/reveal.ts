// Scroll reveals and the motion preference as a root attribute, for CSS.
//
// Elements marked `data-reveal` rise and fade in once, the first time they come into view. The
// hidden starting state only applies under `:root[data-motion='playing']`, which is set here, so
// the content is fully visible without JavaScript, under reduced motion and when paused.
import { useEffect } from 'react';
import { isMotionPaused, onMotionChange } from './motion';

export function useSiteMotion(): void {
  useEffect(() => {
    const root = document.documentElement;
    const sync = () => (root.dataset.motion = isMotionPaused() ? 'paused' : 'playing');
    sync();
    const stop = onMotionChange(sync);

    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (!e.isIntersecting) continue;
          (e.target as HTMLElement).dataset.inview = '';
          io.unobserve(e.target);
        }
      },
      { rootMargin: '0px 0px -12% 0px' },
    );
    const observe = () => document.querySelectorAll('[data-reveal]:not([data-inview])').forEach((el) => io.observe(el));
    observe();
    // Sections may mount content later (for example once an image has loaded).
    const mo = new MutationObserver(observe);
    mo.observe(document.getElementById('main') ?? document.body, { childList: true, subtree: true });
    return () => {
      stop();
      io.disconnect();
      mo.disconnect();
    };
  }, []);
}
