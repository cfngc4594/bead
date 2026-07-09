import type { ComponentType } from "react";
import type { BeadModelSceneProps } from "@/features/bead/components/bead-model-scene";

let beadModelScenePromise: Promise<{
  BeadModelScene: ComponentType<BeadModelSceneProps>;
}> | null = null;

export function preloadBeadModelScene() {
  beadModelScenePromise ??= import(
    "@/features/bead/components/bead-model-scene"
  );

  return beadModelScenePromise;
}
