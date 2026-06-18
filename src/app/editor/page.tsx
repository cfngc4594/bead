import { redirect } from "next/navigation";
import {
  canvasSizes,
  getCanvasSize,
  isCanvasSizeId,
} from "@/config/canvas-sizes";
import { BeadEditor } from "@/features/bead/components/bead-editor";

type EditorPageProps = {
  searchParams: Promise<{ size?: string | string[] }>;
};

export default async function EditorPage({ searchParams }: EditorPageProps) {
  const { size } = await searchParams;

  if (!isCanvasSizeId(size)) {
    redirect(`/editor?size=${canvasSizes[0].id}`);
  }

  return <BeadEditor size={getCanvasSize(size)} />;
}
