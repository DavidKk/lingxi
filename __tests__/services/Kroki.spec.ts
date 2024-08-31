import { Kroki, isKrokiLanguage } from '@/services/Kroki'

describe('Kroki', () => {
  let krokiInstance: Kroki

  beforeAll(() => {
    process.env.KROKI_SERVER_URL = 'https://kroki.io'
    krokiInstance = new Kroki({
      serverUrl: process.env.KROKI_SERVER_URL,
    })

    global.fetch = jest.fn()
  })

  afterAll(() => {
    delete process.env.KROKI_SERVER_URL

    jest.clearAllMocks()
  })

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should extract code blocks and text parts correctly', () => {
    const markdown = `# Title

\`\`\`mermaid
graph TD
  A-->B
\`\`\`

Some more text.

\`\`\`plantuml
@startuml
Alice -> Bob: Hello
@enduml
\`\`\`
    `

    const { textParts, codeBlocks } = krokiInstance['extractCodeBlocks'](markdown)
    expect(textParts).toEqual(['# Title', 'Some more text.'])

    expect(codeBlocks).toEqual([
      { language: 'mermaid', code: 'graph TD\n  A-->B' },
      { language: 'plantuml', code: '@startuml\nAlice -> Bob: Hello\n@enduml' },
    ])
  })

  it('should handle markdown starting with a code block correctly', () => {
    const markdown = `\`\`\`mermaid
graph TD
  A-->B
\`\`\`

Some more text.

\`\`\`plantuml
@startuml
Alice -> Bob: Hello
@enduml
\`\`\`
    `

    const { textParts, codeBlocks } = krokiInstance['extractCodeBlocks'](markdown)
    expect(textParts).toEqual(['', 'Some more text.'])

    expect(codeBlocks).toEqual([
      { language: 'mermaid', code: 'graph TD\n  A-->B' },
      { language: 'plantuml', code: '@startuml\nAlice -> Bob: Hello\n@enduml' },
    ])
  })

  it('should fetch Kroki images correctly', async () => {
    // Mock fetch to return a buffer
    const mockBuffer = Buffer.from('mock image data')
    jest.isMockFunction(fetch) &&
      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        arrayBuffer: async () => mockBuffer,
      })

    const language = 'mermaid'
    const code = 'graph TD\n  A-->B'

    const buffer = await krokiInstance['fetchKrokiImage'](language, code)
    expect(buffer).toEqual(mockBuffer)
    expect(fetch).toHaveBeenCalledWith(`${process.env.KROKI_SERVER_URL}/${language}/png`, {
      method: 'POST',
      body: code,
      headers: { 'Content-Type': 'text/plain' },
    })
  })

  it('should process markdown and handle failed image fetches', async () => {
    if (jest.isMockFunction(fetch)) {
      ;(fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'))
    }

    const markdown = `
# Title

\`\`\`mermaid
graph TD
  A-->B
\`\`\`
    `

    const results = await krokiInstance.processMarkdown(markdown)
    expect(results[0]).toBe('# Title')
    expect(results[1]).toBe('```mermaid\ngraph TD\n  A-->B\n```')
  })

  it('should allow only supported chart languages', () => {
    const validLanguage = 'mermaid'
    const invalidLanguage = 'unsupportedLang'

    expect(isKrokiLanguage(validLanguage)).toBe(true)
    expect(isKrokiLanguage(invalidLanguage)).toBe(false)
  })

  it('should throw an error for unsupported languages', async () => {
    const unsupportedLanguage = 'unsupportedLang'
    const code = 'some code'
    const promise = krokiInstance['fetchKrokiImage'](unsupportedLanguage, code)
    await expect(promise).rejects.toThrow(`Unsupported language: ${unsupportedLanguage}`)
  })

  it('should process markdown correctly and generate image parts with hashed filenames', async () => {
    const encoder = new TextEncoder()
    const mockBuffer = encoder.encode('mock image data').buffer

    jest.isMockFunction(fetch) &&
      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        arrayBuffer: async () => mockBuffer,
      })

    const markdown = `
# Title

\`\`\`mermaid
graph TD
  A-->B
\`\`\`
    `

    const results = await krokiInstance.processMarkdown(markdown)
    expect(results).toEqual([
      '# Title',
      {
        file: expect.any(String),
        content: expect.any(ArrayBuffer),
      },
    ])
  })
})
