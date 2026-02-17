/* eslint-disable @typescript-eslint/no-explicit-any */
import { parseChatHistory } from './chatHistory'

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