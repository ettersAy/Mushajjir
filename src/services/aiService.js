import { validateDivideResponse, validateReformulateResponse, withRetry } from './aiResponseSchema.js'

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

/**
 * Divide a task into subtasks using AI.
 * Includes retry logic with schema validation.
 */
export async function divideTask({ provider, node, ancestors, count, systemPrompt }) {
  const countInstruction =
    count != null
      ? `Divide this task into exactly ${count} focused child tasks.`
      : 'Divide this task into a reasonable number of child tasks (between 1 and 12) based on the complexity of the work. Decide the count yourself.'

  const aiFn = () =>
    callChatCompletion({
      provider,
      messages: [
        {
          role: 'system',
          content:
            systemPrompt ||
            'You are a senior software architect. Break software work into clear implementation tasks for Laravel, Vue, tests, services, controllers, models, or functions. Return JSON only.',
        },
        {
          role: 'user',
          content: `Ancestor context:\n${buildContextLine(ancestors)}\n\nCurrent task title: ${node.data.title}\nCurrent task content: ${node.data.content || ''}\n\n${countInstruction}\nReturn a JSON array only. Each item must be an object with this shape: {"title":"short title","content":"short implementation expectation"}.`,
        },
      ],
    })

  const result = await withRetry(aiFn, validateDivideResponse)

  if (!result.data) {
    throw new Error(result.error || 'Failed to divide task via AI')
  }

  return result.data.slice(0, 5)
}

/**
 * Reformulate a task's title and content using AI.
 * Includes retry logic with schema validation.
 */
export async function reformulateTask({ provider, node, ancestors }) {
  const aiFn = () =>
    callChatCompletion({
      provider,
      messages: [
        {
          role: 'system',
          content:
            'You improve task specs for AI coding agents. Keep the result concise, concrete, and implementation-focused.',
        },
        {
          role: 'user',
          content: `Ancestor context:\n${buildContextLine(ancestors)}\n\nCurrent title: ${node.data.title}\nCurrent content: ${node.data.content || ''}\n\nReformulate this task. Return only this exact JSON object shape: {"title":"improved short title","content":"improved concise task description"}.`,
        },
      ],
    })

  const result = await withRetry(aiFn, validateReformulateResponse)

  if (!result.data) {
    throw new Error(result.error || 'Failed to reformulate task via AI')
  }

  return result.data
}
