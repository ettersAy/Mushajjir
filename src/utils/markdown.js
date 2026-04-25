function escapeHtml(value) {
  return String(value || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
}

function renderInline(value) {
  return escapeHtml(value)
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
    .replace(/`([^`]+)`/g, '<code>$1</code>')
    .replace(/\[([^\]]+)\]\((https?:\/\/[^)\s]+)\)/g, '<a href="$2" target="_blank" rel="noreferrer">$1</a>')
}

export function renderMarkdown(markdown = '') {
  const lines = String(markdown).split('\n')
  const html = []
  let listOpen = false

  function closeList() {
    if (!listOpen) return
    html.push('</ul>')
    listOpen = false
  }

  for (const line of lines) {
    const trimmed = line.trim()

    if (!trimmed) {
      closeList()
      continue
    }

    if (trimmed.startsWith('### ')) {
      closeList()
      html.push(`<h4>${renderInline(trimmed.slice(4))}</h4>`)
      continue
    }

    if (trimmed.startsWith('## ')) {
      closeList()
      html.push(`<h3>${renderInline(trimmed.slice(3))}</h3>`)
      continue
    }

    if (trimmed.startsWith('# ')) {
      closeList()
      html.push(`<h2>${renderInline(trimmed.slice(2))}</h2>`)
      continue
    }

    if (trimmed.startsWith('- ')) {
      if (!listOpen) {
        html.push('<ul>')
        listOpen = true
      }
      html.push(`<li>${renderInline(trimmed.slice(2))}</li>`)
      continue
    }

    closeList()
    html.push(`<p>${renderInline(trimmed)}</p>`)
  }

  closeList()
  return html.join('')
}
