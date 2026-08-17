import { describe, expect, test } from "bun:test";
import { discoverThumbnailSrc } from "./discover-thumbnail-src";

describe("discoverThumbnailSrc", () => {
  test("resolves a relative thumbnail path against the API origin", () => {
    expect(
      discoverThumbnailSrc(
        "/discover/123e4567-e89b-12d3-a456-426614174001/thumbnail",
        "http://localhost:3000",
      ),
    ).toBe(
      "http://localhost:3000/discover/123e4567-e89b-12d3-a456-426614174001/thumbnail",
    );
  });
});
