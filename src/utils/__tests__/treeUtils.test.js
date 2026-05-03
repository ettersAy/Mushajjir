import { describe, it, expect } from 'vitest'
import {
  normalizeNodeData,
  normalizeNode,
  normalizeEdge,
  normalizeTree,
  buildChildrenByParent,
  buildParentByChild,
  descendantIds,
  ancestorIds,
  treeToMarkdown,
  makeId,
  clamp,
  cleanTag,
  getTagColor,
  createHierarchyEdge,
  createRelationEdge,
} from '../treeUtils.js'
import { minimalTree, smallTree } from '../testFixtures.js'

describe('normalizeNodeData', () => {
  it('returns defaults for empty input', () => {
    const result = normalizeNodeData({})
    expect(result.title).toBe('Untitled task')
    expect(result.content).toBe('')
    expect(result.notes).toBe('')
    expect(result.notesOpen).toBe(false)
    expect(result.tags).toEqual([])
    expect(result.childCount).toBeNull()
    expect(result.parentId).toBeNull()
    expect(result.taskStatus).toBe('todo')
    expect(result.systemMessage).toBe('')
    expect(result.collapsed).toBe(false)
    expect(result.width).toBe(320)
    expect(result.height).toBeNull()
  })

  it('preserves provided values', () => {
    const result = normalizeNodeData({
      title: 'My Task',
      content: 'Description',
      tags: ['backend'],
      taskStatus: 'in-progress',
      width: 400,
    })
    expect(result.title).toBe('My Task')
    expect(result.content).toBe('Description')
    expect(result.tags).toEqual(['backend'])
    expect(result.taskStatus).toBe('in-progress')
    expect(result.width).toBe(400)
  })

  it('clamps width to valid range', () => {
    expect(normalizeNodeData({ width: 100 }).width).toBe(280)
    expect(normalizeNodeData({ width: 320 }).width).toBe(320)
    expect(normalizeNodeData({ width: 800 }).width).toBe(560)
  })

  it('clamps height to valid range', () => {
    expect(normalizeNodeData({ height: 100 }).height).toBe(230)
    expect(normalizeNodeData({ height: 500 }).height).toBe(500)
    expect(normalizeNodeData({ height: 1000 }).height).toBe(760)
  })

  it('clamps childCount to valid range', () => {
    expect(normalizeNodeData({ childCount: 0 }).childCount).toBe(1)
    expect(normalizeNodeData({ childCount: 5 }).childCount).toBe(5)
    expect(normalizeNodeData({ childCount: 20 }).childCount).toBe(12)
  })

  it('cleans tags', () => {
    const result = normalizeNodeData({ tags: ['  Backend  ', 'FRONT END', ''] })
    expect(result.tags).toEqual(['backend', 'front-end'])
  })

  it('migrates legacy status to taskStatus when it matches', () => {
    const result = normalizeNodeData({ status: 'done' })
    expect(result.taskStatus).toBe('done')
    expect(result.systemMessage).toBe('')
  })

  it('migrates legacy status to systemMessage when it does not match', () => {
    const result = normalizeNodeData({ status: 'old-custom-status' })
    expect(result.taskStatus).toBe('todo')
    expect(result.systemMessage).toBe('old-custom-status')
  })

  it('handles collapsed boolean coercion', () => {
    expect(normalizeNodeData({ collapsed: true }).collapsed).toBe(true)
    expect(normalizeNodeData({ collapsed: 1 }).collapsed).toBe(true)
    expect(normalizeNodeData({ collapsed: 0 }).collapsed).toBe(false)
    expect(normalizeNodeData({}).collapsed).toBe(false)
  })

  it('handles notesOpen boolean coercion', () => {
    expect(normalizeNodeData({ notesOpen: true }).notesOpen).toBe(true)
    expect(normalizeNodeData({ notesOpen: 1 }).notesOpen).toBe(true)
    expect(normalizeNodeData({}).notesOpen).toBe(false)
  })
})

describe('normalizeNode', () => {
  it('generates an ID if missing', () => {
    const result = normalizeNode({ position: { x: 10, y: 20 } })
    expect(result.id).toMatch(/^node_/)
  })

  it('maps sticky type to task', () => {
    const result = normalizeNode({ id: 'test', type: 'sticky', position: { x: 0, y: 0 } })
    expect(result.type).toBe('task')
  })

  it('defaults position to {0,0}', () => {
    const result = normalizeNode({ id: 'test' })
    expect(result.position).toEqual({ x: 0, y: 0 })
  })
})

describe('normalizeEdge', () => {
  it('sets hierarchy kind by default', () => {
    const result = normalizeEdge({ source: 'a', target: 'b' })
    expect(result.data.kind).toBe('hierarchy')
    expect(result.type).toBe('smoothstep')
  })

  it('preserves relation kind', () => {
    const result = normalizeEdge({ source: 'a', target: 'b', data: { kind: 'relation', label: 'depends on' } })
    expect(result.data.kind).toBe('relation')
    expect(result.data.label).toBe('depends on')
  })

  it('generates ID if missing', () => {
    const hierarchyResult = normalizeEdge({ source: 'a', target: 'b' })
    expect(hierarchyResult.id).toMatch(/^edge_/)

    const relationResult = normalizeEdge({ source: 'a', target: 'b', data: { kind: 'relation' } })
    expect(relationResult.id).toMatch(/^relation_/)
  })
})

describe('normalizeTree', () => {
  it('returns empty arrays for empty payload', () => {
    const result = normalizeTree({})
    expect(result.nodes).toEqual([])
    expect(result.edges).toEqual([])
  })

  it('returns empty arrays for null payload', () => {
    const result = normalizeTree(null)
    expect(result.nodes).toEqual([])
    expect(result.edges).toEqual([])
  })

  it('filters orphaned edges', () => {
    const result = normalizeTree({
      nodes: [{ id: 'a', position: { x: 0, y: 0 } }],
      edges: [
        { source: 'a', target: 'b' }, // 'b' doesn't exist
        { source: 'c', target: 'a' }, // 'c' doesn't exist
      ],
    })
    expect(result.edges).toEqual([])
  })

  it('keeps valid edges', () => {
    const result = normalizeTree({
      nodes: [
        { id: 'a', position: { x: 0, y: 0 } },
        { id: 'b', position: { x: 100, y: 100 } },
      ],
      edges: [{ source: 'a', target: 'b' }],
    })
    expect(result.edges).toHaveLength(1)
  })
})

describe('buildChildrenByParent', () => {
  it('builds correct child map', () => {
    const edges = [
      { source: 'root', target: 'a', data: { kind: 'hierarchy' } },
      { source: 'root', target: 'b', data: { kind: 'hierarchy' } },
    ]
    const result = buildChildrenByParent(edges)
    expect(result.get('root')).toEqual(['a', 'b'])
  })

  it('excludes relation edges', () => {
    const edges = [
      { source: 'root', target: 'a', data: { kind: 'hierarchy' } },
      { source: 'root', target: 'b', data: { kind: 'relation' } },
    ]
    const result = buildChildrenByParent(edges)
    expect(result.get('root')).toEqual(['a'])
  })
})

describe('buildParentByChild', () => {
  it('builds correct parent map', () => {
    const edges = [{ source: 'root', target: 'a', data: { kind: 'hierarchy' } }]
    const result = buildParentByChild(edges)
    expect(result.get('a')).toBe('root')
  })

  it('excludes relation edges', () => {
    const edges = [{ source: 'root', target: 'a', data: { kind: 'relation' } }]
    const result = buildParentByChild(edges)
    expect(result.has('a')).toBe(false)
  })
})

describe('descendantIds', () => {
  it('returns all descendants', () => {
    const childrenByParent = new Map([
      ['root', ['a', 'b']],
      ['a', ['a1', 'a2']],
    ])
    const result = descendantIds('root', childrenByParent)
    expect(result).toContain('a')
    expect(result).toContain('b')
    expect(result).toContain('a1')
    expect(result).toContain('a2')
  })

  it('handles cycles', () => {
    const childrenByParent = new Map([
      ['a', ['b']],
      ['b', ['a']],
    ])
    const result = descendantIds('a', childrenByParent)
    // Cycles are broken but a→b→a is discovered (a not in seen when b is processed)
    expect(result).toContain('b')
    expect(result).toContain('a')
  })
})

describe('ancestorIds', () => {
  it('returns all ancestors ordered from root', () => {
    const parentByChild = new Map([
      ['c', 'b'],
      ['b', 'a'],
      ['a', 'root'],
    ])
    const result = ancestorIds('c', parentByChild)
    expect(result).toEqual(['root', 'a', 'b'])
  })

  it('returns empty array for orphan nodes', () => {
    const result = ancestorIds('orphan', new Map())
    expect(result).toEqual([])
  })
})

describe('treeToMarkdown', () => {
  it('produces markdown output with header', () => {
    const { nodes, edges } = minimalTree({ seed: 42 })
    const result = treeToMarkdown(nodes, edges, 'root')
    expect(result).toContain('# Mushajjir Tree')
    expect(result).toContain('- ')
  })

  it('includes task status in output', () => {
    const nodes = [
      {
        id: 'root',
        type: 'task',
        position: { x: 0, y: 0 },
        data: {
          title: 'Root',
          taskStatus: 'in-progress',
          tags: [],
          collapsed: false,
          width: 320,
          height: null,
          systemMessage: '',
          notes: '',
          content: '',
          notesOpen: false,
          childCount: null,
          parentId: null,
        },
      },
    ]
    const result = treeToMarkdown(nodes, [], 'root')
    expect(result).toContain('[in-progress]')
  })

  it('includes tags in output', () => {
    const nodes = [
      {
        id: 'root',
        type: 'task',
        position: { x: 0, y: 0 },
        data: {
          title: 'Root',
          taskStatus: 'todo',
          tags: ['backend', 'urgent'],
          collapsed: false,
          width: 320,
          height: null,
          systemMessage: '',
          notes: '',
          content: '',
          notesOpen: false,
          childCount: null,
          parentId: null,
        },
      },
    ]
    const result = treeToMarkdown(nodes, [], 'root')
    expect(result).toContain('#backend')
    expect(result).toContain('#urgent')
  })

  it('returns markdown for empty trees', () => {
    const result = treeToMarkdown([], [], 'nonexistent')
    expect(result).toContain('# Mushajjir Tree')
  })
})

describe('clamp', () => {
  it('clamps values within range', () => {
    expect(clamp(5, 1, 10)).toBe(5)
  })

  it('clamps values below min', () => {
    expect(clamp(0, 1, 10)).toBe(1)
  })

  it('clamps values above max', () => {
    expect(clamp(20, 1, 10)).toBe(10)
  })

  it('returns min for non-finite input', () => {
    expect(clamp(NaN, 1, 10)).toBe(1)
    expect(clamp(Infinity, 1, 10)).toBe(1)
  })
})

describe('cleanTag', () => {
  it('trims and lowercases', () => {
    expect(cleanTag('  Backend  ')).toBe('backend')
  })

  it('replaces spaces with dashes', () => {
    expect(cleanTag('front end')).toBe('front-end')
  })

  it('truncates to 28 chars', () => {
    const long = 'a'.repeat(40)
    expect(cleanTag(long).length).toBe(28)
  })
})

describe('getTagColor', () => {
  it('returns color object for valid tag', () => {
    const result = getTagColor('backend')
    expect(result).toHaveProperty('background')
    expect(result).toHaveProperty('color')
  })

  it('returns color for empty tag', () => {
    const result = getTagColor('')
    expect(result).toHaveProperty('background')
    expect(result).toHaveProperty('color')
  })
})

describe('makeId', () => {
  it('produces string with prefix', () => {
    const id = makeId('test')
    expect(id).toMatch(/^test_/)
  })

  it('produces unique IDs', () => {
    const ids = new Set(Array.from({ length: 100 }, () => makeId()))
    expect(ids.size).toBe(100)
  })
})

describe('createHierarchyEdge', () => {
  it('creates edge with hierarchy kind', () => {
    const edge = createHierarchyEdge('parent', 'child')
    expect(edge.source).toBe('parent')
    expect(edge.target).toBe('child')
    expect(edge.data.kind).toBe('hierarchy')
    expect(edge.type).toBe('smoothstep')
  })
})

describe('createRelationEdge', () => {
  it('creates edge with relation kind and label', () => {
    const edge = createRelationEdge('a', 'b', 'depends on')
    expect(edge.source).toBe('a')
    expect(edge.target).toBe('b')
    expect(edge.data.kind).toBe('relation')
    expect(edge.data.label).toBe('depends on')
    expect(edge.label).toBe('depends on')
  })
})
