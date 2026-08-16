import { describe, expect, test } from "bun:test";
import {
  type AnalyticsRouteMatcher,
  resolveAnalyticsUrl,
} from "./analytics-url";

describe("resolveAnalyticsUrl", () => {
  test.each([
    ["/projects/123", "/projects/$projectId"],
    ["/projects/123?source=recent", "/projects/$projectId?source=recent"],
    ["/discover/456#preview", "/discover/$projectId#preview"],
  ])("uses the matched route template for %s", (url, expected) => {
    const fullPath = url.startsWith("/discover")
      ? "/discover/$projectId"
      : "/projects/$projectId";

    expect(resolveAnalyticsUrl(url, matcherFor(fullPath))).toBe(expected);
  });

  test("keeps a static route selected by the router", () => {
    expect(
      resolveAnalyticsUrl("/projects/new", matcherFor("/projects/new")),
    ).toBe("/projects/new");
  });

  test("leaves an unmatched URL unchanged", () => {
    expect(resolveAnalyticsUrl("/missing", () => [])).toBe("/missing");
  });

  test("leaves a not-found URL unchanged", () => {
    expect(
      resolveAnalyticsUrl("/missing", () => [
        { fullPath: "/", globalNotFound: true },
      ]),
    ).toBe("/missing");
  });
});

function matcherFor(fullPath: string): AnalyticsRouteMatcher {
  return () => [{ fullPath: "/" }, { fullPath }];
}
