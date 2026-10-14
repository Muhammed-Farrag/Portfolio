import { CORE_RADIUS, NODES, NODE_RADIUS, edges, leaders, LABEL_X } from '../features/story/approachDiagram';
import './ApproachFigure.css';

export const APPROACH_FIGURE_ID = 'approach-figure';

/**
 * The four layers as real content: an ordered list whose items sit beside the diagram's nodes.
 * The SVG is the still version of the diagram (reduced motion, paused, no WebGL); while the
 * particles are live they form the same shape and the SVG steps back (data-live).
 */
export function ApproachFigure() {
  // SVG y points down; the diagram's y points up.
  return (
    <figure id={APPROACH_FIGURE_ID} className="approach-figure" data-live="false">
      <svg className="approach-figure__still" viewBox="-0.5 -0.5 1 1" aria-hidden="true">
        {edges().map((e, k) => (
          <line key={`e${k}`} className="approach-figure__edge" x1={e.x1} y1={-e.y1} x2={e.x2} y2={-e.y2} />
        ))}
        {leaders().map((e, k) => (
          <line key={`l${k}`} className="approach-figure__leader" x1={e.x1} y1={-e.y1} x2={e.x2} y2={-e.y2} />
        ))}
        {NODES.map((n) => (
          <g key={n.label}>
            <circle className="approach-figure__ring" cx={n.x} cy={-n.y} r={NODE_RADIUS} />
            <circle className="approach-figure__core" cx={n.x} cy={-n.y} r={CORE_RADIUS} />
          </g>
        ))}
      </svg>
      <ol className="approach-figure__layers">
        {NODES.map((n, k) => (
          <li key={n.label} style={{ left: `${(LABEL_X + 0.5) * 100}%`, top: `${(0.5 - n.y) * 100}%` }}>
            <span className="approach-figure__index" aria-hidden="true">
              {String(k + 1).padStart(2, '0')}
            </span>
            {n.label}
          </li>
        ))}
      </ol>
      <figcaption className="visually-hidden">The four layers, from intelligence to operations.</figcaption>
    </figure>
  );
}
