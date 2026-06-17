import Link from "next/link";
import { redirect } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { canvasSizes, isCanvasSizeId } from "@/config/canvas-sizes";
import { cn } from "@/lib/utils";

type PageProps = {
  searchParams: Promise<{ size?: string | string[] }>;
};

export default async function Page({ searchParams }: PageProps) {
  const { size } = await searchParams;

  if (!isCanvasSizeId(size)) {
    redirect(`/?size=${canvasSizes[0].id}`);
  }

  const selected = size;

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

        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          {canvasSizes.map((sizeItem) => {
            const isSelected = selected === sizeItem.id;

            return (
              <Link href={`/?size=${sizeItem.id}`} key={sizeItem.id}>
                <Card
                  className={cn(
                    "cursor-pointer transition-all duration-200 hover:-translate-y-1 hover:shadow-lg",
                    isSelected && "ring-2 ring-primary shadow-lg",
                  )}
                >
                  <CardContent className="flex flex-col items-center gap-3 p-6">
                    <span className="text-4xl">{sizeItem.emoji}</span>

                    <div className="text-center">
                      <p className="font-semibold">{sizeItem.title}</p>

                      <p className="text-muted-foreground text-sm">
                        {sizeItem.desc}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>

        <div className="flex justify-center">
          <Button asChild className="min-w-48 rounded-full" size="lg">
            <Link href={`/editor?size=${selected}`}>开始创作</Link>
          </Button>
        </div>
      </div>
    </main>
  );
}
