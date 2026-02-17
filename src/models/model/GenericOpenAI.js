import { ModelInterface } from '../../interface/ModelInterface'
import { createOpenAI } from '@ai-sdk/openai'
import { generateText } from 'ai'
import { outputSchema } from '@/schema/modelOutput'

export class GenericOpenAI extends ModelInterface {
    name = 'custom'
    apiKey = ''
    baseUrl = ''
    modelName = ''

    init(apiKey, config = {}) {
        this.apiKey = apiKey
        this.baseUrl = config.baseUrl || 'https://api.openai.com/v1'
        this.modelName = config.modelName || 'gpt-3.5-turbo'
    }

    async generateResponse({
        prompt,
        systemPrompt,
        messages,
        extractedCode,
    }) {
        const openai = createOpenAI({
            apiKey: this.apiKey,
            baseURL: this.baseUrl,
        })

        try {
            const { text } = await generateText({
                model: openai(this.modelName),
                system: systemPrompt,
                prompt: prompt,
                messages: messages,
            })

            return { success: text, error: null }
        } catch (error) {
            return { success: null, error: error }
        }
    }
}
