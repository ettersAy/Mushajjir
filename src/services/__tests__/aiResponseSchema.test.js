import { describe, it, expect } from 'vitest'
import { validateDivideResponse, validateReformulateResponse, withRetry } from '../aiResponseSchema.js'

describe('validateDivideResponse', () => {
  it('accepts a valid JSON array of objects', () => {
    const result = validateDivideResponse('[{"title":"Task 1","content":"Do something"},{"title":"Task 2"}]')
    expect(result.valid).toBe(true)
    expect(result.data).toHaveLength(2)
    expect(result.data[0].title).toBe('Task 1')
    expect(result.data[0].content).toBe('Do something')
    expect(result.data[1].title).toBe('Task 2')
    expect(result.data[1].content).toBe('')
  })

  it('accepts a JSON array with string items (wraps them)', () => {
    const result = validateDivideResponse('["Implement auth","Build UI"]')
    expect(result.valid).toBe(true)
    expect(result.data).toHaveLength(2)
    expect(result.data[0].title).toBe('Implement auth')
    expect(result.data[0].content).toBe('')
  })

  it('extracts JSON from markdown code blocks', () => {
    const result = validateDivideResponse('```json\n[{"title":"Task 1","content":"desc"}]\n```')
    expect(result.valid).toBe(true)
    expect(result.data).toHaveLength(1)
    expect(result.data[0].title).toBe('Task 1')
  })

  it('extracts JSON from backtick code blocks without language', () => {
    const result = validateDivideResponse('```\n[{"title":"Task 1"}]\n```')
    expect(result.valid).toBe(true)
    expect(result.data).toHaveLength(1)
    expect(result.data[0].title).toBe('Task 1')
  })

  it('rejects an empty array', () => {
    const result = validateDivideResponse('[]')
    expect(result.valid).toBe(false)
    expect(result.error).toContain('empty')
  })

  it('rejects a plain object instead of array', () => {
    const result = validateDivideResponse('{"title":"Not an array"}')
    expect(result.valid).toBe(false)
    expect(result.error).toContain('array')
  })

  it('rejects non-JSON text', () => {
    const result = validateDivideResponse('Here are the tasks: ...')
    expect(result.valid).toBe(false)
    expect(result.error).toContain('Failed to parse')
  })

  it('rejects items with missing title', () => {
    const result = validateDivideResponse('[{"content":"missing title"}]')
    expect(result.valid).toBe(false)
    expect(result.error).toContain('title')
  })

  it('handles description field as content fallback', () => {
    const result = validateDivideResponse('[{"title":"Task","description":"desc text"}]')
    expect(result.valid).toBe(true)
    expect(result.data[0].content).toBe('desc text')
  })

  it('limits result to 5 items', () => {
    const items = Array.from({ length: 10 }, (_, i) => ({ title: `Task ${i}`, content: '' }))
    const result = validateDivideResponse(JSON.stringify(items))
    expect(result.valid).toBe(true)
    // The validation passes all items; the caller (divideTask) slices to 5
    expect(result.data).toHaveLength(10)
  })

  it('rejects array with null items', () => {
    const result = validateDivideResponse('[42, "string", null]')
    expect(result.valid).toBe(false)
    expect(result.error).toContain('null')
  })
})

describe('validateReformulateResponse', () => {
  it('accepts a valid JSON object with title and content', () => {
    const result = validateReformulateResponse('{"title":"Improved task","content":"Better description"}')
    expect(result.valid).toBe(true)
    expect(result.data.title).toBe('Improved task')
    expect(result.data.content).toBe('Better description')
  })

  it('accepts object with just title (content defaults to empty)', () => {
    const result = validateReformulateResponse('{"title":"Just a title"}')
    expect(result.valid).toBe(true)
    expect(result.data.title).toBe('Just a title')
    expect(result.data.content).toBe('')
  })

  it('extracts from markdown code blocks', () => {
    const result = validateReformulateResponse('```json\n{"title":"Fixed","content":"Done"}\n```')
    expect(result.valid).toBe(true)
    expect(result.data.title).toBe('Fixed')
  })

  it('rejects an array instead of object', () => {
    const result = validateReformulateResponse('["item1","item2"]')
    expect(result.valid).toBe(false)
    expect(result.error).toContain('object')
  })

  it('rejects missing title', () => {
    const result = validateReformulateResponse('{"content":"no title"}')
    expect(result.valid).toBe(false)
    expect(result.error).toContain('title')
  })

  it('rejects non-JSON text', () => {
    const result = validateReformulateResponse('Here is the reformulated task...')
    expect(result.valid).toBe(false)
    expect(result.error).toContain('Failed to parse')
  })

  it('extracts JSON from text with surrounding content', () => {
    const result = validateReformulateResponse(
      'Here is the improved task:\n{"title":"Better","content":"Improved description"}',
    )
    expect(result.valid).toBe(true)
    expect(result.data.title).toBe('Better')
  })
})

describe('withRetry', () => {
  it('returns result on first successful attempt', async () => {
    const aiFn = async () => '{"title":"Task","content":"desc"}'
    const validateFn = (text) => {
      const parsed = JSON.parse(text)
      return parsed.title ? { valid: true, data: parsed, error: null } : { valid: false, data: null, error: 'bad' }
    }
    const result = await withRetry(aiFn, validateFn, { maxRetries: 2 })
    expect(result.data.title).toBe('Task')
    expect(result.attempts).toBe(1)
    expect(result.error).toBeNull()
  })

  it('retries on validation failure', async () => {
    let callCount = 0
    const aiFn = async () => {
      callCount++
      if (callCount < 2) return '{"invalid": true}' // invalid (no title)
      return '{"title":"Task","content":"desc"}' // valid on second try
    }
    const validateFn = (text) => {
      const parsed = JSON.parse(text)
      return parsed.title
        ? { valid: true, data: parsed, error: null }
        : { valid: false, data: null, error: 'Missing title' }
    }
    const result = await withRetry(aiFn, validateFn, { maxRetries: 2 })
    expect(result.data.title).toBe('Task')
    expect(result.attempts).toBe(2)
  })

  it('fails after exhausting retries', async () => {
    const aiFn = async () => '{"invalid": true}'
    const validateFn = () => ({ valid: false, data: null, error: 'Always invalid' })

    const result = await withRetry(aiFn, validateFn, { maxRetries: 1 })
    expect(result.data).toBeNull()
    expect(result.error).toContain('failed')
    expect(result.error).toContain('Always invalid')
  })

  it('retries on network errors', async () => {
    let callCount = 0
    const aiFn = async () => {
      callCount++
      if (callCount === 1) throw new Error('Network error')
      return '{"title":"Task","content":"desc"}'
    }
    const validateFn = (text) => {
      const parsed = JSON.parse(text)
      return { valid: true, data: parsed, error: null }
    }
    const result = await withRetry(aiFn, validateFn, { maxRetries: 2 })
    expect(result.data.title).toBe('Task')
    expect(result.attempts).toBe(2)
  })

  it('provides last raw response in error when max retries exceeded', async () => {
    const aiFn = async () => 'garbage response'
    const validateFn = () => ({ valid: false, data: null, error: 'Invalid format' })

    const result = await withRetry(aiFn, validateFn, { maxRetries: 0 })
    expect(result.data).toBeNull()
    expect(result.error).toContain('garbage response')
  })
})
