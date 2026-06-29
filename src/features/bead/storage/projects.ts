import {
  createCollection,
  createTransaction,
  localStorageCollectionOptions,
} from "@tanstack/react-db";
import type { CanvasSize, CanvasSizeId } from "@/config/canvas-sizes";
import {
  type CanvasDocumentState,
  type CanvasState,
  createDocumentFromBeads,
  createEmptyDocument,
  isSameDocument,
} from "@/features/bead/lib/canvas-document";
import {
  type CanvasSnapshot,
  compactDocument,
  expandSnapshot,
  getSnapshotFilledCount,
} from "@/features/bead/storage/project-snapshots";

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
const PROJECTS_STORAGE_KEY = "bead:projects:v2";

export const projectsCollection = createCollection(
  localStorageCollectionOptions<Project, ProjectId>({
    id: "projects",
    storageKey: PROJECTS_STORAGE_KEY,
    getKey: (project) => project.id,
  }),
);

export function getCurrentCanvas({
  cellCount,
  project,
}: {
  cellCount: number;
  project: Project;
}) {
  return getCurrentDocument({ cellCount, project }).beads;
}

export function getCurrentDocument({
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
  baseIndex,
  beads,
  projectId,
}: {
  baseIndex?: number;
  beads: CanvasState;
  projectId: ProjectId;
}) {
  return saveCanvasDocumentSnapshot({
    baseIndex,
    document: createDocumentFromBeads(beads),
    projectId,
  });
}

export function saveCanvasDocumentSnapshot({
  baseIndex,
  document,
  projectId,
}: {
  baseIndex?: number;
  document: CanvasDocumentState;
  projectId: ProjectId;
}) {
  const project = getRequiredProject(projectId);
  const projectIndex = baseIndex ?? project.currentIndex;
  const currentDocument = expandSnapshot({
    cellCount: document.beads.length,
    snapshot: project.snapshots[projectIndex],
  });

  if (isSameDocument(document, currentDocument)) {
    return Promise.resolve();
  }

  return commitProjectMutation(() => {
    projectsCollection.update(projectId, (draft) => {
      const branchIndex = Math.min(projectIndex, draft.snapshots.length - 1);
      const snapshots = draft.snapshots.slice(0, branchIndex + 1);

      snapshots.push(compactDocument(document));
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
    snapshots: project.snapshots.map((snapshot) => ({
      ...snapshot,
      c: snapshot.c.map((cell) => [...cell] as typeof cell),
      l: snapshot.l.map((layer) => ({ ...layer })),
    })),
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
    snapshots: [compactDocument(createEmptyDocument(size.rows * size.cols))],
    currentIndex: 0,
    updatedAt: Date.now(),
  };

  await commitProjectMutation(() => {
    projectsCollection.insert(project);
  });

  return project;
}

export function getFilledCount(project: Project) {
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
