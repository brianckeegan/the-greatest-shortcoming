// Shared types for the islands bundle.
// The runtime data sources are window.GS_DATA, window.SITE, window.PAGE_CONTEXT
// (emitted by Jekyll via _includes/site-data.html and _includes/page-context.html).

export type EntityKind = 'person' | 'org' | 'theme' | 'instrument' | 'document' | 'part';

export interface Entity {
  id: string;
  kind: EntityKind;
  name: string;
  role?: string;
  dates?: string;
  blurb?: string;
  links?: string[];
  part?: string[]; // part ids the entity participates in (people/orgs/instruments)
  // Allow unknown extra fields without losing type safety on the known ones.
  [extra: string]: unknown;
}

export type PartSlug = string; // intentionally loose — _data/parts.yml is editable
export type PartKind = 'step' | 'bracket';

export interface Part {
  id: PartSlug;
  kind: PartKind;
  title?: string;
  label?: string;
  shortLabel?: string;
  subtitle?: string;
  start?: number | null;
  end?: number | null;
  num?: string | null;
  kicker?: string;
  blurb?: string;
  chapterSlug?: string | null;
  color?: string | null;
  bracketLine?: boolean;
  underlineActive?: boolean;
  target?: string;
}

export interface Step {
  id: PartSlug;
  title: string;
  subtitle: string;
  start?: number | null;
  end?: number | null;
  num?: string | null;
  kicker: string;
  nodes: string[];
  focus: string[];
}

export interface NewsItem {
  date: string;
  kind: 'talk' | 'review' | 'event' | 'press' | 'release' | string;
  title: string;
  blurb?: string;
  link?: string;
}

export interface SectionData {
  id: string;
  kind: 'register' | 'coda' | 'news' | 'epigraphs';
  slot: 'pre-stepper' | 'pre-scrolly' | 'post-scrolly' | 'post-coda';
  kicker?: string;
  title?: string;
  body?: string;
  items?: Array<{ quote: string; cite: string }>;
}

export interface GsData {
  parts: Part[];
  people: Entity[];
  orgs: Entity[];
  themes: Entity[];
  instruments: Entity[];
  documents: Entity[];
  news: NewsItem[];
  byId: Record<string, Entity>;
  all: Entity[];
}

export interface SiteData {
  title: string;
  subtitle: string;
  hero: { title_lines?: string[]; deck?: string; scroll_cue?: string };
  nav: Array<{ label: string; url?: string; kind?: string }>;
  sections: SectionData[];
  themeDefaults: { theme?: string; net?: string; fontSize?: number };
}

export interface PageContext {
  kind: 'home' | 'reading' | 'chapter' | 'static';
  pageId: string;
  hero: { show: boolean; titleLines: string[]; deck: string; scrollCue: string; kicker?: string };
  stepper: { show: boolean; highlightPartId: string | null };
  parts: Part[];
  steps: Step[];
  prose: Record<string, string>;
  network: { show: boolean; caption: string };
  registers: { show: boolean };
  sections: SectionData[];
  intro: { html: string } | null;
  outro: { html: string } | null;
}

declare global {
  interface Window {
    GS_DATA: GsData;
    SITE: SiteData;
    PAGE_CONTEXT: PageContext;
    // Globals exposed by the islands bundle for app.jsx (which is loaded
    // separately via Babel-CDN and does not import from the bundle).
    ScrollyNetwork: unknown;
    NodeShape: unknown;
  }
}
