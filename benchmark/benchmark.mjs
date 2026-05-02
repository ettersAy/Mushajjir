#!/usr/bin/env node

/**
 * Mushajjir Performance Benchmark
 *
 * Measures execution time of core tree operations (the same operations
 * used by the Pinia store computed properties) across increasing tree sizes.
 *
 * Usage:
 *   node benchmark/benchmark.mjs
 *   node benchmark/benchmark.mjs --runs 3        # Custom runs
 *   node benchmark/benchmark.mjs --sizes 10,100   # Custom sizes
 *   node benchmark/benchmark.mjs --format json    # JSON output
 */

import { customTree } from '../src/utils/testFixtures.js'
import {
  buildChildrenByParent,
  buildParentByChild,
  descendantIds,
  ancestorIds,
} from '../src/utils/treeUtils.js'

// ─── Configuration ──────────────────────────────────────────────────────────

const args = process.argv.slice(2)
const RUNS = parseInt(args[args.indexOf('--runs') + 1], 10) || 5
const FORMAT = args.includes('--format') ? args[args.indexOf('--format') + 1] || 'table' : 'table'

const SIZES = args.includes('--sizes')
  ? args[args.indexOf('--sizes') + 1].split(',').map(Number)
  : [10, 50, 100, 500, 1000]

// ─── Benchmark Suite ────────────────────────────────────────────────────────

function createBenchmarkSuite(size, seed) {
  // Generate tree
  const { nodes, edges } = customTree(size, 5, { seed, includeRoot: true })

  // Pre-compute the maps used by store computed properties
  const nodeById = () => new Map(nodes.map((node) => [node.id, node]))
  const childrenByParent = () => buildChildrenByParent(edges)
  const parentByChild = () => buildParentByChild(edges)

  return {
    nodes,
    edges,

    // Benchmark: buildChildrenByParent
    benchChildrenByParent() {
      return buildChildrenByParent(edges)
    },

    // Benchmark: buildParentByChild
    benchParentByChild() {
      return buildParentByChild(edges)
    },

    // Benchmark: visibleNodeIds (without search/filter active)
    benchVisibleNodeIds() {
      const cbp = buildChildrenByParent(edges)
      const hidden = new Set()
      for (const node of nodes) {
        if (!node.data.collapsed) continue
        for (const id of descendantIds(node.id, cbp)) hidden.add(id)
      }
      const ids = new Set()
      for (const node of nodes) {
        if (hidden.has(node.id)) continue
        ids.add(node.id)
      }
      return ids
    },

    // Benchmark: progressByNode (recursive progress computation)
    benchProgressByNode() {
      const nodeMap = new Map(nodes.map((node) => [node.id, node]))
      const cbp = buildChildrenByParent(edges)
      const cache = new Map()

      function progressFor(id) {
        if (cache.has(id)) return cache.get(id)
        const children = cbp.get(id) || []
        if (children.length) {
          const total = children.reduce((sum, childId) => sum + progressFor(childId), 0)
          const progress = Math.round(total / children.length)
          cache.set(id, progress)
          return progress
        }
        const status = nodeMap.get(id)?.data?.taskStatus
        const progress = status === 'done' ? 100 : status === 'in-progress' ? 50 : 0
        cache.set(id, progress)
        return progress
      }

      for (const node of nodes) progressFor(node.id)
      return cache
    },

    // Benchmark: flowNodes (full display node generation)
    benchFlowNodes() {
      const nodeMap = new Map(nodes.map((node) => [node.id, node]))
      const cbp = buildChildrenByParent(edges)
      const pbc = buildParentByChild(edges)

      // visibleNodeIds (no filters)
      const hidden = new Set()
      for (const node of nodes) {
        if (!node.data.collapsed) continue
        for (const id of descendantIds(node.id, cbp)) hidden.add(id)
      }
      const visibleIds = new Set()
      for (const node of nodes) {
        if (hidden.has(node.id)) continue
        visibleIds.add(node.id)
      }

      // progressByNode
      const progressCache = new Map()
      function progressFor(id) {
        if (progressCache.has(id)) return progressCache.get(id)
        const children = cbp.get(id) || []
        if (children.length) {
          const total = children.reduce((sum, childId) => sum + progressFor(childId), 0)
          const p = Math.round(total / children.length)
          progressCache.set(id, p)
          return p
        }
        const status = nodeMap.get(id)?.data?.taskStatus
        const p = status === 'done' ? 100 : status === 'in-progress' ? 50 : 0
        progressCache.set(id, p)
        return p
      }
      for (const node of nodes) progressFor(node.id)

      // Build flowNodes
      return nodes.map((node) => ({
        ...node,
        hidden: !visibleIds.has(node.id),
        data: {
          ...node.data,
          progress: progressCache.get(node.id) || 0,
          actualChildCount: cbp.get(node.id)?.length || 0,
          hiddenDescendantCount: node.data.collapsed ? descendantIds(node.id, cbp).length : 0,
          searchMatch: false,
          dimmed: false,
          relationDraftSourceId: null,
        },
      }))
    },

    // Benchmark: flowEdges (full display edge generation)
    benchFlowEdges() {
      const cbp = buildChildrenByParent(edges)
      const pbc = buildParentByChild(edges)

      // visibleNodeIds
      const hidden = new Set()
      for (const node of nodes) {
        if (!node.data.collapsed) continue
        for (const id of descendantIds(node.id, cbp)) hidden.add(id)
      }
      const visibleIds = new Set()
      for (const node of nodes) {
        if (hidden.has(node.id)) continue
        visibleIds.add(node.id)
      }

      return edges.map((edge) => {
        const kind = edge.data?.kind || 'hierarchy'
        return {
          ...edge,
          hidden: !visibleIds.has(edge.source) || !visibleIds.has(edge.target),
          animated: false,
          style: {
            ...(kind === 'relation'
              ? { stroke: '#888', strokeDasharray: '7 6', strokeWidth: 1.8 }
              : { stroke: '#555', strokeWidth: 2 }),
            opacity: 1,
          },
        }
      })
    },

    // Benchmark: descendantIds for all nodes
    benchDescendantIds() {
      const cbp = buildChildrenByParent(edges)
      for (const node of nodes) {
        descendantIds(node.id, cbp)
      }
    },

    // Benchmark: ancestorIds for all nodes
    benchAncestorIds() {
      const pbc = buildParentByChild(edges)
      for (const node of nodes) {
        ancestorIds(node.id, pbc)
      }
    },
  }
}

// ─── Timing ─────────────────────────────────────────────────────────────────

function measure(fn, runs = RUNS) {
  // Warmup
  fn()

  const times = []
  for (let i = 0; i < runs; i++) {
    const start = process.hrtime.bigint()
    fn()
    const end = process.hrtime.bigint()
    times.push(Number(end - start) / 1e6) // ms
  }

  times.sort((a, b) => a - b)
  // Drop fastest and slowest, average the rest
  const trimmed = times.slice(1, -1)
  const avg = trimmed.reduce((sum, t) => sum + t, 0) / trimmed.length
  const min = times[0]
  const max = times[times.length - 1]

  return { avg: Math.round(avg * 100) / 100, min: Math.round(min * 100) / 100, max: Math.round(max * 100) / 100 }
}

// ─── Reporting ──────────────────────────────────────────────────────────────

function formatTable(results) {
  const benchmarks = Object.keys(results[0]).filter((k) => k !== 'size')
  const sizeWidth = Math.max(...results.map((r) => String(r.size).length), 4)
  const nameWidth = Math.max(...benchmarks.map((b) => b.length), 9)

  // Header
  let output = `\n${'Size'.padStart(sizeWidth)} |`
  for (const name of benchmarks) {
    output += ` ${name.padEnd(nameWidth)} |`
  }
  output += '\n' + '─'.repeat(sizeWidth) + '─┼'
  for (const _ of benchmarks) {
    output += '─'.repeat(nameWidth + 2) + '┼'
  }
  output += '\n'

  // Rows
  for (const row of results) {
    output += `${String(row.size).padStart(sizeWidth)} |`
    for (const name of benchmarks) {
      output += ` ${String(row[name]).padEnd(nameWidth)} |`
    }
    output += '\n'
  }

  output += '\nValues are average execution time in milliseconds.\n'
  output += `Each benchmark runs ${RUNS} times (dropping fastest and slowest).\n`
  return output
}

function formatJson(results) {
  return JSON.stringify(results, null, 2)
}

// ─── Main ───────────────────────────────────────────────────────────────────

console.log('')
console.log('╔══════════════════════════════════════════════════╗')
console.log('║       Mushajjir Performance Benchmark            ║')
console.log('╚══════════════════════════════════════════════════╝')
console.log('')
console.log(`Tree sizes: ${SIZES.join(', ')}`)
console.log(`Runs per benchmark: ${RUNS}`)
console.log('')

const results = []

for (const size of SIZES) {
  const seed = 42 // fixed seed for reproducibility
  const suite = createBenchmarkSuite(size, seed)

  console.log(`  Generating tree with ${size} nodes...`)
  console.log(`    Actual nodes: ${suite.nodes.length}, edges: ${suite.edges.length}`)

  const row = { size: suite.nodes.length }

  const benchmarks = [
    ['buildChildrenByParent', suite.benchChildrenByParent],
    ['buildParentByChild', suite.benchParentByChild],
    ['visibleNodeIds', suite.benchVisibleNodeIds],
    ['progressByNode', suite.benchProgressByNode],
    ['flowNodes', suite.benchFlowNodes],
    ['flowEdges', suite.benchFlowEdges],
    ['descendantIds (all)', suite.benchDescendantIds],
    ['ancestorIds (all)', suite.benchAncestorIds],
  ]

  for (const [name, fn] of benchmarks) {
    const { avg } = measure(fn)
    row[name] = avg < 0.01 ? '<0.01' : avg
    process.stdout.write(`    ${name}: ${row[name]}ms\n`)
  }

  results.push(row)
  console.log('')
}

console.log('─'.repeat(60))
console.log(FORMAT === 'json' ? formatJson(results) : formatTable(results))
console.log('')
