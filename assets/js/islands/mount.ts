// Generic island hydrator. Scans the DOM for `[data-island]` elements,
// looks each up in the registry, and hydrates with React 18's createRoot.
// Props for an island are read from the `data-props` attribute as JSON.
//
// Markup pattern in Liquid templates:
//   <div data-island="qc-efi-matrix" data-props='{"highlight":"free_fall"}'></div>
//
// The registry is provided by index.ts so the bundle has a single, fully
// typed list of which components can be mounted on the page.

import { createRoot, type Root } from 'react-dom/client';
import { createElement, type ComponentType } from 'react';

export type IslandComponent = ComponentType<Record<string, unknown>>;
export type IslandRegistry = Readonly<Record<string, IslandComponent>>;

const mounted = new WeakMap<Element, Root>();

function readProps(node: Element): Record<string, unknown> {
  const raw = node.getAttribute('data-props');
  if (!raw) return {};
  try {
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === 'object' ? (parsed as Record<string, unknown>) : {};
  } catch (err) {
    console.warn(
      `[islands] Could not parse data-props on <${node.tagName.toLowerCase()} data-island="${node.getAttribute(
        'data-island',
      )}">:`,
      err,
    );
    return {};
  }
}

export function mountIslands(registry: IslandRegistry): void {
  const nodes = document.querySelectorAll<HTMLElement>('[data-island]');
  nodes.forEach((node) => {
    if (mounted.has(node)) return;
    const name = node.dataset['island'];
    if (!name) return;
    const Component = registry[name];
    if (!Component) {
      // Not every [data-island] has to be in the registry — `data-island="step"`
      // (for example) is a Scrollama tracking marker handled by its parent.
      return;
    }
    const props = readProps(node);
    const root = createRoot(node);
    root.render(createElement(Component, props));
    mounted.set(node, root);
  });
}

export function bootMount(registry: IslandRegistry): void {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => mountIslands(registry), { once: true });
  } else {
    mountIslands(registry);
  }
}
