import { canvasSizes } from "@/config/canvas-sizes";
import { SizePicker } from "@/features/bead/components/size-picker";

export default function NewProjectPage() {
  return (
    <main className="flex min-h-screen items-center justify-center px-4">
      <div className="w-full max-w-5xl space-y-10">
        <div className="space-y-2 text-center">
          <h1 className="font-bold text-3xl tracking-tight md:text-5xl">
            新建拼豆作品
          </h1>

          <p className="text-muted-foreground text-sm md:text-base">
            选择拼豆板尺寸
          </p>
        </div>

        <SizePicker initialSize={canvasSizes[0].id} />
      </div>
    </main>
  );
}
