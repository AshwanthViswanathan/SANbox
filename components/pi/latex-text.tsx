import katex from 'katex'

type TextPart =
  | { type: 'text'; value: string }
  | { type: 'math'; value: string; displayMode: boolean }

function renderMath(value: string, displayMode: boolean) {
  return katex.renderToString(value, {
    throwOnError: false,
    displayMode,
    strict: 'ignore',
    output: 'html',
    trust: false,
  })
}

function parseMathParts(text: string): TextPart[] {
  const parts: TextPart[] = []
  const pattern = /\\\[([\s\S]+?)\\\]|\\\(([\s\S]+?)\\\)|\$\$([\s\S]+?)\$\$|\$([^$\n]+?)\$/g
  let lastIndex = 0
  let match: RegExpExecArray | null

  while ((match = pattern.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push({
        type: 'text',
        value: text.slice(lastIndex, match.index),
      })
    }

    if (match[1] !== undefined) {
      parts.push({ type: 'math', value: match[1], displayMode: true })
    } else if (match[2] !== undefined) {
      parts.push({ type: 'math', value: match[2], displayMode: false })
    } else if (match[3] !== undefined) {
      parts.push({ type: 'math', value: match[3], displayMode: true })
    } else if (match[4] !== undefined) {
      parts.push({ type: 'math', value: match[4], displayMode: false })
    }

    lastIndex = pattern.lastIndex
  }

  if (lastIndex < text.length) {
    parts.push({
      type: 'text',
      value: text.slice(lastIndex),
    })
  }

  return parts
}

export function LatexText({ text, className }: { text: string; className?: string }) {
  const compactText = text.replace(/\n{2,}/g, '\n')
  const parts = parseMathParts(compactText)

  return (
    <span className={className}>
      {parts.map((part, index) => {
        if (part.type === 'text') {
          return (
            <span key={`text-${index}`} className="whitespace-pre-wrap leading-tight">
              {part.value}
            </span>
          )
        }

        const html = renderMath(part.value, part.displayMode)

        return (
          <span
            key={`math-${index}`}
            className={part.displayMode ? 'my-0 block overflow-x-auto' : 'inline-block align-middle'}
            dangerouslySetInnerHTML={{ __html: html }}
          />
        )
      })}
    </span>
  )
}
