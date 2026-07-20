import { createFileRoute } from "@tanstack/react-router";
import { NativeTabLayout } from "@/features/native/native-tab-layout";

export const Route = createFileRoute("/_tabs")({
  component: NativeTabLayout,
});
