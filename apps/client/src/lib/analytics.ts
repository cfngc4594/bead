import { Capacitor } from "@capacitor/core";
import { env } from "@/env";

type AnalyticsEventName =
  | "export_image_panel_opened"
  | "canvas_edited"
  | "canvas_cleared"
  | "discover_project_opened"
  | "export_image_regenerated"
  | "export_image_saved"
  | "export_image_shared"
  | "image_export_failed"
  | "image_export_started"
  | "image_export_succeeded"
  | "image_import_failed"
  | "image_import_started"
  | "image_import_succeeded"
  | "model_preview_closed"
  | "model_preview_failed"
  | "model_preview_mode_changed"
  | "model_preview_opened"
  | "project_create_cancelled"
  | "project_created"
  | "project_deleted"
  | "project_duplicated"
  | "project_new_clicked"
  | "project_opened"
  | "project_added_from_discover"
  | "project_published"
  | "project_renamed"
  | "project_size_selected"
  | "redo_used"
  | "template_export_failed"
  | "template_export_started"
  | "template_export_succeeded"
  | "template_import_failed"
  | "template_import_started"
  | "template_import_succeeded"
  | "tool_selected"
  | "undo_used";

type AnalyticsValue = string | number | boolean | null | undefined;
type AnalyticsProperties = Record<string, AnalyticsValue>;
type AnalyticsPayload = Record<string, unknown> & { url?: string };
type AnalyticsUrlResolver = (url: string) => string;

declare global {
  interface Window {
    beadAnalyticsBeforeSend?: (
      type: string,
      payload: AnalyticsPayload,
    ) => AnalyticsPayload;
    umami?: {
      track: (eventName: string, eventData?: AnalyticsProperties) => void;
    };
  }
}

const analyticsScriptId = "umami-analytics-script";
const analyticsBeforeSendName = "beadAnalyticsBeforeSend";
const queuedEventsLimit = 20;
const queuedEvents: Array<{
  eventName: AnalyticsEventName;
  properties: AnalyticsProperties;
}> = [];

export function initAnalytics(resolveUrl: AnalyticsUrlResolver) {
  const config = getAnalyticsConfig();

  if (!config || typeof document === "undefined") {
    return;
  }

  window.beadAnalyticsBeforeSend = (type, payload) =>
    normalizeAnalyticsPayload(type, payload, resolveUrl);

  if (document.getElementById(analyticsScriptId)) {
    return;
  }

  const script = document.createElement("script");
  script.id = analyticsScriptId;
  script.defer = true;
  script.src = config.scriptUrl;
  script.dataset.beforeSend = analyticsBeforeSendName;
  script.dataset.websiteId = config.websiteId;
  script.addEventListener("load", flushQueuedEvents, { once: true });

  document.head.appendChild(script);
}

export function trackEvent(
  eventName: AnalyticsEventName,
  properties: AnalyticsProperties = {},
) {
  if (!getAnalyticsConfig()) {
    return;
  }

  if (typeof window === "undefined") {
    return;
  }

  const eventProperties = {
    platform: Capacitor.getPlatform(),
    ...properties,
  };

  if (!window.umami) {
    queueEvent(eventName, eventProperties);
    return;
  }

  try {
    window.umami.track(eventName, eventProperties);
  } catch (error) {
    console.warn("Unable to track analytics event", eventName, error);
  }
}

export function getFilledCellCount(beads: Array<unknown>): number {
  return beads.reduce<number>((total, bead) => total + (bead ? 1 : 0), 0);
}

function getAnalyticsConfig() {
  const scriptUrl = env.VITE_UMAMI_SCRIPT_URL;
  const websiteId = env.VITE_UMAMI_WEBSITE_ID;

  if (!scriptUrl || !websiteId) {
    return null;
  }

  return { scriptUrl, websiteId };
}

function queueEvent(
  eventName: AnalyticsEventName,
  properties: AnalyticsProperties,
) {
  queuedEvents.push({ eventName, properties });

  if (queuedEvents.length > queuedEventsLimit) {
    queuedEvents.shift();
  }
}

function flushQueuedEvents() {
  if (!window.umami) {
    return;
  }

  for (const event of queuedEvents.splice(0)) {
    try {
      window.umami.track(event.eventName, event.properties);
    } catch (error) {
      console.warn("Unable to flush analytics event", event.eventName, error);
    }
  }
}

function normalizeAnalyticsPayload(
  _type: string,
  payload: AnalyticsPayload,
  resolveUrl: AnalyticsUrlResolver,
): AnalyticsPayload {
  if (typeof payload.url !== "string") {
    return payload;
  }

  return {
    ...payload,
    url: resolveUrl(payload.url),
  };
}
