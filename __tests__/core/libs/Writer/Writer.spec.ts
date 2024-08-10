import type fs from 'fs'
import path from 'path'
import { vol, fs as memfs } from 'memfs'
import { Writer } from '@/core/libs/Writer'
import { LOGGER_FILE_MAX_SIZE, LOGGER_FILE_PATH } from '@/core/constants/logger'
import { stringifyDatetime } from '@/core/utils/stringifyDatetime'

jest.mock('fs', () => {
  // eslint-disable-next-line @typescript-eslint/consistent-type-imports
  const { fs } = jest.requireActual<typeof import('memfs')>('memfs')
  const createWriteStream = jest.fn()
  return { ...fs, createWriteStream }
})

describe('Writer', () => {
  let writer: Writer
  let mockWriteStream: jest.Mocked<fs.WriteStream>

  beforeEach(async () => {
    const { createWriteStream } = await import('fs')
    jest.isMockFunction(createWriteStream) &&
      createWriteStream.mockImplementation((...args: Parameters<typeof memfs.createWriteStream>) => {
        const stream = memfs.createWriteStream(...args)
        const write = jest.fn().mockImplementation(stream.write.bind(stream))
        stream.write = write
        mockWriteStream = stream as any
        return mockWriteStream
      })

    writer = new Writer()
  })

  afterEach(async () => {
    jest.clearAllMocks()

    await new Promise<void>((resolve) => {
      setImmediate(() => {
        vol.reset()
        resolve()
      })
    })
  })

  it('should have default properties', async () => {
    const writer = new Writer()
    expect(writer['output']).toEqual(LOGGER_FILE_PATH)
    expect(writer['maxFileSize']).toEqual(LOGGER_FILE_MAX_SIZE)
  })

  it('should write to the stream', async () => {
    writer.write('Hello, world!')

    await writer.waitNextStreamReleased()

    expect(mockWriteStream.write).toHaveBeenCalledTimes(1)
    expect(mockWriteStream.write).toHaveBeenCalledWith('Hello, world!\n')
  }, 3e3)

  it('should flush the stream when the buffer is full', async () => {
    writer.write('Hello, world!')
    writer.write('This is a test')

    await writer.waitNextStreamReleased()

    expect(mockWriteStream.write).toHaveBeenCalledTimes(1)
    expect(mockWriteStream.write).toHaveBeenCalledWith('Hello, world!\nThis is a test\n')
  }, 3e3)

  it('should have default properties', async () => {
    const writer = new Writer()
    expect(writer['output']).toEqual(LOGGER_FILE_PATH)
    expect(writer['maxFileSize']).toEqual(LOGGER_FILE_MAX_SIZE)
  })

  it('should handle exceeding the maximum number of files', async () => {
    const maxFileNumber = 5
    const writer = new Writer({ maxFileNumber })

    // Mock the file system to simulate the maximum number of files
    const files: Record<string, string> = {}
    for (let i = 0; i < maxFileNumber; i++) {
      const name = path.join(writer['output'], `${stringifyDatetime(new Date(), 'YYYY-MM-DD')}.${i}.log`)
      files[name] = ''
    }

    vol.fromJSON(files)

    // 超大数量
    expect(writer['isOverNumber']()).resolves.toBeTruthy()

    // Attempt to write a new log entry, should throw an error
    const writeOperation = () => writer['createWriteStream']()
    await expect(writeOperation()).rejects.toThrow(/The number of files is over/)
  })
})
