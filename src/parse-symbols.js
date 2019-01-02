export default function parseSymbols (doc) {
  const symbolsTag = doc.children[0]
  const symbolTags = Array.from(symbolsTag.children)
    .filter(t => t.tagName === 'symbol')
  const uniques = symbolTags.reduce((a, s) => {
    const id = s.getAttribute('id')
    if (!a.seen[id]) {
      a.seen[id] = true
      a.uniques.push(s)
    }

    return a
  }, {seen: {}, uniques: []}).uniques

  return uniques.map(s => ({
    id: s.getAttribute('id'),
    kind: s.getAttribute('kind'),
    names: Array.from(s.getElementsByTagName('name'))
      .reduce((a, n) => { a[n.getAttribute('lang')] = n.textContent; return a }, {})
  }))
}
