// Publishes a release file to GitHub Releases, so they always match the repo.
//
//   bun run release:publish <version>
//
// Reads content/changelog/v<version>.md and creates the GitHub release (tag
// <version>, title "v<version> - <name>") at the current commit, which must
// already be pushed. When the release exists, its title and notes are updated
// instead, which also syncs later edits of the file.
import { execFileSync } from 'node:child_process'
import { existsSync, mkdtempSync, readFileSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'

function fail(message) {
  console.error(message)
  process.exit(1)
}

const version = process.argv[2]
if (!version) fail('Usage: bun run release:publish <version>')

const releasePath = resolve(process.cwd(), `content/changelog/v${version}.md`)
if (!existsSync(releasePath)) {
  fail(`content/changelog/v${version}.md does not exist.`)
}

const source = readFileSync(releasePath, 'utf8')
const match = source.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/)
if (!match) fail(`content/changelog/v${version}.md has no frontmatter.`)

const [, frontmatter, body] = match
const field = (key) => {
  const value = frontmatter.match(new RegExp(`^${key}:\\s*(.+)$`, 'm'))?.[1]
  return value?.startsWith('"') ? JSON.parse(value) : value
}

const title = `v${version} - ${field('title')}`
const prerelease = field('prerelease') === 'true'

const notesPath = join(
  mkdtempSync(join(tmpdir(), 'keebdex-release-')),
  'notes.md',
)
writeFileSync(notesPath, `${body.trim()}\n`)

const gh = (args) => execFileSync('gh', args, { stdio: 'inherit' })

let exists = true
try {
  execFileSync('gh', ['release', 'view', version], { stdio: 'ignore' })
} catch {
  exists = false
}

if (exists) {
  gh([
    'release',
    'edit',
    version,
    '--title',
    title,
    '--notes-file',
    notesPath,
    `--prerelease=${prerelease}`,
  ])
  console.log(`Updated GitHub release ${version}.`)
} else {
  const commit = execFileSync('git', ['rev-parse', 'HEAD']).toString().trim()
  const pushed = execFileSync('git', ['branch', '-r', '--contains', commit])
    .toString()
    .trim()
  if (!pushed) fail(`Push ${commit.slice(0, 8)} before publishing the release.`)

  gh([
    'release',
    'create',
    version,
    '--target',
    commit,
    '--title',
    title,
    '--notes-file',
    notesPath,
    ...(prerelease ? ['--prerelease'] : []),
  ])
  console.log(`Published GitHub release ${version}.`)
}
