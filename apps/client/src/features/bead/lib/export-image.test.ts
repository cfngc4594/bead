import { expect, test } from "bun:test";
import { defaultBeadImageDisplayOptions } from "@bead/core/bead-image-svg";
import {
  createBeadImageSvgBlob,
  prepareBeadImage,
} from "@/features/bead/lib/export-image";

test("creates the preview blob from the prepared SVG document", async () => {
  const renderer = prepareBeadImage({
    beads: [{ code: "A1", hex: "#FAF4C8" }, null],
    cols: 2,
    rows: 1,
  });
  const image = renderer.render(defaultBeadImageDisplayOptions);
  const previewBlob = createBeadImageSvgBlob(image);

  expect(previewBlob.type).toBe("image/svg+xml;charset=utf-8");
  expect(await previewBlob.text()).toBe(image.svg);
});
