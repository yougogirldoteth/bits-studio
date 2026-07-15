import type { BitsRendererAdapterId, BitsTokenMetadata } from './types.ts'

export type BitsRendererBitTuple = readonly [
  name: string,
  audioFilename: string,
  svgFilename: string,
  source: string,
  processed: number,
]

export type BitsRendererReadResult = {
  tokenId: number
  bit: BitsRendererBitTuple
  svg: string
  html: string
  rendererUpdatedAt?: number
}

export type BitsRendererAdapter = {
  id: BitsRendererAdapterId
  name: string
  requiredFunctions: readonly string[]
  normalize(result: BitsRendererReadResult): BitsTokenMetadata
}

export const bitsRendererV1Adapter: BitsRendererAdapter = {
  id: 'bits-renderer-v1',
  name: 'BITS renderer v1',
  requiredFunctions: [
    'bits(uint256)',
    'tokenToSvg(uint256)',
    'tokenToHtml(uint256)',
    'bitToBase64(uint256)',
    'bitToBytes(uint256)',
  ],
  normalize(result) {
    const [name, audioFilename, svgFilename, source, processed] = result.bit

    return {
      tokenId: result.tokenId,
      created: isRendererBitCreated(result.bit),
      name,
      audioFilename,
      svgFilename,
      source,
      processed: Number(processed),
      svg: result.svg,
      html: result.html,
      rendererUpdatedAt: result.rendererUpdatedAt,
    }
  },
}

export function isRendererBitCreated(bit: BitsRendererBitTuple) {
  return bit.slice(0, 4).some((value) => String(value).trim().length > 0)
}

export const rendererAdapters = {
  'bits-renderer-v1': bitsRendererV1Adapter,
} satisfies Record<BitsRendererAdapterId, BitsRendererAdapter>

export function getRendererAdapter(id: BitsRendererAdapterId) {
  const adapter = rendererAdapters[id]
  if (!adapter) throw new Error(`Unsupported renderer adapter: ${id}`)
  return adapter
}
