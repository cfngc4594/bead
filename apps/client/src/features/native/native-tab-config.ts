import { linkOptions } from "@tanstack/react-router";

export const NATIVE_TAB_CONTENT_ID = "native-tab-content";

export const NATIVE_TAB_CONTENT_SELECTOR = `#${NATIVE_TAB_CONTENT_ID}`;

export const nativeTabs = linkOptions([
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

export const nativeStartTab = nativeTabs[0];
export const nativeSecondaryTabs = nativeTabs.slice(1);
