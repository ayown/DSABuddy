// ── Model Logic ─────────────────────────────────────────────────────────────
// We implement the models directly here to ensure background.js is fully self-contained
// and avoid any build-time inlining/registry issues.

const SYSTEM_PROMPT_NOTE = `\nAlways respond with a JSON object containing: "feedback" (string, required), "hints" (array of up to 2 strings, optional), "snippet" (code string, optional), "programmingLanguage" (string, optional).`

async function callGroq(apiKey, modelId, prompt, systemPrompt, messages) {
  try {
    const groqMessages = [
      { role: 'system', content: (systemPrompt || '') + SYSTEM_PROMPT_NOTE },
      ...(messages?.map(m => ({
        role: m.role === 'assistant' ? 'assistant' : 'user',
        content: typeof m.content === 'string' ? m.content : JSON.stringify(m.content)
      })) || []),
      { role: 'user', content: prompt }
    ]

    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: modelId,
        messages: groqMessages,
        response_format: { type: 'json_object' }
      })
    })

    if (!response.ok) {
      const errText = await response.text()
      return { error: { message: `Groq error ${response.status}: ${errText}` }, success: null }
    }

    const json = await response.json()
    const content = json.choices[0].message.content
    let parsed
    try { parsed = JSON.parse(content) } catch { parsed = { feedback: content } }
    return { error: null, success: parsed }
  } catch (err) {
    return { error: { message: `Groq connection error: ${err.message}` }, success: null }
  }
}

async function callGemini(apiKey, modelId, prompt, systemPrompt, messages) {
  try {
    const geminiMessages = []
    if (messages?.length > 0) {
      for (const m of messages) {
        geminiMessages.push({
          role: m.role === 'assistant' ? 'model' : 'user',
          parts: [{ text: typeof m.content === 'string' ? m.content : JSON.stringify(m.content) }]
        })
      }
    }
    geminiMessages.push({ role: 'user', parts: [{ text: prompt }] })

    const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelId}:generateContent?key=${apiKey}`
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        system_instruction: { parts: [{ text: (systemPrompt || '') + SYSTEM_PROMPT_NOTE }] },
        contents: geminiMessages,
        generationConfig: { responseMimeType: 'application/json' }
      })
    })

    if (!response.ok) {
      const errText = await response.text()
      return { error: { message: `Gemini error ${response.status}: ${errText}` }, success: null }
    }

    const data = await response.json()
    const content = data.candidates?.[0]?.content?.parts?.[0]?.text || ''
    let parsed
    try { parsed = JSON.parse(content) } catch { parsed = { feedback: content } }
    return { error: null, success: parsed }
  } catch (err) {
    return { error: { message: `Gemini connection error: ${err.message}` }, success: null }
  }
}

async function callCustom(apiKey, baseUrl, modelName, prompt, systemPrompt, messages) {
  try {
    const url = baseUrl.endsWith('/') ? `${baseUrl}chat/completions` : `${baseUrl}/chat/completions`
    const customMessages = [
      { role: 'system', content: (systemPrompt || '') + SYSTEM_PROMPT_NOTE },
      ...(messages?.map(m => ({
        role: m.role === 'assistant' ? 'assistant' : 'user',
        content: typeof m.content === 'string' ? m.content : JSON.stringify(m.content)
      })) || []),
      { role: 'user', content: prompt }
    ]

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: modelName,
        messages: customMessages,
        response_format: { type: 'json_object' }
      })
    })

    if (!response.ok) {
      const errText = await response.text()
      return { error: { message: `Custom API error ${response.status}: ${errText}` }, success: null }
    }

    const json = await response.json()
    const content = json.choices[0].message.content
    let parsed
    try { parsed = JSON.parse(content) } catch { parsed = { feedback: content } }
    return { error: null, success: parsed }
  } catch (err) {
    return { error: { message: `Custom API connection error: ${err.message}` }, success: null }
  }
}

// ── Background Handler ──────────────────────────────────────────────────────

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'openPopup') {
    try { chrome.action.openPopup() } catch (e) { }
    return false
  }

  if (request.action === 'generateAI') {
    const { modelName, apiKey, config, prompt, systemPrompt, messages } = request

    const run = async () => {
      try {
        let result
        if (modelName === 'groq_llama') result = await callGroq(apiKey, 'llama-3.3-70b-versatile', prompt, systemPrompt, messages)
        else if (modelName === 'groq_deepseek') result = await callGroq(apiKey, 'deepseek-r1-distill-llama-70b', prompt, systemPrompt, messages)
        else if (modelName === 'gemini_flash') result = await callGemini(apiKey, 'gemini-2.0-flash', prompt, systemPrompt, messages)
        else if (modelName === 'gemini_1.5_pro') result = await callGemini(apiKey, 'gemini-1.5-flash', prompt, systemPrompt, messages)
        else if (modelName === 'custom') result = await callCustom(apiKey, config.baseUrl, config.modelName, prompt, systemPrompt, messages)
        else {
          result = { error: { message: `Model ${modelName} not implemented` }, success: null }
        }
        sendResponse(result)
      } catch (err) {
        sendResponse({ error: { message: `Background error: ${err.message}` }, success: null })
      }
    }

    run()
    return true // Keep message channel open
  }
})