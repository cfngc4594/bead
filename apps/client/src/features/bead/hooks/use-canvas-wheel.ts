import { useLayoutEffect, useRef } from "react";

export function useCanvasWheel({
  containerRef,
  onWheel,
}: {
  containerRef: React.RefObject<HTMLDivElement | null>;
  onWheel: (event: WheelEvent) => void;
}) {
  const onWheelRef = useRef(onWheel);

  useLayoutEffect(() => {
    onWheelRef.current = onWheel;
  }, [onWheel]);

  useLayoutEffect(() => {
    const container = containerRef.current;

    if (!container) {
      return;
    }

    return listenForCanvasWheel(container, (event) => {
      onWheelRef.current(event);
    });
  }, [containerRef]);
}

export function listenForCanvasWheel(
  element: HTMLElement,
  onWheel: (event: WheelEvent) => void,
) {
  function handleWheel(event: WheelEvent) {
    event.preventDefault();
    onWheel(event);
  }

  element.addEventListener("wheel", handleWheel, {
    capture: true,
    passive: false,
  });

  return () => {
    element.removeEventListener("wheel", handleWheel, { capture: true });
  };
}
