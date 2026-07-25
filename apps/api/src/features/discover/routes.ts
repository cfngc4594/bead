import { publishDiscoverProjectsSchema } from "@bead/core/discover";
import { zValidator } from "@hono/zod-validator";
import { Hono } from "hono";
import { z } from "zod";
import {
  createDiscoverProjects,
  findDiscoverProject,
  listDiscoverProjects,
} from "./repository.js";

const discoverProjectParamSchema = z.object({
  projectId: z.uuid(),
});

export type DiscoverRouteRepository = {
  createProjects: typeof createDiscoverProjects;
  findProject: typeof findDiscoverProject;
  listProjects: typeof listDiscoverProjects;
};

const discoverRepository: DiscoverRouteRepository = {
  createProjects: createDiscoverProjects,
  findProject: findDiscoverProject,
  listProjects: listDiscoverProjects,
};

export function createDiscoverRoutes(repository: DiscoverRouteRepository) {
  return new Hono()
    .get("/", async (c) => {
      const projects = await repository.listProjects();
      return c.json({ projects });
    })
    .get(
      "/:projectId",
      zValidator("param", discoverProjectParamSchema),
      async (c) => {
        const { projectId } = c.req.valid("param");
        const project = await repository.findProject(projectId);

        if (!project) {
          return c.json({ error: "Discover project not found" }, 404);
        }

        return c.json({ project });
      },
    )
    .post("/", zValidator("json", publishDiscoverProjectsSchema), async (c) => {
      const input = c.req.valid("json");
      const projects = await repository.createProjects(input.projects);
      return c.json({ projects }, 201);
    });
}

export const discoverRoutes = createDiscoverRoutes(discoverRepository);
