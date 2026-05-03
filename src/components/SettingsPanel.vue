<template>
  <div class="overlay" @click.self="$emit('close')">
    <section class="panel">
      <header class="panel-header">
        <div>
          <h2>Settings</h2>
          <p>Local browser settings for Mushajjir.</p>
        </div>
        <button class="icon" @click="$emit('close')">×</button>
      </header>

      <div class="content">
        <aside class="tabs">
          <button :class="{ active: tab === 'general' }" @click="tab = 'general'">General</button>
          <button :class="{ active: tab === 'save' }" @click="tab = 'save'">Save</button>
          <button :class="{ active: tab === 'api' }" @click="tab = 'api'">API Keys</button>
          <button :class="{ active: tab === 'prompts' }" @click="tab = 'prompts'">Prompts</button>
        </aside>

        <main class="section">
          <div v-if="tab === 'general'" class="form-grid">
            <label>
              App name
              <input
                :value="settings.settings.general.appName"
                @input="settings.updateGeneral({ appName: $event.target.value })"
              />
            </label>
            <label>
              Default children
              <input
                type="number"
                min="1"
                max="12"
                :value="settings.settings.general.defaultChildCount"
                @input="settings.updateGeneral({ defaultChildCount: Number($event.target.value) })"
              />
            </label>
            <label>
              Theme
              <select
                :value="settings.settings.general.theme"
                @change="settings.updateGeneral({ theme: $event.target.value })"
              >
                <option value="light">Light</option>
                <option value="dark">Dark</option>
              </select>
            </label>
          </div>

          <div v-if="tab === 'save'" class="form-grid">
            <label>
              Folder path note
              <input
                :value="settings.settings.save.folderPath"
                placeholder="Example: ~/Documents/mushajjir"
                @input="settings.updateSave({ folderPath: $event.target.value })"
              />
            </label>
            <label>
              Preferred export format
              <select
                :value="settings.settings.save.format"
                @change="settings.updateSave({ format: $event.target.value })"
              >
                <option value="md">Markdown</option>
                <option value="txt">Text</option>
                <option value="json">JSON</option>
              </select>
            </label>
            <p class="hint">
              Browser apps cannot write directly to a local folder without a backend or file picker permission. This is
              saved as your preferred destination note for now.
            </p>
          </div>

          <div v-if="tab === 'api'" class="api-section">
            <label>
              Active provider
              <select
                :value="settings.settings.ai.selectedProviderId"
                @change="settings.selectProvider($event.target.value)"
              >
                <option v-for="provider in settings.settings.ai.providers" :key="provider.id" :value="provider.id">
                  {{ provider.name }} — {{ provider.model || 'no model' }}
                </option>
              </select>
            </label>

            <div v-for="provider in settings.settings.ai.providers" :key="provider.id" class="provider-card">
              <div class="provider-head">
                <strong>{{ provider.name }}</strong>
                <button class="small danger" @click="settings.removeProvider(provider.id)">Remove</button>
              </div>
              <label>
                Name
                <input
                  :value="provider.name"
                  @input="settings.updateProvider(provider.id, { name: $event.target.value })"
                />
              </label>
              <label>
                API key
                <input
                  type="password"
                  :value="provider.apiKey"
                  placeholder="sk-..."
                  @input="settings.updateProvider(provider.id, { apiKey: $event.target.value })"
                />
              </label>
              <label>
                API URL
                <input
                  :value="provider.baseUrl"
                  @input="settings.updateProvider(provider.id, { baseUrl: $event.target.value })"
                />
              </label>
              <label>
                Model
                <input
                  :value="provider.model"
                  @input="settings.updateProvider(provider.id, { model: $event.target.value })"
                />
              </label>
            </div>

            <button class="add" @click="settings.addProvider">+ Add custom provider</button>
            <p class="hint">
              Keys are stored only in this browser localStorage. This is fine for local personal use, but not for a
              public hosted app.
            </p>
          </div>

          <div v-if="tab === 'prompts'" class="api-section">
            <label>
              Active divide prompt
              <select
                :value="settings.settings.prompts.selectedDividePromptId"
                @change="settings.selectDividePrompt($event.target.value)"
              >
                <option v-for="prompt in settings.settings.prompts.dividePrompts" :key="prompt.id" :value="prompt.id">
                  {{ prompt.name }}
                </option>
              </select>
            </label>

            <div v-for="prompt in settings.settings.prompts.dividePrompts" :key="prompt.id" class="provider-card">
              <div class="provider-head">
                <strong>{{ prompt.name }}</strong>
                <button class="small danger" @click="settings.removeDividePrompt(prompt.id)">Remove</button>
              </div>
              <label>
                Name
                <input
                  :value="prompt.name"
                  @input="settings.updateDividePrompt(prompt.id, { name: $event.target.value })"
                />
              </label>
              <label>
                System prompt
                <textarea
                  class="prompt-textarea"
                  rows="6"
                  :value="prompt.content"
                  @input="settings.updateDividePrompt(prompt.id, { content: $event.target.value })"
                />
              </label>
            </div>

            <button class="add" @click="settings.addDividePrompt">+ Add custom prompt</button>
            <p class="hint">
              The active prompt is used when the AI divides a task into child tasks. Customize prompts to match your
              domain and preferred task-splitting logic.
            </p>
          </div>
        </main>
      </div>
    </section>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useSettingsStore } from '../stores/settingsStore.js'

defineEmits(['close'])

const tab = ref('general')
const settings = useSettingsStore()
</script>

<style scoped>
.overlay {
  position: fixed;
  inset: 0;
  z-index: 50;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 18px;
  background: rgba(0, 0, 0, 0.38);
}
.panel {
  width: min(940px, 100%);
  max-height: 88vh;
  overflow: hidden;
  border: 1px solid var(--panel-border);
  border-radius: 8px;
  background: var(--surface);
  box-shadow: var(--shadow-strong);
}
.panel-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 18px 20px;
  border-bottom: 1px solid var(--panel-border);
}
h2 {
  margin: 0;
}
p {
  margin: 4px 0 0;
  color: var(--muted);
}
.icon {
  width: 38px;
  height: 38px;
  border: 0;
  border-radius: 7px;
  background: var(--button);
  color: var(--button-text);
  font-size: 24px;
  cursor: pointer;
}
.content {
  display: grid;
  grid-template-columns: 180px 1fr;
  min-height: 520px;
}
.tabs {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 16px;
  border-right: 1px solid var(--panel-border);
}
.tabs button,
.add,
.small {
  border: 0;
  border-radius: 7px;
  padding: 10px 12px;
  background: var(--button-secondary);
  color: white;
  cursor: pointer;
  font-weight: 800;
  text-align: left;
}
.tabs button.active,
.add {
  background: var(--button);
  color: var(--button-text);
}
.section {
  overflow: auto;
  padding: 18px;
}
.form-grid,
.api-section {
  display: grid;
  gap: 14px;
}
label {
  display: grid;
  gap: 6px;
  font-size: 13px;
  font-weight: 800;
}
input,
select {
  width: 100%;
  border: 0;
  border-radius: 7px;
  padding: 10px 11px;
  background: var(--field);
  color: var(--text);
}
.provider-card {
  display: grid;
  gap: 10px;
  padding: 14px;
  border: 1px solid var(--panel-border);
  border-radius: 8px;
  background: var(--preview);
}
.provider-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}
.small {
  padding: 7px 9px;
  font-size: 12px;
}
.danger {
  background: var(--danger);
}
.hint {
  padding: 10px 12px;
  border-radius: 7px;
  background: var(--field);
  font-size: 13px;
}
.prompt-textarea {
  width: 100%;
  min-height: 100px;
  border: 0;
  border-radius: 7px;
  padding: 10px 11px;
  background: var(--field);
  color: var(--text);
  font-family: inherit;
  font-size: 13px;
  resize: vertical;
  line-height: 1.5;
}
@media (max-width: 760px) {
  .content {
    grid-template-columns: 1fr;
  }
  .tabs {
    flex-direction: row;
    border-right: 0;
    border-bottom: 1px solid var(--panel-border);
    overflow-x: auto;
  }
}
</style>
