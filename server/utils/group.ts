import groupBy from 'lodash.groupby'

type Maker = {
  id: string
  name: string
  invertible_logo: boolean
}

type Item = {
  id: number
  name: string
  maker: Maker
  [key: string]: any
}

function chunkLabel(makers: { maker: Maker }[]) {
  const first = makers[0]?.maker.name.charAt(0).toUpperCase()
  const last = makers[makers.length - 1]?.maker.name.charAt(0).toUpperCase()

  return { first, last }
}

function groupByMakerWithChunks(items: Item[]) {
  const makers = groupBy(items, (item) => item.maker.name)

  // separate numeric vs alphabetic makers
  const numericMakers = []
  const alphaMakers = []

  for (const [maker, its] of Object.entries(makers)) {
    if (/^[0-9]/.test(maker)) {
      numericMakers.push({ maker: its[0]?.maker, items: its })
    } else {
      alphaMakers.push({ maker: its[0]?.maker, items: its })
    }
  }

  // group alphabetic makers by first letter
  const makerGroups = groupBy(alphaMakers, (entry) =>
    entry.maker.name.charAt(0).toUpperCase(),
  )

  // sort letters and makers inside each letter
  const sortedLetters = Object.keys(makerGroups).sort()
  for (const letter of sortedLetters) {
    makerGroups[letter].sort((a, b) => a.maker.name.localeCompare(b.maker.name))
  }

  // build chunks: ≤12 makers, but keep same letter together
  const chunks = []

  // numeric always first
  if (numericMakers.length) {
    chunks.push({
      first: 0,
      last: 9,
      makers: numericMakers,
    })
  }

  let currentChunk = []

  for (const letter of sortedLetters) {
    const group = makerGroups[letter]

    if (currentChunk.length + group.length > 12 && currentChunk.length > 0) {
      chunks.push({
        ...chunkLabel(currentChunk),
        makers: currentChunk,
      })
      currentChunk = []
    }

    currentChunk.push(...group)
  }

  if (currentChunk.length) {
    chunks.push({
      ...chunkLabel(currentChunk),
      makers: currentChunk,
    })
  }

  return chunks
}

export { groupByMakerWithChunks }
