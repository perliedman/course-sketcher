import symbolsXml from './assets/symbols.xml'
import parseSymbols from './parse-symbols.js'

const symbols = parseSymbols(new DOMParser().parseFromString(symbolsXml, 'application/xml'))

// Filter out short words like "in" etc. (this is of course a very crude heuristic)
const extractTerms = s => s.split(/[, ]+/).filter(part => part.length > 3).map(part => part.toLowerCase())

symbols.forEach(s => {
  const enTerms = extractTerms(s.names.en)
  s.searchTerms = Object.keys(s.names).reduce((a, x) => {
    a[x] = enTerms.concat(extractTerms(s.names[x]))
    return a
  }, {})
})

export default symbols
