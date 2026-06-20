"use client";

import dynamic from "next/dynamic";
import { BeadProjectsSkeleton } from "@/features/bead/components/bead-projects-skeleton";

export const BeadProjectsPageNoSsr = dynamic(
  () =>
    import("@/app/projects/projects-page-content").then(
      (module) => module.BeadProjectsPageContent,
    ),
  {
    loading: () => <BeadProjectsSkeleton />,
    ssr: false,
  },
);
