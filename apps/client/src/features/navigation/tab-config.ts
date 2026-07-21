import { linkOptions } from "@tanstack/react-router";

export const TAB_CONTENT_ID = "tab-content";

export const TAB_CONTENT_SELECTOR = `#${TAB_CONTENT_ID}`;

export const appTabs = linkOptions([
  {
    activeOptions: { exact: true },
    id: "projects",
    label: "作品",
    to: "/projects",
  },
  {
    activeOptions: { exact: true },
    id: "discover",
    label: "发现",
    to: "/discover",
  },
  {
    activeOptions: { exact: true },
    id: "settings",
    label: "设置",
    to: "/settings",
  },
]);

export const appStartTab = appTabs[0];
export const appSecondaryTabs = appTabs.slice(1);
