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

describe('Writer - edge cases', () => {
  let writer: Writer
  let mockWriteStream: jest.Mocked<fs.WriteStream>
  let maxFileNumber = 5
  let originDate = global.Date
  let currentDate: Date

  const resetDate = () => {
    currentDate = new originDate()
  }

  beforeAll(() => {
    // 创建一个继承自 Date 的类 DateMock
    class DateMock extends Date {
      constructor(...args: Parameters<DateConstructor>) {
        if (args.length === 0) {
          // 如果没有传参，使用 currentDate 的值
          super(currentDate.getTime())
          // 每次调用后将日期增加一天
          currentDate.setDate(currentDate.getDate() + 1)
        } else {
          // 如果有参数，正常调用父类构造函数
          super(...args)
        }
      }

      static now() {
        return currentDate.getTime()
      }
    }

    // 使用 DateMock 替换原始的 Date
    originDate = global.Date
    global.Date = DateMock as unknown as DateConstructor
  })

  afterAll(() => {
    global.Date = originDate
  })

  beforeEach(async () => {
    resetDate()

    const { createWriteStream } = await import('fs')
    jest.isMockFunction(createWriteStream) &&
      createWriteStream.mockImplementation((...args: Parameters<typeof memfs.createWriteStream>) => {
        const stream = memfs.createWriteStream(...args)
        const write = jest.fn().mockImplementation(stream.write.bind(stream))
        stream.write = write
        mockWriteStream = stream as any
        return mockWriteStream
      })

    writer = new Writer({ maxFileNumber })
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

  it('should stop creating files after reaching the maximum allowed creations', async () => {
    // Spy on shouldCreateNewFileForDate and shouldCreateNewFileForSize to always return true
    jest.spyOn(writer as any, 'shouldCreateNewFileForDate').mockReturnValue(true)
    jest.spyOn(writer as any, 'shouldCreateNewFileForSize').mockReturnValue(true)

    // Write some content to trigger file creation
    writer.write('This should trigger file creation')

    // Wait for the next stream release
    await writer.waitNextStreamReleased()

    // Verify that the write stream was only created once
    expect(mockWriteStream.write).toHaveBeenCalledTimes(1)
    expect(mockWriteStream.write).toHaveBeenCalledWith('This should trigger file creation\n')
  }, 3e3)

  it('should call ensureFile each time when shouldCreateNewFileForDate or shouldCreateNewFileForSize returns true', async () => {
    jest.spyOn(writer as any, 'shouldCreateNewFileForDate').mockReturnValue(true)
    jest.spyOn(writer as any, 'shouldCreateNewFileForSize').mockReturnValue(true)

    for (let i = 0; i < maxFileNumber; i++) {
      await writer['createWriteStream']()
    }

    const fileSize = Object.keys(vol.toJSON())
    expect(fileSize.length).toEqual(maxFileNumber)
  }, 3e3)
})
