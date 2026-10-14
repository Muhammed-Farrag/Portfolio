import type { ReactNode } from 'react';
import './Pending.css';

/**
 * Marks work or content that is not ready. Visible in development and preview builds only:
 * production builds render nothing, so a placeholder can never reach the public site.
 */
export function Pending({ children, block = false }: { children: ReactNode; block?: boolean }) {
  if (!import.meta.env.DEV && import.meta.env.VITE_SHOW_PENDING !== 'true') return null;
  const Tag = block ? 'div' : 'p';
  return (
    <Tag className={block ? 'pending pending--block' : 'pending'} data-pending="">
      <span className="pending__tag">In progress</span> {children}
    </Tag>
  );
}
