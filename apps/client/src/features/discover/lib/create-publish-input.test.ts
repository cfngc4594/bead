import { expect, test } from "bun:test";
import type { Project } from "@/features/bead/storage/projects";
import { createPublishInput } from "./create-publish-input";

test("createPublishInput copies only the current project snapshot", () => {
  const project: Project = {
    id: "local-project",
    title: "Demo",
    sizeId: "16x16",
    snapshots: [
      { colorSchemeId: "mard-291", cells: [[0, "A1"]] },
      { colorSchemeId: "mard-291", cells: [[1, "B2"]] },
    ],
    currentIndex: 1,
    updatedAt: 42,
  };

  expect(createPublishInput(project)).toEqual({
    title: "Demo",
    sizeId: "16x16",
    snapshot: { colorSchemeId: "mard-291", cells: [[1, "B2"]] },
  });
});
