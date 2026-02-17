import { outputSchema } from '@/schema/modelOutput'
import { generateObject } from 'ai'
// TypeScript type imports removed for JS-only project.

/**
 * Generates an object response based on the provided parameters.
 *
 * @param {Object} params - The parameters for generating the object response.
 * @param {ChatHistoryParsed[] | []} params.messages - The chat history messages.
 * @param {string} params.systemPrompt - The system prompt to use.
 * @param {string} params.prompt - The user prompt to use.
 * @param {string} [params.extractedCode] - Optional extracted code to include in the messages.
 * @param {LanguageModelV1} params.model - The language model to use.
 * @returns {Promise<GenerateObjectResult>} A promise that resolves with the generated object response.
 */
export const generateObjectResponce = async ({
  messages,
  systemPrompt,
  prompt,
  extractedCode,
  model,
}) => {
  const data = await generateObject({
    model: model,
    schema: outputSchema,
    output: 'object',
    messages: [
      { role: 'system', content: systemPrompt },
      {
        role: 'system',
        content: `extractedCode (this code is writen by user): ${extractedCode}`,
      },
      ...messages,
      { role: 'user', content: prompt },
    ],
  })

  return data
}