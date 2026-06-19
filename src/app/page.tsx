import { Suspense } from "react";
import { BeadSizePickerFromUrl } from "@/app/size-picker-from-url";
import { BeadSizePickerSkeleton } from "@/features/bead/components/bead-size-picker-skeleton";

export default function Page() {
  return (
    <main className="flex min-h-screen items-center justify-center px-4">
      <div className="w-full max-w-5xl space-y-10">
        <div className="space-y-2 text-center">
          <h1 className="text-3xl font-bold tracking-tight md:text-5xl">
            今天想拼什么？
          </h1>

          <p className="text-muted-foreground text-sm md:text-base">
            选择一个画布尺寸开始创作
          </p>
        </div>

        <Suspense fallback={<BeadSizePickerSkeleton />}>
          <BeadSizePickerFromUrl />
        </Suspense>
      </div>
    </main>
  );
}
