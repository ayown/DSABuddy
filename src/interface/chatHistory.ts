/* eslint-disable @typescript-eslint/no-explicit-any */
import { outputSchema } from '@/schema/modelOutput'
import { z } from 'zod'

/**
 * Represents a parsed chat history message.
 */
export interface ChatHistoryParsed {
  role: 'user' | 'assistant'
  content: string
  timestamp: number
}

/**
 * Represents the raw chat history as stored.
 */
export interface ChatHistory {
  id: string
  messages: ChatHistoryParsed[]
  createdAt: number
  updatedAt: number
}

/**
 * Parses a chat history string into structured data.
 * 
 * @param historyString - The raw chat history string to parse.
 * @returns An array of parsed chat history messages.
 */
export function parseChatHistory(historyString: string): ChatHistoryParsed[] {
  try {
    const parsed = JSON.parse(historyString)
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

/**
 * Defines the contract for AI modal implementations.
 *
 * Each modal must have a unique `name` and provide methods for initialization
 * and response generation.
 */
export abstract class ModalInterface {
  /**
   * The unique name of the modal.
   */
  abstract name: string

  /**
   * Initializes the modal with the provided API key.
   *
   * @param apiKey - The API key used to authenticate with the AI service.
   */
  abstract init(apiKey?: string): void

  /**
   * Generates a response using the AI model.
   *
   * @param prompt - The main prompt provided by the user.
   * @param systemPrompt - A system-level instruction to guide the AI.
   * @param messages - A parsed history of the chat for context.
   * @param extractedCode - (Optional) A code snippet to assist the AI in its response.
   *
   * @returns A promise resolving to an object containing either:
   *  - `error`: Any error encountered during the API call.
   *  - `success`: The successful response data adhering to `outputSchema`.
   */
  abstract generateResponse(props: GenerateResponseParamsType): Promise<{
    error: Error | null
    success: z.infer<typeof outputSchema> | null
  }>
}

/**
 * Defines the contract for AI modal implementations.
 */
export type GenerateResponseReturnType = Promise<{
  error: Error | null
  success: z.infer<typeof outputSchema> | null | any
}>

/**
 * Defines the parameters for generating a response.
 */
export type GenerateResponseParamsType = {
  prompt: string
  systemPrompt: string
  messages: ChatHistoryParsed[] | []
  extractedCode?: string
}