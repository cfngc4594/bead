import { Slider } from "@bead/ui/components/slider";
import { cn } from "@bead/ui/lib/utils";
import {
  type ModelPreviewMode,
  type ModelPreviewSettings,
  modelPreviewModes,
} from "@/features/bead/lib/model-preview-config";

export type ModelPreviewControlsState = {
  mode: ModelPreviewMode;
  settings: ModelPreviewSettings;
  onModeChange: (mode: ModelPreviewMode) => void;
  onSettingsChange: (settings: ModelPreviewSettings) => void;
};

type ModelPreviewControlsProps = ModelPreviewControlsState & {
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
              : "-mx-4 flex snap-x snap-mandatory overflow-x-auto px-4 pb-1",
          )}
        >
          {modelPreviewModes.map((item) => {
            const isSelected = item.id === mode;

            return (
              <button
                aria-pressed={isSelected}
                className={cn(
                  "group flex min-w-0 flex-col gap-1.5 rounded-lg text-left outline-none focus-visible:ring-2 focus-visible:ring-ring/50",
                  layout === "mobile" && "w-20 shrink-0 snap-start",
                )}
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
                  {"normalMapUrl" in item ? (
                    <img
                      alt=""
                      className="size-full object-cover grayscale brightness-110 contrast-75 transition-transform group-hover:scale-105"
                      src={item.normalMapUrl}
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
