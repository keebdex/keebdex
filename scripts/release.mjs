// Cuts a release from the [Unreleased] section of CHANGELOG.md.
//
//   bun run release <version> "<name>" [--prerelease]
//
// Writes content/changelog/v<version>.md (shown on /changelog), empties the
// [Unreleased] section, and bumps package.json. It does not commit, tag, or
// publish; review the diff, commit, push, then run `bun run release:publish`.
import { execSync } from 'node:child_process'
import { existsSync, readFileSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'

const root = process.cwd()
const changelogPath = resolve(root, 'CHANGELOG.md')
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

const changelog = readFileSync(changelogPath, 'utf8')
const heading = '## [Unreleased]'
const start = changelog.indexOf(heading)
if (start === -1) fail(`CHANGELOG.md has no "${heading}" section.`)

const bodyStart = start + heading.length
const next = changelog.indexOf('\n## ', bodyStart)
const bodyEnd = next === -1 ? changelog.length : next
const notes = changelog.slice(bodyStart, bodyEnd).trim()
if (!notes) fail('The [Unreleased] section is empty.')

let author
try {
  author = execSync('gh api user --jq .login', {
    stdio: ['ignore', 'pipe', 'ignore'],
  })
    .toString()
    .trim()
} catch {
  // Without the GitHub CLI the release is listed without an author.
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
  ...(author ? [`author: ${author}`] : []),
  '---',
]

writeFileSync(releasePath, `${frontmatter.join('\n')}\n\n${notes}\n`)

writeFileSync(
  changelogPath,
  `${changelog.slice(0, bodyStart)}\n${changelog.slice(bodyEnd)}`,
)

const pkg = readFileSync(packagePath, 'utf8')
writeFileSync(
  packagePath,
  pkg.replace(/("version":\s*")[^"]+(")/, `$1${version}$2`),
)

console.log(`Wrote content/changelog/v${version}.md (v${version} - ${name}).`)
console.log('Emptied [Unreleased] in CHANGELOG.md and bumped package.json.')
console.log(
  `Next: review, commit "chore(release): v${version}", push, then run "bun run release:publish ${version}".`,
)
