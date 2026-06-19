import { Suspense } from "react";
import { BeadEditorFromUrl } from "@/app/editor/editor-from-url";
import { BeadEditorSkeleton } from "@/features/bead/components/bead-editor-skeleton";

export default function EditorPage() {
  return (
    <Suspense fallback={<BeadEditorSkeleton />}>
      <BeadEditorFromUrl />
    </Suspense>
  );
}
