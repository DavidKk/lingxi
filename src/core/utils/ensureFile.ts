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
      await fs.promises.mkdir(currentDirPath)
    }
  }

  if (!fs.existsSync(filePath)) {
    await fs.promises.writeFile(filePath, '')
  }
}
