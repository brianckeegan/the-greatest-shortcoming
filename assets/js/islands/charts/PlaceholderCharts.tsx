// Per-part chart placeholders.
//
// Five of the six per-part charts are scaffolded but not yet implemented
// with real data — each one needs its own data wrangling pass that the
// scope of the islands rewrite did not include. The placeholder cards
// reserve the slot, render the part kicker correctly, and surface a
// small `placeholder` badge so a reader can tell the difference at a
// glance.
//
// To replace one with a real visualization, copy FreeFallChart.tsx as
// the template and swap in part-specific data + Plot marks.

import type { ReactNode } from 'react';
import { PartChartShell } from './PartChartShell';

interface SkeletonProps {
  partTitle: string;
  governingConcept: string;
  description: ReactNode;
}

const Skeleton = ({ partTitle, governingConcept, description }: SkeletonProps) => (
  <PartChartShell partTitle={partTitle} governingConcept={governingConcept} status="placeholder">
    <p className="part-chart__placeholder-note">{description}</p>
  </PartChartShell>
);

export const BoulderChart = () => (
  <Skeleton
    partTitle="Boulder"
    governingConcept="Prelude"
    description="Annotated 1910 Olmsted Jr. survey overlay; preservation-easement boundary growth, 1898 → 1959."
  />
);

export const QuarantineChart = () => (
  <Skeleton
    partTitle="Quarantine"
    governingConcept="The Rule of Expertise"
    description="CIS / Tanton-network fiscal-impact-statement publication counts, 1995–2008, with Porter pull-quotes."
  />
);

export const SwarmChart = () => (
  <Skeleton
    partTitle="Swarm"
    governingConcept="The Politics of Inevitability"
    description="2008 U.S. Census majority-minority projection lines with replacement-discourse manifesto annotations."
  />
);

export const PortfolioChart = () => (
  <Skeleton
    partTitle="Portfolio"
    governingConcept="Demography as Asset Class"
    description="Pronatalist-longtermism fertility-as-portfolio scatter; hedge / underwrite overlay."
  />
);

export const EvacuationChart = () => (
  <Skeleton
    partTitle="Evacuation"
    governingConcept="Climate Triage"
    description="Triage decision tree → administrative-routine flow; Jasanoff's laws / infrastructures / reporting requirements."
  />
);
