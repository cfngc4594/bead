import { Skeleton } from "@/components/ui/skeleton";

const sizeCardSkeletons = ["16x16", "29x29", "32x32", "64x64"];

export function BeadSizePickerSkeleton() {
  return (
    <>
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        {sizeCardSkeletons.map((size) => (
          <div
            className="flex flex-col items-center gap-3 rounded-xl border bg-card p-6"
            key={size}
          >
            <Skeleton className="size-10 rounded-full" />
            <div className="space-y-2">
              <Skeleton className="mx-auto h-4 w-14" />
              <Skeleton className="mx-auto h-3 w-16" />
            </div>
          </div>
        ))}
      </div>

      <div className="flex justify-center">
        <Skeleton className="h-9 w-48 rounded-full" />
      </div>
    </>
  );
}
