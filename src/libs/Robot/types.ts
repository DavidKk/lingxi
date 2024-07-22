export interface GeminiContent {
  role: 'user' | 'model' | 'system'
  parts: { text: string }[]
}

/** 请求体 */
export interface GeminiReqDTO {
  contents: GeminiContent[]
}

export interface SafetyRating {
  category: string
  probability: string
}

export interface ContentPart {
  text: string
}

export interface Content {
  parts: ContentPart[]
  role: string
}

export interface Candidate {
  content: Content
  finishReason: string
  index: number
  safetyRatings: SafetyRating[]
}

export interface UsageMetadata {
  promptTokenCount: number
  candidatesTokenCount: number
  totalTokenCount: number
}

export interface GeminiMessage {
  candidates: Candidate[]
  usageMetadata: UsageMetadata
}

export interface GeminiException {
  success: boolean
  message: string
  data: null
}

/** 返回体 */
export type GeminiRespDTO = GeminiMessage[] | GeminiException
