// Cuts a release from the notes drafted in content/changelog/unreleased.md.
//
//   bun run release <version> "<name>" [--prerelease]
//
// Turns unreleased.md into content/changelog/v<version>.md (adding version,
// name, and date, and keeping its authors) and bumps package.json. It does
// not commit, tag, or publish; review the diff, commit, push, then run
// `bun run release:publish`.
import { execSync } from 'node:child_process'
import { existsSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'

const root = process.cwd()
const draftPath = resolve(root, 'content/changelog/unreleased.md')
const packagePath = resolve(root, 'package.json')

const args = process.argv.slice(2)
const prerelease = args.includes('--prerelease')
const [version, name] = args.filter((arg) => !arg.startsWith('--'))

function fail(message) {
  console.error(message)
  process.exit(1)
}

if (!version || !name) {
  fail('Usage: bun run release <version> "<name>" [--prerelease]')
}
if (!/^\d+\.\d+\.\d+(-[0-9A-Za-z.-]+)?$/.test(version)) {
  fail(`"${version}" is not a valid version (expected e.g. 4.3.0).`)
}

const releasePath = resolve(root, `content/changelog/v${version}.md`)
if (existsSync(releasePath)) {
  fail(`content/changelog/v${version}.md already exists.`)
}

if (!existsSync(draftPath))
  fail('content/changelog/unreleased.md does not exist.')

const draft = readFileSync(draftPath, 'utf8')
const [, draftFrontmatter = '', body = draft] =
  draft.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/) || []
const notes = body.trim()
if (!notes) fail('content/changelog/unreleased.md has no notes.')

// The draft's `authors` block (co-authors included) carries over as is.
// Without one, the release is credited to the GitHub CLI user, if any.
const authorsMatch = draftFrontmatter.match(/^authors:.*(?:\n[ \t].*)*/m)
let authors = authorsMatch?.[0].split('\n')
if (!authors) {
  try {
    const login = execSync('gh api user --jq .login', {
      stdio: ['ignore', 'pipe', 'ignore'],
    })
      .toString()
      .trim()
    authors = ['authors:', `  - ${login}`]
  } catch {
    authors = []
  }
}

// Local date, so a release cut late in the evening keeps today's date.
const now = new Date()
const date = [
  now.getFullYear(),
  String(now.getMonth() + 1).padStart(2, '0'),
  String(now.getDate()).padStart(2, '0'),
].join('-')

const frontmatter = [
  '---',
  `version: ${JSON.stringify(version)}`,
  `title: ${JSON.stringify(name)}`,
  `date: ${date}`,
  ...(prerelease ? ['prerelease: true'] : []),
  ...authors,
  '---',
]

writeFileSync(releasePath, `${frontmatter.join('\n')}\n\n${notes}\n`)

rmSync(draftPath)

const pkg = readFileSync(packagePath, 'utf8')
writeFileSync(
  packagePath,
  pkg.replace(/("version":\s*")[^"]+(")/, `$1${version}$2`),
)

console.log(`Wrote content/changelog/v${version}.md (v${version} - ${name}).`)
console.log('Removed content/changelog/unreleased.md and bumped package.json.')
console.log(
  `Next: review, commit "chore(release): v${version}", push, then run "bun run release:publish ${version}".`,
)
