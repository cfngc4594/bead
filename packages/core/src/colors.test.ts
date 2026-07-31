import { describe, expect, test } from "bun:test";
import {
  colorSchemeIdSchema,
  colorSchemes,
  DEFAULT_COLOR_SCHEME_ID,
  getBeadColor,
  getBeadColorIndex,
  getRequiredColorScheme,
} from "./colors";

describe("color schemes", () => {
  test("loads the default scheme from JSON", () => {
    const defaultScheme = getRequiredColorScheme(DEFAULT_COLOR_SCHEME_ID);
    const mard221 = getRequiredColorScheme("mard-221");

    expect(defaultScheme).toMatchObject({
      id: "mard-291",
      brandId: "mard",
      variant: "291",
    });
    expect(defaultScheme.colors).toHaveLength(291);
    expect(mard221).toMatchObject({
      id: "mard-221",
      brandId: "mard",
      variant: "221",
    });
    expect(mard221.colors).toHaveLength(221);
    expect(colorSchemes).toContain(defaultScheme);
    expect(colorSchemes.map((scheme) => scheme.id)).toEqual([
      "mard-221",
      "mard-291",
    ]);
  });

  test("looks up colors within a scheme", () => {
    expect(getBeadColor("mard-291", "A1")).toEqual({
      code: "A1",
      hex: "#FAF4C8",
    });
    expect(getBeadColorIndex("mard-291", "A1")).toBe(0);
    expect(getBeadColor("mard-221", "M15")).toEqual({
      code: "M15",
      hex: "#757D78",
    });
    expect(getBeadColor("mard-221", "P1")).toBeUndefined();
    expect(getBeadColor("missing", "A1")).toBeUndefined();
  });

  test("normalizes legacy aliases and rejects unregistered scheme ids", () => {
    expect(colorSchemeIdSchema.parse("mard")).toBe("mard-291");
    expect(getRequiredColorScheme("mard").id).toBe("mard-291");
    expect(colorSchemeIdSchema.safeParse("missing").success).toBe(false);
  });
});
