import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

const sizeCardSkeletons = ["16x16", "29x29", "32x32", "64x64"];

export function BeadSizePickerSkeleton() {
  return (
    <>
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        {sizeCardSkeletons.map((size) => (
          <Card className="h-full" key={size}>
            <CardContent className="flex flex-col items-center gap-3 p-6">
              <Skeleton className="size-10 rounded-full" />
              <div className="text-center">
                <Skeleton className="mx-auto h-6 w-14" />
                <Skeleton className="mx-auto h-5 w-16" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="flex justify-center">
        <Skeleton className="h-9 w-48 rounded-full" />
      </div>
    </>
  );
}
