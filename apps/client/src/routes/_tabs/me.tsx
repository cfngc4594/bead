import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_tabs/me")({
  component: MePage,
});

function MePage() {
  return <main aria-label="我的" className="min-h-full bg-background" />;
}
