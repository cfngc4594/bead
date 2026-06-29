"use client";

import { eq, useLiveQuery } from "@tanstack/react-db";
import { useRef, useState } from "react";
import type { CanvasSize } from "@/config/canvas-sizes";
import {
  type CanvasDocumentState,
  type CanvasState,
  clearDocumentBeads,
  cloneDocument,
  createDocumentFromBeads,
  createEmptyDocument,
  getLayerByCellIndex,
  isSameDocument,
  updateLayersForCell,
} from "@/features/bead/lib/canvas-document";
import {
  canRedo,
  canUndo,
  getCurrentDocument,
  type ProjectId,
  projectsCollection,
  redoProject,
  saveCanvasDocumentSnapshot,
  undoProject,
} from "@/features/bead/storage/projects";
import type { BeadFill } from "@/features/bead/types";

export function useProjectCanvas({
  projectId,
  size,
}: {
  projectId: ProjectId;
  size: CanvasSize;
}) {
  const { data: projects = [] } = useLiveQuery(
    (query) =>
      query
        .from({ project: projectsCollection })
        .where(({ project }) => eq(project.id, projectId))
        .select(({ project }) => ({
          id: project.id,
          title: project.title,
          sizeId: project.sizeId,
          rows: project.rows,
          cols: project.cols,
          snapshots: project.snapshots,
          currentIndex: project.currentIndex,
          updatedAt: project.updatedAt,
        })),
    [projectId],
  );
  const project = projects[0];
  const cellCount = size.rows * size.cols;
  const persistedDocument = project
    ? getCurrentDocument({ cellCount, project })
    : createEmptyDocument(cellCount);
  const editBaseIndexRef = useRef<number | null>(null);
  const draftRef = useRef<CanvasDocumentState | null>(null);
  const [draftDocument, setDraftDocument] =
    useState<CanvasDocumentState | null>(null);
  const document = draftDocument ?? persistedDocument;
  const beads = document.beads;

  function beginEdit() {
    const currentProject = projectsCollection.get(projectId) ?? project;

    if (!currentProject) {
      return;
    }

    editBaseIndexRef.current = currentProject.currentIndex;
    draftRef.current = getCurrentDocument({
      cellCount,
      project: currentProject,
    });
    setDraftDocument(draftRef.current);
  }

  function editCell(index: number, fill: BeadFill | null) {
    const current = draftRef.current ?? document;
    const next = cloneDocument(current);
    const activeLayer = next.layers.find(
      (layer) => layer.id === next.activeLayerId,
    );
    const targetLayer = getLayerByCellIndex(next.layers, index);

    if (activeLayer?.isLocked || targetLayer?.isLocked) {
      return;
    }

    if (isSameBead(next.beads[index] ?? null, fill)) {
      return;
    }

    next.beads[index] = fill;
    next.layers = updateLayersForCell({
      activeLayerId: next.activeLayerId,
      fill,
      index,
      layers: next.layers,
    });
    draftRef.current = next;
    setDraftDocument(next);
  }

  function commitEdit() {
    const draft = draftRef.current;
    const baseIndex = editBaseIndexRef.current;
    draftRef.current = null;
    editBaseIndexRef.current = null;

    if (!draft || isSameDocument(draft, persistedDocument)) {
      setDraftDocument(null);
      return;
    }

    persistProject(
      saveCanvasDocumentSnapshot({
        baseIndex: baseIndex ?? undefined,
        document: draft,
        projectId,
      }),
    );
    setDraftDocument(null);
  }

  function commitBeads(nextBeads: CanvasState) {
    commitDocument(createDocumentFromBeads([...nextBeads]));
  }

  function commitDocument(nextDocument: CanvasDocumentState) {
    const currentProject = projectsCollection.get(projectId) ?? project;

    if (!currentProject) {
      return;
    }

    const baseIndex = currentProject.currentIndex;
    const currentDocument = getCurrentDocument({
      cellCount,
      project: currentProject,
    });

    draftRef.current = null;
    editBaseIndexRef.current = null;
    setDraftDocument(null);

    if (isSameDocument(nextDocument, currentDocument)) {
      return;
    }

    persistProject(
      saveCanvasDocumentSnapshot({
        baseIndex,
        document: cloneDocument(nextDocument),
        projectId,
      }),
    );
  }

  function undo() {
    draftRef.current = null;
    editBaseIndexRef.current = null;
    setDraftDocument(null);
    persistProject(undoProject(projectId));
  }

  function redo() {
    draftRef.current = null;
    editBaseIndexRef.current = null;
    setDraftDocument(null);
    persistProject(redoProject(projectId));
  }

  function clear() {
    commitDocument(clearDocumentBeads(document));
  }

  return {
    beads,
    document,
    layers: document.layers,
    activeLayerId: document.activeLayerId,
    beginEdit,
    editCell,
    commitEdit,
    commitBeads,
    commitDocument,
    undo,
    redo,
    clear,
    canUndo: project ? canUndo(project) : false,
    canRedo: project ? canRedo(project) : false,
  };
}

function persistProject(persistence: Promise<unknown>) {
  persistence.catch((error) => {
    console.error("Unable to persist bead project", error);
  });
}

function isSameBead(a: BeadFill | null, b: BeadFill | null) {
  return a?.code === b?.code && a?.hex === b?.hex;
}
