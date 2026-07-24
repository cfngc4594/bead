import { describe, expect, test } from "bun:test";
import { MAX_DISCOVER_PROJECTS_PER_PUBLISH } from "@bead/core/discover";
import type { Project } from "@/features/bead/storage/projects";
import { getCollectionPublishIssue } from "@/features/collections/storage/collection-transfer";

describe("getCollectionPublishIssue", () => {
  test("accepts a non-empty collection of completed projects", () => {
    expect(getCollectionPublishIssue([createProject()])).toBeNull();
  });

  test("rejects empty collections", () => {
    expect(getCollectionPublishIssue([])).toBe("合集为空，添加作品后才能发布");
  });

  test("allows blank projects as placeholders", () => {
    expect(
      getCollectionPublishIssue([
        createProject({ snapshots: [{ cells: [] }] }),
        createProject({ id: "project-2" }),
      ]),
    ).toBeNull();
  });

  test("rejects collections over the publish limit", () => {
    expect(
      getCollectionPublishIssue(
        Array.from(
          { length: MAX_DISCOVER_PROJECTS_PER_PUBLISH + 1 },
          (_, index) => createProject({ id: `project-${index}` }),
        ),
      ),
    ).toBe(`每个合集最多发布 ${MAX_DISCOVER_PROJECTS_PER_PUBLISH} 个作品`);
  });
});

function createProject(overrides: Partial<Project> = {}): Project {
  return {
    id: "project-1",
    title: "Demo",
    sizeId: "16x16",
    snapshots: [{ cells: [[0, "A1"]] }],
    currentIndex: 0,
    updatedAt: 1,
    ...overrides,
  };
}
