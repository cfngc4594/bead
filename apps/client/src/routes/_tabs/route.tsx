import { createFileRoute } from "@tanstack/react-router";
import { TabLayout } from "@/features/navigation/tab-layout";

export const Route = createFileRoute("/_tabs")({
  component: TabLayout,
});
