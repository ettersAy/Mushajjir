const STORAGE_KEY = 'mushajjir-tree-v1'

export function loadTree() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : null
  } catch (error) {
    console.warn('Could not load tree:', error)
    return null
  }
}

export function saveTree(payload) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(payload))
}

export function clearTree() {
  localStorage.removeItem(STORAGE_KEY)
}
