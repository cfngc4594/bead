import { expect, test } from "bun:test";
import type { PublishedProject } from "./published-project-schema";
import { publishedProjectSchema } from "./published-project-schema";

test("publishedProjectSchema accepts a single published snapshot", () => {
  expect(
    publishedProjectSchema.safeParse(createPublishedProject()).success,
  ).toBe(true);
});

test("publishedProjectSchema rejects invalid snapshot references", () => {
  expect(
    publishedProjectSchema.safeParse(
      createPublishedProject({ snapshot: { cells: [[256, "A1"]] } }),
    ).success,
  ).toBe(false);
  expect(
    publishedProjectSchema.safeParse(
      createPublishedProject({
        snapshot: {
          cells: [
            [0, "A1"],
            [0, "B2"],
          ],
        },
      }),
    ).success,
  ).toBe(false);
});

test("publishedProjectSchema rejects project history fields", () => {
  expect(
    publishedProjectSchema.safeParse({
      ...createPublishedProject(),
      currentIndex: 0,
      snapshots: [{ cells: [[0, "A1"]] }],
    }).success,
  ).toBe(false);
});

function createPublishedProject(
  overrides: Partial<PublishedProject> = {},
): PublishedProject {
  return {
    id: "published-project-1",
    title: "Demo",
    sizeId: "16x16",
    rows: 16,
    cols: 16,
    snapshot: {
      cells: [
        [0, "A1"],
        [5, "B2"],
      ],
    },
    sourceUpdatedAt: 1,
    publishedAt: 2,
    ...overrides,
  };
}
