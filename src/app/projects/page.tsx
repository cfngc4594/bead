"use client";

import dynamic from "next/dynamic";
import { ProjectsRouteSkeleton } from "@/app/projects/projects-route-skeleton";

const ProjectsPageContent = dynamic(
  () =>
    import("@/app/projects/projects-page-content").then(
      (module) => module.ProjectsPageContent,
    ),
  {
    loading: () => <ProjectsRouteSkeleton />,
    ssr: false,
  },
);

export default function ProjectsPage() {
  return <ProjectsPageContent />;
}
