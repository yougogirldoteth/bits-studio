import {
  imageSrcFromSvg,
  type BitsCollectionResponse,
} from '@bits-collection/shared'
import { grid, type Img } from '@visualizevalue/img-grid'

const GRID_BACKGROUND = '#ffffff'
const GRID_MAX_WIDTH = 1200
const GRID_PADDING = 72
const GRID_GUTTER = 0
const BLANK_IMAGE =
  'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="1" height="1"/%3E'

export async function renderCollectionOgGrid(
  collection: BitsCollectionResponse,
) {
  const images: Img[] = []
  for (const token of collection.tokens) {
    const url = imageSrcFromSvg(token.svg)
    if (url) {
      images.push({
        id: String(token.tokenId),
        url,
      })
    }
  }

  if (images.length === 0) return null

  return await grid(squarePaddedImages(images), {
    maxWidth: GRID_MAX_WIDTH,
    background: GRID_BACKGROUND,
    padding: GRID_PADDING,
    gutter: GRID_GUTTER,
    pixelated: false,
  })
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
