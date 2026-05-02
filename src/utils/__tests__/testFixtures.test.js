import { describe, it, expect } from 'vitest'
import { smallTree, mediumTree, largeTree, minimalTree, customTree } from '../testFixtures'
import { buildChildrenByParent, buildParentByChild, normalizeNodeData } from '../treeUtils'

describe('testFixtures', () => {
  describe('minimalTree', () => {
    const { nodes, edges } = minimalTree({ seed: 42 })

    it('returns 3 nodes', () => {
      expect(nodes).toHaveLength(3)
    })

    it('includes a root node', () => {
      expect(nodes.map((n) => n.id)).toContain('root')
    })

    it('creates 2 hierarchy edges', () => {
      expect(edges).toHaveLength(2)
      for (const edge of edges) {
        expect(edge.data.kind).toBe('hierarchy')
      }
    })

    it('has valid node shapes', () => {
      for (const node of nodes) {
        expect(node.id).toBeTruthy()
        expect(node.type).toBe('task')
        expect(node.position).toBeDefined()
        expect(node.position.x).toEqual(expect.any(Number))
        expect(node.position.y).toEqual(expect.any(Number))
        expect(node.data.title).toBeTruthy()
        expect(node.data.taskStatus).toMatch(/^(todo|in-progress|done|blocked)$/)
        // Normalize again to ensure it passes
        const renormalized = normalizeNodeData(node.data)
        expect(renormalized.title).toBe(node.data.title)
      }
    })

    it('builds a connected tree with root having children', () => {
      const childrenByParent = buildChildrenByParent(edges)
      const parentByChild = buildParentByChild(edges)

      // Root should have children (first child always assigned to root)
      const rootChildren = childrenByParent.get('root') || []
      expect(rootChildren.length).toBeGreaterThanOrEqual(1)

      // Every non-root node should have a parent
      for (const node of nodes) {
        if (node.id === 'root') continue
        expect(parentByChild.has(node.id)).toBe(true)
      }

      // Root should be ancestor of all nodes
      for (const childId of rootChildren) {
        expect(parentByChild.get(childId)).toBe('root')
      }
    })

    it('has no collapsed nodes', () => {
      for (const node of nodes) {
        expect(node.data.collapsed).toBe(false)
      }
    })
  })

  describe('smallTree', () => {
    const { nodes, edges } = smallTree({ seed: 123 })

    it('returns ~5 nodes', () => {
      expect(nodes).toHaveLength(5)
    })

    it('has all edges as hierarchy kind', () => {
      for (const edge of edges) {
        expect(edge.data.kind).toBe('hierarchy')
      }
    })

    it('all source/target node IDs exist in nodes', () => {
      const nodeIds = new Set(nodes.map((n) => n.id))
      for (const edge of edges) {
        expect(nodeIds.has(edge.source)).toBe(true)
        expect(nodeIds.has(edge.target)).toBe(true)
      }
    })
  })

  describe('mediumTree', () => {
    const { nodes, edges } = mediumTree({ seed: 456 })

    it('returns ~12 nodes', () => {
      expect(nodes).toHaveLength(12)
    })

    it('has some collapsed nodes', () => {
      const collapsed = nodes.filter((n) => n.data.collapsed)
      expect(collapsed.length).toBeGreaterThan(0)
    })

    it('has valid edge references', () => {
      const nodeIds = new Set(nodes.map((n) => n.id))
      for (const edge of edges) {
        expect(nodeIds.has(edge.source)).toBe(true)
        expect(nodeIds.has(edge.target)).toBe(true)
        expect(edge.data.kind).toBe('hierarchy')
        expect(edge.type).toBe('smoothstep')
      }
    })
  })

  describe('largeTree', () => {
    const { nodes, edges } = largeTree({ seed: 789 })

    it('returns ~30 nodes', () => {
      expect(nodes).toHaveLength(30)
    })

    it('has more edges than nodes - 1 (connected tree)', () => {
      // A tree with N nodes has N-1 hierarchy edges if fully connected
      expect(edges.length).toBe(nodes.length - 1)
    })

    it('every node except root has a parent', () => {
      const parentByChild = buildParentByChild(edges)
      for (const node of nodes) {
        if (node.id === 'root') continue
        expect(parentByChild.has(node.id)).toBe(true)
      }
    })
  })

  describe('customTree with seed for reproducibility', () => {
    it('produces identical output with same seed', () => {
      const a = customTree(8, 3, { seed: 42 })
      const b = customTree(8, 3, { seed: 42 })
      expect(a.nodes.map((n) => n.data.title)).toEqual(b.nodes.map((n) => n.data.title))
      expect(a.edges.map((e) => ({ source: e.source, target: e.target }))).toEqual(
        b.edges.map((e) => ({ source: e.source, target: e.target })),
      )
    })

    it('produces different output with different seed', () => {
      const a = customTree(8, 3, { seed: 42 })
      const b = customTree(8, 3, { seed: 99 })
      const aTitles = a.nodes.map((n) => n.data.title).join(',')
      const bTitles = b.nodes.map((n) => n.data.title).join(',')
      expect(aTitles).not.toBe(bTitles)
    })
  })

  describe('without root node', () => {
    const { nodes, edges } = customTree(6, 3, { includeRoot: false, seed: 42 })

    it('does not have a root node', () => {
      expect(nodes.map((n) => n.id)).not.toContain('root')
    })

    it('has valid edges', () => {
      const nodeIds = new Set(nodes.map((n) => n.id))
      for (const edge of edges) {
        expect(nodeIds.has(edge.source)).toBe(true)
        expect(nodeIds.has(edge.target)).toBe(true)
      }
    })
  })

  describe('taskStatus distribution', () => {
    const { nodes, edges } = customTree(20, 4, { seed: 42, taskStatusRatio: 0.5 })
    const childrenByParent = buildChildrenByParent(edges)

    it('leaves have status based on ratio', () => {
      const leaves = nodes.filter((n) => !childrenByParent.has(n.id) || childrenByParent.get(n.id).length === 0)
      expect(leaves.length).toBeGreaterThan(0)
      const doneLeaves = leaves.filter((n) => n.data.taskStatus === 'done')
      expect(doneLeaves.length).toBeGreaterThan(0)
    })
  })
})
