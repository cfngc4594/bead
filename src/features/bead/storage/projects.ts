import {
  createCollection,
  createTransaction,
  localStorageCollectionOptions,
} from "@tanstack/react-db";
import type { CanvasSize, CanvasSizeId } from "@/config/canvas-sizes";
import { runStorageMigrations } from "@/features/bead/storage/storage-migrations";
import type { BeadFill } from "@/features/bead/types";

export type CanvasState = (BeadFill | null)[];

export type CanvasSnapshotCell = {
  index: number;
  fill: BeadFill;
};

export type CanvasSnapshot = CanvasSnapshotCell[];

export type ProjectId = string;

export type Project = {
  id: ProjectId;
  title: string;
  sizeId: CanvasSizeId;
  rows: number;
  cols: number;
  snapshots: CanvasSnapshot[];
  currentIndex: number;
  updatedAt: number;
};

export const DEFAULT_PROJECT_TITLE = "未命名作品";
const PROJECTS_V0_STORAGE_KEY = "bead:v5:documents";
const PROJECTS_V1_STORAGE_KEY = "bead:projects:v1";

runStorageMigrations([
  {
    from: PROJECTS_V0_STORAGE_KEY,
    to: PROJECTS_V1_STORAGE_KEY,
  },
]);

export const projectsCollection = createCollection(
  localStorageCollectionOptions<Project, ProjectId>({
    id: "projects",
    storageKey: PROJECTS_V1_STORAGE_KEY,
    getKey: (project) => project.id,
  }),
);

export function createEmptyCanvas(cellCount: number): CanvasState {
  return Array.from({ length: cellCount }, () => null);
}

export function getCurrentCanvas({
  cellCount,
  project,
}: {
  cellCount: number;
  project: Project;
}) {
  return expandSnapshot(project.snapshots[project.currentIndex], cellCount);
}

export function canUndo(project: Project) {
  return project.currentIndex > 0;
}

export function canRedo(project: Project) {
  return project.currentIndex < project.snapshots.length - 1;
}

export function saveCanvasSnapshot({
  baseIndex,
  beads,
  projectId,
}: {
  baseIndex?: number;
  beads: CanvasState;
  projectId: ProjectId;
}) {
  const project = getRequiredProject(projectId);

  const projectIndex = baseIndex ?? project.currentIndex;
  const nextSnapshot = compactBeads(beads);
  const currentSnapshot = project.snapshots[projectIndex];

  if (isSameSnapshot(currentSnapshot, nextSnapshot)) {
    return Promise.resolve();
  }

  return commitProjectMutation(() => {
    projectsCollection.update(projectId, (draft) => {
      const branchIndex = Math.min(projectIndex, draft.snapshots.length - 1);
      const snapshots = draft.snapshots.slice(0, branchIndex + 1);

      snapshots.push(nextSnapshot);
      draft.snapshots = snapshots;
      draft.currentIndex = snapshots.length - 1;
      draft.updatedAt = Date.now();
    });
  });
}

export function undoProject(projectId: ProjectId) {
  return moveProjectIndex(projectId, -1);
}

export function redoProject(projectId: ProjectId) {
  return moveProjectIndex(projectId, 1);
}

export async function duplicateProject(projectId: ProjectId) {
  const project = getRequiredProject(projectId);
  const duplicatedProject: Project = {
    ...project,
    id: createProjectId(),
    snapshots: project.snapshots.map((snapshot) =>
      snapshot.map((cell) => ({ ...cell, fill: { ...cell.fill } })),
    ),
    updatedAt: Date.now(),
  };

  await commitProjectMutation(() => {
    projectsCollection.insert(duplicatedProject);
  });

  return duplicatedProject;
}

export function deleteProject(projectId: ProjectId) {
  getRequiredProject(projectId);

  return commitProjectMutation(() => {
    projectsCollection.delete(projectId);
  });
}

export function renameProject({
  projectId,
  title,
}: {
  projectId: ProjectId;
  title: string;
}) {
  const project = getRequiredProject(projectId);

  const nextTitle = normalizeProjectTitle(title) || DEFAULT_PROJECT_TITLE;

  if (project.title === nextTitle) {
    return Promise.resolve();
  }

  return commitProjectMutation(() => {
    projectsCollection.update(projectId, (draft) => {
      draft.title = nextTitle;
      draft.updatedAt = Date.now();
    });
  });
}

export async function createProject(size: CanvasSize) {
  const project: Project = {
    id: createProjectId(),
    title: DEFAULT_PROJECT_TITLE,
    sizeId: size.id,
    rows: size.rows,
    cols: size.cols,
    snapshots: [[]],
    currentIndex: 0,
    updatedAt: Date.now(),
  };

  await commitProjectMutation(() => {
    projectsCollection.insert(project);
  });

  return project;
}

export function getFilledCount(project: Project) {
  return project.snapshots[project.currentIndex].length;
}

function moveProjectIndex(projectId: ProjectId, delta: -1 | 1) {
  const project = getRequiredProject(projectId);

  const nextIndex = project.currentIndex + delta;

  if (nextIndex < 0 || nextIndex >= project.snapshots.length) {
    return Promise.resolve();
  }

  return commitProjectMutation(() => {
    projectsCollection.update(projectId, (draft) => {
      draft.currentIndex = nextIndex;
      draft.updatedAt = Date.now();
    });
  });
}

function createProjectId() {
  return crypto.randomUUID();
}

function getRequiredProject(projectId: ProjectId) {
  const project = projectsCollection.get(projectId);

  if (!project) {
    throw new Error(`Bead project not found: ${projectId}`);
  }

  return project;
}

function normalizeProjectTitle(title: string) {
  return title.trim().slice(0, 80);
}

function commitProjectMutation(mutator: () => void) {
  const transaction = createTransaction({
    mutationFn: async ({ transaction }) => {
      projectsCollection.utils.acceptMutations(transaction);
    },
  });

  transaction.mutate(mutator);
  return transaction.isPersisted.promise;
}

function compactBeads(beads: CanvasState): CanvasSnapshot {
  const snapshot: CanvasSnapshot = [];

  for (let index = 0; index < beads.length; index += 1) {
    const fill = beads[index];

    if (fill) {
      snapshot.push({ index, fill });
    }
  }

  return snapshot;
}

function expandSnapshot(
  snapshot: CanvasSnapshot,
  cellCount: number,
): CanvasState {
  const beads = createEmptyCanvas(cellCount);

  for (const cell of snapshot) {
    if (cell.index >= 0 && cell.index < cellCount) {
      beads[cell.index] = cell.fill;
    }
  }

  return beads;
}

function isSameSnapshot(a: CanvasSnapshot, b: CanvasSnapshot) {
  if (a.length !== b.length) {
    return false;
  }

  for (let index = 0; index < a.length; index += 1) {
    const left = a[index];
    const right = b[index];

    if (
      left.index !== right.index ||
      left.fill.code !== right.fill.code ||
      left.fill.hex !== right.fill.hex
    ) {
      return false;
    }
  }

  return true;
}
