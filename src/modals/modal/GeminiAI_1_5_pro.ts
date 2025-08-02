/* eslint-disable @typescript-eslint/no-explicit-any */
import type {
  GenerateResponseParamsType,
  GenerateResponseReturnType,
} from '../../interface/ModalInterface'
import { ModalInterface } from '../../interface/ModalInterface'
import { createGoogleGenerativeAI } from '@ai-sdk/google'
import { generateObjectResponce } from '../utils'
import { VALID_MODELS } from '@/constants/valid_modals'
import type { LanguageModelV1 } from 'ai'

export class GeminiAI_1_5_pro implements ModalInterface {
  name = 'gemini_1.5_pro'
  private apiKey: string = ''

  init(apiKey: string) {
    this.apiKey = apiKey
  }

  async generateResponse(
    props: GenerateResponseParamsType
  ): GenerateResponseReturnType {
    try {
      const google = createGoogleGenerativeAI({
        apiKey: this.apiKey,
      })

      const data = await generateObjectResponce({
        model: google(
          VALID_MODELS.find((model) => model.name === this.name)?.model ?? 'gemini-1.5-pro'
        ) as unknown as LanguageModelV1,
        messages: props.messages,
        systemPrompt: props.systemPrompt,
        prompt: props.prompt,
        extractedCode: props.extractedCode,
      })

      return {
        error: null,
        success: data.object,
      }
    } catch (error: any) {
      return { error, success: null }
    }
  }
}