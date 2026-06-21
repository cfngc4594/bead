import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { canvasSizes } from "@/config/canvas-sizes";
import { BeadSizePicker } from "@/features/bead/components/bead-size-picker";

export default function NewProjectPage() {
  return (
    <main className="relative flex min-h-screen items-center justify-center px-4">
      <Button
        asChild
        className="absolute top-6 left-4 md:left-8"
        size="icon-sm"
        variant="outline"
      >
        <Link aria-label="返回作品" href="/projects">
          <ArrowLeft aria-hidden="true" />
        </Link>
      </Button>

      <div className="w-full max-w-5xl space-y-10">
        <div className="space-y-2 text-center">
          <h1 className="font-bold text-3xl tracking-tight md:text-5xl">
            今天想拼什么？
          </h1>

          <p className="text-muted-foreground text-sm md:text-base">
            选择一个画布尺寸开始创作
          </p>
        </div>

        <BeadSizePicker initialSize={canvasSizes[0].id} />
      </div>
    </main>
  );
}
