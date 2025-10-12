/* eslint-disable @typescript-eslint/no-explicit-any */
import { outputSchema } from '@/schema/modelOutput'
import { z } from 'zod'
import type { ChatHistoryParsed } from './chatHistory'
import { parseChatHistory } from './chatHistory'

export type Roles =
  | 'user'
  | 'assistant'

export interface ChatHistory {
  role: Roles
  content: string | z.infer<typeof outputSchema>
}

// Re-export the types from chatHistory.ts
export type { ChatHistoryParsed }
export { parseChatHistory }

export const parseChatHistoryFromModal = (chatHistory) => {
  return chatHistory.map((history) => ({
    role: history.role,
    content: typeof history.content === 'string' ? history.content : JSON.stringify(history.content),
    timestamp: Date.now(),
  }))
}

export class ModalInterface {
  init(apiKey) {}
  async generateResponse(props) {
    throw new Error('generateResponse must be implemented in subclass')
  }
}

export { parseChatHistory }