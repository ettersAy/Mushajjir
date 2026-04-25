function extractJsonArray(text) {
  const trimmed = text.trim()
  if (trimmed.startsWith('[')) return JSON.parse(trimmed)

  const match = trimmed.match(/\[[\s\S]*\]/)
  if (!match) throw new Error('AI response did not contain a JSON array')
  return JSON.parse(match[0])
}

function buildContextLine(ancestors) {
  if (!ancestors.length) return 'No ancestor context.'
  return ancestors.map((item, index) => `${index + 1}. ${item.title}: ${item.content || ''}`).join('\n')
}

async function callChatCompletion({ provider, messages, temperature = 0.35 }) {
  if (!provider?.apiKey) throw new Error(`Missing API key for ${provider?.name || 'selected provider'}`)
  if (!provider?.baseUrl) throw new Error('Missing API URL for selected provider')
  if (!provider?.model) throw new Error('Missing model for selected provider')

  const response = await fetch(provider.baseUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${provider.apiKey}`,
      'HTTP-Referer': window.location.origin,
      'X-Title': 'Mushajjir',
    },
    body: JSON.stringify({
      model: provider.model,
      messages,
      temperature,
    }),
  })

  if (!response.ok) {
    const details = await response.text().catch(() => '')
    throw new Error(`AI request failed (${response.status}). ${details.slice(0, 300)}`)
  }

  const payload = await response.json()
  const content = payload?.choices?.[0]?.message?.content
  if (!content) throw new Error('AI response was empty')
  return content.trim()
}

export async function divideTask({ provider, node, ancestors, count }) {
  const content = await callChatCompletion({
    provider,
    messages: [
      {
        role: 'system',
        content: 'You are a senior software architect. Break software work into clear implementation tasks for Laravel, Vue, tests, services, controllers, models, or functions. Return JSON only.',
      },
      {
        role: 'user',
        content: `Ancestor context:\n${buildContextLine(ancestors)}\n\nCurrent task title: ${node.data.title}\nCurrent task content: ${node.data.content || ''}\n\nDivide this task into ${count} focused child tasks. Return a JSON array only. Each item must be an object with this shape: {"title":"short title","content":"short implementation expectation"}.`,
      },
    ],
  })

  const parsed = extractJsonArray(content)
  return parsed.slice(0, 5).map((item, index) => {
    if (typeof item === 'string') return { title: item, content: '' }
    return {
      title: item.title || `AI task ${index + 1}`,
      content: item.content || item.description || '',
    }
  })
}

export async function reformulateTask({ provider, node, ancestors }) {
  return callChatCompletion({
    provider,
    messages: [
      {
        role: 'system',
        content: 'You improve task specs for AI coding agents. Keep the result concise, concrete, and implementation-focused.',
      },
      {
        role: 'user',
        content: `Ancestor context:\n${buildContextLine(ancestors)}\n\nCurrent title: ${node.data.title}\nCurrent content: ${node.data.content || ''}\n\nReformulate this task. Return only this exact JSON object shape: {"title":"improved short title","content":"improved concise task description"}.`,
      },
    ],
  }).then((content) => {
    const match = content.match(/\{[\s\S]*\}/)
    if (!match) throw new Error('AI response did not contain a JSON object')
    const parsed = JSON.parse(match[0])
    return {
      title: parsed.title || node.data.title,
      content: parsed.content || node.data.content || '',
    }
  })
}
