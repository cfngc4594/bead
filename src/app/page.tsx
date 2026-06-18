import { canvasSizes, isCanvasSizeId } from "@/config/canvas-sizes";
import { BeadSizePicker } from "@/features/bead/components/bead-size-picker";

type PageProps = {
  searchParams: Promise<{ size?: string | string[] }>;
};

export default async function Page({ searchParams }: PageProps) {
  const { size } = await searchParams;
  const selected = isCanvasSizeId(size) ? size : canvasSizes[0].id;

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

        <BeadSizePicker initialSize={selected} />
      </div>
    </main>
  );
}
