import { describe, it, expect } from 'vitest'
import { renderMarkdown } from '../markdown.js'

describe('renderMarkdown', () => {
  it('returns empty string for empty input', () => {
    expect(renderMarkdown('')).toBe('')
  })

  it('handles null/undefined input', () => {
    // Default parameter kicks in for undefined → '', for null → String(null) = 'null'
    expect(renderMarkdown(null)).toBe('<p>null</p>')
    expect(renderMarkdown(undefined)).toBe('')
  })

  it('renders plain text as paragraph', () => {
    const result = renderMarkdown('Hello world')
    expect(result).toBe('<p>Hello world</p>')
  })

  it('renders h1, h2, h3', () => {
    const result = renderMarkdown('# Title\n## Section\n### Subsection')
    expect(result).toContain('<h2>Title</h2>')
    expect(result).toContain('<h3>Section</h3>')
    expect(result).toContain('<h4>Subsection</h4>')
  })

  it('renders bullet list', () => {
    const result = renderMarkdown('- Item 1\n- Item 2')
    expect(result).toContain('<ul>')
    expect(result).toContain('<li>Item 1</li>')
    expect(result).toContain('<li>Item 2</li>')
    expect(result).toContain('</ul>')
  })

  it('closes list on blank line', () => {
    const result = renderMarkdown('- Item 1\n- Item 2\n\nAfter list')
    expect(result).toContain('</ul>')
    expect(result).toContain('<p>After list</p>')
  })

  it('escapes HTML entities', () => {
    const result = renderMarkdown('<script>alert("xss")</script>')
    expect(result).not.toContain('<script>')
    expect(result).toContain('&lt;script&gt;')
  })

  it('renders bold text', () => {
    const result = renderMarkdown('This is **bold** text')
    expect(result).toContain('<strong>bold</strong>')
  })

  it('renders inline code', () => {
    const result = renderMarkdown('Use `npm test` to run')
    expect(result).toContain('<code>npm test</code>')
  })

  it('renders links', () => {
    const result = renderMarkdown('[GitHub](https://github.com)')
    expect(result).toContain('<a href="https://github.com"')
    expect(result).toContain('>GitHub</a>')
  })

  it('renders links with target and rel attributes', () => {
    const result = renderMarkdown('[Link](https://example.com)')
    expect(result).toContain('target="_blank"')
    expect(result).toContain('rel="noreferrer"')
  })

  it('ignores non-http links', () => {
    const result = renderMarkdown('[local](local/path)')
    expect(result).not.toContain('<a href')
  })

  it('handles mixed content', () => {
    const result = renderMarkdown('# Title\n\nText with **bold** and `code`\n\n- Item 1\n- Item 2')
    expect(result).toContain('<h2>Title</h2>')
    expect(result).toContain('<strong>bold</strong>')
    expect(result).toContain('<code>code</code>')
    expect(result).toContain('<li>Item 1</li>')
  })

  it('handles multiple blank lines', () => {
    const result = renderMarkdown('Para 1\n\n\nPara 2')
    expect(result).toBe('<p>Para 1</p><p>Para 2</p>')
  })
})
