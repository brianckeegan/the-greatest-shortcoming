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

// Expose the legacy globals app.jsx still relies on. app.jsx is loaded
// separately via Babel-CDN and reads these from `window`; setting them
// here means assets/js/scrolly-network.jsx can be deleted while app.jsx
// continues to work unchanged.
window.ScrollyNetwork = ScrollyNetwork;
window.NodeShape = NodeShape;

// Also expose the new scroll primitives on window so app.jsx (or any
// other script in the page) can use them without an import. The
// canonical use is inside other islands; the globals are an escape
// hatch for the existing Babel-CDN code path during the migration.
(window as unknown as { Scroller: typeof Scroller; SmoothScrollLink: typeof SmoothScrollLink }).Scroller = Scroller;
(window as unknown as { Scroller: typeof Scroller; SmoothScrollLink: typeof SmoothScrollLink }).SmoothScrollLink = SmoothScrollLink;

bootMount(registry);
