export function layoutTree(nodes, hierarchyEdges, rootId = 'root') {
  const nodeById = new Map(nodes.map((node) => [node.id, node]))
  const childrenByParent = new Map()
  const measuredWidths = new Map()
  const positions = new Map()
  const siblingGap = 84
  const levelGap = 300
  const fallbackWidth = 320

  for (const edge of hierarchyEdges) {
    childrenByParent.set(edge.source, [...(childrenByParent.get(edge.source) || []), edge.target])
  }

  function nodeWidth(id) {
    return Number(nodeById.get(id)?.data?.width || fallbackWidth)
  }

  function measure(id, seen = new Set()) {
    if (measuredWidths.has(id)) return measuredWidths.get(id)
    if (seen.has(id)) return nodeWidth(id)
    seen.add(id)

    const children = childrenByParent.get(id) || []
    if (!children.length) {
      measuredWidths.set(id, nodeWidth(id))
      return nodeWidth(id)
    }

    const childrenWidth = children.reduce(
      (total, childId, index) => total + measure(childId, seen) + (index > 0 ? siblingGap : 0),
      0,
    )
    const width = Math.max(nodeWidth(id), childrenWidth)
    measuredWidths.set(id, width)
    return width
  }

  function place(id, centerX, y, seen = new Set()) {
    if (seen.has(id) || !nodeById.has(id)) return
    seen.add(id)

    positions.set(id, { x: Math.round(centerX - nodeWidth(id) / 2), y: Math.round(y) })

    const children = childrenByParent.get(id) || []
    if (!children.length) return

    const totalWidth = children.reduce(
      (total, childId, index) => total + measure(childId) + (index > 0 ? siblingGap : 0),
      0,
    )

    let cursor = centerX - totalWidth / 2
    for (const childId of children) {
      const width = measure(childId)
      place(childId, cursor + width / 2, y + levelGap, seen)
      cursor += width + siblingGap
    }
  }

  const root = nodeById.get(rootId) || nodes[0]
  if (!root) return positions

  const rootCenterX = root.position.x + nodeWidth(root.id) / 2
  place(root.id, rootCenterX, root.position.y)

  return positions
}
