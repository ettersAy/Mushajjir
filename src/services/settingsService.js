const SETTINGS_KEY = 'mushajjir-settings-v1'

export const DEFAULT_DIVIDE_PROMPTS = [
  {
    id: 'coding-default',
    name: 'Coding — Default',
    content:
      'You are a senior software architect. Break software work into clear implementation tasks for Laravel, Vue, tests, services, controllers, models, or functions. Return JSON only.',
  },
  {
    id: 'coding-detailed',
    name: 'Coding — Detailed specs',
    content:
      'You are a senior software architect. Break the software work into detailed atomic implementation tasks. Each task must include specific file names, method signatures, and test expectations when relevant. Target Laravel + Vue + Inertia stack. Return JSON only.',
  },
  {
    id: 'coding-tdd',
    name: 'Coding — TDD first',
    content:
      'You are a senior software architect following Test-Driven Development. Break the work into tasks where tests are defined first (red), then implementation (green), then refactoring. Return JSON only.',
  },
  {
    id: 'coding-micro',
    name: 'Coding — Micro tasks',
    content:
      'You are a senior software architect. Break the work into very small, granular tasks suitable for LLM coding agents with limited context. Each task should be completable in a single code edit session (under 50 lines of code). Prefer more, smaller tasks over fewer larger ones. Return JSON only.',
  },
]

export const DEFAULT_PROVIDERS = [
  {
    id: 'openrouter',
    name: 'OpenRouter',
    baseUrl: 'https://openrouter.ai/api/v1/chat/completions',
    model: 'deepseek/deepseek-chat-v3-0324:free',
    apiKey: '',
  },
  {
    id: 'deepseek',
    name: 'DeepSeek',
    baseUrl: 'https://api.deepseek.com/chat/completions',
    model: 'deepseek-chat',
    apiKey: '',
  },
  {
    id: 'grok',
    name: 'Grok / xAI',
    baseUrl: 'https://api.x.ai/v1/chat/completions',
    model: 'grok-3-mini',
    apiKey: '',
  },
]

export const DEFAULT_SETTINGS = {
  general: {
    appName: 'Mushajjir',
    defaultChildCount: 4,
    theme: 'light',
  },
  save: {
    folderPath: '',
    format: 'md',
  },
  ai: {
    selectedProviderId: 'openrouter',
    providers: DEFAULT_PROVIDERS,
  },
  prompts: {
    selectedDividePromptId: 'coding-default',
    dividePrompts: DEFAULT_DIVIDE_PROMPTS,
  },
}

function mergeSettings(saved) {
  if (!saved) return structuredClone(DEFAULT_SETTINGS)

  const savedProviders = saved.ai?.providers || []
  const providers = DEFAULT_PROVIDERS.map((provider) => ({
    ...provider,
    ...(savedProviders.find((item) => item.id === provider.id) || {}),
  }))

  const customProviders = savedProviders.filter(
    (provider) => !DEFAULT_PROVIDERS.some((item) => item.id === provider.id),
  )

  return {
    general: { ...DEFAULT_SETTINGS.general, ...(saved.general || {}) },
    save: { ...DEFAULT_SETTINGS.save, ...(saved.save || {}) },
    ai: {
      selectedProviderId: saved.ai?.selectedProviderId || DEFAULT_SETTINGS.ai.selectedProviderId,
      providers: [...providers, ...customProviders],
    },
    prompts: {
      selectedDividePromptId: saved.prompts?.selectedDividePromptId || DEFAULT_SETTINGS.prompts.selectedDividePromptId,
      dividePrompts: mergeDividePrompts(saved.prompts?.dividePrompts),
    },
  }
}

function mergeDividePrompts(savedPrompts) {
  if (!Array.isArray(savedPrompts) || !savedPrompts.length) return structuredClone(DEFAULT_DIVIDE_PROMPTS)

  const defaults = DEFAULT_DIVIDE_PROMPTS.map((prompt) => ({
    ...prompt,
    ...(savedPrompts.find((item) => item.id === prompt.id) || {}),
  }))

  const customPrompts = savedPrompts.filter((prompt) => !DEFAULT_DIVIDE_PROMPTS.some((item) => item.id === prompt.id))

  return [...defaults, ...customPrompts]
}

export function loadSettings() {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY)
    return mergeSettings(raw ? JSON.parse(raw) : null)
  } catch (error) {
    console.warn('Could not load settings:', error)
    return structuredClone(DEFAULT_SETTINGS)
  }
}

export function saveSettings(settings) {
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings))
}
