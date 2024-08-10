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
})

describe('Writer (file writing)', () => {
  let writer: Writer

  beforeEach(async () => {
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

  it('should write stream to file', async () => {
    writer.write('Hello, world!')
    await writer.waitNextStreamReleased()

    const symbol = stringifyDatetime`YYYY-MM-DD`
    const logFile = path.join(writer['output'], `${symbol}.0.log`)
    const source = vol.toJSON()
    expect(source[logFile]).toEqual('Hello, world!\n')
  })

  it('should rotate log file when max file size is reached', async () => {
    const writer = new Writer({ maxFileSize: 6 })

    writer.write('Hello!')
    await writer.waitNextStreamReleased()

    writer.write('World!')
    await writer.waitNextStreamReleased()

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
