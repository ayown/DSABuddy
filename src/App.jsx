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
    <div className="relative p-4 w-[350px] bg-background">
      <Show show={isLoaded}>
        <div className="">
          <div className="w-full  h-20 overflow-hidden ">
            <div className="mx-auto h-20 w-auto flex items-center justify-center">
              <h2 className="text-2xl font-bold text-white">DSA Buddy</h2>
            </div>
          </div>
          <div className="text-center">
            <h1 className=" font-bold text-3xl text-white">
              LeetCode <span className="text-whisperOrange">Whisper</span>
            </h1>
            <p className="text-sm text-muted-foreground">
              Your Companion to Beat LeetCode!
            </p>
          </div>
          <form
            onSubmit={(e) => updatestorage(e)}
            className="mt-10 flex flex-col gap-2 w-full"
          >
            <div className="space-y-2">
              <label htmlFor="text" className="text-xs text-muted-foreground">
                select a model
              </label>
              <Select
                onValueChange={(v) => heandelModel(v)}
                value={selectedModel}
              >
                <SelectTrigger className="w-full">
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
            </div>
            {model === 'custom' && (
              <>
                <div className="space-y-2">
                  <label htmlFor="baseUrl" className="text-xs text-muted-foreground">
                    Base URL (Optional)
                  </label>
                  <Input
                    id="baseUrl"
                    value={baseUrl}
                    onChange={(e) => setBaseUrl(e.target.value)}
                    placeholder="https://api.openai.com/v1"
                  />
                </div>
                <div className="space-y-2">
                  <label htmlFor="customModelName" className="text-xs text-muted-foreground">
                    Model Name (Optional)
                  </label>
                  <Input
                    id="customModelName"
                    value={customModelName}
                    onChange={(e) => setCustomModelName(e.target.value)}
                    placeholder="e.g. gpt-4-turbo"
                  />
                </div>
              </>
            )}
            <div className="space-y-2">
              <label htmlFor="text" className="text-xs text-muted-foreground">
                API Key {model ? `for ${model}` : ''}
              </label>
              <HideApiKey
                value={apikey || ''}
                onChange={(e) => setApikey(e.target.value)}
                placeholder="Enter OpenAI API Key"
                disabled={!model}
                required
              />
            </div>
            <Button disabled={isloading} type="submit" className="w-full mt-2">
              save API Key
            </Button>
          </form>
          {submitMessage ? (
            <div
              className="mt-2 text-center text-sm text-muted-foreground flex items-center justify-center p-2 rounded-sm"
              style={{
                color: submitMessage.state === 'error' ? 'red' : 'green',
                border:
                  submitMessage.state === 'error'
                    ? '1px solid red'
                    : '1px solid green',
                backgroundColor:
                  submitMessage.state === 'error'
                    ? 'rgba(255, 0, 0, 0.1)'
                    : 'rgba(0, 255, 0, 0.1)',
              }}
            >
              {submitMessage.state === 'error' ? (
                <p className="text-red-500">{submitMessage.message}</p>
              ) : (
                <p className="text-green-500">{submitMessage.message}</p>
              )}
            </div>
          ) : (
            ''
          )}
          <div className="mt-7 flex items-center justify-center">
            <p className="text-sm">
              Want more features?&nbsp;
              <a
                href="https://github.com/ayown/DSABuddy/issues/new"
                className="text-blue-500 hover:underline"
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