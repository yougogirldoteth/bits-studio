export function decodeDataUri(value: string) {
  const uri = value.trim()
  const comma = uri.indexOf(',')
  if (!uri.startsWith('data:') || comma < 0) return ''

  const header = uri.slice(0, comma)
  const body = uri.slice(comma + 1)

  if (header.includes(';base64')) {
    return decodeBase64Utf8(body)
  }

  return decodeURIComponent(body)
}

export function imageSrcFromSvg(value: string) {
  let svg = value.trim()
  if (!svg) return ''

  if (svg.startsWith('data:application/json')) {
    const decoded = decodeDataUri(svg)
    const metadata = JSON.parse(decoded) as { image?: string }
    return metadata.image ? imageSrcFromSvg(metadata.image) : ''
  }

  if (
    svg.startsWith('data:image/') ||
    svg.startsWith('http://') ||
    svg.startsWith('https://')
  ) {
    return svg
  }

  if (svg.startsWith('base64,')) {
    return `data:image/svg+xml;base64,${svg.slice(7).trim()}`
  }

  const compact = svg.replace(/\s+/g, '')
  if (/^[A-Za-z0-9+/]+=*$/.test(compact) && compact.length > 32) {
    return `data:image/svg+xml;base64,${compact}`
  }

  const decoded = decodeBase64Utf8(svg)
  if (decoded.trim().startsWith('<svg')) {
    return `data:image/svg+xml;base64,${svg}`
  }

  if (svg.includes('%3Csvg')) {
    svg = decodeURIComponent(svg)
  }

  if (!svg.startsWith('<svg') && svg.includes('<svg')) {
    svg = svg.slice(svg.indexOf('<svg'))
  }

  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`
}

export function htmlSrcdoc(value: string) {
  let html = value.trim()
  if (!html) return ''

  if (html.startsWith('data:text/html')) {
    return decodeDataUri(html) || html
  }

  const decoded = decodeBase64Utf8(html)
  if (decoded.trim().startsWith('<')) return decoded

  if (html.includes('%3C')) {
    html = decodeURIComponent(html)
  }

  return html
}

function decodeBase64Utf8(value: string) {
  try {
    if (typeof globalThis.atob === 'function') {
      const binary = globalThis.atob(value)
      const bytes = Uint8Array.from(binary, (char) => char.charCodeAt(0))
      return new TextDecoder().decode(bytes)
    }

    return Buffer.from(value, 'base64').toString('utf8')
  } catch {
    return ''
  }
}
