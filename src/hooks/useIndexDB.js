import { clearChatHistory, getChatHistory, saveChatHistory } from '@/lib/indexedDB'

export const useIndexDB = () => {
  return {
    saveChatHistory: async (problemName, history) => {
      await saveChatHistory(problemName, history)
    },

    fetchChatHistory: async (problemName, limit, offset) => {
      return await getChatHistory(problemName, limit, offset)
    },

    clearChatHistory: async (problemName) => {
      await clearChatHistory(problemName)
    },
  }
}