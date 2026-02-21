import { ModelInterface } from '../../interface/ModelInterface'
import { VALID_MODELS } from '@/constants/valid_models'

const RESPONSE_SCHEMA = {
  type: 'OBJECT',
  properties: {
    feedback: { type: 'STRING' },
    hints: { type: 'ARRAY', items: { type: 'STRING' } },
    snippet: { type: 'STRING' },
    programmingLanguage: { type: 'STRING' },
  },
  required: ['feedback'],
}

const SCHEMA_NOTE = `Always respond with a JSON object with: "feedback" (string, required), "hints" (array of up to 2 strings, optional), "snippet" (code string, optional), "programmingLanguage" (string, optional).`

function parseFriendlyError(status, errText) {
  try {
    const errJson = JSON.parse(errText)
    const code = errJson?.error?.code
    const msg = errJson?.error?.message || errText
    if (code === 429) {
      const m = errText.match(/"retryDelay"\s*:\s*"(\d+)s"/)
      return `⏳ Rate limit reached (free tier). Please wait ${m ? m[1] : '60'} seconds and retry.`
    }
    if (code === 403 || code === 401) return `🔑 Invalid API key. Please check your key in the extension popup.`
    if (code === 404) return `❌ Model not available. Try switching to a different model.`
    return `API error ${code}: ${msg}`
  } catch {
    return `API error ${status}: ${errText}`
  }
}

export class GeminiAI_1_5_pro extends ModelInterface {
  name = 'gemini_1.5_pro'
  apiKey = ''

  init(apiKey) {
    this.apiKey = apiKey
  }

  async generateResponse(props) {
    try {
      const modelEntry = VALID_MODELS.find((m) => m.name === this.name)
      const modelId = modelEntry?.model ?? 'gemini-1.5-flash'
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelId}:generateContent?key=${this.apiKey}`

      const contents = []
      if (props.messages?.length > 0) {
        for (const msg of props.messages) {
          contents.push({
            role: msg.role === 'assistant' ? 'model' : 'user',
            parts: [{ text: typeof msg.content === 'string' ? msg.content : JSON.stringify(msg.content) }]
          })
        }
      }
      contents.push({ role: 'user', parts: [{ text: props.prompt }] })

      const body = {
        system_instruction: { parts: [{ text: (props.systemPrompt || '') + '\n' + SCHEMA_NOTE }] },
        contents,
        generationConfig: { responseMimeType: 'application/json', responseSchema: RESPONSE_SCHEMA }
      }

      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      })

      if (!response.ok) {
        const errText = await response.text()
        return { error: { message: parseFriendlyError(response.status, errText) }, success: null }
      }

      const json = await response.json()
      const rawText = json?.candidates?.[0]?.content?.parts?.[0]?.text || ''
      let parsed
      try { parsed = JSON.parse(rawText) } catch { parsed = { feedback: rawText } }
      return { error: null, success: parsed }
    } catch (error) {
      return { error: { message: error.message || 'Unknown error' }, success: null }
    }
  }
}