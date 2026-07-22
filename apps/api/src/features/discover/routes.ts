import { zValidator } from "@hono/zod-validator";
import { Hono } from "hono";
import {
  createDiscoverProjects,
  findDiscoverProject,
  listDiscoverProjects,
} from "./repository";
import {
  discoverProjectParamSchema,
  publishDiscoverProjectsSchema,
} from "./schema";

export const discoverRoutes = new Hono()
  .get("/", async (c) => {
    const projects = await listDiscoverProjects();
    return c.json({ projects });
  })
  .get(
    "/:projectId",
    zValidator("param", discoverProjectParamSchema),
    async (c) => {
      const { projectId } = c.req.valid("param");
      const project = await findDiscoverProject(projectId);

      if (!project) {
        return c.json({ error: "Discover project not found" }, 404);
      }

      return c.json({ project });
    },
  )
  .post("/", zValidator("json", publishDiscoverProjectsSchema), async (c) => {
    const input = c.req.valid("json");
    const projects = await createDiscoverProjects(input.projects);
    return c.json({ projects }, 201);
  });
