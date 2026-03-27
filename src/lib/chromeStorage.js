const hasChromeStorage = () =>
  typeof chrome !== 'undefined' &&
  !!chrome.runtime?.id &&
  !!chrome.storage?.local

// All groq_* models share the same API key in storage
const storageKey = (model) =>
  typeof model === 'string' && model.startsWith('groq_') ? 'groq_llama' : model

export const setKeyModel = async (apiKey, model, baseUrl = '', customModelName = '') => {
    if (!hasChromeStorage()) return
    const key = storageKey(model)
    await chrome.storage.local.set({
        [key]: apiKey,
        [`${key}_baseUrl`]: baseUrl,
        [`${key}_customModelName`]: customModelName
    })
}

export const getKeyModel = async (model) => {
    if (!hasChromeStorage() || !model) {
        return {
            model: model || null,
            apiKey: null,
            baseUrl: '',
            customModelName: ''
        }
    }
    const key = storageKey(model)
    const result = await chrome.storage.local.get([
        key,
        `${key}_baseUrl`,
        `${key}_customModelName`
    ])
    return {
        model: model,
        apiKey: result[key],
        baseUrl: result[`${key}_baseUrl`],
        customModelName: result[`${key}_customModelName`]
    }
}

export const setSelectModel = async (model) => {
    if (!hasChromeStorage()) return
    await chrome.storage.local.set({ ['selectedModel']: model })
}

export const selectModel = async () => {
    if (!hasChromeStorage()) return null
    const result = await chrome.storage.local.get('selectedModel')
    return result['selectedModel']
}
