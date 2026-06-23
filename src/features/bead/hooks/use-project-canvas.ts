"use client";

import { eq, useLiveQuery } from "@tanstack/react-db";
import { useRef, useState } from "react";
import type { CanvasSize } from "@/config/canvas-sizes";
import {
  type CanvasState,
  canRedo,
  canUndo,
  createEmptyCanvas,
  getCurrentCanvas,
  type ProjectId,
  projectsCollection,
  redoProject,
  saveCanvasSnapshot,
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
  const persistedBeads = project
    ? getCurrentCanvas({ cellCount, project })
    : createEmptyCanvas(cellCount);
  const editBaseIndexRef = useRef<number | null>(null);
  const draftRef = useRef<CanvasState | null>(null);
  const [draftBeads, setDraftBeads] = useState<CanvasState | null>(null);
  const beads = draftBeads ?? persistedBeads;

  function beginEdit() {
    const currentProject = projectsCollection.get(projectId) ?? project;

    if (!currentProject) {
      return;
    }

    editBaseIndexRef.current = currentProject.currentIndex;
    draftRef.current = getCurrentCanvas({
      cellCount,
      project: currentProject,
    });
    setDraftBeads(draftRef.current);
  }

  function editCell(index: number, fill: BeadFill | null) {
    const next = [...(draftRef.current ?? beads)];

    if (isSameBead(next[index] ?? null, fill)) {
      return;
    }

    next[index] = fill;
    draftRef.current = next;
    setDraftBeads(next);
  }

  function commitEdit() {
    const draft = draftRef.current;
    const baseIndex = editBaseIndexRef.current;
    draftRef.current = null;
    editBaseIndexRef.current = null;

    if (!draft || isSameBeads(draft, persistedBeads)) {
      setDraftBeads(null);
      return;
    }

    persistProject(
      saveCanvasSnapshot({
        baseIndex: baseIndex ?? undefined,
        beads: draft,
        projectId,
      }),
    );
    setDraftBeads(null);
  }

  function commitBeads(nextBeads: CanvasState) {
    const currentProject = projectsCollection.get(projectId) ?? project;

    if (!currentProject) {
      return;
    }

    const baseIndex = currentProject.currentIndex;
    const currentBeads = getCurrentCanvas({
      cellCount,
      project: currentProject,
    });

    draftRef.current = null;
    editBaseIndexRef.current = null;
    setDraftBeads(null);

    if (isSameBeads(nextBeads, currentBeads)) {
      return;
    }

    persistProject(
      saveCanvasSnapshot({
        baseIndex,
        beads: [...nextBeads],
        projectId,
      }),
    );
  }

  function undo() {
    draftRef.current = null;
    editBaseIndexRef.current = null;
    setDraftBeads(null);
    persistProject(undoProject(projectId));
  }

  function redo() {
    draftRef.current = null;
    editBaseIndexRef.current = null;
    setDraftBeads(null);
    persistProject(redoProject(projectId));
  }

  function clear() {
    commitBeads(createEmptyCanvas(cellCount));
  }

  return {
    beads,
    beginEdit,
    editCell,
    commitEdit,
    commitBeads,
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

function isSameBeads(a: CanvasState, b: CanvasState) {
  if (a.length !== b.length) {
    return false;
  }

  for (let index = 0; index < a.length; index += 1) {
    if (!isSameBead(a[index] ?? null, b[index] ?? null)) {
      return false;
    }
  }

  return true;
}

function isSameBead(a: BeadFill | null, b: BeadFill | null) {
  return a?.code === b?.code && a?.hex === b?.hex;
}
