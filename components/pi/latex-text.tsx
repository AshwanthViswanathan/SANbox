import { memo, useMemo } from 'react'
import katex from 'katex'

import { hasRenderableLatex } from '@/lib/math/latex'

type TextPart =
  | { type: 'text'; value: string }
  | { type: 'math'; value: string; displayMode: boolean }

type RenderedTextPart =
  | { type: 'text'; value: string }
  | { type: 'math'; displayMode: boolean; html: string }

export type LatexTextRenderMode = 'plain' | 'auto' | 'math'

type LatexTextProps = {
  text: string
  className?: string
  renderMode?: LatexTextRenderMode
}

const MATH_PART_PATTERN = /\\\[([\s\S]+?)\\\]|\\\(([\s\S]+?)\\\)|\$\$([\s\S]+?)\$\$|\$([^$\n]+?)\$/g

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
  let lastIndex = 0
  let match: RegExpExecArray | null

  MATH_PART_PATTERN.lastIndex = 0

  while ((match = MATH_PART_PATTERN.exec(text)) !== null) {
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

    lastIndex = MATH_PART_PATTERN.lastIndex
  }

  if (lastIndex < text.length) {
    parts.push({
      type: 'text',
      value: text.slice(lastIndex),
    })
  }

  return parts
}

function renderPlainText(value: string) {
  return <span className="whitespace-pre-wrap leading-tight">{value}</span>
}

export const LatexText = memo(function LatexText({
  text,
  className,
  renderMode = 'auto',
}: LatexTextProps) {
  const compactText = useMemo(() => text.replace(/\n{2,}/g, '\n'), [text])
  const shouldRenderMath = useMemo(() => {
    if (renderMode === 'plain') {
      return false
    }

    return renderMode === 'math' || hasRenderableLatex(compactText)
  }, [compactText, renderMode])

  const parts = useMemo<RenderedTextPart[] | null>(() => {
    if (!shouldRenderMath) {
      return null
    }

    return parseMathParts(compactText).map((part) => {
      if (part.type === 'text') {
        return part
      }

      return {
        type: 'math',
        displayMode: part.displayMode,
        html: renderMath(part.value, part.displayMode),
      }
    })
  }, [compactText, shouldRenderMath])

  if (!parts) {
    return <span className={className}>{renderPlainText(compactText)}</span>
  }

  return (
    <span className={className}>
      {parts.map((part, index) =>
        part.type === 'text' ? (
          <span key={`text-${index}`}>{renderPlainText(part.value)}</span>
        ) : (
          <span
            key={`math-${index}`}
            className={part.displayMode ? 'my-0 block overflow-x-auto' : 'inline-block align-middle'}
            dangerouslySetInnerHTML={{ __html: part.html }}
          />
        )
      )}
    </span>
  )
})

LatexText.displayName = 'LatexText'
