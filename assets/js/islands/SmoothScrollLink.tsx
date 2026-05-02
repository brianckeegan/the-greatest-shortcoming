// SmoothScrollLink — anchor smooth-scroll using react-scroll.
//
// Replaces hand-rolled `window.scrollTo({behavior: 'smooth'})` calls and
// raw `<a href="#anchor">` tags whenever a click should glide to a named
// section instead of jumping. Pairs naturally with the section IDs declared
// in `_sections/<slug>.md` (filename slug = DOM id = link target).
//
// Reduced-motion (per the scrollytelling skill's mandatory accessibility
// requirement): when the user prefers reduced motion, the underlying
// react-scroll smoothness is disabled and the page jumps to the target
// instantly. This is the more accessible behavior — vestibular-disorder
// users explicitly request that animations not run.
//
// Offset handling: the scrolly layout has a sticky top header (~48px) plus
// a sticky stepper (~48px) covering the top of the viewport. The default
// offset (-100 px) keeps the target heading visible below both bars.

import { useEffect, useState, type ReactNode } from 'react';
import { Link as ReactScrollLink } from 'react-scroll';

export interface SmoothScrollLinkProps {
  // Section id WITHOUT the leading '#'. Maps to a `_sections/<to>.md`
  // slug or any other element with a matching `id` / `name` attribute.
  to: string;
  // Optional duration (ms). Default 600. Ignored when reduced-motion is on.
  duration?: number;
  // Optional offset in px from the target's top. Default -100 to clear the
  // sticky top-header + stepper.
  offset?: number;
  // Optional spy mode (highlights the link when the target is in view).
  spy?: boolean;
  // Standard CSS class for styling.
  className?: string;
  // Optional aria-label for screen readers.
  'aria-label'?: string;
  // Optional title attribute for tooltip.
  title?: string;
  children: ReactNode;
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

export function SmoothScrollLink({
  to,
  duration = 600,
  offset = -100,
  spy = false,
  children,
  className,
  title,
  'aria-label': ariaLabel,
}: SmoothScrollLinkProps): JSX.Element {
  const reducedMotion = usePrefersReducedMotion();
  // react-scroll's TS types incorrectly extend HTMLButtonElement props in
  // some versions, so we pass props explicitly rather than spreading.
  return (
    <ReactScrollLink
      to={to}
      smooth={!reducedMotion}
      duration={reducedMotion ? 0 : duration}
      offset={offset}
      spy={spy}
      hashSpy={spy}
      href={`#${to}`}
      className={className}
      title={title}
      aria-label={ariaLabel}
    >
      {children}
    </ReactScrollLink>
  );
}
