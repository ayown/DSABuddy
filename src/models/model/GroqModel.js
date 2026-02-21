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

const SCHEMA_NOTE = `\nAlways respond with a JSON object containing: "feedback" (string, required), "hints" (array of up to 2 strings, optional), "snippet" (code string, optional), "programmingLanguage" (string, optional).`

export class GroqModel extends ModelInterface {
    name = 'groq_llama'
    apiKey = ''

    init(apiKey) {
        this.apiKey = apiKey
    }

    async generateResponse(props) {
        try {
            const modelEntry = VALID_MODELS.find((m) => m.name === this.name)
            const modelId = modelEntry?.model ?? 'llama-3.3-70b-versatile'

            const messages = [
                { role: 'system', content: (props.systemPrompt || '') + SCHEMA_NOTE },
                ...(props.messages?.map(m => ({
                    role: m.role === 'assistant' ? 'assistant' : 'user',
                    content: typeof m.content === 'string' ? m.content : JSON.stringify(m.content)
                })) || []),
                { role: 'user', content: props.prompt }
            ]

            const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.apiKey}`
                },
                body: JSON.stringify({
                    model: modelId,
                    messages,
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
        } catch (error) {
            return { error: { message: error.message || 'Unknown error' }, success: null }
        }
    }
}
