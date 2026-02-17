import { ModelInterface } from '../../interface/ModelInterface'
import { createOpenAI } from '@ai-sdk/openai'
import { generateObjectResponce } from '../utils'
import { generateText } from 'ai'
import { VALID_MODELS } from '@/constants/valid_models'
import { outputSchema } from '@/schema/modelOutput'

export class OpenAI_3_5_turbo extends ModelInterface {
  name = 'openai_3.5_turbo'
  apiKey = ''

  init(apiKey) {
    this.apiKey = apiKey
  }

  async generateResponse(props) {
    try {
      const openai = createOpenAI({ compatibility: 'strict', apiKey: this.apiKey })
      const data = await generateObjectResponce({
        model: openai.chat(VALID_MODELS.find((m) => m.name === this.name)?.model ?? 'gpt-3.5-turbo'),
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
