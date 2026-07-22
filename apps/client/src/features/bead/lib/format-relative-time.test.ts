import { expect, test } from "bun:test";
import { formatRelativeTime } from "./format-relative-time";

const now = Date.UTC(2026, 6, 22);

test("formatRelativeTime uses the largest complete relative unit", () => {
  expect(formatRelativeTime(now - 59_000, now)).toBe("刚刚");
  expect(formatRelativeTime(now - 60_000, now)).toBe("1 分钟前");
  expect(formatRelativeTime(now - 2 * 60 * 60_000, now)).toBe("2 小时前");
  expect(formatRelativeTime(now - 3 * 24 * 60 * 60_000, now)).toBe("3 天前");
});

test("formatRelativeTime supports future timestamps", () => {
  expect(formatRelativeTime(now + 30 * 24 * 60 * 60_000, now)).toBe("1 个月内");
});
