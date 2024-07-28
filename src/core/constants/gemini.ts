import type { GeminiGenerationConfig, GeminiSafetySettings } from '../types'

export const GenerationConfig: GeminiGenerationConfig = {
  temperature: 0.5,
  topP: 1,
  maxOutputTokens: 4000,
}

export const SafetySettings: GeminiSafetySettings[] = [
  {
    category: 'HARM_CATEGORY_HARASSMENT',
    threshold: 'BLOCK_ONLY_HIGH',
  },
  {
    category: 'HARM_CATEGORY_HATE_SPEECH',
    threshold: 'BLOCK_ONLY_HIGH',
  },
  {
    category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT',
    threshold: 'BLOCK_ONLY_HIGH',
  },
  {
    category: 'HARM_CATEGORY_DANGEROUS_CONTENT',
    threshold: 'BLOCK_ONLY_HIGH',
  },
]
