import { Suspense } from "react";
import { BeadProjectsPageNoSsr } from "@/app/projects/projects-page-no-ssr";
import { BeadProjectsSkeleton } from "@/features/bead/components/bead-projects-skeleton";

export default function ProjectsPage() {
  return (
    <Suspense fallback={<BeadProjectsSkeleton />}>
      <BeadProjectsPageNoSsr />
    </Suspense>
  );
}
