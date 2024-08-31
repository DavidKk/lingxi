export type GeminiChatModel = 'gemini-pro' | 'gemini-1.5-flash'

export interface GeminiTextContentPart {
  text: string
}

export interface GeminiImageContentPartBlob {
  /** Mime type of the image, e.g. "image/png" */
  mimeType: string
  /** Image as a base64 string */
  data: string
}

export interface GeminiImageContentPart {
  inlineData: GeminiImageContentPartBlob
}

export type GeminiContentRole = 'user' | 'model' | 'system'

export interface GeminiContent {
  role: GeminiContentRole
  parts: (GeminiTextContentPart | GeminiImageContentPart)[]
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
export type GeminiRespDTO = GeminiMessageDTO | GeminiMessageDTO[] | GeminiExceptionDTO | GeminiFailedDTO
