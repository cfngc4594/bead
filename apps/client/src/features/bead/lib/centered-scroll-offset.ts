export function getCenteredScrollOffset({
  itemOffset,
  itemSize,
  scrollSize,
  viewportSize,
}: {
  itemOffset: number;
  itemSize: number;
  scrollSize: number;
  viewportSize: number;
}) {
  const maxOffset = Math.max(0, scrollSize - viewportSize);
  const centeredOffset = itemOffset + itemSize / 2 - viewportSize / 2;

  return Math.min(maxOffset, Math.max(0, centeredOffset));
}
