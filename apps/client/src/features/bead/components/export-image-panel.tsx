import type {
  BeadImageDisplayOptions,
  BeadImageSvg,
} from "@bead/core/bead-image-svg";
import { Button } from "@bead/ui/components/button";
import {
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@bead/ui/components/dialog";
import {
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@bead/ui/components/sheet";
import { Switch } from "@bead/ui/components/switch";
import { useIsMobile } from "@bead/ui/hooks/use-mobile";
import { cn } from "@bead/ui/lib/utils";
import { Capacitor } from "@capacitor/core";
import { Download, LoaderCircle, RefreshCcw, Share2, X } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import {
  saveImageBlob,
  shareImageBlob,
} from "@/features/bead/lib/download-file";
import { createBeadImageSvgBlob } from "@/features/bead/lib/export-image";
import {
  NativeBackDialog,
  NativeBackSheet,
} from "@/features/native/native-back-overlays";
import { NativeBottomSheetContent } from "@/features/native/native-safe-area";
import { trackEvent } from "@/lib/analytics";

type ExportImagePanelProps = {
  displayOptions: BeadImageDisplayOptions;
  filename: string;
  image: BeadImageSvg | null;
  isEncoding: boolean;
  onCreatePng: (image: BeadImageSvg) => Promise<Blob | null>;
  onDisplayOptionsChange: (displayOptions: BeadImageDisplayOptions) => void;
  onOpenChange: (open: boolean) => void;
  onPrepareImage: (displayOptions: BeadImageDisplayOptions) => void;
  open: boolean;
};

type ExportOptionDefinition = {
  key: keyof BeadImageDisplayOptions;
  label: string;
};

type ExportImageContentProps = {
  displayOptions: BeadImageDisplayOptions;
  isPreviewPreparing: boolean;
  isWorking: boolean;
  onDisplayOptionsChange: (displayOptions: BeadImageDisplayOptions) => void;
  onRegenerate: () => void;
  previewUrl: string | null;
};

type ExportImageLayoutProps = {
  canSave: boolean;
  content: ExportImageContentProps;
  filename: string;
  isSaving: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: () => Promise<void>;
  open: boolean;
};

const optionDefinitions = [
  {
    key: "showColorLegend",
    label: "显示豆色用量",
  },
  {
    key: "showBeadCodes",
    label: "显示豆色编号",
  },
  {
    key: "showGuides",
    label: "显示辅助线",
  },
] as const satisfies readonly ExportOptionDefinition[];

export function ExportImagePanel({
  displayOptions,
  filename,
  image,
  isEncoding,
  onCreatePng,
  onDisplayOptionsChange,
  onOpenChange,
  onPrepareImage,
  open,
}: ExportImagePanelProps) {
  const isMobileViewport = useIsMobile();
  const isNative = Capacitor.isNativePlatform();
  const useMobileLayout = isNative || isMobileViewport;
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isSharing, setIsSharing] = useState(false);

  useEffect(() => {
    if (!image) {
      setPreviewUrl(null);
      return;
    }

    const url = URL.createObjectURL(createBeadImageSvgBlob(image));
    setPreviewUrl(url);

    return () => URL.revokeObjectURL(url);
  }, [image]);

  async function saveImage() {
    if (!image || isEncoding || isSaving || isSharing) {
      return;
    }

    setIsSaving(true);

    try {
      const blob = await onCreatePng(image);

      if (!blob) {
        return;
      }

      await saveImageBlob(blob, filename);
      trackEvent("export_image_saved", {
        destination: isNative ? "photo_library" : "download",
        ...image.displayOptions,
      });
      toast.success(isNative ? "图片已保存" : "图片已下载");
      onOpenChange(false);
    } catch (error) {
      console.error("Unable to save exported image", error);
      toast.error(isNative ? "保存图片失败" : "下载图片失败");
    } finally {
      setIsSaving(false);
    }
  }

  async function shareImage() {
    if (!image || isEncoding || isSaving || isSharing) {
      return;
    }

    setIsSharing(true);

    try {
      const blob = await onCreatePng(image);

      if (!blob) {
        return;
      }

      const didShare = await shareImageBlob(blob, filename);

      if (didShare) {
        trackEvent("export_image_shared", {
          destination: "share_sheet",
          ...image.displayOptions,
        });
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

  function regenerateImage() {
    trackEvent("export_image_regenerated", {
      destination: useMobileLayout ? "mobile_panel" : "desktop_dialog",
      ...displayOptions,
    });
    onPrepareImage(displayOptions);
  }

  const isWorking = isEncoding || isSaving || isSharing;
  const content: ExportImageContentProps = {
    displayOptions,
    isPreviewPreparing: Boolean(image) && !previewUrl,
    isWorking,
    onDisplayOptionsChange,
    onRegenerate: regenerateImage,
    previewUrl,
  };
  const layout = {
    canSave: Boolean(image) && !isWorking,
    content,
    filename,
    isSaving,
    onOpenChange,
    onSave: saveImage,
    open,
  } satisfies ExportImageLayoutProps;

  if (useMobileLayout) {
    return (
      <MobileExportImagePanel
        {...layout}
        isSharing={isSharing}
        onShare={shareImage}
        saveLabel={isNative ? "保存到相册" : "下载"}
      />
    );
  }

  return <DesktopExportImagePanel {...layout} />;
}

function MobileExportImagePanel({
  canSave,
  content,
  filename,
  isSaving,
  isSharing,
  onOpenChange,
  onSave,
  onShare,
  open,
  saveLabel,
}: ExportImageLayoutProps & {
  isSharing: boolean;
  onShare: () => Promise<void>;
  saveLabel: string;
}) {
  return (
    <NativeBackSheet open={open} onOpenChange={onOpenChange}>
      <NativeBottomSheetContent className="max-h-[92svh] gap-0 overflow-hidden rounded-t-xl">
        <SheetHeader className="shrink-0 pb-3">
          <SheetTitle>导出图片</SheetTitle>
          <SheetDescription>{filename}</SheetDescription>
        </SheetHeader>

        <div className="min-h-0 flex-1 overflow-y-auto px-4 pb-4">
          <ExportImagePreview
            className="aspect-4/3 max-h-[34vh] w-full"
            isPreparing={content.isPreviewPreparing}
            onRegenerate={content.onRegenerate}
            previewUrl={content.previewUrl}
          />
          <div className="mt-4">
            <ExportDisplayOptions
              disabled={content.isWorking}
              displayOptions={content.displayOptions}
              layout="mobile"
              onChange={content.onDisplayOptionsChange}
            />
          </div>
        </div>

        <SheetFooter className="mt-0 shrink-0 border-t bg-popover">
          <Button
            disabled={!canSave}
            onClick={() => void onSave()}
            type="button"
          >
            {isSaving ? (
              <LoaderCircle className="animate-spin" />
            ) : (
              <Download />
            )}
            {saveLabel}
          </Button>
          <Button
            disabled={!canSave}
            onClick={() => void onShare()}
            type="button"
            variant="outline"
          >
            {isSharing ? <LoaderCircle className="animate-spin" /> : <Share2 />}
            分享图片
          </Button>
        </SheetFooter>
      </NativeBottomSheetContent>
    </NativeBackSheet>
  );
}

function DesktopExportImagePanel({
  canSave,
  content,
  filename,
  isSaving,
  onOpenChange,
  onSave,
  open,
}: ExportImageLayoutProps) {
  return (
    <NativeBackDialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="flex max-h-[calc(100svh-2rem)] w-[min(1040px,calc(100vw-2rem))] flex-col gap-0 overflow-hidden p-0 sm:max-w-none"
        showCloseButton={false}
      >
        <DialogHeader className="flex-row items-center justify-between gap-4 border-b px-6 py-3 text-left">
          <div className="min-w-0">
            <DialogTitle>导出图片</DialogTitle>
            <DialogDescription className="sr-only">
              自定义导出图片内容并预览结果
            </DialogDescription>
          </div>
          <DialogClose asChild>
            <Button
              aria-label="关闭"
              size="icon-sm"
              type="button"
              variant="ghost"
            >
              <X />
            </Button>
          </DialogClose>
        </DialogHeader>

        <div className="min-h-0 flex-1 overflow-y-auto px-6 py-4">
          <ExportImagePreview
            className="h-[min(50vh,500px)] min-h-64 w-full"
            isPreparing={content.isPreviewPreparing}
            onRegenerate={content.onRegenerate}
            previewUrl={content.previewUrl}
          />
          <div className="mt-4">
            <ExportDisplayOptions
              disabled={content.isWorking}
              displayOptions={content.displayOptions}
              layout="desktop"
              onChange={content.onDisplayOptionsChange}
            />
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-4 border-t px-6 py-4">
          <div className="min-w-0 flex-1">
            <p className="truncate font-medium">{filename}</p>
          </div>
          <Button
            disabled={content.isWorking}
            onClick={() => onOpenChange(false)}
            type="button"
            variant="outline"
          >
            取消
          </Button>
          <Button
            disabled={!canSave}
            onClick={() => void onSave()}
            type="button"
          >
            {isSaving ? (
              <LoaderCircle className="animate-spin" />
            ) : (
              <Download />
            )}
            下载
          </Button>
        </div>
      </DialogContent>
    </NativeBackDialog>
  );
}

function ExportImagePreview({
  className,
  isPreparing,
  onRegenerate,
  previewUrl,
}: {
  className: string;
  isPreparing: boolean;
  onRegenerate: () => void;
  previewUrl: string | null;
}) {
  return (
    <div
      className={cn(
        "relative grid size-full min-h-40 place-items-center overflow-hidden rounded-xl border bg-muted/30",
        className,
      )}
    >
      {previewUrl ? (
        <img
          alt="导出的豆图预览"
          className="absolute inset-0 h-full w-full object-contain p-2"
          src={previewUrl}
        />
      ) : isPreparing ? (
        <output className="flex items-center gap-2 text-muted-foreground">
          <LoaderCircle className="animate-spin" />
          <span>正在生成预览</span>
        </output>
      ) : (
        <Button onClick={onRegenerate} type="button" variant="outline">
          <RefreshCcw />
          重新生成
        </Button>
      )}
    </div>
  );
}

function ExportDisplayOptions({
  disabled,
  displayOptions,
  layout,
  onChange,
}: {
  disabled: boolean;
  displayOptions: BeadImageDisplayOptions;
  layout: "desktop" | "mobile";
  onChange: (displayOptions: BeadImageDisplayOptions) => void;
}) {
  return (
    <div
      className={cn(
        layout === "mobile" ? "divide-y" : "grid grid-cols-3 gap-3",
      )}
    >
      {optionDefinitions.map((option) => {
        const switchId = `export-${layout}-${option.key}`;

        return (
          <div
            className={cn(
              "flex min-w-0 items-center gap-3",
              layout === "mobile" ? "py-3" : "rounded-xl border px-4 py-3",
            )}
            key={option.key}
          >
            <label className="min-w-0 flex-1 font-medium" htmlFor={switchId}>
              {option.label}
            </label>
            <Switch
              checked={displayOptions[option.key]}
              disabled={disabled}
              id={switchId}
              onCheckedChange={(checked) =>
                onChange({
                  ...displayOptions,
                  [option.key]: checked,
                })
              }
            />
          </div>
        );
      })}
    </div>
  );
}
