/**
 * Mushajjir configuration constants.
 *
 * All application-wide configuration values should live here.
 * Import from this directory rather than scattering constants across utility files.
 */

/** Available task status options */
export const TASK_STATUSES = [
  { id: 'todo', label: 'Todo' },
  { id: 'in-progress', label: 'In progress' },
  { id: 'blocked', label: 'Blocked' },
  { id: 'done', label: 'Done' },
]

/** Default set of tags shown in the autocomplete / filter UI */
export const DEFAULT_TAGS = ['backend', 'frontend', 'test', 'urgent', 'ai-generated']

/** Min/max bounds for node dimensions */
export const NODE_SIZE = {
  width: { min: 280, max: 560, default: 320 },
  height: { min: 230, max: 760, default: 250 },
}

/** Max children per parent */
export const MAX_CHILDREN = 12
