import { cp, rm } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const distDir = path.join(repoRoot, 'dist')

const filesToCopy = ['index.html']
const directoriesToCopy = ['assets', 'media']

for (const fileName of filesToCopy) {
  await cp(path.join(distDir, fileName), path.join(repoRoot, fileName), { force: true })
}

for (const directoryName of directoriesToCopy) {
  const sourceDir = path.join(distDir, directoryName)
  const targetDir = path.join(repoRoot, directoryName)

  await rm(targetDir, { force: true, recursive: true })
  await cp(sourceDir, targetDir, { force: true, recursive: true })
}
