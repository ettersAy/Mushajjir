export function useTreeLayout() {
  function childPositions(parentPosition, count) {
    const gap = 260
    const yGap = 230
    const totalWidth = (count - 1) * gap

    return Array.from({ length: count }, (_, index) => ({
      x: parentPosition.x - totalWidth / 2 + index * gap,
      y: parentPosition.y + yGap,
    }))
  }

  return { childPositions }
}
