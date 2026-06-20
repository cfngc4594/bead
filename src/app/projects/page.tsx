import { Suspense } from "react";
import { BeadProjectsPageNoSsr } from "@/app/projects/projects-page-no-ssr";

export default function ProjectsPage() {
  return (
    <Suspense fallback={<main className="min-h-screen bg-background" />}>
      <BeadProjectsPageNoSsr />
    </Suspense>
  );
}
