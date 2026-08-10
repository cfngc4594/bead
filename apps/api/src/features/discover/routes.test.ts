import { describe, expect, test } from "bun:test";
import type {
  DiscoverProject,
  PublishDiscoverProject,
} from "@bead/core/discover";
import { discoverProjectSchema } from "@bead/core/discover";
import { z } from "zod";
import {
  createDiscoverRoutes,
  type DiscoverRouteRepository,
} from "./routes.js";

const PROJECT_ID = "123e4567-e89b-12d3-a456-426614174001";
const USER_ID = "publisher-user-id";

describe("discover project routes", () => {
  test("returns discover projects", async () => {
    const project = createProject(createPublishProject("Rabbit"));
    const app = createDiscoverRoutes(
      createRepository({ listProjects: async () => [project] }),
      resolveAuthenticatedUser,
    );

    const response = await app.request("/");

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ projects: [project] });
  });

  test("returns 404 for a missing project and 400 for an invalid id", async () => {
    const app = createDiscoverRoutes(
      createRepository(),
      resolveAuthenticatedUser,
    );

    expect((await app.request(`/${PROJECT_ID}`)).status).toBe(404);
    expect((await app.request("/not-a-uuid")).status).toBe(400);
  });

  test("validates publish input", async () => {
    let receivedProject: PublishDiscoverProject | undefined;
    let receivedPublisherUserId: string | undefined;
    const app = createDiscoverRoutes(
      createRepository({
        createProject: async (project, publisherUserId) => {
          receivedProject = project;
          receivedPublisherUserId = publisherUserId;
          return createProject(project);
        },
      }),
      resolveAuthenticatedUser,
    );
    const input = {
      project: createPublishProject("Rabbit"),
    };

    const response = await app.request("/", {
      body: JSON.stringify(input),
      headers: { "content-type": "application/json" },
      method: "POST",
    });

    expect(response.status).toBe(201);
    expect(receivedProject?.title).toBe("Rabbit");
    expect(receivedPublisherUserId).toBe(USER_ID);
    const responseBody = z
      .object({ project: discoverProjectSchema })
      .parse(await response.json());
    expect(responseBody.project.title).toBe("Rabbit");

    const invalidResponse = await app.request("/", {
      body: JSON.stringify({
        projects: [createPublishProject("Rabbit")],
      }),
      headers: { "content-type": "application/json" },
      method: "POST",
    });
    expect(invalidResponse.status).toBe(400);
  });

  test("requires authentication to publish", async () => {
    let createWasCalled = false;
    const app = createDiscoverRoutes(
      createRepository({
        createProject: async (project) => {
          createWasCalled = true;
          return createProject(project);
        },
      }),
      async () => null,
    );

    const response = await app.request("/", {
      body: JSON.stringify({ project: createPublishProject("Rabbit") }),
      headers: { "content-type": "application/json" },
      method: "POST",
    });

    expect(response.status).toBe(401);
    expect(createWasCalled).toBe(false);
  });
});

function createRepository(
  overrides: Partial<DiscoverRouteRepository> = {},
): DiscoverRouteRepository {
  return {
    createProject: async (project) => createProject(project),
    findProject: async () => null,
    listProjects: async () => [],
    ...overrides,
  };
}

async function resolveAuthenticatedUser() {
  return USER_ID;
}

function createPublishProject(title: string): PublishDiscoverProject {
  return {
    title,
    sizeId: "16x16",
    snapshot: { cells: [[0, "A1"]] },
  };
}

function createProject(project: PublishDiscoverProject): DiscoverProject {
  return {
    ...project,
    id: PROJECT_ID,
    publishedAt: 1,
  };
}
