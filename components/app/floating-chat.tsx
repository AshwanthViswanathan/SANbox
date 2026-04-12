'use client'

import { useState } from 'react'
import { useChat } from '@ai-sdk/react'
import { Bot, LoaderCircle, MessageSquare, Send, X } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import { cn } from '@/lib/utils'

const MODEL_OPTIONS = [
  { value: 'openai/gpt-oss-safeguard-20b', label: 'GPT OSS Safeguard 20B' },
  { value: 'openai/gpt-oss-120b', label: 'GPT OSS 120B' },
  { value: 'openai/gpt-oss-20b', label: 'GPT OSS 20B' },
  { value: 'llama-3.3-70b-versatile', label: 'Llama 3.3 70B' },
  { value: 'llama-3.1-8b-instant', label: 'Llama 3.1 8B' },
] as const

function getMessageText(parts: Array<{ type: string; text?: string }>) {
  return parts
    .filter((part) => part.type === 'text' && typeof part.text === 'string')
    .map((part) => part.text)
    .join('')
    .trim()
}

export function FloatingChat() {
  const [open, setOpen] = useState(false)
  const [input, setInput] = useState('')
  const [model, setModel] = useState<(typeof MODEL_OPTIONS)[number]['value']>('openai/gpt-oss-120b')
  const { messages, sendMessage, status, error } = useChat({
    body: {
      model,
    },
  })

  const isBusy = status === 'submitted' || status === 'streaming'

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()

    const text = input.trim()
    if (!text || isBusy) return

    setInput('')
    await sendMessage({ text })
  }

  return (
    <div className="fixed right-4 bottom-4 z-50 flex flex-col items-end gap-3 sm:right-6 sm:bottom-6">
      {open && (
        <div className="w-[min(24rem,calc(100vw-2rem))] overflow-hidden rounded-2xl border border-border bg-background/95 shadow-2xl backdrop-blur">
          <div className="flex items-center justify-between border-b border-border px-4 py-3">
            <div className="flex items-center gap-3">
              <div className="flex size-9 items-center justify-center rounded-full bg-accent/15 text-accent">
                <Bot className="size-4" />
              </div>
              <div>
                <p className="text-sm font-semibold">Groq Chat</p>
                <p className="text-xs text-muted-foreground">Internal prompt lab for SANbox flows</p>
              </div>
            </div>
            <Button type="button" variant="ghost" size="icon-sm" onClick={() => setOpen(false)}>
              <X className="size-4" />
              <span className="sr-only">Close chat</span>
            </Button>
          </div>

          <div className="border-b border-border px-4 py-3">
            <label className="flex flex-col gap-1 text-xs text-muted-foreground">
              Model
              <select
                value={model}
                onChange={(event) =>
                  setModel(event.target.value as (typeof MODEL_OPTIONS)[number]['value'])
                }
                className="h-10 rounded-xl border border-border bg-background px-3 text-sm text-foreground outline-none"
              >
                {MODEL_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <ScrollArea className="h-96 px-4 py-4">
            <div className="space-y-3">
              {messages.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-border bg-muted/30 px-4 py-3 text-sm text-muted-foreground">
                  Ask about lesson ideas, device behavior, or parent-dashboard flows and this widget will call
                  Groq through <code className="font-mono">/api/chat</code> using the selected model.
                </div>
              ) : (
                messages.map((message) => {
                  const text = getMessageText(message.parts)
                  if (!text) return null

                  return (
                    <div
                      key={message.id}
                      className={cn(
                        'max-w-[90%] rounded-2xl px-4 py-3 text-sm leading-6 shadow-sm',
                        message.role === 'user'
                          ? 'ml-auto bg-primary text-primary-foreground'
                          : 'bg-muted text-foreground'
                      )}
                    >
                      {text}
                    </div>
                  )
                })
              )}

              {isBusy && (
                <div className="flex max-w-[90%] items-center gap-2 rounded-2xl bg-muted px-4 py-3 text-sm text-muted-foreground shadow-sm">
                  <LoaderCircle className="size-4 animate-spin" />
                  Thinking
                </div>
              )}

              {error && (
                <div className="rounded-2xl border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
                  {error.message}
                </div>
              )}
            </div>
          </ScrollArea>

          <form onSubmit={handleSubmit} className="border-t border-border p-3">
            <div className="flex items-end gap-2">
              <Input
                value={input}
                onChange={(event) => setInput(event.target.value)}
                placeholder="Ask Groq about SANbox prompts or lesson flows..."
                className="h-11 rounded-xl"
              />
              <Button type="submit" size="icon" disabled={!input.trim() || isBusy}>
                <Send className="size-4" />
                <span className="sr-only">Send message</span>
              </Button>
            </div>
          </form>
        </div>
      )}

      <Button
        type="button"
        onClick={() => setOpen((current) => !current)}
        className="h-12 rounded-full px-4 shadow-lg"
      >
        <MessageSquare className="size-4" />
        {open ? 'Hide chat' : 'Test prompts'}
      </Button>
    </div>
  )
}
