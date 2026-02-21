import { GeminiAI_1_5_pro } from '@/models/model/GeminiAI_1_5_pro'
import { GeminiFlash } from '@/models/model/GeminiFlash'
import { GroqModel } from '@/models/model/GroqModel'
import { GenericOpenAI } from './model/GenericOpenAI'

// Each Groq model is the same class — the model ID is looked up from VALID_MODELS at runtime
function groq(name) {
  const m = new GroqModel()
  m.name = name
  return m
}

export const models = {
  'groq_llama': groq('groq_llama'),
  'groq_deepseek': groq('groq_deepseek'),
  'gemini_flash': new GeminiFlash(),
  'gemini_1.5_pro': new GeminiAI_1_5_pro(),
  'custom': new GenericOpenAI(),
}