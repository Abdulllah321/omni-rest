import { execSync } from 'child_process'
import { readdirSync, writeFileSync } from 'fs'
import { join } from 'path'

const pagesDir = join(process.cwd(), 'pages/docs')
const out = {}

try {
  const files = readdirSync(pagesDir).filter(f => f.endsWith('.mdx'))
  for (const file of files) {
    const filePath = join(pagesDir, file)
    try {
      const result = execSync(
        `git log -1 --format="%ci" -- "${filePath}"`,
        { encoding: 'utf8', stdio: ['pipe', 'pipe', 'ignore'] }
      ).trim()
      if (result) out[file] = result
    } catch {
      // no git history for this file, skip
    }
  }
} catch {
  // git not available, write empty map
}

writeFileSync(
  join(process.cwd(), 'timestamps.json'),
  JSON.stringify(out, null, 2)
)
console.log(`Generated timestamps for ${Object.keys(out).length} files`)
