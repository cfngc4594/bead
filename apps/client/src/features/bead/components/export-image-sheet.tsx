import { Button } from "@bead/ui/components/button";
import {
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@bead/ui/components/sheet";
import { Download, LoaderCircle, RefreshCcw, Share2 } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import {
  saveImageBlob,
  shareImageBlob,
} from "@/features/bead/lib/download-file";
import { NativeBackSheet } from "@/features/native/native-back-overlays";
import { trackEvent } from "@/lib/analytics";

type ExportImageSheetProps = {
  blob: Blob | null;
  filename: string;
  isCreating: boolean;
  open: boolean;
  onCreateImage: () => void;
  onOpenChange: (open: boolean) => void;
};

export function ExportImageSheet({
  blob,
  filename,
  isCreating,
  open,
  onCreateImage,
  onOpenChange,
}: ExportImageSheetProps) {
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

  return (
    <NativeBackSheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        className="max-h-[88vh] rounded-t-xl pb-[max(1rem,env(safe-area-inset-bottom))]"
        side="bottom"
      >
        <SheetHeader className="pb-0">
          <SheetTitle>导出图片</SheetTitle>
          <SheetDescription>{filename}</SheetDescription>
        </SheetHeader>

        <div className="px-4">
          <div className="relative grid aspect-4/3 max-h-[42vh] place-items-center overflow-hidden rounded-lg border bg-muted/30">
            {previewUrl ? (
              <img
                alt="导出的豆图预览"
                className="h-full w-full object-contain"
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

        <SheetFooter>
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
        </SheetFooter>
      </SheetContent>
    </NativeBackSheet>
  );
}
