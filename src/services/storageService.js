import { normalizeTree } from '../utils/treeUtils.js'

const STORAGE_KEY = 'mushajjir-tree-v2'
const LEGACY_STORAGE_KEY = 'mushajjir-tree-v1'
const SCHEMA_VERSION = 2
const SAVE_DEBOUNCE_MS = 250

let saveTimer = null

function storage() {
  return typeof localStorage === 'undefined' ? null : localStorage
}

export function loadTree() {
  try {
    const local = storage()
    if (!local) return null

    const raw = local.getItem(STORAGE_KEY) || local.getItem(LEGACY_STORAGE_KEY)
    if (!raw) return null

    const parsed = JSON.parse(raw)
    const tree = parsed?.schemaVersion ? parsed.tree : parsed
    return normalizeTree(tree)
  } catch (error) {
    console.warn('Could not load tree:', error)
    return null
  }
}

export function saveTreeNow(payload) {
  const local = storage()
  if (!local) return

  const normalized = normalizeTree(payload)
  local.setItem(
    STORAGE_KEY,
    JSON.stringify({
      schemaVersion: SCHEMA_VERSION,
      savedAt: new Date().toISOString(),
      tree: normalized,
    }),
  )
}

export function saveTree(payload) {
  globalThis.clearTimeout(saveTimer)
  saveTimer = globalThis.setTimeout(() => saveTreeNow(payload), SAVE_DEBOUNCE_MS)
}

export function clearTree() {
  const local = storage()
  globalThis.clearTimeout(saveTimer)
  if (!local) return
  local.removeItem(STORAGE_KEY)
  local.removeItem(LEGACY_STORAGE_KEY)
}
