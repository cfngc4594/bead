"use client";

import dynamic from "next/dynamic";
import { ProjectsRouteSkeleton } from "@/app/projects/projects-route-skeleton";

const BeadProjectsPageContent = dynamic(
  () =>
    import("@/app/projects/projects-page-content").then(
      (module) => module.BeadProjectsPageContent,
    ),
  {
    loading: () => <ProjectsRouteSkeleton />,
    ssr: false,
  },
);

export default function ProjectsPage() {
  return <BeadProjectsPageContent />;
}
