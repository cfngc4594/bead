import {
  KeyboardSensor,
  MouseSensor,
  TouchSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import { sortableKeyboardCoordinates } from "@dnd-kit/sortable";

/**
 * Capacitor / Android WebView fire pointer events for touch.
 * PointerSensor would race the scroll parent and starve TouchSensor.
 * Split mouse vs touch so long-press can activate drag without blocking scroll.
 */
export function useLibraryDndSensors({
  withKeyboard = false,
}: {
  withKeyboard?: boolean;
} = {}) {
  const mouse = useSensor(MouseSensor, {
    activationConstraint: { distance: 8 },
  });
  const touch = useSensor(TouchSensor, {
    activationConstraint: { delay: 220, tolerance: 8 },
  });
  const keyboard = useSensor(KeyboardSensor, {
    coordinateGetter: sortableKeyboardCoordinates,
  });

  return useSensors(mouse, touch, ...(withKeyboard ? [keyboard] : []));
}
