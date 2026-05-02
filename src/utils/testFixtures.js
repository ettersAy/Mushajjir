/**
 * Test Fixture Generator for Mushajjir
 *
 * Builds realistic tree data structures (small/medium/large) for use in Vitest tests.
 *
 * Usage:
 *   import { smallTree, mediumTree, largeTree } from '../utils/testFixtures'
 *   const { nodes, edges } = smallTree()
 *   const { nodes, edges } = mediumTree({ collapseSome: true })
 *   const { nodes, edges } = customTree(15, 3, { seed: 42 })
 */

import { normalizeNode, normalizeEdge, buildChildrenByParent, descendantIds } from './treeUtils.js'

// ─── Label Pools ───────────────────────────────────────────────────────────

const TASK_TITLES = [
  'Implement user authentication',
  'Build REST API endpoints',
  'Create database schema',
  'Design frontend components',
  'Write unit tests',
  'Set up CI/CD pipeline',
  'Configure logging system',
  'Add input validation',
  'Implement error handling',
  'Create documentation',
  'Optimize database queries',
  'Build notification system',
  'Add search functionality',
  'Implement file upload',
  'Set up caching layer',
  'Create admin dashboard',
  'Add export/import features',
  'Implement rate limiting',
  'Build reporting module',
  'Add data migration tool',
]

const TASK_CONTENTS = [
  'Implement the feature with proper error handling and validation.',
  'Cover edge cases and ensure backward compatibility.',
  'Follow the existing patterns and code conventions.',
  'Ensure performance meets the required benchmarks.',
  'Add comprehensive test coverage for all paths.',
  'Document the implementation for future reference.',
  'Coordinate with the team on API contract changes.',
  'Review security implications before shipping.',
]

const TAG_POOLS = {
  backend: ['backend', 'api', 'database', 'auth', 'cache'],
  frontend: ['frontend', 'ui', 'component', 'form'],
  testing: ['test', 'e2e', 'unit', 'integration'],
  devops: ['devops', 'ci-cd', 'deployment', 'monitoring'],
  docs: ['documentation', 'api-docs'],
}

// ─── Seeded Pseudo-Random ───────────────────────────────────────────────────

function seedRandom(seed) {
  let s = seed
  return () => {
    s = (s * 1664525 + 1013904223) & 0xffffffff
    return (s >>> 0) / 0xffffffff
  }
}

function pick(arr, rand) {
  return arr[Math.floor(rand() * arr.length)]
}

// ─── Fixture Builder ────────────────────────────────────────────────────────

/**
 * Generate a tree with the given parameters.
 *
 * @param {number} totalNodes - Total number of nodes (including root). Default 10.
 * @param {number} maxChildrenPerParent - Maximum children per parent. Default 4.
 * @param {object} options
 * @param {number}  [options.seed] - Seed for reproducible pseudo-random generation.
 * @param {boolean} [options.includeRoot] - Whether to include a 'root' node as first node. Default true.
 * @param {boolean} [options.collapseSome] - Randomly set collapsed on some nodes.
 * @param {number}  [options.taskStatusRatio] - Ratio of 'done' nodes among leaves (0..1). Default 0.3.
 * @returns {{ nodes: object[], edges: object[] }}
 */
export function customTree(totalNodes = 10, maxChildrenPerParent = 4, options = {}) {
  const { seed = Date.now(), includeRoot = true, collapseSome = false, taskStatusRatio = 0.3 } = options

  const rand = seedRandom(seed)
  const nodes = []
  const edges = []
  const nodeIdStack = []
  let idCounter = 0

  function makeId() {
    return `fixture-node-${idCounter++}`
  }

  function buildTitle() {
    return pick(TASK_TITLES, rand)
  }

  function buildContent() {
    return pick(TASK_CONTENTS, rand)
  }

  function buildTags() {
    const poolKeys = Object.keys(TAG_POOLS)
    const count = Math.floor(rand() * 3) // 0..2 tags
    const selected = new Set()
    for (let i = 0; i < count; i++) {
      const pool = TAG_POOLS[poolKeys[Math.floor(rand() * poolKeys.length)]]
      selected.add(pick(pool, rand))
    }
    return Array.from(selected)
  }

  function buildTaskStatus(isLeaf) {
    if (!isLeaf) return Math.random() < 0.2 ? 'in-progress' : 'todo'
    const r = rand()
    if (r < taskStatusRatio) return 'done'
    if (r < taskStatusRatio + 0.2) return 'in-progress'
    return 'todo'
  }

  // Create nodes
  if (includeRoot) {
    nodes.push(
      normalizeNode({
        id: 'root',
        position: { x: 120, y: 120 },
        data: {
          title: 'Root project',
          content: 'Top-level project description.',
          tags: [],
          taskStatus: 'in-progress',
          width: 340,
        },
      }),
    )
    nodeIdStack.push('root')
  }

  for (let i = nodes.length; i < totalNodes; i++) {
    nodes.push(
      normalizeNode({
        id: makeId(),
        position: { x: 0, y: 0 },
        data: {
          title: buildTitle(),
          content: buildContent(),
          tags: buildTags(),
          taskStatus: 'todo',
        },
      }),
    )
    nodeIdStack.push(nodes[nodes.length - 1].id)
  }

  // Assign parent-child relationships
  const childCounts = new Map()
  // Only nodes already assigned a parent (or root) should be eligible parents.
  // This prevents cycles where a child becomes parent of an ancestor.
  const availableParents = includeRoot ? ['root'] : [nodeIdStack[0]]

  // Helper to add a node to the eligible parent pool once it has a parent itself
  function addAsPotentialParent(id) {
    if (!availableParents.includes(id)) {
      availableParents.push(id)
    }
  }

  for (let i = 1; i < nodeIdStack.length; i++) {
    const childId = nodeIdStack[i]

    // First non-root child always goes to root when includeRoot is true
    let parentId
    if (includeRoot && i === 1) {
      parentId = 'root'
    } else {
      // Find a parent that hasn't exceeded maxChildren
      const eligibleParents = availableParents.filter((pId) => {
        if (pId === childId) return false
        const count = childCounts.get(pId) || 0
        return count < maxChildrenPerParent
      })

      if (!eligibleParents.length) break
      parentId = pick(eligibleParents, rand)
    }

    childCounts.set(parentId, (childCounts.get(parentId) || 0) + 1)

    edges.push(
      normalizeEdge({
        id: `edge-${parentId}-${childId}`,
        source: parentId,
        target: childId,
        type: 'smoothstep',
        data: { kind: 'hierarchy' },
      }),
    )

    // Only after this node has a parent can it become a parent itself
    addAsPotentialParent(childId)
  }

  // Apply taskStatus based on leaf/non-leaf
  const childrenByParent = buildChildrenByParent(edges)
  for (const node of nodes) {
    const isLeaf = !childrenByParent.has(node.id) || childrenByParent.get(node.id).length === 0
    if (!node.data.taskStatus || node.data.taskStatus === 'todo') {
      node.data.taskStatus = buildTaskStatus(isLeaf)
    }
  }

  // Optionally collapse some nodes
  if (collapseSome) {
    for (const node of nodes) {
      if (childrenByParent.has(node.id) && rand() < 0.3) {
        node.data.collapsed = true
      }
    }
  }

  // Set reasonable positions (simple grid layout)
  const positions = computePositions(nodes, edges, includeRoot ? 'root' : null)
  for (const [id, pos] of positions.entries()) {
    const node = nodes.find((n) => n.id === id)
    if (node) node.position = pos
  }

  return { nodes, edges }
}

// ─── Layout Helper ──────────────────────────────────────────────────────────

function computePositions(nodes, edges, rootId) {
  const childrenByParent = buildChildrenByParent(edges)
  const nodeMap = new Map(nodes.map((n) => [n.id, n]))
  const positions = new Map()
  const siblingGap = 84
  const levelGap = 300

  function nodeWidth(id) {
    return Number(nodeMap.get(id)?.data?.width || 320)
  }

  function measure(id, seen = new Set()) {
    if (seen.has(id) || !nodeMap.has(id)) return nodeWidth(id)
    seen.add(id)

    const children = childrenByParent.get(id) || []
    if (!children.length) return nodeWidth(id)

    return children.reduce(
      (total, childId, index) => total + measure(childId, seen) + (index > 0 ? siblingGap : 0),
      Math.max(nodeWidth(id), 0),
    )
  }

  function place(id, centerX, y, seen = new Set()) {
    if (seen.has(id) || !nodeMap.has(id)) return
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

  if (rootId && nodeMap.has(rootId)) {
    const root = nodeMap.get(rootId)
    place(root.id, root.position.x + nodeWidth(root.id) / 2, root.position.y)
  } else {
    // Forest layout — place each root-level node
    const roots = nodes.filter((n) => {
      if (n.id === rootId) return false
      return !edges.some((e) => e.target === n.id && (!e.data || e.data.kind !== 'relation'))
    })
    let y = 120
    for (const root of roots) {
      place(root.id, 400, y)
      const subtreeHeight = (descendantIds(root.id, childrenByParent).length + 1) * levelGap
      y += subtreeHeight
    }
  }

  return positions
}

// ─── Preset Sizes ───────────────────────────────────────────────────────────

/**
 * Small tree: ~5 nodes, 1 level deep, no collapsed nodes.
 */
export function smallTree(options = {}) {
  return customTree(5, 3, { ...options, collapseSome: false })
}

/**
 * Medium tree: ~12 nodes, 2-3 levels deep, some collapsed nodes.
 */
export function mediumTree(options = {}) {
  return customTree(12, 4, { ...options, collapseSome: true })
}

/**
 * Large tree: ~30 nodes, 3-4 levels deep, some collapsed nodes.
 */
export function largeTree(options = {}) {
  return customTree(30, 5, { ...options, collapseSome: true })
}

/**
 * Minimal tree: just a root and 2 children (3 nodes).
 */
export function minimalTree(options = {}) {
  return customTree(3, 2, { ...options, collapseSome: false })
}
