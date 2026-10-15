import React from 'react'

interface MarkdownLiteProps {
  content: string
  className?: string
}

function parseInline(text: string): React.ReactNode[] {
  // Regex pattern matching:
  // 1. Links: [label](url)
  // 2. Bold: **text**
  // 3. Italic: *text*
  const pattern = /(!?\[([^\]]+)\]\((https?:\/\/[^\s)]+)\))|(\*\*([^*]+)\*\*)|(\*([^*]+)\*)/g
  const parts: React.ReactNode[] = []
  let lastIndex = 0
  let match: RegExpExecArray | null

  while ((match = pattern.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push(text.slice(lastIndex, match.index))
    }

    if (match[1]) {
      // Link
      const label = match[2]
      const url = match[3]
      parts.push(
        <a
          key={`link-${match.index}`}
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          style={{ color: 'var(--color-accent)', textDecoration: 'underline' }}
        >
          {label}
        </a>
      )
    } else if (match[4]) {
      // Bold
      parts.push(
        <strong key={`bold-${match.index}`} style={{ fontWeight: 'var(--font-weight-bold)' }}>
          {match[5]}
        </strong>
      )
    } else if (match[6]) {
      // Italic
      parts.push(
        <em key={`italic-${match.index}`} style={{ fontStyle: 'italic' }}>
          {match[7]}
        </em>
      )
    }

    lastIndex = pattern.lastIndex
  }

  if (lastIndex < text.length) {
    parts.push(text.slice(lastIndex))
  }

  return parts
}

export function MarkdownLite({ content, className }: MarkdownLiteProps) {
  const lines = content.split('\n')
  const blocks: React.ReactNode[] = []
  let currentList: React.ReactNode[] = []

  const flushList = () => {
    if (currentList.length > 0) {
      blocks.push(
        <ul key={`ul-${blocks.length}`} style={{ margin: 'var(--space-2) 0', paddingLeft: 'var(--space-5)' }}>
          {currentList}
        </ul>
      )
      currentList = []
    }
  }

  lines.forEach((line, idx) => {
    const trimmed = line.trim()
    if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
      currentList.push(
        <li key={`li-${idx}`} style={{ margin: 'var(--space-1) 0' }}>
          {parseInline(trimmed.slice(2))}
        </li>
      )
    } else {
      flushList()
      if (trimmed.startsWith('### ')) {
        blocks.push(
          <h4 key={`h4-${idx}`} style={{ margin: 'var(--space-2) 0', fontSize: 'var(--font-size-sm)', fontWeight: 'var(--font-weight-bold)' }}>
            {parseInline(trimmed.slice(4))}
          </h4>
        )
      } else if (trimmed.startsWith('## ')) {
        blocks.push(
          <h3 key={`h3-${idx}`} style={{ margin: 'var(--space-2) 0', fontSize: 'var(--font-size-base)', fontWeight: 'var(--font-weight-bold)' }}>
            {parseInline(trimmed.slice(3))}
          </h3>
        )
      } else if (trimmed.startsWith('# ')) {
        blocks.push(
          <h2 key={`h2-${idx}`} style={{ margin: 'var(--space-3) 0 var(--space-2)', fontSize: 'var(--font-size-lg)', fontWeight: 'var(--font-weight-bold)' }}>
            {parseInline(trimmed.slice(2))}
          </h2>
        )
      } else if (trimmed.length > 0) {
        blocks.push(
          <p key={`p-${idx}`} style={{ margin: 'var(--space-1) 0' }}>
            {parseInline(line)}
          </p>
        )
      }
    }
  })

  flushList()

  return <div className={className}>{blocks}</div>
}
