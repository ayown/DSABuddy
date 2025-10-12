import { openDB } from 'idb'

const dbPromise = openDB('chat-db', 1, {
  upgrade(db) {
    db.createObjectStore('chats', { keyPath: 'problemName' })
  },
})

export const saveChatHistory = async (problemName, history) => {
  const db = await dbPromise
  await db.put('chats', { problemName, chatHistory: history })
}

export const getChatHistory = async (problemName, limit, offset) => {
  const db = await dbPromise
  const chatData = await db.get('chats', problemName)
  if (!chatData) return { totalMessageCount: 0, chatHistory: [] }

  const { chatHistory } = chatData
  const totalMessageCount = chatHistory.length

  const slicedHistory = chatHistory.slice(
    Math.max(totalMessageCount - offset - limit, 0),
    totalMessageCount - offset
  )
  return {
    totalMessageCount,
    chatHistory: slicedHistory,
    allChatHistory: chatHistory || [],
  }
}

export const clearChatHistory = async (problemName) => {
  const db = await dbPromise
  await db.delete('chats', problemName)
}

export const LIMIT_VALUE = 10