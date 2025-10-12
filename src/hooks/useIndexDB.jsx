import type { ChatHistoryParsed } from '@/interface/chatHistory'
import {
  clearChatHistory,
  getChatHistory,
  saveChatHistory,
} from '@/lib/indexedDB'

export const useIndexDB = () => {
  return {
    saveChatHistory: async (problemName: string, history: ChatHistoryParsed[]) => {
      await saveChatHistory(problemName, history)
    },

    fetchChatHistory: async (
      problemName: string,
      limit: number,
      offset: number
    ) => {
      return await getChatHistory(problemName, limit, offset)
    },

    clearChatHistory: async (problemName: string) => {
      await clearChatHistory(problemName)
    },
  }
}