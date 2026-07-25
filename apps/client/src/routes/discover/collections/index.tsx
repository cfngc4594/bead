import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/discover/collections/")({
  beforeLoad: () => {
    throw redirect({ to: "/discover" });
  },
});
