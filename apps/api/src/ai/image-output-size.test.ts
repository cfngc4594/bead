import { describe, expect, test } from "bun:test";
import { getStylizeOutputSize } from "./image-output-size.js";

describe("getStylizeOutputSize", () => {
  test("uses legal image sizes aligned to every canvas grid", () => {
    expect(getStylizeOutputSize("16x16")).toBe("816x816");
    expect(getStylizeOutputSize("29x29")).toBe("928x928");
    expect(getStylizeOutputSize("58x58")).toBe("928x928");
    expect(getStylizeOutputSize("87x87")).toBe("1392x1392");
  });
});
