import {
  publishDiscoverCollectionSchema,
  publishDiscoverProjectsSchema,
} from "@bead/core/discover";
import { zValidator } from "@hono/zod-validator";
import { Hono } from "hono";
import { z } from "zod";
import {
  createDiscoverCollection,
  createDiscoverProjects,
  findDiscoverCollection,
  findDiscoverProject,
  listDiscoverCollections,
  listDiscoverProjects,
} from "./repository";

const discoverProjectParamSchema = z.object({
  projectId: z.uuid(),
});
const discoverCollectionParamSchema = z.object({
  collectionId: z.uuid(),
});

export type DiscoverRouteRepository = {
  createCollection: typeof createDiscoverCollection;
  createProjects: typeof createDiscoverProjects;
  findCollection: typeof findDiscoverCollection;
  findProject: typeof findDiscoverProject;
  listCollections: typeof listDiscoverCollections;
  listProjects: typeof listDiscoverProjects;
};

const discoverRepository: DiscoverRouteRepository = {
  createCollection: createDiscoverCollection,
  createProjects: createDiscoverProjects,
  findCollection: findDiscoverCollection,
  findProject: findDiscoverProject,
  listCollections: listDiscoverCollections,
  listProjects: listDiscoverProjects,
};

export function createDiscoverRoutes(repository: DiscoverRouteRepository) {
  return new Hono()
    .get("/", async (c) => {
      const projects = await repository.listProjects();
      return c.json({ projects });
    })
    .get("/collections", async (c) => {
      const collections = await repository.listCollections();
      return c.json({ collections });
    })
    .get(
      "/collections/:collectionId",
      zValidator("param", discoverCollectionParamSchema),
      async (c) => {
        const { collectionId } = c.req.valid("param");
        const collection = await repository.findCollection(collectionId);

        if (!collection) {
          return c.json({ error: "Discover collection not found" }, 404);
        }

        return c.json({ collection });
      },
    )
    .post(
      "/collections",
      zValidator("json", publishDiscoverCollectionSchema),
      async (c) => {
        const input = c.req.valid("json");
        const collection = await repository.createCollection(input);
        return c.json({ collection }, 201);
      },
    )
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
