import assert from 'node:assert/strict'
import test from 'node:test'
import { htmlSrcdoc, imageSrcFromSvg } from '../src/index.ts'

test('normalizes raw svg into a data image', () => {
  const src = imageSrcFromSvg('<svg viewBox="0 0 1 1"></svg>')

  assert.ok(src.startsWith('data:image/svg+xml;charset=utf-8,'))
})

test('extracts html from a data uri', () => {
  const html = '<html><body>BITS</body></html>'
  const uri = `data:text/html,${encodeURIComponent(html)}`

  assert.equal(htmlSrcdoc(uri), html)
})
