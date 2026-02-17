import { ModelInterface } from '../../interface/ModelInterface'
import { createGoogleGenerativeAI } from '@ai-sdk/google'
import { generateText } from 'ai'
import { VALID_MODELS } from '@/constants/valid_models'
import { outputSchema } from '@/schema/modelOutput'
import { generateObjectResponce } from '../utils'

export class GeminiAI_1_5_pro extends ModelInterface {
  name = 'gemini_1.5_pro'
  apiKey = ''

  init(apiKey) {
    this.apiKey = apiKey
  }

  async generateResponse(props) {
    try {
      const google = createGoogleGenerativeAI({ apiKey: this.apiKey })
      const data = await generateObjectResponce({
        model: google(VALID_MODELS.find((m) => m.name === this.name)?.model ?? 'gemini-1.5-pro'),
        messages: props.messages,
        systemPrompt: props.systemPrompt,
        prompt: props.prompt,
        extractedCode: props.extractedCode,
      })
      return { error: null, success: data.object }
    } catch (error) {
      return { error, success: null }
    }
  }
}