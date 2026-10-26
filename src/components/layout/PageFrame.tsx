import './PageFrame.css';

/**
 * The page frame: a forest mat around the viewport with rounded inner corners, like a framed
 * print (chosen by the owner on 26 Oct 2026 over an inset line and corner brackets). It is drawn
 * over the page and never takes clicks.
 */
export function PageFrame() {
  return <div className="page-frame" aria-hidden="true" />;
}
