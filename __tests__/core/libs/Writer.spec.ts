import type fs from 'fs'
import path from 'path'
import { vol } from 'memfs'
import { Writer } from '@/core/libs/Writer'
import { LOGGER_FILE_MAX_SIZE, LOGGER_FILE_PATH } from '@/core/constants/logger'
import { stringifyDatetime } from '@/core/utils/stringifyDatetime'

// eslint-disable-next-line @typescript-eslint/consistent-type-imports
jest.mock('fs', () => jest.requireActual<typeof import('memfs')>('memfs'))

describe('Writer', () => {
  let writer: Writer
  let mockWriteStream: jest.Mocked<fs.WriteStream>

  beforeEach(() => {
    mockWriteStream = {
      writable: true,
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
    vol.reset()
  })

  it('should have default properties', () => {
    const writer = new Writer()
    expect(writer['output']).toEqual(LOGGER_FILE_PATH)
    expect(writer['maxFileSize']).toEqual(LOGGER_FILE_MAX_SIZE)
  })

  it('should write to the stream', async () => {
    writer.write('Hello, world!')
    await Promise.resolve()

    expect(mockWriteStream.write).toHaveBeenCalledTimes(1)
    expect(mockWriteStream.write).toHaveBeenCalledWith('Hello, world!\n', expect.any(Function))
  })

  it('should flush the stream when the buffer is full', async () => {
    writer.write('Hello, world!')
    writer.write('This is a test')

    await Promise.resolve()
    expect(mockWriteStream.write).toHaveBeenCalledTimes(1)
    expect(mockWriteStream.write).toHaveBeenCalledWith('Hello, world!\nThis is a test\n', expect.any(Function))
  })

  it('should write multiple chunks to the stream', async () => {
    writer.write('Hello, world!')
    await Promise.resolve()
    writer.write('This is a test')
    await Promise.resolve()

    expect(mockWriteStream.write).toHaveBeenCalledTimes(2)
    expect(mockWriteStream.write).toHaveBeenCalledWith('Hello, world!\n', expect.any(Function))
    expect(mockWriteStream.write).toHaveBeenCalledWith('This is a test\n', expect.any(Function))
  })
})

describe('Writer (file writing)', () => {
  let writer: Writer

  beforeEach(() => {
    writer = new Writer()
  })

  afterEach(() => {
    vol.reset()
  })

  it('should write stream to file', async () => {
    writer.write('Hello, world!')
    await writer.nextFlush()

    const symbol = stringifyDatetime`YYYY-MM-DD`
    const logFile = path.join(writer['output'], `${symbol}.0.log`)
    const source = vol.toJSON()
    expect(source[logFile]).toEqual('Hello, world!\n')
  })

  it('should rotate log file when max file size is reached', async () => {
    const writer = new Writer({ maxFileSize: 6 })

    writer.write('Hello!')
    await writer.nextFlush()

    writer.write('World!')
    await writer.nextFlush()

    const source = vol.toJSON()
    const files = Object.keys(source)
    expect(files.length).toEqual(2)

    const symbol = stringifyDatetime`YYYY-MM-DD`
    expect(files[0]).toEqual(path.join(writer['output'], `${symbol}.0.log`))
    expect(files[1]).toEqual(path.join(writer['output'], `${symbol}.1.log`))

    expect(source[files[0]]).toEqual('Hello!\n')
    expect(source[files[1]]).toEqual('World!\n')
  })
})

describe('Writer (error handling)', () => {
  let writer: Writer
  let mockWriteStream: jest.Mocked<fs.WriteStream>

  beforeEach(() => {
    mockWriteStream = {
      writable: true,
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
    vol.reset()
  })

  it('should handle errors when writing to the stream', async () => {
    const error = new Error('Error writing to log file')
    jest.isMockFunction(mockWriteStream.write) &&
      mockWriteStream.write.mockImplementationOnce((_: string, callback: (error: Error | null | undefined) => void) => {
        callback(error)
      })

    jest.spyOn(console, 'error').mockImplementationOnce(() => {
      // nonthing todo...
    })

    writer.write('Hello, world!')
    await writer.nextFlush()

    // eslint-disable-next-line no-console
    expect(console.error).toHaveBeenCalledTimes(1)
    // eslint-disable-next-line no-console
    expect(console.error).toHaveBeenCalledWith(`Error writing to log file: ${error}`)
  })
})
