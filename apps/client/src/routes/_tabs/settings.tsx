import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_tabs/settings")({
  component: SettingsPage,
});

function SettingsPage() {
  return <main aria-label="设置" className="min-h-full bg-background" />;
}
