"use client";

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
  const document = project ? beadDocumentsCollection.get(project) : undefined;

  useEffect(() => {
    if (!project) {
      router.replace("/");
      return;
    }

    if (!document) {
      router.replace("/projects");
    }
  }, [document, project, router]);

  if (!project || !document) {
    return null;
  }

  return <BeadEditor documentId={project} size={getCanvasSize(selected)} />;
}
