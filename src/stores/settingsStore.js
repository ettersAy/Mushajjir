import { defineStore } from 'pinia'
import { computed, ref, watch } from 'vue'
import { loadSettings, saveSettings } from '../services/settingsService'

function makeProviderId(name) {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') || `provider-${Date.now()}`
}

export const useSettingsStore = defineStore('settings', () => {
  const settings = ref(loadSettings())

  watch(settings, () => saveSettings(settings.value), { deep: true })

  const selectedProvider = computed(() => (
    settings.value.ai.providers.find((provider) => provider.id === settings.value.ai.selectedProviderId)
    || settings.value.ai.providers[0]
  ))

  function updateGeneral(patch) {
    settings.value.general = { ...settings.value.general, ...patch }
  }

  function updateSave(patch) {
    settings.value.save = { ...settings.value.save, ...patch }
  }

  function toggleTheme() {
    settings.value.general.theme = settings.value.general.theme === 'dark' ? 'light' : 'dark'
  }

  function selectProvider(id) {
    settings.value.ai.selectedProviderId = id
  }

  function updateProvider(id, patch) {
    settings.value.ai.providers = settings.value.ai.providers.map((provider) => (
      provider.id === id ? { ...provider, ...patch } : provider
    ))
  }

  function addProvider() {
    const id = makeProviderId(`Custom ${settings.value.ai.providers.length + 1}`)
    settings.value.ai.providers.push({
      id,
      name: 'Custom Provider',
      baseUrl: '',
      model: '',
      apiKey: '',
    })
    settings.value.ai.selectedProviderId = id
  }

  function removeProvider(id) {
    if (settings.value.ai.providers.length <= 1) return
    settings.value.ai.providers = settings.value.ai.providers.filter((provider) => provider.id !== id)
    if (settings.value.ai.selectedProviderId === id) {
      settings.value.ai.selectedProviderId = settings.value.ai.providers[0].id
    }
  }

  return {
    settings,
    selectedProvider,
    updateGeneral,
    updateSave,
    toggleTheme,
    selectProvider,
    updateProvider,
    addProvider,
    removeProvider,
  }
})
