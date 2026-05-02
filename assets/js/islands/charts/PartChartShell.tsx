// Shared frame for per-part charts. Each part's chart island wraps its
// visualization in this shell to get consistent typography, the part
// kicker, and a TODO badge for placeholders.

import type { ReactNode } from 'react';

export interface PartChartShellProps {
  partTitle: string;
  governingConcept: string;
  status?: 'live' | 'placeholder';
  children: ReactNode;
}

export const PartChartShell = ({
  partTitle,
  governingConcept,
  status = 'live',
  children,
}: PartChartShellProps) => (
  <figure className={`part-chart part-chart--${status}`} role="figure" aria-label={`${partTitle} chart`}>
    <figcaption className="part-chart__caption">
      <span className="kicker">{governingConcept}</span>
      <span className="part-chart__title">{partTitle}</span>
      {status === 'placeholder' && (
        <span className="part-chart__badge" title="Visualization is a placeholder">
          placeholder
        </span>
      )}
    </figcaption>
    <div className="part-chart__body">{children}</div>
  </figure>
);
