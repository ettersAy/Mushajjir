#!/usr/bin/env node

/**
 * Mushajjir Project Index
 *
 * Lightweight project exploration tool. Answers common queries about
 * file locations, import graph, component responsibilities, and store actions.
 *
 * Usage:
 *   node scripts/project-index.mjs                    # Full index
 *   node scripts/project-index.mjs --components       # List components
 *   node scripts/project-index.mjs --stores           # List stores and actions
 *   node scripts/project-index.mjs --utils            # List utilities
 *   node scripts/project-index.mjs --imports <file>   # Show imports of a file
 *   node scripts/project-index.mjs --tree-schema      # Show tree data model
 *   node scripts/project-index.mjs --json             # JSON output
 */

import { readFile, readdir, stat } from 'node:fs/promises'
import { resolve, relative, dirname, basename } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const SRC = resolve(ROOT, 'src')
const args = process.argv.slice(2)
const jsonOutput = args.includes('--json')

// ─── File Discovery ─────────────────────────────────────────────────────────

async function findFiles(dir, pattern = /\.(js|vue)$/) {
  const results = []
  const entries = await readdir(dir, { withFileTypes: true })
  for (const entry of entries) {
    const fullPath = resolve(dir, entry.name)
    if (entry.isDirectory() && entry.name !== '__tests__' && entry.name !== 'node_modules') {
      results.push(...(await findFiles(fullPath, pattern)))
    } else if (entry.isFile() && pattern.test(entry.name)) {
      results.push(fullPath)
    }
  }
  return results
}

async function readFileText(path) {
  try {
    return await readFile(path, 'utf8')
  } catch {
    return ''
  }
}

function relativePath(abs) {
  return relative(ROOT, abs)
}

// ─── Import Extraction ──────────────────────────────────────────────────────

function extractImports(source) {
  const imports = []
  const regex = /import\s+(?:(?:\{[^}]*\}|\*\s+as\s+\w+|\w+)(?:\s*,\s*(?:\{[^}]*\}|\*\s+as\s+\w+|\w+))*\s+from\s+)?['"]([^'"]+)['"]/g
  let match
  while ((match = regex.exec(source)) !== null) {
    const specifier = match[1]
    if (specifier.startsWith('.')) {
      imports.push({ specifier, local: true })
    } else if (specifier.startsWith('@')) {
      imports.push({ specifier, local: false, scoped: true })
    } else {
      imports.push({ specifier, local: false, scoped: false })
    }
  }
  return imports
}

function extractExports(source) {
  const exports = []
  const namedRegex = /export\s+(?:const|let|var|function|class|async\s+function)\s+(\w+)/g
  const defaultRegex = /export\s+default\s+(?:function\s+)?(\w+)?/
  let match
  while ((match = namedRegex.exec(source)) !== null) {
    exports.push({ name: match[1], type: 'named' })
  }
  const defaultMatch = defaultRegex.exec(source)
  if (defaultMatch) {
    exports.push({ name: defaultMatch[1] || 'default', type: 'default' })
  }
  return exports
}

// ─── Component Analysis ─────────────────────────────────────────────────────

async function analyzeComponents() {
  const dir = resolve(SRC, 'components')
  const files = await findFiles(dir)
  const results = []

  for (const file of files) {
    const source = await readFileText(file)
    const props = []
    const emits = []
    const propMatch = source.match(/defineProps\(\{([^}]+)\}/s)
    const emitMatch = source.match(/defineEmits\(\['([^']+)'\]/)

    if (propMatch) {
      const propStr = propMatch[1]
      const propNames = propStr.match(/(\w+):/g)
      if (propNames) {
        for (const p of propNames) {
          props.push(p.replace(':', ''))
        }
      }
    }
    if (emitMatch) {
      emits.push(...emitMatch[1].split("','"))
    }

    results.push({
      file: relativePath(file),
      name: basename(file, '.vue'),
      props,
      emits,
      imports: extractImports(source),
    })
  }

  return results
}

// ─── Store Analysis ─────────────────────────────────────────────────────────

async function analyzeStores() {
  const dir = resolve(SRC, 'stores')
  const files = await findFiles(dir)
  const results = []

  for (const file of files) {
    const source = await readFileText(file)
    const storeName = source.match(/defineStore\('(\w+)'/)?.[1] || basename(file, '.js')
    const returnMatch = source.match(/return\s*\{([^}]+(?:\{[^}]*\}[^}]*)*)\}/s)
    const actions = []
    const computedProps = []

    if (returnMatch) {
      const returnBlock = returnMatch[1]
      const memberRegex = /(\w+)(?=\s*,|\s*\n|$)/g
      let m
      while ((m = memberRegex.exec(returnBlock)) !== null) {
        const name = m[1]
        // Detect computed vs action by checking if it's a function
        const isComputed = source.includes(`const ${name} = computed(`)
        if (isComputed) {
          computedProps.push(name)
        } else if (/function|async/.test(source.slice(source.indexOf(`const ${name}`), source.indexOf(`const ${name}`) + 200))) {
          actions.push(name)
        } else {
          // Heuristic: refs and simple values
          const isRef = source.includes(`const ${name} = ref(`)
          if (!isRef) {
            actions.push(name)
          }
        }
      }
    }

    results.push({
      file: relativePath(file),
      store: storeName,
      computedProperties: computedProps,
      actions: [...new Set(actions)],
    })
  }

  return results
}

// ─── Utility Analysis ───────────────────────────────────────────────────────

async function analyzeUtils() {
  const dir = resolve(SRC, 'utils')
  const files = await findFiles(dir)
  const results = []

  for (const file of files) {
    const source = await readFileText(file)
    results.push({
      file: relativePath(file),
      exports: extractExports(source),
    })
  }

  return results
}

// ─── Service Analysis ───────────────────────────────────────────────────────

async function analyzeServices() {
  const dir = resolve(SRC, 'services')
  const files = await findFiles(dir)
  const results = []

  for (const file of files) {
    const source = await readFileText(file)
    results.push({
      file: relativePath(file),
      exports: extractExports(source),
    })
  }

  return results
}

// ─── Tree Schema ────────────────────────────────────────────────────────────

function getTreeSchema() {
  return {
    node: {
      id: 'string (UUID or timestamp-based)',
      type: "string (always 'task')",
      position: '{ x: number, y: number }',
      data: {
        title: "string (default: 'Untitled task')",
        content: "string (default: '')",
        notes: "string (default: '')",
        notesOpen: 'boolean (default: false)',
        tags: 'string[] (default: [])',
        childCount: 'number | null (default: null, range: 1-12)',
        parentId: 'string | null (default: null)',
        taskStatus: "string (one of: 'todo', 'in-progress', 'blocked', 'done')",
        systemMessage: "string (default: '')",
        collapsed: 'boolean (default: false)',
        width: 'number (default: 320, range: 280-560)',
        height: 'number | null (default: null, range: 230-760)',
      },
    },
    edge: {
      hierarchy: {
        id: 'string',
        source: 'string (parent node ID)',
        target: 'string (child node ID)',
        type: "string ('smoothstep')",
        'data.kind': "string ('hierarchy')",
      },
      relation: {
        id: 'string',
        source: 'string (source node ID)',
        target: 'string (target node ID)',
        type: "string ('smoothstep')",
        'data.kind': "string ('relation')",
        'data.label': "string (default: '')",
      },
    },
    settings: 'See doc/data-model.md for full settings schema',
  }
}

// ─── File Imports ───────────────────────────────────────────────────────────

async function showImports(filePath) {
  const abs = resolve(ROOT, filePath)
  const source = await readFileText(abs)
  return {
    file: filePath,
    imports: extractImports(source),
    exports: extractExports(source),
  }
}

// ─── Main ───────────────────────────────────────────────────────────────────

async function main() {
  if (args.includes('--components')) {
    const components = await analyzeComponents()
    console.log(jsonOutput ? JSON.stringify(components, null, 2) : formatComponents(components))
    return
  }

  if (args.includes('--stores')) {
    const stores = await analyzeStores()
    console.log(jsonOutput ? JSON.stringify(stores, null, 2) : formatStores(stores))
    return
  }

  if (args.includes('--utils')) {
    const utils = await analyzeUtils()
    console.log(jsonOutput ? JSON.stringify(utils, null, 2) : formatUtils(utils))
    return
  }

  if (args.includes('--services')) {
    const services = await analyzeServices()
    console.log(jsonOutput ? JSON.stringify(services, null, 2) : formatServices(services))
    return
  }

  if (args.includes('--tree-schema')) {
    const schema = getTreeSchema()
    console.log(jsonOutput ? JSON.stringify(schema, null, 2) : formatTreeSchema(schema))
    return
  }

  if (args.includes('--imports')) {
    const idx = args.indexOf('--imports')
    const file = args[idx + 1]
    if (!file) {
      console.error('Usage: node scripts/project-index.mjs --imports <file>')
      process.exit(1)
    }
    const info = await showImports(file)
    console.log(jsonOutput ? JSON.stringify(info, null, 2) : formatImports(info))
    return
  }

  // Full index
  const [components, stores, utils, services] = await Promise.all([
    analyzeComponents(),
    analyzeStores(),
    analyzeUtils(),
    analyzeServices(),
  ])

  const index = {
    project: 'Mushajjir',
    root: ROOT,
    components,
    stores,
    utils,
    services,
    treeSchema: getTreeSchema(),
  }

  if (jsonOutput) {
    console.log(JSON.stringify(index, null, 2))
  } else {
    console.log(formatFullIndex(index))
  }
}

// ─── Formatters ─────────────────────────────────────────────────────────────

function formatComponents(components) {
  let out = '\nComponents:\n'
  out += '─'.repeat(40) + '\n'
  for (const c of components) {
    out += `\n  ${c.name} (${c.file})\n`
    if (c.props.length) out += `    Props: ${c.props.join(', ')}\n`
    if (c.emits.length) out += `    Emits: ${c.emits.join(', ')}\n`
  }
  return out
}

function formatStores(stores) {
  let out = '\nPinia Stores:\n'
  out += '─'.repeat(40) + '\n'
  for (const s of stores) {
    out += `\n  ${s.store} (${s.file})\n`
    if (s.computedProperties.length) out += `    Computed: ${s.computedProperties.join(', ')}\n`
    if (s.actions.length) out += `    Actions: ${s.actions.join(', ')}\n`
  }
  return out
}

function formatUtils(utils) {
  let out = '\nUtilities:\n'
  out += '─'.repeat(40) + '\n'
  for (const u of utils) {
    out += `\n  ${u.file}\n`
    out += `    Exports: ${u.exports.map((e) => e.name).join(', ')}\n`
  }
  return out
}

function formatServices(services) {
  let out = '\nServices:\n'
  out += '─'.repeat(40) + '\n'
  for (const s of services) {
    out += `\n  ${s.file}\n`
    out += `    Exports: ${s.exports.map((e) => e.name).join(', ')}\n`
  }
  return out
}

function formatTreeSchema(schema) {
  return '\nTree Schema:\n' + '─'.repeat(40) + '\n\n' + JSON.stringify(schema, null, 2) + '\n'
}

function formatImports(info) {
  let out = `\n${info.file}:\n`
  out += '─'.repeat(40) + '\n'
  out += '\n  Exports:\n'
  for (const e of info.exports) {
    out += `    ${e.type}: ${e.name}\n`
  }
  out += '\n  Imports:\n'
  for (const i of info.imports) {
    out += `    ${i.specifier}${i.local ? ' (local)' : ''}\n`
  }
  return out
}

function formatFullIndex(index) {
  let out = ''
  out += '\n╔══════════════════════════════════════════════════╗\n'
  out += '║         Mushajjir Project Index                   ║\n'
  out += '╚══════════════════════════════════════════════════╝\n'
  out += formatComponents(index.components)
  out += formatStores(index.stores)
  out += formatUtils(index.utils)
  out += formatServices(index.services)
  out += formatTreeSchema(index.treeSchema)
  out += '\nTip: Use --json for machine-readable output.\n'
  return out
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
