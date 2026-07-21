import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_tabs/discover")({
  component: DiscoverPage,
});

function DiscoverPage() {
  return <main aria-label="发现" className="min-h-full bg-background" />;
}
