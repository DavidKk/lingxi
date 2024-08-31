import fs from 'fs'
import path from 'path'

export async function ensureFile(filePath: string) {
  const dirPath = path.dirname(filePath)
  const dirPathSegments = dirPath.split(path.sep)
  // Create any missing directories
  for (let i = 0; i < dirPathSegments.length; i++) {
    const segments = dirPathSegments.slice(0, i + 1)
    const currentDirPath = path.join('/', ...segments)
    if (currentDirPath === '.') {
      continue
    }

    if (!fs.existsSync(currentDirPath)) {
      await fs.promises.mkdir(currentDirPath, { recursive: true })
    }
  }

  if (!fs.existsSync(filePath)) {
    await writeFile(filePath, '')
  }
}

async function writeFile(filePath: string, data: string): Promise<void> {
  let handle: fs.promises.FileHandle | undefined
  try {
    handle = await fs.promises.open(filePath, 'wx')
    await handle.appendFile(data, 'utf-8')
    await handle.close()
  } catch (error) {
    if (typeof error === 'object' && error != null && 'code' in error && error.code === 'EEXIST') {
      // eslint-disable-next-line no-console
      console.warn('File already exists. Handling accordingly.')
      return
    }

    throw error
  } finally {
    try {
      handle && (await handle.close())
    } catch (error) {
      // nothing todo...
    }
  }
}
