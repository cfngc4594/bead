import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/projects/collections/$collectionId")({
  beforeLoad: () => {
    throw redirect({ to: "/projects" });
  },
});
