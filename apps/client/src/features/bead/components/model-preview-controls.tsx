import { Button } from "@bead/ui/components/button";
import { Slider } from "@bead/ui/components/slider";
import { cn } from "@bead/ui/lib/utils";
import { LoaderCircle, PawPrint, Square } from "lucide-react";
import {
  type ModelPreviewMode,
  type ModelPreviewSettings,
  modelPreviewModes,
} from "@/features/bead/lib/model-preview-config";

export type ModelPreviewControlsBinding = {
  pet?: {
    canStart: boolean;
    isBusy: boolean;
    isRunning: boolean;
    onStart: () => void;
    onStop: () => void;
  };
  mode: ModelPreviewMode;
  settings: ModelPreviewSettings;
  onModeChange: (mode: ModelPreviewMode) => void;
  onSettingsChange: (settings: ModelPreviewSettings) => void;
};

type ModelPreviewControlsProps = ModelPreviewControlsBinding & {
  className?: string;
  layout: "desktop" | "mobile";
};

const beadPreviewColors = [
  "#ef4444",
  "#f59e0b",
  "#facc15",
  "#22c55e",
  "#38bdf8",
  "#6366f1",
  "#a855f7",
  "#ec4899",
  "#f8fafc",
  "#fb923c",
  "#14b8a6",
  "#8b5cf6",
];

export function ModelPreviewControls({
  className,
  pet,
  layout,
  mode,
  settings,
  onModeChange,
  onSettingsChange,
}: ModelPreviewControlsProps) {
  const isPressedMode = mode !== "beads";

  function updateSetting(key: keyof ModelPreviewSettings, value: number) {
    onSettingsChange({
      ...settings,
      [key]: value,
    });
  }

  return (
    <div className={cn("space-y-6", className)}>
      <section aria-labelledby={`${layout}-press-method-heading`}>
        <h2
          className="mb-3 text-sm font-medium"
          id={`${layout}-press-method-heading`}
        >
          烫法
        </h2>
        <div
          className={cn(
            "gap-2",
            layout === "desktop"
              ? "grid grid-cols-3"
              : "grid grid-cols-2 min-[360px]:grid-cols-3",
          )}
        >
          {modelPreviewModes.map((item) => {
            const isSelected = item.id === mode;

            return (
              <button
                aria-pressed={isSelected}
                className="group flex min-w-0 flex-col gap-1.5 rounded-lg text-left outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
                key={item.id}
                onClick={() => onModeChange(item.id)}
                type="button"
              >
                <div
                  className={cn(
                    "aspect-square w-full overflow-hidden rounded-lg border bg-muted transition-[border-color,box-shadow] group-hover:border-foreground/30",
                    isSelected && "border-primary ring-2 ring-primary/20",
                  )}
                >
                  {"previewUrl" in item ? (
                    <img
                      alt=""
                      className="size-full object-cover grayscale brightness-110 contrast-75 transition-transform group-hover:scale-105"
                      decoding="async"
                      height={128}
                      loading="lazy"
                      src={item.previewUrl}
                      width={128}
                    />
                  ) : (
                    <BeadMaterialPreview />
                  )}
                </div>
                <span
                  className={cn(
                    "w-full truncate px-1 text-center text-xs text-muted-foreground",
                    isSelected && "font-medium text-primary",
                  )}
                >
                  {item.label}
                </span>
              </button>
            );
          })}
        </div>
      </section>

      <section
        aria-labelledby={`${layout}-preview-settings-heading`}
        className="space-y-4"
      >
        <h2
          className="text-sm font-medium"
          id={`${layout}-preview-settings-heading`}
        >
          预览效果
        </h2>
        <ModelSettingSlider
          label="光照"
          max={150}
          min={50}
          onChange={(value) => updateSetting("lightIntensity", value / 100)}
          value={Math.round(settings.lightIntensity * 100)}
        />
        <ModelSettingSlider
          label="材质粗糙度"
          max={90}
          min={20}
          onChange={(value) => updateSetting("roughness", value / 100)}
          value={Math.round(settings.roughness * 100)}
        />
        {isPressedMode ? (
          <>
            <ModelSettingSlider
              label="纹理强度"
              max={200}
              min={0}
              onChange={(value) =>
                updateSetting("textureStrength", value / 100)
              }
              value={Math.round(settings.textureStrength * 100)}
            />
            <ModelSettingSlider
              label="纹理大小"
              max={200}
              min={50}
              onChange={(value) => updateSetting("textureScale", value / 100)}
              value={Math.round(settings.textureScale * 100)}
            />
          </>
        ) : null}
      </section>

      {pet ? (
        <section
          aria-labelledby={`${layout}-pet-heading`}
          className="space-y-3 border-t pt-5"
        >
          <div className="space-y-1">
            <h2 className="text-sm font-medium" id={`${layout}-pet-heading`}>
              桌面宠物
            </h2>
            <p className="text-xs leading-relaxed text-muted-foreground">
              将当前 3D 效果显示为可拖动的 Android 悬浮宠物。
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              className="min-w-0 flex-1"
              disabled={!pet.canStart || pet.isBusy}
              onClick={pet.onStart}
              size="sm"
              type="button"
            >
              {pet.isBusy ? (
                <LoaderCircle aria-hidden="true" className="animate-spin" />
              ) : (
                <PawPrint aria-hidden="true" />
              )}
              {pet.isRunning ? "更新桌宠" : "设为桌宠"}
            </Button>
            {pet.isRunning ? (
              <Button
                aria-label="停止桌面宠物"
                disabled={pet.isBusy}
                onClick={pet.onStop}
                size="icon-sm"
                type="button"
                variant="outline"
              >
                <Square aria-hidden="true" />
              </Button>
            ) : null}
          </div>
          {!pet.canStart ? (
            <p className="text-xs text-muted-foreground">
              画布中至少需要一颗豆子。
            </p>
          ) : null}
        </section>
      ) : null}
    </div>
  );
}

function BeadMaterialPreview() {
  return (
    <div className="grid size-full grid-cols-4 place-items-center gap-1 bg-zinc-100 p-2 dark:bg-zinc-800">
      {beadPreviewColors.map((color) => (
        <span
          className="grid aspect-square w-full place-items-center rounded-full shadow-xs"
          key={color}
          style={{ backgroundColor: color }}
        >
          <span className="size-[35%] rounded-full bg-zinc-100 dark:bg-zinc-800" />
        </span>
      ))}
    </div>
  );
}

function ModelSettingSlider({
  label,
  max,
  min,
  value,
  onChange,
}: {
  label: string;
  max: number;
  min: number;
  value: number;
  onChange: (value: number) => void;
}) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-3 text-xs">
        <span>{label}</span>
        <span className="tabular-nums text-muted-foreground">{value}%</span>
      </div>
      <Slider
        aria-label={label}
        max={max}
        min={min}
        onValueChange={(values) => onChange(values.at(0) ?? value)}
        step={5}
        value={[value]}
      />
    </div>
  );
}
