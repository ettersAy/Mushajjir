/**
 * AI Response Schema Validator
 *
 * Validates AI divide/reformulate responses against expected schemas.
 * Provides descriptive error messages for malformed responses.
 */

// ─── Schema Descriptions ────────────────────────────────────────────────────

const SCHEMAS = {
  /**
   * Divide task response: JSON array of task objects
   * Expected shape: Array<{ title: string, content?: string, description?: string }>
   */
  divide: {
    name: 'Divide Task Response',
    description: 'a JSON array of task objects',
    expectedShape: '[ { "title": "short title", "content": "short description" }, ... ]',
    validate(items) {
      if (!Array.isArray(items)) {
        return {
          valid: false,
          error: `Expected a JSON array, got ${typeof items}`,
        }
      }

      if (items.length === 0) {
        return {
          valid: false,
          error: 'Array is empty — no child tasks were returned',
        }
      }

      const errors = []
      for (let i = 0; i < items.length; i++) {
        const item = items[i]

        if (item === null || item === undefined) {
          errors.push(`Item ${i}: is null or undefined`)
          continue
        }

        if (typeof item === 'string') {
          // String items are acceptable — they'll be wrapped later
          continue
        }

        if (typeof item !== 'object') {
          errors.push(`Item ${i}: expected an object, got ${typeof item}`)
          continue
        }

        if (!item.title || typeof item.title !== 'string') {
          errors.push(`Item ${i}: missing or invalid "title" (expected non-empty string)`)
        }

        if (item.content !== undefined && typeof item.content !== 'string') {
          errors.push(`Item ${i}: "content" should be a string, got ${typeof item.content}`)
        }
      }

      if (errors.length > 0) {
        return {
          valid: false,
          error: `Schema validation failed:\n  ${errors.join('\n  ')}`,
        }
      }

      return { valid: true, error: null }
    },
  },

  /**
   * Reformulate task response: JSON object with title and content
   * Expected shape: { "title": "improved title", "content": "improved description" }
   */
  reformulate: {
    name: 'Reformulate Task Response',
    description: 'a JSON object with "title" and "content" fields',
    expectedShape: '{ "title": "improved short title", "content": "improved concise task description" }',
    validate(obj) {
      if (!obj || typeof obj !== 'object' || Array.isArray(obj)) {
        return {
          valid: false,
          error: `Expected a JSON object, got ${Array.isArray(obj) ? 'array' : typeof obj}`,
        }
      }

      const errors = []

      if (!obj.title || typeof obj.title !== 'string') {
        errors.push('Missing or invalid "title" (expected non-empty string)')
      }

      if (obj.content !== undefined && typeof obj.content !== 'string') {
        errors.push('"content" should be a string')
      }

      if (errors.length > 0) {
        return {
          valid: false,
          error: `Schema validation failed:\n  ${errors.join('\n  ')}`,
        }
      }

      return { valid: true, error: null }
    },
  },
}

// ─── JSON Extraction ────────────────────────────────────────────────────────

/**
 * Extract a JSON value from AI response text.
 * Tries: direct parse → markdown code block → regex match.
 */
function extractJson(text) {
  const trimmed = text.trim()

  // 1. Direct parse
  try {
    return JSON.parse(trimmed)
  } catch {
    // Continue to fallbacks
  }

  // 2. Markdown code block: ```json ... ``` or ``` ... ```
  const codeBlockMatch = trimmed.match(/```(?:json)?\s*\n?([\s\S]*?)```/)
  if (codeBlockMatch) {
    try {
      return JSON.parse(codeBlockMatch[1].trim())
    } catch {
      // Continue to regex fallback
    }
  }

  // 3. Extract first array or object with regex
  const arrayMatch = trimmed.match(/\[[\s\S]*?\]/)
  if (arrayMatch) {
    try {
      return JSON.parse(arrayMatch[0])
    } catch {
      // Continue
    }
  }

  const objectMatch = trimmed.match(/\{[\s\S]*?\}/)
  if (objectMatch) {
    try {
      return JSON.parse(objectMatch[0])
    } catch {
      // Continue
    }
  }

  throw new Error(describeParseError(text))
}

/**
 * Generate a helpful error message when JSON parsing fails.
 */
function describeParseError(text) {
  const preview = text.slice(0, 200).replace(/\n/g, '\\n')
  return [
    `Failed to parse AI response as JSON.`,
    `First 200 characters: "${preview}"`,
    `Total length: ${text.length} chars`,
    `The AI response did not contain valid JSON. Check that the provider is returning the expected format.`,
  ].join('\n')
}

// ─── Public API ─────────────────────────────────────────────────────────────

/**
 * Validate an AI divide task response.
 *
 * @param {string} text - Raw AI response text
 * @returns {{ valid: boolean, data: object[], error: string|null }}
 */
export function validateDivideResponse(text) {
  let parsed
  try {
    parsed = extractJson(text)
  } catch (err) {
    return { valid: false, data: null, error: err.message }
  }

  const schema = SCHEMAS.divide
  const result = schema.validate(parsed)

  if (!result.valid) {
    return {
      valid: false,
      data: null,
      error: [`Invalid ${schema.name}.`, `Expected: ${schema.expectedShape}`, ``, result.error].join('\n'),
    }
  }

  // Normalize items
  const data = parsed.map((item, index) => {
    if (typeof item === 'string') {
      return { title: item, content: '' }
    }
    return {
      title: item.title || `AI task ${index + 1}`,
      content: item.content || item.description || '',
    }
  })

  return { valid: true, data, error: null }
}

/**
 * Validate an AI reformulate task response.
 *
 * @param {string} text - Raw AI response text
 * @returns {{ valid: boolean, data: object|null, error: string|null }}
 */
export function validateReformulateResponse(text) {
  let parsed
  try {
    parsed = extractJson(text)
  } catch (err) {
    return { valid: false, data: null, error: err.message }
  }

  const schema = SCHEMAS.reformulate
  const result = schema.validate(parsed)

  if (!result.valid) {
    return {
      valid: false,
      data: null,
      error: [`Invalid ${schema.name}.`, `Expected: ${schema.expectedShape}`, ``, result.error].join('\n'),
    }
  }

  return {
    valid: true,
    data: {
      title: parsed.title,
      content: parsed.content || '',
    },
    error: null,
  }
}

// ─── Retry Logic ────────────────────────────────────────────────────────────

/**
 * Maximum number of retry attempts for AI calls.
 */
const MAX_RETRIES = 2

/**
 * Call an AI function with retry logic.
 * Retries on validation errors (schema mismatch) and network errors.
 *
 * @param {Function} aiFn - Async function to call (returns text content)
 * @param {Function} validateFn - Validation function (text → { valid, data, error })
 * @param {object} options
 * @param {number}  [options.maxRetries=2]
 * @param {boolean} [options.retryOnNetworkError=true]
 * @returns {Promise<{ data: any, error: string|null, attempts: number }>}
 */
export async function withRetry(aiFn, validateFn, { maxRetries = MAX_RETRIES, retryOnNetworkError = true } = {}) {
  let lastError = null
  let lastText = null

  for (let attempt = 1; attempt <= maxRetries + 1; attempt++) {
    try {
      const text = await aiFn()
      lastText = text

      const result = validateFn(text)
      if (result.valid) {
        return { data: result.data, error: null, attempts: attempt }
      }

      lastError = result.error

      // Retry on validation failure if we have attempts left
      if (attempt <= maxRetries) {
        continue
      }
    } catch (err) {
      lastError = err.message

      // Retry on network errors if configured
      if (retryOnNetworkError && attempt <= maxRetries) {
        continue
      }

      // Don't retry on non-retryable errors
      break
    }
  }

  return {
    data: null,
    error: [
      `AI response validation failed after ${maxRetries + 1} attempt(s).`,
      ``,
      `Last error: ${lastError}`,
      lastText ? `\nLast raw response (first 300 chars):\n${lastText.slice(0, 300)}` : '',
      ``,
      `Suggestions:`,
      `  • Verify the AI provider is returning the correct format`,
      `  • Try a different provider or model`,
      `  • Check that the system prompt is clear about JSON output`,
    ].join('\n'),
    attempts: maxRetries + 1,
  }
}
