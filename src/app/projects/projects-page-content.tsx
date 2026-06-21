"use client";

import { eq, useLiveQuery } from "@tanstack/react-db";
import dynamic from "next/dynamic";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect } from "react";
import { getCanvasSize } from "@/config/canvas-sizes";
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
  const projectId = searchParams.get("projectId");
  const { data: documents, isReady } = useLiveQuery(
    (query) =>
      projectId
        ? query
            .from({ document: beadDocumentsCollection })
            .where(({ document }) => eq(document.id, projectId))
            .select(({ document }) => ({
              id: document.id,
              title: document.title,
              sizeId: document.sizeId,
            }))
        : undefined,
    [projectId],
  );
  const document = documents?.[0];

  useEffect(() => {
    if (projectId && isReady && !document) {
      router.replace("/projects");
    }
  }, [document, isReady, projectId, router]);

  if (!projectId) {
    return <BeadProjectsPage />;
  }

  if (!document) {
    return <BeadEditorSkeleton />;
  }

  return (
    <BeadEditor
      documentId={projectId}
      size={getCanvasSize(document.sizeId)}
      title={document.title}
    />
  );
}
