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
    id: "materials",
    label: "素材",
    to: "/materials",
  },
  {
    activeOptions: { exact: true },
    id: "me",
    label: "我的",
    to: "/me",
  },
]);

export const appStartTab = appTabs[0];
export const appSecondaryTabs = appTabs.slice(1);
