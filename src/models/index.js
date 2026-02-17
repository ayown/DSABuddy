import { ModelInterface } from '@/interface/ModelInterface'

import { OpenAI_3_5_turbo } from '@/models/model/OpenAI_3_5_turbo'
import { GeminiAI_1_5_pro } from '@/models/model/GeminiAI_1_5_pro'
import { OpenAi_4o } from './model/OpenAI_40'
import { GenericOpenAI } from './model/GenericOpenAI'

export const models = {
  'openai_3.5_turbo': new OpenAI_3_5_turbo(),
  openai_4o: new OpenAi_4o(),
  'gemini_1.5_pro': new GeminiAI_1_5_pro(),
  'custom': new GenericOpenAI(),
}