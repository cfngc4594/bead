type AnalyticsRouteMatch = {
  fullPath: string;
  globalNotFound?: boolean;
};

export type AnalyticsRouteMatcher = (
  pathname: string,
) => ReadonlyArray<AnalyticsRouteMatch>;

export function resolveAnalyticsUrl(
  url: string,
  matchRoutes: AnalyticsRouteMatcher,
): string {
  const location = new URL(url, "https://analytics.invalid");
  const routeMatch = matchRoutes(location.pathname).at(-1);

  if (!routeMatch || routeMatch.globalNotFound) {
    return url;
  }

  return `${routeMatch.fullPath}${location.search}${location.hash}`;
}
