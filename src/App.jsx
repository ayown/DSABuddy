import React, { useState } from 'react'

// import leetCode from '@/assets/leetcode.png'

import { Button } from '@/components/ui/button'
import Show from '@/components/Show'
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectLabel,
  SelectItem,
  SelectSeparator,
  SelectValue,
  SelectTrigger,
} from '@/components/ui/select'
import { VALID_MODELS } from './constants/valid_models'
import { HideApiKey, Input } from '@/components/ui/input'
import { setKeyModel, getKeyModel, setSelectModel, selectModel } from '@/lib/chromeStorage'

const Popup = () => {
  const [apikey, setApikey] = React.useState(null)
  const [model, setModel] = React.useState(null)
  const [baseUrl, setBaseUrl] = React.useState('')
  const [customModelName, setCustomModelName] = React.useState('')
  const [isLoaded, setIsLoaded] = React.useState(false)

  const [isloading, setIsloading] = useState(false)
  const [submitMessage, setSubmitMessage] = useState(null)

  const [selectedModel, setSelectedModel] = useState(undefined)

  const updatestorage = async (e) => {
    e.preventDefault()
    try {
      setIsloading(true)

      if (apikey && model) {
        await setSelectModel(model)
        await setKeyModel(apikey, model, baseUrl, customModelName)
      }

      setSubmitMessage({
        state: 'success',
        message: 'API Key saved successfully',
      })
    } catch (error) {
      setSubmitMessage({
        state: 'error',
        message: error.message,
      })
    } finally {
      setIsloading(false)
    }
  }

  React.useEffect(() => {
    const loadChromeStorage = async () => {
      try {
        if (typeof chrome === 'undefined' || !chrome.storage) {
          setIsLoaded(true)
          return
        }

        const storedModel = await selectModel()
        // Default to first available model if nothing is stored
        const modelToUse = storedModel || VALID_MODELS[0]?.name

        if (!storedModel && modelToUse) {
          await setSelectModel(modelToUse)
        }

        setModel(modelToUse)
        setSelectedModel(modelToUse)

        if (modelToUse) {
          const data = await getKeyModel(modelToUse)
          if (data) {
            setApikey(data.apiKey)
            setBaseUrl(data.baseUrl || '')
            setCustomModelName(data.customModelName || '')
          }
        }
      } catch (error) {
        console.error('Failed to load settings:', error)
      } finally {
        setIsLoaded(true)
      }
    }

    loadChromeStorage()
  }, [])

  const heandelModel = async (v) => {
    if (v) {
      setSelectModel(v)
      setModel(v)
      setSelectedModel(v)
      const data = await getKeyModel(v)
      setApikey(data.apiKey)
      setBaseUrl(data.baseUrl || '')
      setCustomModelName(data.customModelName || '')
    }
  }

  return (
    <div className="relative w-[340px] overflow-hidden rounded-[1.75rem] bg-[#050816] p-2.5 text-foreground shadow-[0_22px_70px_rgba(0,0,0,0.45)]">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -left-16 top-0 h-40 w-40 rounded-full bg-cyan-400/18 blur-3xl" />
        <div className="absolute right-[-3.5rem] top-20 h-52 w-52 rounded-full bg-indigo-500/20 blur-3xl" />
        <div className="absolute bottom-0 left-12 h-36 w-36 rounded-full bg-orange-400/12 blur-3xl" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.09),transparent_38%),linear-gradient(155deg,rgba(255,255,255,0.08),rgba(255,255,255,0.01)_42%,rgba(10,14,30,0.72)_100%)]" />
      </div>
      <Show show={isLoaded}>
        <div className="relative overflow-hidden rounded-[1.6rem] border border-white/12 bg-white/8 p-4 shadow-[0_18px_60px_rgba(0,0,0,0.38)] backdrop-blur-2xl">
          <div className="absolute inset-x-5 top-0 h-px bg-gradient-to-r from-transparent via-white/45 to-transparent" />
          <div className="absolute inset-y-10 right-0 w-px bg-gradient-to-b from-transparent via-white/15 to-transparent" />

          <div className="rounded-[1.35rem] border border-white/10 bg-black/20 px-4 py-4 shadow-inner shadow-white/5">
            <p className="text-[0.62rem] font-semibold uppercase tracking-[0.35em] text-cyan-200/70">
              DSA Buddy
            </p>
            <h1 className="mt-2 text-[2rem] font-bold leading-[0.92] text-white">
              LeetCode <span className="text-whisperOrange">Whisper</span>
            </h1>
            <p className="mt-3 max-w-[230px] text-sm leading-5 text-slate-300">
              Your Companion to Beat LeetCode!
            </p>
            <div className="mt-4 flex items-center gap-2 text-[0.62rem] uppercase tracking-[0.24em] text-slate-300/75">
              <span className="h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_14px_rgba(74,222,128,0.85)]" />
              Dark mode tuned
            </div>
          </div>

          <form
            onSubmit={(e) => updatestorage(e)}
            className="mt-4 flex flex-col gap-2.5"
          >
            <div className="rounded-[1.25rem] border border-white/10 bg-white/[0.06] p-3.5 shadow-[inset_0_1px_0_rgba(255,255,255,0.08)] backdrop-blur-xl">
              <label htmlFor="text" className="text-[0.7rem] font-medium uppercase tracking-[0.24em] text-slate-300/70">
                select a model
              </label>
              <Select
                onValueChange={(v) => heandelModel(v)}
                value={selectedModel}
              >
                <SelectTrigger className="mt-2.5 h-10 w-full rounded-[1.1rem] border-white/10 bg-black/25 px-4 text-slate-100 shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]">
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
            </div>
            {model === 'custom' && (
              <div className="rounded-[1.25rem] border border-white/10 bg-white/[0.06] p-3.5 shadow-[inset_0_1px_0_rgba(255,255,255,0.08)] backdrop-blur-xl">
                <div className="space-y-2">
                  <label htmlFor="baseUrl" className="text-[0.7rem] font-medium uppercase tracking-[0.24em] text-slate-300/70">
                    Base URL (Optional)
                  </label>
                  <Input
                    className="mt-2.5"
                    iclassName="h-10 rounded-[1.1rem] border-white/10 bg-black/25 px-4 text-slate-100 placeholder:text-slate-400 shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]"
                    id="baseUrl"
                    value={baseUrl}
                    onChange={(e) => setBaseUrl(e.target.value)}
                    placeholder="https://api.openai.com/v1"
                  />
                </div>
                <div className="mt-3.5 space-y-2">
                  <label htmlFor="customModelName" className="text-[0.7rem] font-medium uppercase tracking-[0.24em] text-slate-300/70">
                    Model Name (Optional)
                  </label>
                  <Input
                    className="mt-2.5"
                    iclassName="h-10 rounded-[1.1rem] border-white/10 bg-black/25 px-4 text-slate-100 placeholder:text-slate-400 shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]"
                    id="customModelName"
                    value={customModelName}
                    onChange={(e) => setCustomModelName(e.target.value)}
                    placeholder="e.g. gpt-4-turbo"
                  />
                </div>
              </div>
            )}
            <div className="rounded-[1.25rem] border border-white/10 bg-white/[0.06] p-3.5 shadow-[inset_0_1px_0_rgba(255,255,255,0.08)] backdrop-blur-xl">
              <label htmlFor="text" className="text-[0.7rem] font-medium uppercase tracking-[0.24em] text-slate-300/70">
                API Key {model ? `for ${model}` : ''}
              </label>
              <HideApiKey
                className="mt-2.5"
                iclassName="h-10 rounded-[1.1rem] border-white/10 bg-black/25 px-4 text-slate-100 placeholder:text-slate-400 shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]"
                value={apikey || ''}
                onChange={(e) => setApikey(e.target.value)}
                placeholder="Enter OpenAI API Key"
                disabled={!model}
                required
              />
            </div>

            <Button
              disabled={isloading}
              type="submit"
              className="mt-0.5 w-full rounded-[1.15rem] border border-cyan-300/20 bg-gradient-to-r from-cyan-400 to-blue-500 px-4 py-2.5 text-[0.74rem] font-semibold uppercase tracking-[0.28em] text-slate-950 shadow-[0_16px_38px_rgba(34,211,238,0.22)] hover:from-cyan-300 hover:to-blue-400"
            >
              save API Key
            </Button>
          </form>

          {submitMessage ? (
            <div
              className="mt-2.5 flex items-center justify-center rounded-[1.15rem] border px-4 py-2.5 text-center text-sm backdrop-blur-xl"
              style={{
                color: submitMessage.state === 'error' ? '#fca5a5' : '#86efac',
                border:
                  submitMessage.state === 'error'
                    ? '1px solid rgba(239, 68, 68, 0.35)'
                    : '1px solid rgba(34, 197, 94, 0.35)',
                backgroundColor:
                  submitMessage.state === 'error'
                    ? 'rgba(127, 29, 29, 0.22)'
                    : 'rgba(20, 83, 45, 0.2)',
              }}
            >
              {submitMessage.state === 'error' ? (
                <p className="text-red-300">{submitMessage.message}</p>
              ) : (
                <p className="text-green-300">{submitMessage.message}</p>
              )}
            </div>
          ) : (
            ''
          )}

          <div className="mt-4 flex items-center justify-center rounded-[1.15rem] border border-white/8 bg-black/15 px-4 py-2.5 text-center">
            <p className="text-[0.82rem] text-slate-300">
              Want more features?&nbsp;
              <a
                href="https://github.com/ayown/DSABuddy/issues/new"
                className="text-cyan-300 transition-colors hover:text-cyan-200 hover:underline"
                target="_blank"
              >
                Request a feature!
              </a>
            </p>
          </div>
        </div>
      </Show>
    </div>
  )
}

export default Popup
