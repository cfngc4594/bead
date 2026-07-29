import { Slider } from "@bead/ui/components/slider";
import { cn } from "@bead/ui/lib/utils";
import { Check, CircleDot } from "lucide-react";
import {
  type ModelPreviewMode,
  type ModelPreviewSettings,
  modelPreviewModes,
} from "@/features/bead/lib/model-preview-config";

export type ModelPreviewControlsBinding = {
  mode: ModelPreviewMode;
  settings: ModelPreviewSettings;
  onModeChange: (mode: ModelPreviewMode) => void;
  onSettingsChange: (settings: ModelPreviewSettings) => void;
};

type ModelPreviewControlsProps = ModelPreviewControlsBinding & {
  className?: string;
  layout: "desktop" | "mobile";
};

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
    <div className={cn("max-w-full space-y-6", className)}>
      <section aria-labelledby={`${layout}-press-method-heading`}>
        <h2
          className="mb-2.5 text-sm font-medium"
          id={`${layout}-press-method-heading`}
        >
          烫法
        </h2>
        <div className="grid min-w-0 grid-cols-[repeat(auto-fit,56px)] justify-start gap-2">
          {modelPreviewModes.map((item) => {
            const isSelected = item.id === mode;

            return (
              <button
                aria-pressed={isSelected}
                className="group flex w-fit min-w-0 justify-self-center flex-col items-center gap-1 rounded-md py-1 text-center outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
                key={item.id}
                onClick={() => onModeChange(item.id)}
                type="button"
              >
                <div
                  className={cn(
                    "relative size-14 shrink-0 overflow-hidden rounded-md border bg-muted transition-[border-color,box-shadow] group-hover:border-foreground/30",
                    isSelected &&
                      "border-primary ring-2 ring-primary/20 group-hover:border-primary",
                  )}
                >
                  {"previewUrl" in item ? (
                    <img
                      alt=""
                      className="size-full object-cover grayscale brightness-110 contrast-75"
                      decoding="async"
                      height={128}
                      loading="lazy"
                      src={item.previewUrl}
                      width={128}
                    />
                  ) : (
                    <BeadMaterialPreview />
                  )}
                  {isSelected ? (
                    <span className="absolute top-0.5 right-0.5 grid size-3.5 place-items-center rounded-full bg-primary text-primary-foreground shadow-xs">
                      <Check aria-hidden="true" className="size-2.5" />
                    </span>
                  ) : null}
                </div>
                <span
                  className={cn(
                    "w-full truncate text-xs text-muted-foreground",
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
          label="磨砂"
          max={90}
          min={20}
          onChange={(value) => updateSetting("roughness", value / 100)}
          value={Math.round(settings.roughness * 100)}
        />
        {isPressedMode ? (
          <>
            <ModelSettingSlider
              label="纹理深浅"
              max={200}
              min={0}
              onChange={(value) =>
                updateSetting("textureStrength", value / 100)
              }
              value={Math.round(settings.textureStrength * 100)}
            />
            <ModelSettingSlider
              label="纹理缩放"
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
    <div className="grid size-full place-items-center bg-zinc-100 text-zinc-500">
      <CircleDot aria-hidden="true" className="size-7" strokeWidth={1.5} />
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
