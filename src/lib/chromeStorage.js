export const setKeyModel = async (apiKey, model, baseUrl = '', customModelName = '') => {
    await chrome.storage.local.set({
        [model]: apiKey,
        [`${model}_baseUrl`]: baseUrl,
        [`${model}_customModelName`]: customModelName
    })
}

export const getKeyModel = async (model) => {
    const result = await chrome.storage.local.get([
        model,
        `${model}_baseUrl`,
        `${model}_customModelName`
    ])
    return {
        model: model,
        apiKey: result[model],
        baseUrl: result[`${model}_baseUrl`],
        customModelName: result[`${model}_customModelName`]
    }
}

export const setSelectModel = async (model) => {
    await chrome.storage.local.set({ ['selectedModel']: model })
}

export const selectModel = async () => {
    const result = await chrome.storage.local.get('selectedModel')
    return result['selectedModel']
}
