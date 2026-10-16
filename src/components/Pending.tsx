import type { ReactNode } from 'react';
import './Pending.css';

/**
 * Marks work or content that is not ready. Visible in development and preview builds only:
 * production builds render nothing, so a placeholder can never reach the public site.
 */
export const SHOW_PENDING = import.meta.env.DEV || import.meta.env.VITE_SHOW_PENDING === 'true';

/** `label` names the kind of mark: work still to build (the default), or draft content the owner will edit. */
export function Pending({ children, block = false, label = 'In progress' }: { children: ReactNode; block?: boolean; label?: string }) {
  if (!SHOW_PENDING) return null;
  const Tag = block ? 'div' : 'p';
  return (
    <Tag className={block ? 'pending pending--block' : 'pending'} data-pending="">
      <span className="pending__tag">{label}</span> {children}
    </Tag>
  );
}
