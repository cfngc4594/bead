import { expect, test } from "bun:test";
import type { Project } from "@/features/bead/storage/projects";
import { createPublishInput } from "./create-publish-input";

test("createPublishInput copies only the current project snapshot", () => {
  const project: Project = {
    id: "local-project",
    title: "Demo",
    sizeId: "16x16",
    rows: 16,
    cols: 16,
    snapshots: [{ cells: [[0, "A1"]] }, { cells: [[1, "B2"]] }],
    currentIndex: 1,
    updatedAt: 42,
  };

  expect(createPublishInput(project)).toEqual({
    title: "Demo",
    sizeId: "16x16",
    rows: 16,
    cols: 16,
    snapshot: { cells: [[1, "B2"]] },
  });
});
