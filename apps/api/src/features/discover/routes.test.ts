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

describe("discover project routes", () => {
  test("returns discover projects", async () => {
    const project = createProject(createPublishProject("Rabbit"), 0);
    const app = createDiscoverRoutes(
      createRepository({ listProjects: async () => [project] }),
    );

    const response = await app.request("/");

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ projects: [project] });
  });

  test("returns 404 for a missing project and 400 for an invalid id", async () => {
    const app = createDiscoverRoutes(createRepository());

    expect((await app.request(`/${PROJECT_ID}`)).status).toBe(404);
    expect((await app.request("/not-a-uuid")).status).toBe(400);
  });

  test("validates publish input", async () => {
    let receivedProjects: PublishDiscoverProject[] | undefined;
    const app = createDiscoverRoutes(
      createRepository({
        createProjects: async (projects) => {
          receivedProjects = projects;
          return projects.map(createProject);
        },
      }),
    );
    const input = {
      projects: [createPublishProject("Rabbit"), createPublishProject("Flower")],
    };

    const response = await app.request("/", {
      body: JSON.stringify(input),
      headers: { "content-type": "application/json" },
      method: "POST",
    });

    expect(response.status).toBe(201);
    expect(receivedProjects?.map((project) => project.title)).toEqual([
      "Rabbit",
      "Flower",
    ]);
    const responseBody = z
      .object({ projects: z.array(discoverProjectSchema) })
      .parse(await response.json());
    expect(responseBody.projects.map((project) => project.title)).toEqual([
      "Rabbit",
      "Flower",
    ]);

    const invalidResponse = await app.request("/", {
      body: JSON.stringify({ projects: [] }),
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
    createProjects: async (projects) =>
      projects.map((project, index) => createProject(project, index)),
    findProject: async () => null,
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
  index = 0,
): DiscoverProject {
  return {
    ...project,
    id:
      index === 0
        ? PROJECT_ID
        : `123e4567-e89b-12d3-a456-42661417400${index + 1}`,
    publishedAt: 1,
  };
}
