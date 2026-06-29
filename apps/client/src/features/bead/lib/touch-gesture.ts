export type TouchPoint = {
  x: number;
  y: number;
};

export type TwoTouchGesture = {
  center: TouchPoint;
  distance: number;
};

const pinchDistanceDeadZone = 5;
const pinchScaleDeadZone = 0.015;

export function getTwoTouchGesture([first, second]: [
  TouchPoint,
  TouchPoint,
]): TwoTouchGesture {
  return {
    center: {
      x: (first.x + second.x) / 2,
      y: (first.y + second.y) / 2,
    },
    distance: Math.hypot(first.x - second.x, first.y - second.y),
  };
}

export function getThresholdedPinchScaleFactor({
  previousDistance,
  nextDistance,
}: {
  previousDistance: number;
  nextDistance: number;
}) {
  if (previousDistance === 0) {
    return 1;
  }

  const distanceDelta = nextDistance - previousDistance;
  const scaleFactor = nextDistance / previousDistance;

  if (
    Math.abs(distanceDelta) < pinchDistanceDeadZone ||
    Math.abs(scaleFactor - 1) < pinchScaleDeadZone
  ) {
    return 1;
  }

  return scaleFactor;
}
