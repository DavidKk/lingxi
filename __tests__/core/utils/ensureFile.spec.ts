import fs from 'fs'
import path from 'path'
import { ensureFile } from '@/core/utils/ensureFile'
import { vol } from 'memfs'
// eslint-disable-next-line @typescript-eslint/consistent-type-imports
jest.mock('fs', () => jest.requireActual<typeof import('memfs')>('memfs'))

describe('ensureFile', () => {
  it('should create a file if it does not exist', async () => {
    const filePath = path.join(__dirname, 'test.txt')

    await ensureFile(filePath)
    expect(fs.existsSync(filePath)).toBe(true)
  })

  it('should create any missing directories', async () => {
    const filePath = path.join(__dirname, 'dir1/dir2/test.txt')

    await ensureFile(filePath)

    expect(fs.existsSync(path.join(__dirname, 'dir1'))).toBe(true)
    expect(fs.existsSync(path.join(__dirname, 'dir1/dir2'))).toBe(true)
    expect(fs.existsSync(filePath)).toBe(true)
  })

  it('should not overwrite an existing file', async () => {
    const filePath = path.join(__dirname, 'test.txt')

    await ensureFile(filePath)
    await fs.promises.writeFile(filePath, 'Hello world')

    await ensureFile(filePath)
    const fileContents = await fs.promises.readFile(filePath, 'utf8')
    expect(fileContents).toBe('Hello world')
  })
})
