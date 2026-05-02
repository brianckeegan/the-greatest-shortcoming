// Scroller — scroll-driven step coordinator built on react-scrollama.
//
// Usage pattern (one Scroller per scrolly figure):
//
//   <Scroller
//     steps={steps}
//     renderSticky={(activeStep) => <PartChart step={activeStep} />}
//     renderStep={(step, i, isActive) => <Beat step={step} isActive={isActive} />}
//   />
//
// Sticky pane stays pinned via CSS `position: sticky` (per the
// scrollytelling skill: "Use CSS position: sticky, not JavaScript scroll
// listeners — better performance and graceful degradation"). react-scrollama
// fires step events as each beat enters the viewport offset.
//
// Reduced-motion fallback (mandatory per WCAG SC 2.3.3 / the scrollytelling
// skill): if the user has prefers-reduced-motion set, the sticky pane
// freezes on the FIRST step and every beat reads as a static document. No
// scroll-position tracking is initialized.
//
// This component is the new canonical scroll-coordination primitive; over
// time the legacy scroll listener inside assets/js/app.jsx will migrate to
// it. For this PR the Scroller is exported and exercised by the islands
// bundle but app.jsx still drives its own scroller.

import { useEffect, useState, useMemo, type ReactNode } from 'react';
import { Scrollama, Step as ScrollamaStep } from 'react-scrollama';

export interface ScrollerProps<S> {
  steps: readonly S[];
  // Render the sticky pane for the currently-active step. The function is
  // re-invoked whenever the active step index changes.
  renderSticky: (activeStep: S, activeIndex: number) => ReactNode;
  // Render one beat in the flowing pane. `isActive` is true for exactly one
  // beat at a time (the one driving the sticky pane). `index` is the beat's
  // 0-based position in `steps`.
  renderStep: (step: S, index: number, isActive: boolean) => ReactNode;
  // CSS offset (0–1, fraction of viewport from the top) at which a beat is
  // considered active. Default 0.6 places the trigger ~60% down the viewport.
  offset?: number;
  // Optional className for the outer .scroller wrapper.
  className?: string;
  // Optional caption/announcement text used as the aria-live region. The
  // default uses the step index; supply a function to customize.
  announce?: (step: S, index: number) => string;
}

function usePrefersReducedMotion(): boolean {
  const [reduced, setReduced] = useState<boolean>(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return false;
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  });
  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return;
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    const onChange = (e: MediaQueryListEvent) => setReduced(e.matches);
    mq.addEventListener?.('change', onChange);
    return () => mq.removeEventListener?.('change', onChange);
  }, []);
  return reduced;
}

export function Scroller<S>({
  steps,
  renderSticky,
  renderStep,
  offset = 0.6,
  className,
  announce,
}: ScrollerProps<S>): JSX.Element {
  const reducedMotion = usePrefersReducedMotion();
  const [activeIndex, setActiveIndex] = useState<number>(0);

  const safeIndex = Math.max(0, Math.min(steps.length - 1, activeIndex));
  const activeStep: S | undefined = steps[safeIndex];

  const announcement = useMemo(() => {
    if (!activeStep) return '';
    if (announce) return announce(activeStep, safeIndex);
    return `Step ${safeIndex + 1} of ${steps.length}`;
  }, [activeStep, safeIndex, steps.length, announce]);

  // Reduced-motion fallback: render every beat statically with no scroll
  // tracking. The sticky pane shows the first step and never updates.
  if (reducedMotion) {
    return (
      <div className={['scroller scroller--reduced-motion', className].filter(Boolean).join(' ')}>
        <div className="scroller__sticky">
          {steps[0] !== undefined && renderSticky(steps[0], 0)}
        </div>
        <div className="scroller__flow" role="list">
          {steps.map((s, i) => (
            <div key={i} className="scroller__beat" role="listitem">
              {renderStep(s, i, false)}
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className={['scroller', className].filter(Boolean).join(' ')}>
      <div className="scroller__sticky" aria-live="polite" aria-atomic="true">
        {activeStep !== undefined && renderSticky(activeStep, safeIndex)}
        <span className="scroller__sr-announcement" style={srOnly}>{announcement}</span>
      </div>
      <div className="scroller__flow">
        <Scrollama
          offset={offset}
          onStepEnter={(payload) => {
            const data = (payload as { data: unknown }).data;
            if (typeof data === 'number') setActiveIndex(data);
          }}
        >
          {steps.map((s, i) => (
            <ScrollamaStep data={i} key={i}>
              <div className={'scroller__beat' + (i === safeIndex ? ' is-active' : '')}>
                {renderStep(s, i, i === safeIndex)}
              </div>
            </ScrollamaStep>
          ))}
        </Scrollama>
      </div>
    </div>
  );
}

const srOnly = {
  position: 'absolute' as const,
  width: '1px',
  height: '1px',
  padding: 0,
  margin: '-1px',
  overflow: 'hidden',
  clip: 'rect(0, 0, 0, 0)',
  whiteSpace: 'nowrap' as const,
  border: 0,
};
