import { imageSrcFromSvg, type BitsTokenArtwork } from '@bits-collection/shared'
import { grid, type Img } from '@visualizevalue/img-grid'
import sharp from 'sharp'

const OG_WIDTH = 1200
const OG_HEIGHT = 630
const GRID_BACKGROUND = '#050505'
const GRID_MAX_WIDTH = 630
const GRID_PADDING = 71
const GRID_GUTTER = 8
const BLANK_IMAGE =
  'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="1" height="1"/%3E'
const EMPTY_TOKEN_IMAGE = `data:image/svg+xml,${encodeURIComponent(`
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 600">
    <rect width="600" height="600" fill="#10100f"/>
    <path d="M0 0 600 600M600 0 0 600" stroke="#343431" stroke-width="2"/>
    <rect x="249" y="249" width="102" height="102" fill="none" stroke="#5b5a55" stroke-width="2"/>
  </svg>
`)}`

export async function renderCollectionOgGrid(
  artwork: readonly BitsTokenArtwork[],
) {
  const images: Img[] = []
  for (const token of artwork) {
    const url = imageSrcFromSvg(token.svg)
    images.push({
      id: String(token.tokenId),
      url: url || EMPTY_TOKEN_IMAGE,
    })
  }

  if (images.length === 0) return null

  const gridImage = await grid(squarePaddedImages(images), {
    maxWidth: GRID_MAX_WIDTH,
    background: GRID_BACKGROUND,
    padding: GRID_PADDING,
    gutter: GRID_GUTTER,
    pixelated: false,
  })

  return await sharp({
    create: {
      width: OG_WIDTH,
      height: OG_HEIGHT,
      channels: 4,
      background: GRID_BACKGROUND,
    },
  })
    .composite([
      {
        input: gridImage,
        left: Math.floor((OG_WIDTH - GRID_MAX_WIDTH) / 2),
        top: Math.floor((OG_HEIGHT - GRID_MAX_WIDTH) / 2),
      },
    ])
    .png()
    .toBuffer()
}

function squarePaddedImages(images: Img[]): Img[] {
  const columns = gridColumns(images.length)
  const rows = Math.ceil(images.length / columns)
  const total = Math.max(columns, rows) ** 2

  return [
    ...images,
    ...Array.from({ length: total - images.length }, (_, index) => ({
      id: `blank-${index}`,
      url: BLANK_IMAGE,
    })),
  ]
}

function gridColumns(cells: number) {
  if (cells <= 1) return 1

  let bestColumns = 1
  let bestScore: [number, number, number] | null = null

  for (let columns = 1; columns <= Math.ceil(Math.sqrt(cells)) + 2; columns++) {
    const rows = Math.ceil(cells / columns)
    const score: [number, number, number] = [
      Math.max(columns, rows),
      columns * rows - cells,
      -columns,
    ]

    if (!bestScore || lexLess(score, bestScore)) {
      bestColumns = columns
      bestScore = score
    }
  }

  return bestColumns
}

function lexLess(a: [number, number, number], b: [number, number, number]) {
  for (let index = 0; index < a.length; index++) {
    const left = a[index]!
    const right = b[index]!
    if (left !== right) return left < right
  }

  return false
}
