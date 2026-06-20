"use client";

import { eq, useLiveQuery } from "@tanstack/react-db";
import dynamic from "next/dynamic";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect } from "react";
import {
  canvasSizes,
  getCanvasSize,
  isCanvasSizeId,
} from "@/config/canvas-sizes";
import { BeadEditorSkeleton } from "@/features/bead/components/bead-editor-skeleton";
import { BeadProjectsSkeleton } from "@/features/bead/components/bead-projects-skeleton";
import { beadDocumentsCollection } from "@/features/bead/storage/bead-documents";

const BeadProjectsPage = dynamic(
  () =>
    import("@/features/bead/components/bead-projects-page").then(
      (module) => module.BeadProjectsPage,
    ),
  {
    loading: () => <BeadProjectsSkeleton />,
    ssr: false,
  },
);

const BeadEditor = dynamic(
  () =>
    import("@/features/bead/components/bead-editor").then(
      (module) => module.BeadEditor,
    ),
  {
    loading: () => <BeadEditorSkeleton />,
    ssr: false,
  },
);

export function BeadProjectsPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const size = searchParams.get("size");
  const project = searchParams.get("project");
  const selected = isCanvasSizeId(size) ? size : canvasSizes[0].id;
  const { data: documents, isReady } = useLiveQuery(
    (query) =>
      project
        ? query
            .from({ document: beadDocumentsCollection })
            .where(({ document }) => eq(document.id, project))
            .select(({ document }) => ({
              id: document.id,
            }))
        : undefined,
    [project],
  );
  const document = documents?.[0];

  useEffect(() => {
    if (project && isReady && !document) {
      router.replace("/projects");
    }
  }, [document, isReady, project, router]);

  if (!project) {
    return <BeadProjectsPage />;
  }

  if (!document) {
    return <BeadEditorSkeleton />;
  }

  return <BeadEditor documentId={project} size={getCanvasSize(selected)} />;
}
