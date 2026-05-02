// Module declarations for dependencies that don't ship their own types
// or whose types are wrong in ways we work around at the call site.

declare module 'react-scrollama' {
  import type { ComponentType, ReactNode } from 'react';

  export interface ScrollamaCallbackPayload<T = unknown> {
    /** The `data` prop value from the active <Step />. */
    data: T;
    /** The DOM element of the active <Step />. */
    element: HTMLElement;
    /** Index of the active <Step /> within the parent <Scrollama />. */
    entry: IntersectionObserverEntry;
    /** Direction of the scroll that triggered the event. */
    direction: 'up' | 'down';
  }

  export interface ScrollamaProps {
    /** Fraction of viewport from the top at which a step is considered active (0–1). Default 0.5. */
    offset?: number;
    /** When true, fires onStepProgress as the step scrolls through the offset. */
    progress?: boolean;
    /** Threshold for progress events (0–1). */
    threshold?: number;
    /** Use IntersectionObserver root margin debugging. */
    debug?: boolean;
    onStepEnter?: <T = unknown>(payload: ScrollamaCallbackPayload<T>) => void;
    onStepExit?: <T = unknown>(payload: ScrollamaCallbackPayload<T>) => void;
    onStepProgress?: <T = unknown>(
      payload: ScrollamaCallbackPayload<T> & { progress: number },
    ) => void;
    children?: ReactNode;
  }

  export interface StepProps<T = unknown> {
    /** Arbitrary data passed back via callback payloads. */
    data?: T;
    children?: ReactNode;
  }

  export const Scrollama: ComponentType<ScrollamaProps>;
  export const Step: ComponentType<StepProps>;
}
