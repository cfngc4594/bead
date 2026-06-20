"use client";

import dynamic from "next/dynamic";
import { BeadProjectsSkeleton } from "@/features/bead/components/bead-projects-skeleton";

export const BeadProjectsPageNoSsr = dynamic(
  () =>
    import("@/features/bead/components/bead-projects-page").then(
      (module) => module.BeadProjectsPage,
    ),
  {
    loading: () => <BeadProjectsSkeleton />,
    ssr: false,
  },
);
