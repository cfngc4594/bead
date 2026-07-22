import {
  createCollection,
  createTransaction,
  localStorageCollectionOptions,
} from "@tanstack/react-db";
import { cloneSnapshot } from "@/features/bead/storage/project-snapshots";
import {
  getFilledCount,
  type Project,
  projectsCollection,
} from "@/features/bead/storage/projects";
import {
  type PublishedProject,
  publishedProjectSchema,
} from "@/features/bead/storage/published-project-schema";

const PUBLISHED_PROJECTS_STORAGE_KEY = "bead:published-projects";

export type { PublishedProject };

export const publishedProjectsCollection = createCollection(
  localStorageCollectionOptions({
    id: "published-projects",
    schema: publishedProjectSchema,
    storageKey: PUBLISHED_PROJECTS_STORAGE_KEY,
    getKey: (project) => project.id,
  }),
);

export async function preloadProjectSharingCollections() {
  await Promise.all([
    projectsCollection.preload(),
    publishedProjectsCollection.preload(),
  ]);
  return null;
}

export async function publishProjects(projectIds: string[]) {
  await preloadProjectSharingCollections();

  const projects = [...new Set(projectIds)].map((projectId) => {
    const project = projectsCollection.get(projectId);

    if (!project) {
      throw new Error(`Bead project not found: ${projectId}`);
    }

    if (getFilledCount(project) === 0) {
      throw new Error(`Blank bead project cannot be published: ${projectId}`);
    }

    return project;
  });

  if (projects.length === 0) {
    return;
  }

  const publishedAt = Date.now();

  await commitPublishedProjectMutation(() => {
    for (const project of projects) {
      const publishedProject = createPublishedProject({
        project,
        publishedAt,
      });
      const existingProject = publishedProjectsCollection.get(project.id);

      if (existingProject) {
        publishedProjectsCollection.update(project.id, (draft) => {
          Object.assign(draft, publishedProject);
        });
      } else {
        publishedProjectsCollection.insert(publishedProject);
      }
    }
  });
}

export async function unpublishProject(projectId: string) {
  await publishedProjectsCollection.preload();

  if (!publishedProjectsCollection.get(projectId)) {
    return;
  }

  await commitPublishedProjectMutation(() => {
    publishedProjectsCollection.delete(projectId);
  });
}

function createPublishedProject({
  project,
  publishedAt,
}: {
  project: Project;
  publishedAt: number;
}): PublishedProject {
  return {
    id: project.id,
    title: project.title,
    sizeId: project.sizeId,
    rows: project.rows,
    cols: project.cols,
    snapshot: cloneSnapshot(project.snapshots[project.currentIndex]),
    sourceUpdatedAt: project.updatedAt,
    publishedAt,
  };
}

function commitPublishedProjectMutation(mutator: () => void) {
  const transaction = createTransaction({
    mutationFn: async ({ transaction }) => {
      publishedProjectsCollection.utils.acceptMutations(transaction);
    },
  });

  transaction.mutate(mutator);
  return transaction.isPersisted.promise;
}
