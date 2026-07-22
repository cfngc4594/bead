import type { CanvasSizeId } from "@bead/core/canvas-sizes";
import type { CanvasSnapshot } from "@bead/core/canvas-snapshot";
import {
  createCollection,
  createTransaction,
  localStorageCollectionOptions,
} from "@tanstack/react-db";
import type { CanvasSize } from "@/config/canvas-sizes";
import {
  type CanvasState,
  createEmptyCanvas,
  isSameCanvas,
} from "@/features/bead/lib/canvas-state";
import type { Project } from "@/features/bead/storage/project-schema";
import { projectIntegritySchema } from "@/features/bead/storage/project-schema";
import {
  cloneSnapshot,
  compactCanvas,
  expandSnapshot,
  getSnapshotFilledCount,
} from "@/features/bead/storage/project-snapshots";

export type ProjectId = string;
export type { Project };

export const DEFAULT_PROJECT_TITLE = "未命名作品";
const PROJECTS_STORAGE_KEY = "bead:projects";

export const projectsCollection = createCollection(
  localStorageCollectionOptions({
    id: "projects",
    schema: projectIntegritySchema,
    storageKey: PROJECTS_STORAGE_KEY,
    getKey: (project) => project.id,
  }),
);

export async function preloadProjectsCollection() {
  await projectsCollection.preload();
  return null;
}

export function getCurrentCanvas({
  cellCount,
  project,
}: {
  cellCount: number;
  project: Project;
}) {
  return expandSnapshot({
    cellCount,
    snapshot: project.snapshots[project.currentIndex],
  });
}

export function canUndo(project: Project) {
  return project.currentIndex > 0;
}

export function canRedo(project: Project) {
  return project.currentIndex < project.snapshots.length - 1;
}

export function saveCanvasSnapshot({
  beads,
  baseIndex,
  projectId,
}: {
  beads: CanvasState;
  baseIndex: number;
  projectId: ProjectId;
}) {
  const project = getRequiredProject(projectId);
  const currentCanvas = expandSnapshot({
    cellCount: beads.length,
    snapshot: project.snapshots[baseIndex],
  });

  if (isSameCanvas(beads, currentCanvas)) {
    return Promise.resolve();
  }

  return commitProjectMutation(() => {
    projectsCollection.update(projectId, (draft) => {
      const branchIndex = Math.min(baseIndex, draft.snapshots.length - 1);
      const snapshots = draft.snapshots.slice(0, branchIndex + 1);

      snapshots.push(compactCanvas(beads));
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
    snapshots: project.snapshots.map(cloneSnapshot),
    updatedAt: Date.now(),
  };

  await commitProjectMutation(() => {
    projectsCollection.insert(duplicatedProject);
  });

  return duplicatedProject;
}

export async function createProjectFromSnapshot({
  cols,
  rows,
  sizeId,
  snapshot,
  title,
}: {
  cols: number;
  rows: number;
  sizeId: CanvasSizeId;
  snapshot: CanvasSnapshot;
  title: string;
}) {
  await projectsCollection.preload();

  const normalizedTitle = normalizeProjectTitle(title);
  const project: Project = {
    id: createProjectId(),
    title:
      normalizedTitle.length === 0 ? DEFAULT_PROJECT_TITLE : normalizedTitle,
    sizeId,
    rows,
    cols,
    snapshots: [cloneSnapshot(snapshot)],
    currentIndex: 0,
    updatedAt: Date.now(),
  };

  await commitProjectMutation(() => {
    projectsCollection.insert(project);
  });

  return project;
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
  const normalizedTitle = normalizeProjectTitle(title);
  const nextTitle =
    normalizedTitle.length === 0 ? DEFAULT_PROJECT_TITLE : normalizedTitle;

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
    snapshots: [compactCanvas(createEmptyCanvas(size.rows * size.cols))],
    currentIndex: 0,
    updatedAt: Date.now(),
  };

  await commitProjectMutation(() => {
    projectsCollection.insert(project);
  });

  return project;
}

export function getFilledCount(
  project: Pick<Project, "currentIndex" | "snapshots">,
) {
  return getSnapshotFilledCount(project.snapshots[project.currentIndex]);
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
