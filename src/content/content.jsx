import React, { useEffect, useRef } from 'react'
import { createRoot } from 'react-dom/client'
import { Button } from '@/components/ui/button'
import {
  Bot,
  Copy,
  MoreVertical,
  Eraser,
  Send,
  Settings,
} from 'lucide-react'
import { Highlight, themes } from 'prism-react-renderer'
import { Input } from '@/components/ui/input'
import { SYSTEM_PROMPT } from '@/constants/prompt'
import { LeetCodeAdapter } from './adapters/LeetCodeAdapter'

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'

import { cn } from '@/lib/utils'
import { Card, CardContent, CardFooter } from '@/components/ui/card'

// API calls are routed through background.js via chrome.runtime.sendMessage
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
import { LIMIT_VALUE } from '@/lib/indexedDB'
import { getChatHistory, saveChatHistory, clearChatHistory } from '@/lib/indexedDB'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuPortal,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,

  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

// TypeScript interface removed; using plain JS props.

const ChatBox = ({
  context,
  visible,
  model,
  apikey,
  baseUrl,
  customModelName,
  heandelModel,
  selectedModel,
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

  // Countdown timer for rate limit
  useEffect(() => {
    if (rateLimitSecs <= 0) return
    const timer = setTimeout(() => setRateLimitSecs(s => s - 1), 1000)
    return () => clearTimeout(timer)
  }, [rateLimitSecs])

  const getProblemName = () => {
    const adapter = new LeetCodeAdapter()
    if (adapter.match(window.location.href)) {
      return adapter.getProblemName()
    }
    return 'Unknown Problem'
  }

  const problemName = getProblemName()
  const inputFieldRef = useRef(null)

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

  /**
   * Handles the generation of an AI response via background script.
   * Routes API calls through the background service worker to bypass CORS.
   */
  const handleGenerateAIResponse = async (messageText) => {
    const adapter = new LeetCodeAdapter()
    let programmingLanguage = 'UNKNOWN'
    let extractedCode = ''

    if (adapter.match(window.location.href)) {
      programmingLanguage = adapter.getLanguage() || 'UNKNOWN'
      extractedCode = adapter.getUserCode()
    }

    // Truncate code to avoid blowing through free-tier token limits
    if (extractedCode.length > 3000) {
      extractedCode = extractedCode.slice(0, 3000) + '\n// ... (truncated)'
    }

    const systemPromptModified = SYSTEM_PROMPT.replace(
      /{{problem_statement}}/gi,
      context.problemStatement
    )
      .replace(/{{programming_language}}/g, programmingLanguage)
      .replace(/{{user_code}}/g, extractedCode)

    // Only send last 6 messages to keep under free-tier token limits
    const PCH = chatHistory.slice(-6)

    // Route API call through background script to bypass CORS
    const { error, success } = await new Promise((resolve) => {
      chrome.runtime.sendMessage(
        {
          action: 'generateAI',
          modelName: model,
          apiKey: apikey,
          config: { baseUrl, modelName: customModelName },
          prompt: messageText,
          systemPrompt: systemPromptModified,
          messages: PCH,
          extractedCode: extractedCode,
        },
        (response) => {
          if (chrome.runtime.lastError) {
            resolve({ error: { message: chrome.runtime.lastError.message }, success: null })
          } else {
            resolve(response || { error: { message: 'No response from background' }, success: null })
          }
        }
      )
    })

    if (error) {
      // Parse retry seconds from rate limit messages like "⏳ Rate limit... wait 12 seconds"
      const retryMatch = error.message?.match(/(\d+)\s*seconds?/i)
      if (retryMatch) setRateLimitSecs(parseInt(retryMatch[1], 10) + 2)

      const errorMessage = {
        role: 'assistant',
        content: error.message,
        timestamp: Date.now(),
      }
      await saveChatHistory(problemName, [
        ...priviousChatHistory,
        errorMessage,
      ])
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
      await saveChatHistory(problemName, [
        ...priviousChatHistory,
        res,
      ])
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
    if (totalMessages < offset) {
      return
    }
    setIsPriviousMsgLoading(true)
    const { chatHistory: moreMessages } = await getChatHistory(
      problemName,
      LIMIT_VALUE,
      offset
    )

    if (moreMessages.length > 0) {
      setChatHistory((prev) => [...moreMessages, ...prev]) // Correctly merge the new messages with the previous ones
      setOffset((prevOffset) => prevOffset + LIMIT_VALUE)
    }

    setTimeout(() => {
      setIsPriviousMsgLoading(false)
    }, 500)
  }

  const handleScroll = (e) => {
    const target = e.currentTarget
    if (target.scrollTop === 0) {
      console.log('Reached the top, loading more messages...')
      loadMoreMessages()
    }
  }

  const onSendMessage = async (value) => {
    setIsResponseLoading(true)
    const newMessage = {
      role: 'user',
      content: value,
      timestamp: Date.now()
    }

    setPreviousChatHistory((prev) => {
      return [...prev, newMessage]
    })
    setChatHistory([...chatHistory, newMessage])

    lastMessageRef.current?.scrollIntoView({ behavior: 'smooth' })
    handleGenerateAIResponse(value)
  }

  if (!visible) return <></>

  return (
    <Card className="mb-2 ">
      <div className="flex gap-2 items-center justify-between h-16 rounded-t-lg px-3">
        <div className="flex gap-2 items-center justify-start">
          <div className="bg-white rounded-full p-1.5">
            <Bot color="#000" className="h-5 w-5" />
          </div>
          <div>
            <h3 className="font-bold text-sm">Need Help?</h3>
            <h6 className="font-normal text-[10px] opacity-60">
              {VALID_MODELS.find((m) => m.name === selectedModel)?.display || 'No model'}
            </h6>
          </div>
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-red-400 hover:text-red-300 hover:bg-red-900/30"
          title="Clear chat"
          onClick={heandelClearChat}
        >
          <Eraser size={16} strokeWidth={1.5} />
        </Button>
      </div>
      <CardContent className="p-2">
        {chatHistory.length > 0 ? (
          <ScrollArea
            className="space-y-4 h-[500px] w-[400px] p-2"
            ref={scrollAreaRef}
            onScroll={handleScroll}
          >
            {totalMessages > offset && (
              <div className="flex w-full items-center justify-center">
                <Button
                  className="text-sm p-1 m-x-auto bg-transpernent text-white hover:bg-transpernent"
                  onClick={loadMoreMessages}
                >
                  Load Previous Messages
                </Button>
              </div>
            )}
            {chatHistory.map((message, index) => (
              <div
                key={index}
                className={cn(
                  'flex w-max max-w-[75%] flex-col gap-2 px-3 py-2 text-sm my-4',
                  message.role === 'user'
                    ? 'ml-auto bg-primary text-primary-foreground rounded-bl-lg rounded-tl-lg rounded-tr-lg '
                    : 'bg-muted rounded-br-lg rounded-tl-lg rounded-tr-lg'
                )}
              >
                <>
                  <div className="max-w-80" style={{ whiteSpace: 'pre-wrap' }}>
                    {(() => {
                      try {
                        const parsedContent = JSON.parse(message.content)
                        if (typeof parsedContent === 'string') return parsedContent
                        if (parsedContent && typeof parsedContent === 'object' && 'feedback' in parsedContent) {
                          return parsedContent.feedback
                        }
                        return message.content
                      } catch {
                        return message.content
                      }
                    })()}
                  </div>

                  {(() => {
                    try {
                      const parsedContent = JSON.parse(message.content)
                      return typeof parsedContent === 'object' && parsedContent !== null
                    } catch {
                      return false
                    }
                  })() && (
                      <Accordion type="multiple">
                        {(() => {
                          try {
                            const parsedContent = JSON.parse(message.content)
                            return parsedContent?.hints && parsedContent.hints.length > 0
                          } catch {
                            return false
                          }
                        })() && (
                            <AccordionItem value="item-1" className="max-w-80">
                              <AccordionTrigger>Hints 👀</AccordionTrigger>
                              <AccordionContent>
                                <ul className="space-y-4">
                                  {(() => {
                                    try {
                                      const parsedContent = JSON.parse(message.content)
                                      return parsedContent?.hints?.map((e) => (
                                        <li key={e}>{e}</li>
                                      ))
                                    } catch {
                                      return []
                                    }
                                  })()}
                                </ul>
                              </AccordionContent>
                            </AccordionItem>
                          )}
                        {(() => {
                          try {
                            const parsedContent = JSON.parse(message.content)
                            return parsedContent?.snippet
                          } catch {
                            return false
                          }
                        })() && (
                            <AccordionItem value="item-2" className="max-w-80">
                              <AccordionTrigger>Code 🧑🏻‍💻</AccordionTrigger>

                              <AccordionContent>
                                <div className="mt-4 rounded-md">
                                  <div className="relative">
                                    <Copy
                                      onClick={() => {
                                        try {
                                          const parsedContent = JSON.parse(message.content)
                                          if (parsedContent?.snippet) {
                                            navigator.clipboard.writeText(parsedContent.snippet)
                                          }
                                        } catch {
                                          // If parsing fails, do nothing
                                        }
                                      }}
                                      className="absolute right-2 top-2 h-4 w-4"
                                    />
                                    <Highlight
                                      theme={themes.dracula}
                                      code={(() => {
                                        try {
                                          const parsedContent = JSON.parse(message.content)
                                          return parsedContent?.snippet || ''
                                        } catch {
                                          return ''
                                        }
                                      })()}
                                      language={(() => {
                                        try {
                                          const parsedContent = JSON.parse(message.content)
                                          return parsedContent?.programmingLanguage?.toLowerCase() || 'javascript'
                                        } catch {
                                          return 'javascript'
                                        }
                                      })()}
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
                                          className={cn(
                                            className,
                                            'p-3 rounded-md'
                                          )}
                                        >
                                          {tokens.map((line, i) => (
                                            <div
                                              key={i}
                                              {...getLineProps({ line })}
                                            >
                                              {line.map((token, key) => (
                                                <span
                                                  key={key}
                                                  {...getTokenProps({ token })}
                                                />
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
                </>
              </div>
            ))}
            {isResponseLoading && (
              <div className={'flex w-max max-w-[75%] flex-col my-2'}>
                <div className="w-5 h-5 rounded-full animate-pulse bg-primary"></div>
              </div>
            )}
            <div ref={lastMessageRef} />
          </ScrollArea>
        ) : (
          <div>
            <p className="flex items-center justify-center h-[510px] w-[400px] text-center space-y-4">
              No messages yet.
            </p>
          </div>
        )}
      </CardContent>
      <CardFooter>
        <form
          onSubmit={(event) => {
            event.preventDefault()
            if (value.trim().length === 0) return
            onSendMessage(value)
            setValue('')
          }}
          className="flex w-full items-center space-x-2"
        >
          <Input
            id="message"
            placeholder={rateLimitSecs > 0 ? `Rate limited — wait ${rateLimitSecs}s…` : 'Type your message...'}
            className="flex-1"
            autoComplete="off"
            value={value}
            onChange={(event) => setValue(event.target.value)}
            disabled={isResponseLoading || rateLimitSecs > 0}
            required
            ref={inputFieldRef}
          />
          <Button
            type="submit"
            className="bg-[#fafafa] rounded-lg text-black min-w-[40px] text-xs"
            size="icon"
            disabled={value.length === 0 || rateLimitSecs > 0 || isResponseLoading}
          >
            {rateLimitSecs > 0 ? <span>{rateLimitSecs}s</span> : <Send className="h-4 w-4" />}
            <span className="sr-only">Send</span>
          </Button>
        </form>
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

  const ref = useRef(null)

  React.useEffect(() => {
    const adapter = new LeetCodeAdapter()

    // Initial check
    if (adapter.match(window.location.href)) {
      const statement = adapter.getProblemStatement()
      if (statement) setProblemStatement(statement)
    }

    const observer = new MutationObserver(() => {
      if (adapter.match(window.location.href)) {
        const statement = adapter.getProblemStatement()
        if (statement && statement !== problemStatement) {
          setProblemStatement(statement)
        }
      }
    })

    observer.observe(document.body, { childList: true, subtree: true })

    // Close chatbox when clicking outside the extension container
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
  // Load model + API key from storage, and re-load whenever the popup saves new settings.
  const loadFromStorage = React.useCallback(async () => {
    try {
      const storedModel = await selectModel()
      const data = await getKeyModel(storedModel)
      setSelectedModel(storedModel)
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
    // Re-load whenever the popup (or any part of the extension) writes to storage
    const onStorageChanged = () => loadFromStorage()
    chrome.storage.onChanged.addListener(onStorageChanged)
    return () => chrome.storage.onChanged.removeListener(onStorageChanged)
  }, [loadFromStorage])

  const heandelModel = (v) => {
    if (v) {
      setSelectModel(v)
      setSelectedModel(v)
    }
  }

  return (
    <div
      ref={ref}
      className="dark z-[2147483647]"
      style={{
        position: 'fixed',
        bottom: '30px',
        right: '30px',
      }}
    >
      {chatboxExpanded && (
        !model || !apiKey ? (
          <Card className="mb-5">
            <CardContent className="h-[500px] grid place-items-center">
              <div className="grid place-items-center gap-4">
                {!selectedModel && (
                  <>
                    <p className="text-center">
                      Please configure the extension before using this
                      feature.
                    </p>
                    <Button
                      onClick={() => {
                        chrome.runtime.sendMessage({ action: 'openPopup' })
                      }}
                    >
                      configure
                    </Button>
                  </>
                )}
                {selectedModel && (
                  <>
                    <p>
                      We couldn't find any API key for selected model{' '}
                      <b>
                        <u>{selectedModel}</u>
                      </b>
                    </p>
                    <p>you can select another models</p>
                    <Select
                      onValueChange={(v) => heandelModel(v)}
                      value={selectedModel}
                    >
                      <SelectTrigger className="w-56">
                        <SelectValue placeholder="Select a model" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectGroup>
                          <SelectLabel>Model</SelectLabel>
                          <SelectSeparator />
                          {VALID_MODELS.map((modelOption) => (
                            <SelectItem
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
            heandelModel={heandelModel}
            selectedModel={selectedModel}
          />
        )
      )}
      {/* Bot button should ALWAYS be visible */}
      <div className="flex justify-end">
        <Button
          size={'icon'}
          onClick={() => setChatboxExpanded(!chatboxExpanded)}
        >
          <Bot />
        </Button>
      </div>
    </div>
  )
}

// Duplicate mounting code removed.
// The component is mounted by src/content.jsx
export default ContentPage

// ── Injection ──────────────────────────────────────────────────────────────
// Vite builds this file directly as the "content" entry point.
// We inject our React root here and use a MutationObserver to re-inject
// if LeetCode's SPA (Next.js) removes the container during navigation.

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

// Initial injection — wait for body if needed
if (document.body) {
  ensureContainer()
} else {
  document.addEventListener('DOMContentLoaded', ensureContainer)
}

// Re-inject whenever LeetCode's SPA removes our container
new MutationObserver(() => {
  if (!document.getElementById(CONTAINER_ID)) {
    ensureContainer()
  }
}).observe(document.body, { childList: true, subtree: false })