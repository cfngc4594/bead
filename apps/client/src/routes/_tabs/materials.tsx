import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_tabs/materials")({
  component: MaterialsPage,
});

function MaterialsPage() {
  return <main aria-label="素材" className="min-h-full bg-background" />;
}
