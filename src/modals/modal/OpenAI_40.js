import { ModalInterface } from '../../interface/ModalInterface'
import { createOpenAI } from '@ai-sdk/openai'
import { generateObjectResponce } from '../utils'
import { VALID_MODELS } from '@/constants/valid_modals'

export class OpenAi_4o extends ModalInterface {
  name = 'openai_4o'
  apiKey = ''

  init(apiKey) {
    this.apiKey = apiKey
  }

  async generateResponse(props) {
    try {
      const openai = createOpenAI({ compatibility: 'strict', apiKey: this.apiKey })
      const data = await generateObjectResponce({
        model: openai(VALID_MODELS.find((m) => m.name === this.name)?.model),
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