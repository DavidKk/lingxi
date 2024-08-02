import { Writer } from '@/core/libs/Logger/Writer'
import type fs from 'fs'

describe('Writer', () => {
  let writer: Writer
  let mockWriteStream: jest.Mocked<fs.WriteStream>

  beforeEach(() => {
    mockWriteStream = {
      cork: jest.fn(),
      uncork: jest.fn(),
      write: jest.fn(),
      end: jest.fn(),
      close: jest.fn(),
      on: jest.fn(),
    } as any

    writer = new Writer()
    writer['stream'] = mockWriteStream
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  it('should write to the stream', async () => {
    writer.write('Hello, world!')
    await Promise.resolve()

    expect(mockWriteStream.write).toHaveBeenCalledTimes(1)
    expect(mockWriteStream.write).toHaveBeenCalledWith('Hello, world!')
  })

  it('should flush the stream when the buffer is full', async () => {
    writer.write('Hello, world!')
    writer.write('This is a test')

    await Promise.resolve()
    expect(mockWriteStream.cork).toHaveBeenCalledTimes(1)
    expect(mockWriteStream.uncork).toHaveBeenCalledTimes(2)
    expect(mockWriteStream.write).toHaveBeenCalledTimes(1)

    expect(mockWriteStream.write).toHaveBeenCalledWith('Hello, world!\nThis is a test')
  })

  it('should write multiple chunks to the stream', async () => {
    writer.write('Hello, world!')
    await Promise.resolve()
    writer.write('This is a test')
    await Promise.resolve()

    expect(mockWriteStream.cork).toHaveBeenCalledTimes(2)
    expect(mockWriteStream.uncork).toHaveBeenCalledTimes(2)
    expect(mockWriteStream.write).toHaveBeenCalledTimes(2)

    expect(mockWriteStream.write).toHaveBeenCalledWith('Hello, world!')
    expect(mockWriteStream.write).toHaveBeenCalledWith('This is a test')
  })
})
