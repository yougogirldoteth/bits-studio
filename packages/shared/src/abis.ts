import { parseAbi } from 'viem'

export const bitsAbi = parseAbi([
  'event TransferSingle(address indexed operator, address indexed from, address indexed to, uint256 id, uint256 value)',
  'event TransferBatch(address indexed operator, address indexed from, address indexed to, uint256[] ids, uint256[] values)',
  'event URI(string value, uint256 indexed id)',
  'event MetadataUpdate(uint256 _tokenId)',
  'event BatchMetadataUpdate(uint256 _fromTokenId, uint256 _toTokenId)',
  'event OwnershipTransferred(address indexed previousOwner, address indexed newOwner)',
  'function balanceOf(address account, uint256 id) view returns (uint256)',
  'function bitCollections(uint256 collection) view returns (string name, uint256 startTokenId, uint256 collectionSize, uint256 editionSize, uint256 minted, address renderer, uint256 price, bool active, bool locked)',
  'function mintBitPublic(uint256 tokenId, address to, uint256 amount) payable',
  'function mintCollectionPublic(uint256 collection, address to) payable',
  'function tokenMinted(uint256 tokenId) view returns (uint256)',
  'function tokenToCollectionId(uint256 tokenId) view returns (uint256)',
])

export const bitsRendererV1Abi = parseAbi([
  'function bits(uint256 tokenId) view returns (string name, string audioFilename, string svgFilename, string source, uint8 processed)',
  'function bitToBase64(uint256 tokenId) view returns (string)',
  'function bitToBytes(uint256 tokenId) view returns (bytes)',
  'function tokenToHtml(uint256 tokenId) view returns (string)',
  'function tokenToSvg(uint256 tokenId) view returns (string)',
])
