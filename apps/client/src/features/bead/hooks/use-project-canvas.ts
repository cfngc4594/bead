import { eq, useLiveQuery } from "@tanstack/react-db";
import { useRef, useState } from "react";
import type { CanvasSize } from "@/config/canvas-sizes";
import {
  type CanvasState,
  cloneCanvas,
  createEmptyCanvas,
  isSameCanvas,
} from "@/features/bead/lib/canvas-state";
import {
  canRedo,
  canUndo,
  getCurrentCanvas,
  type ProjectId,
  projectsCollection,
  redoProject,
  saveCanvasSnapshot,
  undoProject,
} from "@/features/bead/storage/projects";
import type { BeadFill } from "@/features/bead/types";

type CanvasDraft = {
  baseIndex: number;
  beads: CanvasState;
};

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
  const draftRef = useRef<CanvasDraft | null>(null);
  const [draftBeads, setDraftBeads] = useState<CanvasState | null>(null);
  const beads = draftBeads ?? persistedBeads;

  function beginEdit() {
    const currentProject = projectsCollection.get(projectId) ?? project;

    if (!currentProject) {
      return;
    }

    const draft = {
      baseIndex: currentProject.currentIndex,
      beads: getCurrentCanvas({
        cellCount,
        project: currentProject,
      }),
    };

    draftRef.current = draft;
    setDraftBeads(draft.beads);
  }

  function editCell(index: number, fill: BeadFill | null) {
    const draft = draftRef.current;

    if (!draft) {
      return;
    }

    const next = cloneCanvas(draft.beads);

    if (isSameBead(next[index], fill)) {
      return;
    }

    next[index] = fill;
    draftRef.current = { ...draft, beads: next };
    setDraftBeads(next);
  }

  function commitEdit() {
    const draft = draftRef.current;
    draftRef.current = null;

    if (!draft || isSameCanvas(draft.beads, persistedBeads)) {
      setDraftBeads(null);
      return;
    }

    persistProject(
      saveCanvasSnapshot({
        beads: draft.beads,
        baseIndex: draft.baseIndex,
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
    setDraftBeads(null);

    if (isSameCanvas(nextBeads, currentBeads)) {
      return;
    }

    persistProject(
      saveCanvasSnapshot({
        beads: cloneCanvas(nextBeads),
        baseIndex,
        projectId,
      }),
    );
  }

  function undo() {
    draftRef.current = null;
    setDraftBeads(null);
    persistProject(undoProject(projectId));
  }

  function redo() {
    draftRef.current = null;
    setDraftBeads(null);
    persistProject(redoProject(projectId));
  }

  function clear() {
    commitBeads(createEmptyCanvas(beads.length));
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

function isSameBead(a: BeadFill | null, b: BeadFill | null) {
  return a?.code === b?.code && a?.hex === b?.hex;
}
