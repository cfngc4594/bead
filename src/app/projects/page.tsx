import { Suspense } from "react";
import { BeadProjectsPageNoSsr } from "@/app/projects/projects-page-no-ssr";
import { ProjectsRouteSkeleton } from "@/app/projects/projects-route-skeleton";

export default function ProjectsPage() {
  return (
    <Suspense fallback={<ProjectsRouteSkeleton />}>
      <BeadProjectsPageNoSsr />
    </Suspense>
  );
}
