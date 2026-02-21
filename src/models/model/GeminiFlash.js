import { ModelInterface } from '../../interface/ModelInterface'
import { VALID_MODELS } from '@/constants/valid_models'

const RESPONSE_SCHEMA = {
    type: 'OBJECT',
    properties: {
        feedback: { type: 'STRING', description: 'Main response / feedback to the user' },
        hints: { type: 'ARRAY', items: { type: 'STRING' }, description: 'Up to 2 hints (optional)' },
        snippet: { type: 'STRING', description: 'Optional code snippet' },
        programmingLanguage: {
            type: 'STRING',
            description: 'Programming language of the snippet (e.g. python, java, cpp)',
        },
    },
    required: ['feedback'],
}

const SCHEMA_NOTE = `Always respond with a JSON object with: "feedback" (string, required), "hints" (array of up to 2 strings, optional), "snippet" (code string, optional), "programmingLanguage" (string, optional).`

export class GeminiFlash extends ModelInterface {
    name = 'gemini_flash'
    apiKey = ''

    init(apiKey) {
        this.apiKey = apiKey
    }

    async generateResponse(props) {
        try {
            const modelEntry = VALID_MODELS.find((m) => m.name === this.name)
            const modelId = modelEntry?.model ?? 'gemini-2.0-flash'
            const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelId}:generateContent?key=${this.apiKey}`

            const contents = []
            if (props.messages && props.messages.length > 0) {
                for (const msg of props.messages) {
                    contents.push({
                        role: msg.role === 'assistant' ? 'model' : 'user',
                        parts: [{ text: typeof msg.content === 'string' ? msg.content : JSON.stringify(msg.content) }]
                    })
                }
            }
            contents.push({ role: 'user', parts: [{ text: props.prompt }] })

            const body = {
                system_instruction: {
                    parts: [{ text: (props.systemPrompt || '') + '\n' + SCHEMA_NOTE }]
                },
                contents,
                generationConfig: {
                    responseMimeType: 'application/json',
                    responseSchema: RESPONSE_SCHEMA,
                }
            }

            const response = await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body)
            })

            if (!response.ok) {
                const errText = await response.text()
                let friendlyError
                try {
                    const errJson = JSON.parse(errText)
                    const code = errJson?.error?.code
                    const msg = errJson?.error?.message || errText
                    if (code === 429) {
                        const retryMatch = errText.match(/"retryDelay"\s*:\s*"(\d+)s"/)
                        const waitSec = retryMatch ? retryMatch[1] : '60'
                        friendlyError = `⏳ Rate limit reached (free tier). Please wait ${waitSec} seconds and try again.`
                    } else if (code === 403 || code === 401) {
                        friendlyError = `🔑 Invalid API key. Please check your key in the extension settings.`
                    } else if (code === 404) {
                        friendlyError = `❌ Model not available. Try switching to a different model.`
                    } else {
                        friendlyError = `API error ${code}: ${msg}`
                    }
                } catch {
                    friendlyError = `API error ${response.status}: ${errText}`
                }
                return { error: { message: friendlyError }, success: null }
            }

            const json = await response.json()
            const rawText = json?.candidates?.[0]?.content?.parts?.[0]?.text || ''

            let parsed
            try { parsed = JSON.parse(rawText) }
            catch { parsed = { feedback: rawText } }

            return { error: null, success: parsed }
        } catch (error) {
            return { error: { message: error.message || 'Unknown error' }, success: null }
        }
    }
}
