import { DEFAULT_TAGS, TASK_STATUSES } from '../config/index.js'

export { TASK_STATUSES, DEFAULT_TAGS }

const TAG_COLORS = [
  { background: '#e7f0ff', color: '#1f4f8f' },
  { background: '#e8f7ef', color: '#216343' },
  { background: '#fff1d9', color: '#7b4a00' },
  { background: '#ffe5e5', color: '#8a2d2d' },
  { background: '#efe9ff', color: '#59409a' },
  { background: '#e4f8f7', color: '#1f6765' },
  { background: '#f2efe8', color: '#665640' },
]

export function makeId(prefix = 'id') {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return `${prefix}_${crypto.randomUUID()}`
  }

  return `${prefix}_${Date.now()}_${Math.random().toString(16).slice(2)}`
}

export function clamp(value, min, max) {
  const number = Number(value)
  if (!Number.isFinite(number)) return min
  return Math.min(max, Math.max(min, number))
}

function hashTag(tag) {
  return Array.from(tag).reduce((total, character) => total + character.charCodeAt(0), 0)
}

export function getTagColor(tag) {
  return TAG_COLORS[hashTag(String(tag || '')) % TAG_COLORS.length]
}

export function cleanTag(tag) {
  return String(tag || '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '-')
    .slice(0, 28)
}

export function normalizeNodeData(data = {}) {
  const oldStatus = data.status || ''
  const oldStatusIsTaskState = TASK_STATUSES.some((status) => status.id === oldStatus)

  return {
    title: data.title || 'Untitled task',
    content: data.content || '',
    notes: data.notes || '',
    notesOpen: Boolean(data.notesOpen),
    tags: Array.isArray(data.tags) ? data.tags.map(cleanTag).filter(Boolean) : [],
    childCount: data.childCount != null ? clamp(Number(data.childCount), 1, 12) : null,
    parentId: data.parentId ?? null,
    taskStatus: data.taskStatus || (oldStatusIsTaskState ? oldStatus : 'todo'),
    systemMessage: data.systemMessage || (!oldStatusIsTaskState ? oldStatus : ''),
    collapsed: Boolean(data.collapsed),
    width: clamp(Number(data.width || 320), 280, 560),
    height: data.height ? clamp(Number(data.height), 230, 760) : null,
  }
}

export function normalizeNode(node) {
  return {
    ...node,
    id: node.id || makeId('node'),
    type: node.type === 'sticky' ? 'task' : node.type || 'task',
    position: node.position || { x: 0, y: 0 },
    data: normalizeNodeData(node.data || {}),
  }
}

export function createHierarchyEdge(source, target) {
  return {
    id: makeId('edge'),
    source,
    target,
    type: 'smoothstep',
    data: { kind: 'hierarchy' },
  }
}

export function createRelationEdge(source, target, label = '') {
  return {
    id: makeId('relation'),
    source,
    target,
    type: 'smoothstep',
    label,
    data: { kind: 'relation', label },
  }
}

export function normalizeEdge(edge) {
  const kind = edge.data?.kind || 'hierarchy'
  return {
    ...edge,
    id: edge.id || makeId(kind === 'relation' ? 'relation' : 'edge'),
    type: edge.type || 'smoothstep',
    label: kind === 'relation' ? edge.label || edge.data?.label || '' : edge.label,
    data: {
      ...(edge.data || {}),
      kind,
      label: kind === 'relation' ? edge.label || edge.data?.label || '' : edge.data?.label,
    },
  }
}

export function normalizeTree(payload) {
  const nodes = Array.isArray(payload?.nodes) ? payload.nodes.map(normalizeNode) : []
  const knownNodeIds = new Set(nodes.map((node) => node.id))
  const edges = Array.isArray(payload?.edges)
    ? payload.edges.filter((edge) => knownNodeIds.has(edge.source) && knownNodeIds.has(edge.target)).map(normalizeEdge)
    : []

  return { nodes, edges }
}

export function buildChildrenByParent(edges) {
  const childrenByParent = new Map()

  for (const edge of edges) {
    if (edge.data?.kind === 'relation') continue
    childrenByParent.set(edge.source, [...(childrenByParent.get(edge.source) || []), edge.target])
  }

  return childrenByParent
}

export function buildParentByChild(edges) {
  const parentByChild = new Map()

  for (const edge of edges) {
    if (edge.data?.kind === 'relation') continue
    parentByChild.set(edge.target, edge.source)
  }

  return parentByChild
}

export function descendantIds(id, childrenByParent, seen = new Set()) {
  const children = childrenByParent.get(id) || []
  const descendants = []

  for (const childId of children) {
    if (seen.has(childId)) continue
    seen.add(childId)
    descendants.push(childId, ...descendantIds(childId, childrenByParent, seen))
  }

  return descendants
}

export function ancestorIds(id, parentByChild) {
  const ancestors = []
  let currentId = parentByChild.get(id)

  while (currentId) {
    ancestors.unshift(currentId)
    currentId = parentByChild.get(currentId)
  }

  return ancestors
}

export function treeToMarkdown(nodes, edges, rootId = 'root') {
  const nodeById = new Map(nodes.map((node) => [node.id, node]))
  const childrenByParent = buildChildrenByParent(edges)

  function renderNode(id, depth = 0) {
    const node = nodeById.get(id)
    if (!node) return []

    const indent = '  '.repeat(depth)
    const status = node.data.taskStatus ? ` [${node.data.taskStatus}]` : ''
    const tags = node.data.tags?.length ? ` (${node.data.tags.map((tag) => `#${tag}`).join(' ')})` : ''
    const lines = [`${indent}- ${node.data.title}${status}${tags}`]

    if (node.data.content) lines.push(`${indent}  ${node.data.content}`)
    if (node.data.notes) lines.push(`${indent}  Notes: ${node.data.notes.replace(/\n+/g, ' ')}`)

    for (const childId of childrenByParent.get(id) || []) {
      lines.push(...renderNode(childId, depth + 1))
    }

    return lines
  }

  return `# Mushajjir Tree\n\n${renderNode(rootId).join('\n')}\n`
}
