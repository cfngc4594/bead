import { cn } from "@bead/ui/lib/utils";
import {
  EditorToolButton,
  editorToolSurfaceClassName,
} from "@/features/bead/components/editor-tool-button";
import {
  type BeadFillMode,
  beadFillModeDefinitions,
  type DrawInstrument,
  drawInstrumentDefinitions,
} from "@/features/bead/lib/canvas-tool-definitions";

type DrawToolOptionsProps = {
  beadFillEnabled: boolean;
  beadFillMode: BeadFillMode;
  className?: string;
  instrument: DrawInstrument;
  onSelect: (instrument: DrawInstrument, fillMode?: BeadFillMode) => void;
};

export function DrawToolOptions({
  beadFillEnabled,
  beadFillMode,
  className,
  instrument,
  onSelect,
}: DrawToolOptionsProps) {
  return (
    <div
      className={cn(
        editorToolSurfaceClassName,
        "flex items-center gap-1.5 duration-200 animate-in fade-in slide-in-from-bottom-2",
        className,
      )}
      role="toolbar"
      aria-label="绘制选项"
    >
      {drawInstrumentDefinitions.map((definition) => (
        <EditorToolButton
          icon={definition.icon}
          isActive={instrument === definition.id}
          key={definition.id}
          label={definition.label}
          onClick={() => onSelect(definition.id)}
        />
      ))}
      {beadFillModeDefinitions.map((definition) => (
        <EditorToolButton
          disabled={!beadFillEnabled}
          icon={definition.icon}
          isActive={beadFillEnabled && beadFillMode === definition.id}
          key={definition.id}
          label={definition.label}
          onClick={() => onSelect("brush", definition.id)}
        />
      ))}
    </div>
  );
}
