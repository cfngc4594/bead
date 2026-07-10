import { Button } from "@bead/ui/components/button";
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from "@bead/ui/components/drawer";
import { Download, LoaderCircle, RefreshCcw, Share2 } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import {
  saveImageBlob,
  shareImageBlob,
} from "@/features/bead/lib/download-file";
import { trackEvent } from "@/lib/analytics";

type ExportImageDrawerProps = {
  blob: Blob | null;
  filename: string;
  isCreating: boolean;
  open: boolean;
  onCreateImage: () => void;
  onOpenChange: (open: boolean) => void;
};

export function ExportImageDrawer({
  blob,
  filename,
  isCreating,
  open,
  onCreateImage,
  onOpenChange,
}: ExportImageDrawerProps) {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isSharing, setIsSharing] = useState(false);

  useEffect(() => {
    if (!blob) {
      setPreviewUrl(null);
      return;
    }

    const url = URL.createObjectURL(blob);
    setPreviewUrl(url);

    return () => URL.revokeObjectURL(url);
  }, [blob]);

  async function saveImage() {
    if (!blob || isSaving) {
      return;
    }

    setIsSaving(true);

    try {
      await saveImageBlob(blob, filename);
      trackEvent("export_image_saved", { destination: "photo_library" });
      toast.success("图片已保存");
      onOpenChange(false);
    } catch (error) {
      console.error("Unable to save exported image", error);
      toast.error("保存图片失败");
    } finally {
      setIsSaving(false);
    }
  }

  async function shareImage() {
    if (!blob || isSharing) {
      return;
    }

    setIsSharing(true);

    try {
      const didShare = await shareImageBlob(blob, filename);

      if (didShare) {
        trackEvent("export_image_shared", { destination: "share_sheet" });
        toast.success("图片已分享");
        onOpenChange(false);
      }
    } catch (error) {
      console.error("Unable to share exported image", error);
      toast.error("分享图片失败");
    } finally {
      setIsSharing(false);
    }
  }

  const isWorking = isCreating || isSaving || isSharing;

  function handleOpenChange(nextOpen: boolean) {
    if (!nextOpen && (isSaving || isSharing)) {
      return;
    }

    onOpenChange(nextOpen);
  }

  return (
    <Drawer
      direction="bottom"
      dismissible={!isSaving && !isSharing}
      open={open}
      onOpenChange={handleOpenChange}
    >
      <DrawerContent className="overflow-hidden">
        <DrawerHeader className="shrink-0 pb-0">
          <DrawerTitle>导出图片</DrawerTitle>
          <DrawerDescription className="truncate">
            预览并保存 {filename}
          </DrawerDescription>
        </DrawerHeader>

        <div className="min-h-0 flex-1 overflow-y-auto px-4 pt-4">
          <div className="relative grid min-h-48 place-items-center rounded-lg border bg-muted/30 p-2">
            {previewUrl ? (
              <img
                alt="导出的豆图预览"
                className="block max-h-[42svh] max-w-full object-contain"
                src={previewUrl}
              />
            ) : isCreating ? (
              <output className="flex items-center gap-2 text-muted-foreground">
                <LoaderCircle className="animate-spin" />
                <span>正在生成图片</span>
              </output>
            ) : (
              <Button
                onClick={() => {
                  trackEvent("export_image_regenerated", {
                    destination: "android_sheet",
                  });
                  onCreateImage();
                }}
                type="button"
                variant="outline"
              >
                <RefreshCcw />
                重新生成
              </Button>
            )}
          </div>
        </div>

        <DrawerFooter className="shrink-0 pb-[max(1rem,env(safe-area-inset-bottom))] sm:flex-row sm:justify-end">
          <Button
            disabled={!blob || isWorking}
            onClick={saveImage}
            type="button"
          >
            {isSaving ? (
              <LoaderCircle className="animate-spin" />
            ) : (
              <Download />
            )}
            保存到相册
          </Button>
          <Button
            disabled={!blob || isWorking}
            onClick={shareImage}
            type="button"
            variant="outline"
          >
            {isSharing ? <LoaderCircle className="animate-spin" /> : <Share2 />}
            分享图片
          </Button>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}
