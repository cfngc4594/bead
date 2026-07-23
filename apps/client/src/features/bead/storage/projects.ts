import {
  type CanvasSizeId,
  getCanvasSizeDefinition,
} from "@bead/core/canvas-sizes";
import type { CanvasSnapshot } from "@bead/core/canvas-snapshot";
import {
  BasicIndex,
  createCollection,
  localStorageCollectionOptions,
} from "@tanstack/react-db";
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
import {
  collectionItemsCollection,
  collectionsCollection,
  getCollectionItemKey,
  preloadCollectionStorage,
} from "@/features/collections/storage/collection-storage";
import { commitLocalStorageMutation } from "@/lib/local-storage-transaction";

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

projectsCollection.createIndex((project) => project.id, {
  indexType: BasicIndex,
});

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
    id: createProjectId(),
    title: project.title,
    sizeId: project.sizeId,
    snapshots: project.snapshots.map(cloneSnapshot),
    currentIndex: project.currentIndex,
    updatedAt: Date.now(),
  };

  await commitProjectMutation(() => {
    projectsCollection.insert(duplicatedProject);
  });

  return duplicatedProject;
}

export async function createProjectFromSnapshot({
  sizeId,
  snapshot,
  title,
}: {
  sizeId: CanvasSizeId;
  snapshot: CanvasSnapshot;
  title: string;
}) {
  await projectsCollection.preload();
  const project = buildProjectFromSnapshot({
    sizeId,
    snapshot,
    title,
  });

  await commitProjectMutation(() => {
    projectsCollection.insert(project);
  });

  return project;
}

export async function deleteProject(projectId: ProjectId) {
  await Promise.all([projectsCollection.preload(), preloadCollectionStorage()]);
  getRequiredProject(projectId);
  const relatedItems = [...collectionItemsCollection.values()].filter(
    (item) => item.projectId === projectId,
  );
  const relatedCollectionIds = new Set(
    relatedItems.map((item) => item.collectionId),
  );
  const remainingItemsByCollection = new Map(
    [...relatedCollectionIds].map((collectionId) => [
      collectionId,
      [...collectionItemsCollection.values()]
        .filter(
          (item) =>
            item.collectionId === collectionId && item.projectId !== projectId,
        )
        .sort((left, right) => left.position - right.position),
    ]),
  );
  const now = Date.now();

  return commitProjectDeletion(() => {
    if (relatedItems.length > 0) {
      collectionItemsCollection.delete(
        relatedItems.map((item) =>
          getCollectionItemKey(item.collectionId, item.projectId),
        ),
      );
    }
    relatedCollectionIds.forEach((collectionId) => {
      if (!collectionsCollection.has(collectionId)) {
        return;
      }

      collectionsCollection.update(collectionId, (draft) => {
        draft.updatedAt = now;
      });
      remainingItemsByCollection
        .get(collectionId)
        ?.forEach((item, position) => {
          if (item.position === position) {
            return;
          }

          collectionItemsCollection.update(
            getCollectionItemKey(item.collectionId, item.projectId),
            (draft) => {
              draft.position = position;
            },
          );
        });
    });
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

export async function createProject(sizeId: CanvasSizeId) {
  const size = getCanvasSizeDefinition(sizeId);
  const project: Project = {
    id: createProjectId(),
    title: DEFAULT_PROJECT_TITLE,
    sizeId,
    snapshots: [compactCanvas(createEmptyCanvas(size.rows * size.cols))],
    currentIndex: 0,
    updatedAt: Date.now(),
  };

  await commitProjectMutation(() => {
    projectsCollection.insert(project);
  });

  return project;
}

export function buildProjectFromSnapshot({
  sizeId,
  snapshot,
  title,
  updatedAt = Date.now(),
}: {
  sizeId: CanvasSizeId;
  snapshot: CanvasSnapshot;
  title: string;
  updatedAt?: number;
}): Project {
  const normalizedTitle = normalizeProjectTitle(title);

  return {
    id: createProjectId(),
    title:
      normalizedTitle.length === 0 ? DEFAULT_PROJECT_TITLE : normalizedTitle,
    sizeId,
    snapshots: [cloneSnapshot(snapshot)],
    currentIndex: 0,
    updatedAt,
  };
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
  return commitLocalStorageMutation(
    mutator,
    projectsCollection.utils.acceptMutations,
  );
}

function commitProjectDeletion(mutator: () => void) {
  return commitLocalStorageMutation(
    mutator,
    projectsCollection.utils.acceptMutations,
    collectionsCollection.utils.acceptMutations,
    collectionItemsCollection.utils.acceptMutations,
  );
}
