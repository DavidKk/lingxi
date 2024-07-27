export interface GeminiContentPart {
  text: string
}

export interface GeminiContent {
  role: 'user' | 'model' | 'system'
  parts: GeminiContentPart[]
}

export interface GeminiGenerationConfig {
  temperature: number
  maxOutputTokens: number
  topP: number
}

export interface GeminiSafetySettings {
  category: string
  threshold: string
}

export interface GeminiReqDTO {
  contents: GeminiContent[]
  /** Optional. Configuration options for model generation and outputs. */
  generationConfig?: GeminiGenerationConfig
  /** Optional. A list of unique SafetySetting instances for blocking unsafe content. */
  safetySettings?: GeminiSafetySettings[]
  /** Optional. Input only. Immutable. Developer set system instruction. Currently text only. */
  systemInstruction?: GeminiContent
}

export interface GeminiSafetyRating {
  category: string
  probability: string
}

export interface GeminiCandidate {
  content: GeminiContent
  finishReason: string
  index: number
  safetyRatings: GeminiSafetyRating[]
}

export interface GeminiUsageMetadata {
  promptTokenCount: number
  candidatesTokenCount: number
  totalTokenCount: number
}

export interface GeminiMessageDTO {
  candidates: GeminiCandidate[]
  usageMetadata: GeminiUsageMetadata
}

export interface GeminiExceptionDTO {
  success: boolean
  message: string
  data: null
}

export interface GeminiFaildResultItem {
  error: Error
}

export interface GeminiFailedDTO {
  failed: boolean
  message: string
  result: GeminiFaildResultItem[]
}

/** 返回体 */
export type GeminiRespDTO = GeminiMessageDTO[] | GeminiExceptionDTO | GeminiFailedDTO
