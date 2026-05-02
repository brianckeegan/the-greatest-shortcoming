// Islands bundle entry. Built by esbuild.config.mjs into
// assets/js/dist/islands.js. Loaded once per scrolly page from
// _layouts/scrolly.html as a regular <script src="…/islands.js" defer>.
//
// Two responsibilities:
//
// 1. Auto-mount any `[data-island]` element on the page using the
//    registry below. The registry maps a data-island name to the
//    React component that should render into that node.
//
// 2. Expose window.ScrollyNetwork and window.NodeShape so app.jsx
//    (loaded separately via Babel-CDN) can keep using the existing
//    `<window.ScrollyNetwork ...>` mount inside its render tree. This
//    is the seam that lets the legacy app.jsx coexist with the new
//    bundled islands.

import { bootMount, type IslandRegistry } from './mount';
import { ScrollyNetwork, NodeShape } from './ScrollyNetwork';
import { QcEfiMatrix } from './QcEfiMatrix';
import { Scroller } from './Scroller';
import { SmoothScrollLink } from './SmoothScrollLink';
import { FreeFallChart } from './charts/FreeFallChart';
import {
  BoulderChart,
  QuarantineChart,
  SwarmChart,
  PortfolioChart,
  EvacuationChart,
} from './charts/PlaceholderCharts';

// Auto-mounted islands. To add an island to a page: drop a
// `<div data-island="<name>" data-props='{...}'></div>` element where
// you want it to render. The bundle will hydrate it on DOMContentLoaded.
const registry: IslandRegistry = {
  'qc-efi-matrix': QcEfiMatrix,
  'part-chart-boulder': BoulderChart,
  'part-chart-free-fall': FreeFallChart,
  'part-chart-quarantine': QuarantineChart,
  'part-chart-swarm': SwarmChart,
  'part-chart-portfolio': PortfolioChart,
  'part-chart-evacuation': EvacuationChart,
};

// Expose components on window so app.jsx (loaded separately via Babel-CDN)
// can render them inline without going through the [data-island] hydration
// path. The pattern: a section file with `kind: island, island: <Name>` in
// frontmatter looks up window[<Name>] in app.jsx renderSection and renders
// `<Component {...props}/>` directly. Works because PR #20's React-externals
// fix means the bundle and app.jsx share window.React.
(window as unknown as Record<string, unknown>).ScrollyNetwork = ScrollyNetwork;
(window as unknown as Record<string, unknown>).NodeShape = NodeShape;
(window as unknown as Record<string, unknown>).QcEfiMatrix = QcEfiMatrix;
(window as unknown as Record<string, unknown>).Scroller = Scroller;
(window as unknown as Record<string, unknown>).SmoothScrollLink = SmoothScrollLink;

bootMount(registry);
