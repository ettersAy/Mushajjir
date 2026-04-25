const SETTINGS_KEY = 'mushajjir-settings-v1'

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
  }
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
