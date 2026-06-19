"use client";

import dynamic from "next/dynamic";
import { BeadEditorSkeleton } from "@/features/bead/components/bead-editor-skeleton";

export const BeadEditorFromUrlNoSsr = dynamic(
  () =>
    import("@/app/editor/editor-from-url").then(
      (module) => module.BeadEditorFromUrl,
    ),
  {
    loading: () => <BeadEditorSkeleton />,
    ssr: false,
  },
);
