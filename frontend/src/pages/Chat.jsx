import { useEffect, useRef, useState } from 'react'
import ReactMarkdown from 'react-markdown'
import { useAppStore } from '../store/useAppStore'
import FileUpload from '../components/ui/FileUpload'
import Button from '../components/ui/Button'

const STORAGE_KEY = 'ensia_chat_messages'

function loadMessages() {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]') } catch { return [] }
}
function saveMessages(msgs) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(msgs))
}

function Bubble({ role, content, streaming }) {
  const isUser = role === 'user'
  return (
    <div className={`flex gap-3 ${isUser ? 'flex-row-reverse' : ''}`}>
      <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
        isUser ? 'bg-blue-600 text-white' : 'bg-blue-100 text-blue-700'
      }`}>
        {isUser ? 'U' : 'AI'}
      </div>

      <div className={`max-w-[78%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
        isUser
          ? 'bg-blue-600 text-white'
          : 'border border-gray-200 bg-white text-gray-800 shadow-sm'
      }`}>
        {isUser ? (
          <p>{content}</p>
        ) : (
          <div className="prose prose-sm max-w-none prose-headings:text-gray-900 prose-headings:font-semibold prose-a:text-blue-700 prose-code:bg-gray-100 prose-code:px-1 prose-code:rounded">
            <ReactMarkdown>{content || (streaming ? '…' : '')}</ReactMarkdown>
          </div>
        )}
      </div>
    </div>
  )
}

export default function Chat() {
  const token = useAppStore(s => s.auth.token)

  const [messages,    setMessages]    = useState(loadMessages)
  const [input,       setInput]       = useState('')
  const [isStreaming, setIsStreaming] = useState(false)
  const [ocrResult,   setOcrResult]  = useState(null)
  const [ocrLoading,  setOcrLoading] = useState(false)
  const [ocrError,    setOcrError]   = useState(null)
  const [imageFiles,  setImageFiles]  = useState([])
  const [showOcr,     setShowOcr]    = useState(false)

  const bottomRef  = useRef(null)
  const inputRef   = useRef(null)

  useEffect(() => { saveMessages(messages) }, [messages])
  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [messages])

  const runOCR = async (files) => {
    setImageFiles(files)
    if (!files.length) { setOcrResult(null); return }
    setOcrLoading(true); setOcrError(null)
    const form = new FormData()
    form.append('image', files[0])
    try {
      const res  = await fetch('http://localhost:8000/api/chat/ocr/', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: form,
      })
      const data = await res.json()
      if (data.error) throw new Error(data.error)
      setOcrResult(data.result)
    } catch (e) {
      setOcrError(e.message || 'OCR failed')
      setOcrResult(null)
    } finally {
      setOcrLoading(false)
    }
  }

  const sendMessage = async () => {
    const msg = input.trim()
    if (!msg || isStreaming) return

    setInput('')
    const userMsg      = { role: 'user', content: msg }
    const assistantMsg = { role: 'assistant', content: '' }
    const next         = [...messages, userMsg, assistantMsg]
    setMessages(next)
    setIsStreaming(true)

    try {
      const res = await fetch('http://localhost:8000/api/chat/message/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          message: msg,
          imageContext: ocrResult ? JSON.stringify(ocrResult, null, 2) : '',
        }),
      })

      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: res.statusText }))
        throw new Error(err.error || 'Request failed')
      }

      const reader  = res.body.getReader()
      const decoder = new TextDecoder()
      let buffer    = ''
      let full      = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split('\n')
        buffer = lines.pop()

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue
          const raw = line.slice(6).trim()
          if (raw === '[DONE]') break
          try {
            const parsed = JSON.parse(raw)
            if (parsed.error) throw new Error(parsed.error)
            if (parsed.content) {
              full += parsed.content
              setMessages(prev => {
                const updated = [...prev]
                updated[updated.length - 1] = { role: 'assistant', content: full }
                return updated
              })
            }
          } catch (e) {
            if (e.message && !e.message.startsWith('Unexpected')) throw e
          }
        }
      }
    } catch (err) {
      setMessages(prev => {
        const updated = [...prev]
        updated[updated.length - 1] = {
          role: 'assistant',
          content: `**Error:** ${err.message}`,
        }
        return updated
      })
    } finally {
      setIsStreaming(false)
      inputRef.current?.focus()
    }
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage() }
  }

  const clearChat = () => {
    setMessages([])
    setOcrResult(null)
    setImageFiles([])
  }

  return (
    <div className="grid min-h-[calc(100vh-10rem)] gap-6 xl:grid-cols-[0.82fr_1.18fr]">
      <aside className="space-y-4 xl:sticky xl:top-0 xl:self-start">
        <div className="app-panel space-y-4 p-5">
          <div>
            <p className="app-heading">Image audit</p>
            <h2 className="mt-2 text-xl font-bold tracking-tight text-slate-900">Upload a product image</h2>
            <p className="mt-2 text-sm leading-6 text-slate-500">
              Run the NVIDIA OCR audit and attach the result as context for your next question.
            </p>
          </div>

          <FileUpload
            files={imageFiles}
            onChange={runOCR}
            label="Drop image here"
            accept="image/*"
          />

          {ocrLoading && (
            <div className="rounded-2xl border border-sky-200 bg-sky-50 px-3 py-2 text-xs font-medium text-sky-700">
              Running NVIDIA audit…
            </div>
          )}
          {ocrError && (
            <div className="rounded-2xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-medium text-rose-700">{ocrError}</div>
          )}
          {ocrResult && (
            <div className="space-y-2">
              <div className="flex items-center justify-between gap-3">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-700 ring-1 ring-inset ring-blue-200/70">
                  Audit ready
                </span>
                <button
                  onClick={() => setShowOcr(s => !s)}
                  className="text-xs font-semibold text-slate-400 hover:text-slate-700"
                >
                  {showOcr ? 'Hide' : 'View'}
                </button>
              </div>
              {showOcr && (
                <pre className="max-h-64 overflow-y-auto rounded-3xl bg-slate-950 p-4 text-xs text-slate-300 scrollbar-hide">
                  {JSON.stringify(ocrResult, null, 2)}
                </pre>
              )}
            </div>
          )}
        </div>

        {messages.filter(m => m.role === 'user').length > 0 && (
          <div className="app-panel space-y-3 p-5">
            <p className="app-heading">Recent questions</p>
            {messages
              .filter(m => m.role === 'user')
              .slice(-5)
              .reverse()
              .map((m, i) => (
                <button
                  key={i}
                  onClick={() => setInput(m.content)}
                  className="w-full truncate rounded-2xl border border-slate-200/70 bg-white px-3 py-2.5 text-left text-xs font-medium text-slate-600 transition hover:-translate-y-0.5 hover:border-slate-300 hover:text-slate-900"
                >
                  {m.content}
                </button>
              ))}
          </div>
        )}
      </aside>

      <div className="flex min-h-[70vh] flex-1 flex-col overflow-hidden app-panel">
        <div className="flex items-center justify-between border-b border-slate-200/70 px-5 py-4 sm:px-6">
          <div>
            <p className="text-sm font-semibold tracking-tight text-slate-900">Compliance Chat</p>
            <p className="text-xs text-slate-500">Powered by NVIDIA NIM · LangGraph agent · RAG</p>
          </div>
          <button
            onClick={clearChat}
            className="rounded-full border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-500 transition hover:-translate-y-0.5 hover:border-slate-300 hover:text-slate-900"
          >
            Clear
          </button>
        </div>

        <div className="flex-1 space-y-5 overflow-y-auto px-4 py-5 sm:px-6">
          {messages.length === 0 && (
            <div className="flex min-h-[42vh] flex-col items-center justify-center gap-4 rounded-[28px] border border-dashed border-slate-200 bg-white/60 px-6 py-10 text-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-900 text-2xl text-white shadow-lg">💬</div>
              <div>
                <p className="text-base font-semibold tracking-tight text-slate-900">Ask a compliance question</p>
                <p className="mt-2 text-sm leading-6 text-slate-500">
                  The agent can search your compliance documents, browse the web, and analyse product images.
                </p>
              </div>
              <div className="mt-1 flex flex-wrap justify-center gap-2">
                {[
                  'What are the labeling requirements for Algeria food exports?',
                  'Does this product comply with EU customs rules?',
                  'What certifications are needed for pharmaceutical exports?',
                ].map(q => (
                  <button
                    key={q}
                    onClick={() => setInput(q)}
                    className="rounded-full border border-slate-200 bg-white px-3 py-2 text-left text-xs font-medium text-slate-600 transition hover:-translate-y-0.5 hover:border-slate-300 hover:text-slate-900"
                  >
                    {q}
                  </button>
                ))}
              </div>
            </div>
          )}

          {messages.map((m, i) => (
            <Bubble
              key={i}
              role={m.role}
              content={m.content}
              streaming={isStreaming && i === messages.length - 1 && m.role === 'assistant'}
            />
          ))}
          <div ref={bottomRef} />
        </div>

        <div className="border-t border-slate-200/70 bg-white/75 px-4 py-4 backdrop-blur sm:px-6">
          {ocrResult && (
            <div className="mb-3 flex items-center gap-2 text-xs font-medium text-blue-700">
              <span className="h-1.5 w-1.5 rounded-full bg-blue-500" />
              Image context attached to next message
              <button
                onClick={() => { setOcrResult(null); setImageFiles([]) }}
                className="ml-auto text-slate-400 hover:text-slate-700"
              >
                Remove
              </button>
            </div>
          )}
          <div className="flex gap-2">
            <textarea
              ref={inputRef}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask a compliance question… (Enter to send)"
              disabled={isStreaming}
              rows={2}
              className="flex-1 resize-none rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-blue-400 focus:bg-white focus:ring-4 focus:ring-blue-500/10 disabled:opacity-50"
            />
            <Button onClick={sendMessage} disabled={isStreaming || !input.trim()} className="self-end px-5">
              {isStreaming ? '…' : 'Send'}
            </Button>
          </div>
          <p className="mt-2 text-right text-xs text-slate-400">Shift+Enter for newline</p>
        </div>
      </div>
    </div>
  )
}
