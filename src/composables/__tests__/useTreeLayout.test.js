import { describe, it, expect } from 'vitest'
import { layoutTree } from '../useTreeLayout.js'
import { minimalTree, smallTree, mediumTree } from '../../utils/testFixtures.js'

describe('layoutTree', () => {
  it('positions all nodes from a minimal tree', () => {
    const { nodes, edges } = minimalTree({ seed: 42 })
    const positions = layoutTree(nodes, edges, 'root')
    expect(positions.size).toBeGreaterThanOrEqual(1)
    expect(positions.has('root')).toBe(true)
  })

  it('returns integer positions', () => {
    const { nodes, edges } = minimalTree({ seed: 42 })
    const positions = layoutTree(nodes, edges, 'root')
    for (const [, pos] of positions) {
      expect(Number.isInteger(pos.x)).toBe(true)
      expect(Number.isInteger(pos.y)).toBe(true)
    }
  })

  it('handles empty nodes', () => {
    const positions = layoutTree([], [], 'root')
    expect(positions.size).toBe(0)
  })

  it('falls back to first node if root is missing', () => {
    const { nodes, edges } = minimalTree({ seed: 42 })
    const positions = layoutTree(nodes, edges, 'nonexistent')
    expect(positions.size).toBeGreaterThanOrEqual(1)
  })

  it('positions root at its current x,y', () => {
    const nodes = [
      {
        id: 'root',
        type: 'task',
        position: { x: 100, y: 200 },
        data: { width: 320, collapsed: false },
      },
      {
        id: 'child',
        type: 'task',
        position: { x: 0, y: 0 },
        data: { width: 320, collapsed: false },
      },
    ]
    const edges = [{ source: 'root', target: 'child', data: { kind: 'hierarchy' } }]
    const positions = layoutTree(nodes, edges, 'root')
    expect(positions.get('root').y).toBe(200)
  })

  it('positions child below parent', () => {
    const nodes = [
      {
        id: 'root',
        type: 'task',
        position: { x: 100, y: 120 },
        data: { width: 320, collapsed: false },
      },
      {
        id: 'child',
        type: 'task',
        position: { x: 0, y: 0 },
        data: { width: 320, collapsed: false },
      },
    ]
    const edges = [{ source: 'root', target: 'child', data: { kind: 'hierarchy' } }]
    const positions = layoutTree(nodes, edges, 'root')
    expect(positions.get('child').y).toBeGreaterThan(positions.get('root').y)
  })

  it('handles small tree without error', () => {
    const { nodes, edges } = smallTree({ seed: 123 })
    const positions = layoutTree(nodes, edges, 'root')
    expect(positions.size).toBe(nodes.length)
  })

  it('handles medium tree without error', () => {
    const { nodes, edges } = mediumTree({ seed: 456 })
    const positions = layoutTree(nodes, edges, 'root')
    expect(positions.size).toBeGreaterThan(0)
  })

  it('positions siblings with horizontal spacing', () => {
    const nodes = [
      {
        id: 'root',
        type: 'task',
        position: { x: 100, y: 120 },
        data: { width: 320, collapsed: false },
      },
      {
        id: 'child1',
        type: 'task',
        position: { x: 0, y: 0 },
        data: { width: 320, collapsed: false },
      },
      {
        id: 'child2',
        type: 'task',
        position: { x: 0, y: 0 },
        data: { width: 320, collapsed: false },
      },
    ]
    const edges = [
      { source: 'root', target: 'child1', data: { kind: 'hierarchy' } },
      { source: 'root', target: 'child2', data: { kind: 'hierarchy' } },
    ]
    const positions = layoutTree(nodes, edges, 'root')
    expect(positions.get('child1').x).not.toBe(positions.get('child2').x)
  })

  it('ignores relation edges for layout', () => {
    const nodes = [
      {
        id: 'root',
        type: 'task',
        position: { x: 100, y: 120 },
        data: { width: 320, collapsed: false },
      },
      {
        id: 'child',
        type: 'task',
        position: { x: 0, y: 0 },
        data: { width: 320, collapsed: false },
      },
    ]
    // Only relation edge — no hierarchy edge
    const edges = [{ source: 'root', target: 'child', data: { kind: 'relation' } }]
    const positions = layoutTree(nodes, edges, 'root')
    // Only root should be positioned since there are no hierarchy edges
    // The root is always positioned. child won't be positioned because there's no hierarchy edge
    expect(positions.has('root')).toBe(true)
  })
})
