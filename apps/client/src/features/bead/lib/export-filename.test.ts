import { expect, test } from "bun:test";
import {
  stripFileExtension,
  uniqueNativeFileBase,
  uniqueNativeFilename,
} from "@/features/bead/lib/export-filename";

const date = new Date("2026-08-18T03:56:07.123Z");

test("strips a single file extension", () => {
  expect(stripFileExtension("bead-29x29.png")).toBe("bead-29x29");
});

test("makes native album file names unique per save", () => {
  expect(uniqueNativeFileBase("bead-29x29.png", date)).toBe(
    `bead-29x29-${formatLocalStamp(date)}`,
  );
});

test("keeps the original extension on native share files", () => {
  expect(uniqueNativeFilename("bead-29x29.png", date)).toBe(
    `bead-29x29-${formatLocalStamp(date)}.png`,
  );
});

function formatLocalStamp(value: Date) {
  const pad = (part: number, size = 2) => String(part).padStart(size, "0");

  return `${value.getFullYear()}${pad(value.getMonth() + 1)}${pad(value.getDate())}-${pad(value.getHours())}${pad(value.getMinutes())}${pad(value.getSeconds())}${pad(value.getMilliseconds(), 3)}`;
}
