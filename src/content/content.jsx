import React, { useEffect, useRef } from 'react'
import { createRoot } from 'react-dom/client'
import { Button } from '@/components/ui/button'
import { Bot, Copy, Eraser, GripHorizontal, Send } from 'lucide-react'
import { Highlight, themes } from 'prism-react-renderer'
import { Input } from '@/components/ui/input'
import { SYSTEM_PROMPT } from '@/constants/prompt'
import { LeetCodeAdapter } from './adapters/LeetCodeAdapter'
import { HackerRankAdapter } from './adapters/HackerRankAdapter'
import { GFGAdapter } from './adapters/GFGAdapter'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'
import { cn } from '@/lib/utils'
import { Card, CardContent, CardFooter } from '@/components/ui/card'
import { setSelectModel, getKeyModel, selectModel } from '@/lib/chromeStorage'
import { VALID_MODELS } from '@/constants/valid_models'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { LIMIT_VALUE, getChatHistory, saveChatHistory, clearChatHistory } from '@/lib/indexedDB'

const PANEL_DEFAULT_SIZE = { width: 460, height: 640 }
const PANEL_MIN_SIZE = { width: 380, height: 420 }
const PANEL_MARGIN = 24
const PANEL_STORAGE_KEY = 'dsa-buddy-panel-layout'

const hasExtensionContext = () =>
  typeof chrome !== 'undefined' &&
  !!chrome.runtime?.id

const clamp = (value, min, max) => Math.min(Math.max(value, min), max)

const clampPanelLayout = (layout) => {
  const maxWidth = Math.max(PANEL_MIN_SIZE.width, window.innerWidth - PANEL_MARGIN * 2)
  const maxHeight = Math.max(PANEL_MIN_SIZE.height, window.innerHeight - PANEL_MARGIN * 2)

  const width = clamp(layout.width, PANEL_MIN_SIZE.width, maxWidth)
  const height = clamp(layout.height, PANEL_MIN_SIZE.height, maxHeight)

  return {
    width,
    height,
    x: clamp(layout.x, PANEL_MARGIN, window.innerWidth - width - PANEL_MARGIN),
    y: clamp(layout.y, PANEL_MARGIN, window.innerHeight - height - PANEL_MARGIN),
  }
}

const getDefaultPanelLayout = () =>
  clampPanelLayout({
    width: PANEL_DEFAULT_SIZE.width,
    height: PANEL_DEFAULT_SIZE.height,
    x: window.innerWidth - PANEL_DEFAULT_SIZE.width - PANEL_MARGIN,
    y: window.innerHeight - PANEL_DEFAULT_SIZE.height - PANEL_MARGIN,
  })

const parseMessageContent = (content) => {
  try {
    return JSON.parse(content)
  } catch {
    return null
  }
}

const getFeedbackText = (content) => {
  const parsed = parseMessageContent(content)
  if (typeof parsed === 'string') return parsed
  if (parsed && typeof parsed === 'object' && 'feedback' in parsed) {
    return parsed.feedback
  }
  return content
}

const getProblemNameForPage = () => {
  const adapters = [
    new LeetCodeAdapter(),
    new HackerRankAdapter(),
    new GFGAdapter(),
  ]
  const adapter = adapters.find((a) => a.match(window.location.href))
  if (adapter) return adapter.getProblemName()
  return 'Unknown Problem'
}

const ChatMessage = ({ message }) => {
  const parsedContent = parseMessageContent(message.content)
  const hasStructuredData =
    parsedContent && typeof parsedContent === 'object' && !Array.isArray(parsedContent)

  return (
    <div
      className={cn(
        'my-3 flex w-fit max-w-[86%] flex-col gap-3 px-4 py-3 text-sm leading-7 shadow-[0_14px_35px_rgba(0,0,0,0.18)]',
        message.role === 'user'
          ? 'ml-auto rounded-[1.25rem] rounded-br-md bg-gradient-to-r from-cyan-400 to-blue-500 text-slate-950'
          : 'rounded-[1.25rem] rounded-bl-md border border-white/10 bg-white/[0.06] text-slate-100 backdrop-blur-xl'
      )}
    >
      <div className="max-w-full whitespace-pre-wrap break-words">
        {getFeedbackText(message.content)}
      </div>

      {hasStructuredData && (
        <Accordion type="multiple" className="w-full">
          {parsedContent?.hints?.length > 0 && (
            <AccordionItem value="hints" className="max-w-full border-white/10">
              <AccordionTrigger className="text-left text-slate-200">
                Hints
              </AccordionTrigger>
              <AccordionContent>
                <ul className="space-y-3 text-slate-300">
                  {parsedContent.hints.map((hint) => (
                    <li key={hint}>{hint}</li>
                  ))}
                </ul>
              </AccordionContent>
            </AccordionItem>
          )}

          {parsedContent?.snippet && (
            <AccordionItem value="code" className="max-w-full border-white/10">
              <AccordionTrigger className="text-left text-slate-200">
                Code
              </AccordionTrigger>
              <AccordionContent>
                <div className="mt-3 rounded-xl border border-white/10 bg-[#090f1c]">
                  <div className="relative">
                    <Copy
                      onClick={() => navigator.clipboard.writeText(parsedContent.snippet)}
                      className="absolute right-3 top-3 h-4 w-4 cursor-pointer text-slate-400 hover:text-slate-200"
                    />
                    <Highlight
                      theme={themes.dracula}
                      code={parsedContent.snippet || ''}
                      language={parsedContent?.programmingLanguage?.toLowerCase() || 'javascript'}
                    >
                      {({
                        className,
                        style,
                        tokens,
                        getLineProps,
                        getTokenProps,
                      }) => (
                        <pre
                          style={style}
                          className={cn(className, 'overflow-x-auto rounded-xl p-4')}
                        >
                          {tokens.map((line, i) => (
                            <div key={i} {...getLineProps({ line })}>
                              {line.map((token, key) => (
                                <span key={key} {...getTokenProps({ token })} />
                              ))}
                            </div>
                          ))}
                        </pre>
                      )}
                    </Highlight>
                  </div>
                </div>
              </AccordionContent>
            </AccordionItem>
          )}
        </Accordion>
      )}
    </div>
  )
}

const ChatBox = ({
  context,
  visible,
  model,
  apikey,
  baseUrl,
  customModelName,
  selectedModel,
  layout,
  onDragStart,
  onResizeStart,
}) => {
  const [value, setValue] = React.useState('')
  const [chatHistory, setChatHistory] = React.useState([])
  const [priviousChatHistory, setPreviousChatHistory] = React.useState([])
  const [isResponseLoading, setIsResponseLoading] = React.useState(false)
  const scrollAreaRef = useRef(null)
  const lastMessageRef = useRef(null)
  const [offset, setOffset] = React.useState(0)
  const [totalMessages, setTotalMessages] = React.useState(0)
  const [isPriviousMsgLoading, setIsPriviousMsgLoading] = React.useState(false)
  const [rateLimitSecs, setRateLimitSecs] = React.useState(0)
  const inputFieldRef = useRef(null)
  const problemName = getProblemNameForPage()
  const messageAreaHeight = Math.max(layout.height - 182, 250)

  useEffect(() => {
    if (rateLimitSecs <= 0) return
    const timer = setTimeout(() => setRateLimitSecs((s) => s - 1), 1000)
    return () => clearTimeout(timer)
  }, [rateLimitSecs])

  useEffect(() => {
    if (lastMessageRef.current && !isPriviousMsgLoading) {
      lastMessageRef.current.scrollIntoView({ behavior: 'smooth' })
    }
    setTimeout(() => {
      inputFieldRef.current?.focus()
    }, 0)
  }, [chatHistory, isResponseLoading, visible])

  const heandelClearChat = async () => {
    await clearChatHistory(problemName)
    setChatHistory([])
    setPreviousChatHistory([])
  }

  const handleGenerateAIResponse = async (messageText) => {
    if (!hasExtensionContext()) {
      setIsResponseLoading(false)
      return
    }

    const adapters = [
      new LeetCodeAdapter(),
      new HackerRankAdapter(),
      new GFGAdapter(),
    ]
    const adapter = adapters.find((a) => a.match(window.location.href))
    let programmingLanguage = 'UNKNOWN'
    let extractedCode = ''

    if (adapter) {
      programmingLanguage = adapter.getLanguage() || 'UNKNOWN'
      extractedCode = adapter.getUserCode()
    }

    if (extractedCode.length > 3000) {
      extractedCode = extractedCode.slice(0, 3000) + '\n// ... (truncated)'
    }

    const systemPromptModified = SYSTEM_PROMPT.replace(
      /{{problem_statement}}/gi,
      context.problemStatement
    )
      .replace(/{{programming_language}}/g, programmingLanguage)
      .replace(/{{user_code}}/g, extractedCode)

    const PCH = chatHistory.slice(-6)

    let error = null
    let success = null

    try {
      const result = await new Promise((resolve) => {
        chrome.runtime.sendMessage(
          {
            action: 'generateAI',
            modelName: model,
            apiKey: apikey,
            config: { baseUrl, modelName: customModelName },
            prompt: messageText,
            systemPrompt: systemPromptModified,
            messages: PCH,
            extractedCode,
          },
          (response) => {
            if (chrome.runtime.lastError) {
              resolve({
                error: { message: chrome.runtime.lastError.message },
                success: null,
              })
            } else {
              resolve(
                response || {
                  error: { message: 'No response from background' },
                  success: null,
                }
              )
            }
          }
        )
      })

      error = result.error
      success = result.success
    } catch (runtimeError) {
      error = {
        message:
          runtimeError?.message || 'The extension was reloaded. Refresh the page and try again.',
      }
    }

    if (error) {
      const retryMatch = error.message?.match(/(\d+)\s*seconds?/i)
      if (retryMatch) setRateLimitSecs(parseInt(retryMatch[1], 10) + 2)

      const errorMessage = {
        role: 'assistant',
        content: error.message,
        timestamp: Date.now(),
      }
      await saveChatHistory(problemName, [...priviousChatHistory, errorMessage])
      setPreviousChatHistory((prev) => [...prev, errorMessage])
      setChatHistory((prev) => [...prev, errorMessage])
      lastMessageRef.current?.scrollIntoView({ behavior: 'smooth' })
    }

    if (success) {
      const res = {
        role: 'assistant',
        content: typeof success === 'string' ? success : JSON.stringify(success),
        timestamp: Date.now(),
      }
      await saveChatHistory(problemName, [...priviousChatHistory, res])
      setPreviousChatHistory((prev) => [...prev, res])
      setChatHistory((prev) => [...prev, res])
      setValue('')
      lastMessageRef.current?.scrollIntoView({ behavior: 'smooth' })
    }

    setIsResponseLoading(false)
    setTimeout(() => {
      inputFieldRef.current?.focus()
    }, 0)
  }

  const loadInitialChatHistory = async () => {
    const { totalMessageCount, chatHistory, allChatHistory } =
      await getChatHistory(problemName, LIMIT_VALUE, 0)
    setPreviousChatHistory(allChatHistory || [])
    setTotalMessages(totalMessageCount)
    setChatHistory(chatHistory)
    setOffset(LIMIT_VALUE)
  }

  useEffect(() => {
    loadInitialChatHistory()
  }, [problemName])

  const loadMoreMessages = async () => {
    if (totalMessages < offset) return

    setIsPriviousMsgLoading(true)
    const { chatHistory: moreMessages } = await getChatHistory(
      problemName,
      LIMIT_VALUE,
      offset
    )

    if (moreMessages.length > 0) {
      setChatHistory((prev) => [...moreMessages, ...prev])
      setOffset((prevOffset) => prevOffset + LIMIT_VALUE)
    }

    setTimeout(() => {
      setIsPriviousMsgLoading(false)
    }, 500)
  }

  const handleScroll = (e) => {
    const target = e.currentTarget
    if (target.scrollTop === 0) loadMoreMessages()
  }

  const onSendMessage = async (messageValue) => {
    setIsResponseLoading(true)
    const newMessage = {
      role: 'user',
      content: messageValue,
      timestamp: Date.now(),
    }

    setPreviousChatHistory((prev) => [...prev, newMessage])
    setChatHistory((prev) => [...prev, newMessage])
    lastMessageRef.current?.scrollIntoView({ behavior: 'smooth' })
    try {
      await handleGenerateAIResponse(messageValue)
    } catch (error) {
      console.warn('DSA Buddy: failed to generate AI response', error)
      setIsResponseLoading(false)
    }
  }

  if (!visible) return <></>

  return (
    <Card
      className="mb-3 flex flex-col overflow-hidden rounded-[1.8rem] border border-white/10 bg-[#07101d]/92 text-white shadow-[0_28px_90px_rgba(0,0,0,0.5)] backdrop-blur-2xl"
      style={{ width: `${layout.width}px`, height: `${layout.height}px` }}
    >
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -left-10 top-0 h-36 w-36 rounded-full bg-cyan-400/12 blur-3xl" />
        <div className="absolute right-[-2.5rem] top-16 h-44 w-44 rounded-full bg-indigo-500/16 blur-3xl" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.08),transparent_32%),linear-gradient(155deg,rgba(255,255,255,0.08),rgba(255,255,255,0.01)_36%,rgba(5,10,22,0.78)_100%)]" />
      </div>

      <div
        className="relative flex cursor-move items-center justify-between px-4 pb-3 pt-4"
        onMouseDown={onDragStart}
      >
        <div className="flex items-center gap-3">
          <div className="rounded-full border border-white/15 bg-white/90 p-2 shadow-[0_10px_30px_rgba(255,255,255,0.1)]">
            <Bot color="#020617" className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-base font-bold tracking-tight">Need Help?</h3>
            <h6 className="text-[11px] font-normal text-slate-300/70">
              {VALID_MODELS.find((m) => m.name === selectedModel)?.display ||
                'No model'}
            </h6>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="rounded-full border border-white/10 bg-white/[0.06] px-2.5 py-1 text-[10px] uppercase tracking-[0.24em] text-slate-300/70">
            Drag
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="h-9 w-9 rounded-full border border-red-400/20 bg-red-500/5 text-red-300 hover:bg-red-500/10 hover:text-red-200"
            title="Clear chat"
            onClick={heandelClearChat}
          >
            <Eraser size={16} strokeWidth={1.5} />
          </Button>
        </div>
      </div>

      <CardContent className="relative flex-1 min-h-0 px-3 pb-0 pt-0">
        <div className="h-full rounded-[1.35rem] border border-white/10 bg-black/25 p-2 shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]">
          <ScrollArea
            className="h-full min-h-0 w-full rounded-[1.05rem] px-2"
            style={{ height: `${messageAreaHeight}px` }}
            ref={scrollAreaRef}
            onScroll={handleScroll}
          >
            {chatHistory.length > 0 && totalMessages > offset && (
              <div className="flex w-full items-center justify-center">
                <Button
                  className="m-x-auto rounded-full bg-white/5 px-3 py-1 text-xs text-slate-200 hover:bg-white/10"
                  onClick={loadMoreMessages}
                >
                  Load Previous Messages
                </Button>
              </div>
            )}

            {chatHistory.length > 0 ? (
              <>
                {chatHistory.map((message, index) => (
                  <ChatMessage key={index} message={message} />
                ))}
                {isResponseLoading && (
                  <div className="my-2 flex w-max max-w-[75%] flex-col">
                    <div className="h-5 w-5 rounded-full animate-pulse bg-cyan-300"></div>
                  </div>
                )}
              </>
            ) : (
              <div className="grid h-full min-h-[220px] place-items-center text-center text-sm text-slate-300/70">
                No messages yet.
              </div>
            )}
            <div ref={lastMessageRef} />
          </ScrollArea>
        </div>
      </CardContent>

      <CardFooter className="relative px-3 pb-3 pt-3">
        <form
          onSubmit={(event) => {
            event.preventDefault()
            if (value.trim().length === 0) return
            onSendMessage(value)
            setValue('')
          }}
          className="flex w-full items-center gap-2 pr-9"
        >
          <Input
            id="message"
            placeholder={
              rateLimitSecs > 0
                ? `Rate limited - wait ${rateLimitSecs}s...`
                : 'Type your message...'
            }
            className="flex-1"
            iclassName="h-11 rounded-[1rem] border-white/10 bg-black/30 px-4 text-slate-100 placeholder:text-slate-400 shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]"
            autoComplete="off"
            value={value}
            onChange={(event) => setValue(event.target.value)}
            disabled={isResponseLoading || rateLimitSecs > 0}
            required
            ref={inputFieldRef}
          />
          <Button
            type="submit"
            className="min-w-[44px] rounded-[1rem] border border-cyan-300/20 bg-gradient-to-r from-cyan-400 to-blue-500 text-xs text-slate-950"
            size="icon"
            disabled={
              value.length === 0 || rateLimitSecs > 0 || isResponseLoading
            }
          >
            {rateLimitSecs > 0 ? (
              <span>{rateLimitSecs}s</span>
            ) : (
              <Send className="h-4 w-4" />
            )}
            <span className="sr-only">Send</span>
          </Button>
        </form>
        <button
          type="button"
          onMouseDown={onResizeStart}
          className="absolute bottom-3 right-3 z-10 flex h-7 w-7 cursor-se-resize items-center justify-center rounded-full border border-white/10 bg-[#0b1323]/90 text-slate-300/70 shadow-[0_8px_22px_rgba(0,0,0,0.32)] hover:bg-[#121c31] hover:text-slate-100"
          title="Resize panel"
        >
          <GripHorizontal className="h-3.5 w-3.5 rotate-45" />
        </button>
      </CardFooter>
    </Card>
  )
}

const ContentPage = () => {
  const [chatboxExpanded, setChatboxExpanded] = React.useState(false)
  const [problemStatement, setProblemStatement] = React.useState('')
  const [model, setModel] = React.useState(null)
  const [apiKey, setApiKey] = React.useState(null)
  const [baseUrl, setBaseUrl] = React.useState(null)
  const [customModelName, setCustomModelName] = React.useState(null)
  const [selectedModel, setSelectedModel] = React.useState(undefined)
  const [panelLayout, setPanelLayout] = React.useState(() => getDefaultPanelLayout())
  const ref = useRef(null)
  const dragStateRef = useRef(null)

  React.useEffect(() => {
    const storedLayout = window.localStorage.getItem(PANEL_STORAGE_KEY)
    if (storedLayout) {
      try {
        setPanelLayout(clampPanelLayout(JSON.parse(storedLayout)))
      } catch {
        setPanelLayout(getDefaultPanelLayout())
      }
    }
  }, [])

  React.useEffect(() => {
    window.localStorage.setItem(PANEL_STORAGE_KEY, JSON.stringify(panelLayout))
  }, [panelLayout])

  React.useEffect(() => {
    const adapters = [
      new LeetCodeAdapter(),
      new HackerRankAdapter(),
      new GFGAdapter(),
    ]

    const updateStatement = () => {
      const adapter = adapters.find((a) => a.match(window.location.href))
      const statement = adapter?.getProblemStatement() || ''
      if (statement && statement !== problemStatement) {
        setProblemStatement(statement)
      }
    }

    updateStatement()

    const observer = new MutationObserver(updateStatement)
    observer.observe(document.body, { childList: true, subtree: true })

    const handleDocumentClick = (event) => {
      if (ref.current && !ref.current.contains(event.target)) {
        setChatboxExpanded(false)
      }
    }

    document.addEventListener('click', handleDocumentClick)
    return () => {
      document.removeEventListener('click', handleDocumentClick)
      observer.disconnect()
    }
  }, [problemStatement])

  React.useEffect(() => {
    const handleViewportResize = () => {
      setPanelLayout((prev) => clampPanelLayout(prev))
    }

    window.addEventListener('resize', handleViewportResize)
    return () => window.removeEventListener('resize', handleViewportResize)
  }, [])

  const loadFromStorage = React.useCallback(async () => {
    try {
      const storedModel = await selectModel()
      const modelToUse = storedModel || VALID_MODELS[0]?.name || null
      const data = await getKeyModel(modelToUse)
      setSelectedModel(modelToUse)
      setModel(data.model)
      setApiKey(data.apiKey)
      setBaseUrl(data.baseUrl)
      setCustomModelName(data.customModelName)
    } catch (e) {
      console.warn('DSA Buddy: failed to load storage', e)
    }
  }, [])

  React.useEffect(() => {
    loadFromStorage()
    const onStorageChanged = () => loadFromStorage()
    if (hasExtensionContext() && chrome.storage?.onChanged) {
      chrome.storage.onChanged.addListener(onStorageChanged)
      return () => {
        if (hasExtensionContext() && chrome.storage?.onChanged) {
          chrome.storage.onChanged.removeListener(onStorageChanged)
        }
      }
    }
    return undefined
  }, [loadFromStorage])

  const heandelModel = (v) => {
    if (v) {
      setSelectModel(v).catch((error) => {
        console.warn('DSA Buddy: failed to persist selected model', error)
      })
      setSelectedModel(v)
    }
  }

  const bindPointerMove = (onMove) => {
    const handleMouseMove = (event) => onMove(event)
    const handleMouseUp = () => {
      dragStateRef.current = null
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('mouseup', handleMouseUp)
    }

    window.addEventListener('mousemove', handleMouseMove)
    window.addEventListener('mouseup', handleMouseUp)
  }

  const handleDragStart = (event) => {
    if (event.target.closest('button, input, textarea, [role="button"]')) return
    event.preventDefault()

    dragStateRef.current = {
      startX: event.clientX,
      startY: event.clientY,
      initialX: panelLayout.x,
      initialY: panelLayout.y,
    }

    bindPointerMove((moveEvent) => {
      setPanelLayout((prev) =>
        clampPanelLayout({
          ...prev,
          x: dragStateRef.current.initialX + (moveEvent.clientX - dragStateRef.current.startX),
          y: dragStateRef.current.initialY + (moveEvent.clientY - dragStateRef.current.startY),
        })
      )
    })
  }

  const handleResizeStart = (event) => {
    event.preventDefault()
    event.stopPropagation()

    dragStateRef.current = {
      startX: event.clientX,
      startY: event.clientY,
      initialWidth: panelLayout.width,
      initialHeight: panelLayout.height,
      initialX: panelLayout.x,
      initialY: panelLayout.y,
    }

    bindPointerMove((moveEvent) => {
      setPanelLayout((prev) =>
        clampPanelLayout({
          ...prev,
          width:
            dragStateRef.current.initialWidth +
            (moveEvent.clientX - dragStateRef.current.startX),
          height:
            dragStateRef.current.initialHeight +
            (moveEvent.clientY - dragStateRef.current.startY),
          x: dragStateRef.current.initialX,
          y: dragStateRef.current.initialY,
        })
      )
    })
  }

  const collapsedButtonStyle = {
    position: 'fixed',
    right: `${PANEL_MARGIN}px`,
    bottom: `${PANEL_MARGIN}px`,
  }

  return (
    <div
      ref={ref}
      className="dark z-[2147483647]"
      style={
        chatboxExpanded
          ? {
              position: 'fixed',
              left: `${panelLayout.x}px`,
              top: `${panelLayout.y}px`,
            }
          : collapsedButtonStyle
      }
    >
      {chatboxExpanded &&
        (!model || !apiKey ? (
          <Card
            className="mb-3 overflow-hidden rounded-[1.8rem] border border-white/10 bg-[#07101d]/92 text-white shadow-[0_28px_90px_rgba(0,0,0,0.5)] backdrop-blur-2xl"
            style={{ width: `${panelLayout.width}px`, minHeight: `${Math.max(panelLayout.height - 80, 360)}px` }}
          >
            <CardContent className="grid min-h-[360px] place-items-center p-6 text-center">
              <div className="grid max-w-sm place-items-center gap-4">
                {!selectedModel && (
                  <>
                    <p className="text-slate-200">
                      Please configure the extension before using this feature.
                    </p>
                    <Button
                      className="rounded-[1rem] border border-cyan-300/20 bg-gradient-to-r from-cyan-400 to-blue-500 text-slate-950"
                      onClick={() => {
                        if (!hasExtensionContext()) return
                        chrome.runtime.sendMessage({ action: 'openPopup' }, () => {
                          if (chrome.runtime.lastError) {
                            console.warn(
                              'DSA Buddy: failed to open popup',
                              chrome.runtime.lastError.message
                            )
                          }
                        })
                      }}
                    >
                      Configure
                    </Button>
                  </>
                )}
                {selectedModel && (
                  <>
                    <p className="text-slate-200">
                      We could not find any API key for the selected model{' '}
                      <b>{selectedModel}</b>.
                    </p>
                    <p className="text-sm text-slate-400">
                      You can switch to another configured model below.
                    </p>
                    <Select
                      onValueChange={(v) => heandelModel(v)}
                      value={selectedModel}
                    >
                      <SelectTrigger className="w-64 rounded-[1rem] border-white/10 bg-black/30 text-slate-100">
                        <SelectValue placeholder="Select a model" />
                      </SelectTrigger>
                      <SelectContent className="rounded-2xl border-white/10 bg-[#0c1120]/95 backdrop-blur-xl">
                        <SelectGroup>
                          <SelectLabel className="text-slate-300/80">Model</SelectLabel>
                          <SelectSeparator />
                          {VALID_MODELS.map((modelOption) => (
                            <SelectItem
                              className="rounded-xl text-slate-100 focus:bg-white/10 focus:text-white"
                              key={modelOption.name}
                              value={modelOption.name}
                            >
                              {modelOption.display}
                            </SelectItem>
                          ))}
                        </SelectGroup>
                      </SelectContent>
                    </Select>
                  </>
                )}
              </div>
            </CardContent>
          </Card>
        ) : (
          <ChatBox
            visible={chatboxExpanded}
            context={{ problemStatement }}
            model={model}
            apikey={apiKey}
            baseUrl={baseUrl}
            customModelName={customModelName}
            selectedModel={selectedModel}
            layout={panelLayout}
            onDragStart={handleDragStart}
            onResizeStart={handleResizeStart}
          />
        ))}

      <div className="flex justify-end">
        <Button
          size="icon"
          className="h-12 w-12 rounded-2xl border border-white/10 bg-[#07101d]/92 text-white shadow-[0_20px_40px_rgba(0,0,0,0.35)] backdrop-blur-xl hover:bg-[#0b1528]"
          onClick={() => setChatboxExpanded(!chatboxExpanded)}
        >
          <Bot />
        </Button>
      </div>
    </div>
  )
}

export default ContentPage

const CONTAINER_ID = '__dsa_buddy_root'

function ensureContainer() {
  if (document.getElementById(CONTAINER_ID)) return

  const container = document.createElement('div')
  container.id = CONTAINER_ID
  document.body.appendChild(container)

  createRoot(container).render(
    <React.StrictMode>
      <ContentPage />
    </React.StrictMode>
  )
  console.log('DSA Buddy: bot icon injected')
}

if (document.body) {
  ensureContainer()
} else {
  document.addEventListener('DOMContentLoaded', ensureContainer)
}

new MutationObserver(() => {
  if (!document.getElementById(CONTAINER_ID)) {
    ensureContainer()
  }
}).observe(document.body, { childList: true, subtree: false })
