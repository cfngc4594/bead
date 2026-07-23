import { describe, expect, test } from "bun:test";
import type {
  DiscoverCollection,
  DiscoverCollectionSummary,
  DiscoverProject,
  PublishDiscoverCollection,
  PublishDiscoverProject,
} from "@bead/core/discover";
import { discoverCollectionSchema } from "@bead/core/discover";
import { z } from "zod";
import { createDiscoverRoutes, type DiscoverRouteRepository } from "./routes";

const COLLECTION_ID = "123e4567-e89b-12d3-a456-426614174000";
const PROJECT_IDS = [
  "123e4567-e89b-12d3-a456-426614174001",
  "123e4567-e89b-12d3-a456-426614174002",
] as const;

describe("discover collection routes", () => {
  test("returns lightweight collection summaries", async () => {
    const summary = createCollectionSummary();
    const app = createDiscoverRoutes(
      createRepository({ listCollections: async () => [summary] }),
    );

    const response = await app.request("/collections");

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ collections: [summary] });
  });

  test("returns 404 for a missing collection and 400 for an invalid id", async () => {
    const app = createDiscoverRoutes(createRepository());

    expect((await app.request(`/collections/${COLLECTION_ID}`)).status).toBe(
      404,
    );
    expect((await app.request("/collections/not-a-uuid")).status).toBe(400);
  });

  test("validates publish input and preserves project order", async () => {
    let receivedInput: PublishDiscoverCollection | undefined;
    const app = createDiscoverRoutes(
      createRepository({
        createCollection: async (input) => {
          receivedInput = input;
          return createCollection(input);
        },
      }),
    );
    const input = {
      title: "Spring set",
      projects: [
        createPublishProject("Rabbit"),
        createPublishProject("Flower"),
      ],
    };

    const response = await app.request("/collections", {
      body: JSON.stringify(input),
      headers: { "content-type": "application/json" },
      method: "POST",
    });

    expect(response.status).toBe(201);
    expect(receivedInput?.projects.map((project) => project.title)).toEqual([
      "Rabbit",
      "Flower",
    ]);
    const responseBody = z
      .object({ collection: discoverCollectionSchema })
      .parse(await response.json());
    expect(
      responseBody.collection.projects.map((project) => project.title),
    ).toEqual(["Rabbit", "Flower"]);

    const invalidResponse = await app.request("/collections", {
      body: JSON.stringify({ title: "Empty", projects: [] }),
      headers: { "content-type": "application/json" },
      method: "POST",
    });
    expect(invalidResponse.status).toBe(400);
  });
});

function createRepository(
  overrides: Partial<DiscoverRouteRepository> = {},
): DiscoverRouteRepository {
  return {
    createCollection: async (input) => createCollection(input),
    createProjects: async (projects) =>
      projects.map((project, index) => createProject(project, index)),
    findCollection: async () => null,
    findProject: async () => null,
    listCollections: async () => [],
    listProjects: async () => [],
    ...overrides,
  };
}

function createPublishProject(title: string): PublishDiscoverProject {
  return {
    title,
    sizeId: "16x16",
    snapshot: { cells: [[0, "A1"]] },
  };
}

function createProject(
  project: PublishDiscoverProject,
  index: number,
): DiscoverProject {
  return {
    ...project,
    id: PROJECT_IDS[index] ?? PROJECT_IDS[0],
    publishedAt: 1,
  };
}

function createCollection(
  input: PublishDiscoverCollection,
): DiscoverCollection {
  return {
    id: COLLECTION_ID,
    title: input.title,
    publishedAt: 1,
    projects: input.projects.map(createProject),
  };
}

function createCollectionSummary(): DiscoverCollectionSummary {
  const project = createProject(createPublishProject("Rabbit"), 0);

  return {
    id: COLLECTION_ID,
    title: "Spring set",
    publishedAt: 1,
    projectCount: 12,
    previewProjects: [
      {
        id: project.id,
        sizeId: project.sizeId,
        snapshot: project.snapshot,
      },
    ],
  };
}
