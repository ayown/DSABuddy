/* eslint-disable @typescript-eslint/no-explicit-any */

// TypeScript interfaces removed for JS-only project.

/**
 * Parses a chat history string into structured data.
 * 
 * @param historyString - The raw chat history string to parse.
 * @returns An array of parsed chat history messages.
 */
export function parseChatHistory(historyString) {
  try {
    const parsed = JSON.parse(historyString)
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}
// TypeScript abstract class and types removed for JS-only project.