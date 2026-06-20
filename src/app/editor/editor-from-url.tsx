"use client";

import { eq, useLiveQuery } from "@tanstack/react-db";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect } from "react";
import {
  canvasSizes,
  getCanvasSize,
  isCanvasSizeId,
} from "@/config/canvas-sizes";
import { BeadEditor } from "@/features/bead/components/bead-editor";
import { beadDocumentsCollection } from "@/features/bead/storage/bead-documents";

export function BeadEditorFromUrl() {
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
    if (!project) {
      router.replace("/");
      return;
    }

    if (isReady && !document) {
      router.replace("/projects");
    }
  }, [document, isReady, project, router]);

  if (!project || !document) {
    return null;
  }

  return <BeadEditor documentId={project} size={getCanvasSize(selected)} />;
}
