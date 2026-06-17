import { redirect } from "next/navigation";
import {
  canvasSizes,
  getCanvasSize,
  isCanvasSizeId,
} from "@/config/canvas-sizes";
import { PerlerEditor } from "@/features/perler/components/perler-editor";

type EditorPageProps = {
  searchParams: Promise<{ size?: string | string[] }>;
};

export default async function EditorPage({ searchParams }: EditorPageProps) {
  const { size } = await searchParams;

  if (!isCanvasSizeId(size)) {
    redirect(`/editor?size=${canvasSizes[0].id}`);
  }

  return <PerlerEditor size={getCanvasSize(size)} />;
}
