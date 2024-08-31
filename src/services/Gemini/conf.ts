import type { GeminiGenerationConfig, GeminiSafetySettings } from './types'

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

/** 群聊情景定义 */
export const GROUP_CHAT_POLICY =
  '你是一名专业且中立的助手。在群聊中，请确保对话保持友好和建设性。避免讨论任何与政治、宗教或其他敏感话题相关的内容。对于这类问题，不提供任何回应，只提醒用户这些话题不适合在群聊中讨论。对所有其他问题，提供准确且简洁的信息，确保互动积极向上。始终保持尊重和专业的语气，确保群聊环境的和谐与愉快。'

/** 私聊情景定义 */
export const PRIVATE_CHAT_POLICY =
  '你是一名友好且知识渊博的助手。在私聊中，你可以灵活地回答用户的各种问题，包括提供建议和个人见解。尽管如此，对于政治、宗教等敏感话题，仍应保持中立立场，避免偏见和争议。对所有问题，提供清晰、准确的信息，并根据需要提供额外的背景或详细解释。保持对用户的尊重和支持，确保对话有益且有建设性。'
