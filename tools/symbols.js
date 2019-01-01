const fs = require('fs')
const { DOMParser, XMLSerializer, DOMImplementation } = require('xmldom');

const getSvg = (symbol) => {
  return {
    type: 'svg',
    attrs: {
      fill: 'transparent',
      viewBox: '0 0 200 200'
    },
    children: paths('lines', false, false, symbol)
      .concat(paths('polygon', false, true, symbol))
      .concat(paths('filled-polygon', true, true, symbol))
      .concat(circles('circle', false, symbol))
      .concat(circles('filled-circle', true, symbol))
      .concat(beziers('beziers', false, symbol))
      .concat(beziers('filled-beziers', false, symbol))
  }
}

const createSvgNode = (document, n) => {
  const node = document.createElementNS('http://www.w3.org/2000/svg', n.type)
  n.id && (node.id = n.id)
  n.attrs && Object.keys(n.attrs).forEach(attrName => node.setAttribute(attrName, n.attrs[attrName]))
  n.children && n.children.forEach(child => node.appendChild(createSvgNode(document, child)))

  return node
}

const paths = (tag, fill, closed, symbol) => Array.from(symbol.getElementsByTagName(tag))
  .map(p => {
    const points = Array.from(p.getElementsByTagName('point'))
    if (closed) {
      points.push(points[0])
    }

    return {
      type: 'path',
      attrs: {
        stroke: 'black',
        fill: fill ? 'black' : 'none',
        'stroke-width': p.getAttribute('thickness'),
        'stroke-linejoin': p.getAttribute('corners') !== 'round' ? 'miter' : 'round',
        d: points
          .map((p, i) => `${i === 0 ? 'M' : 'L'} ${svgCoord(p)}`)
          .join(' ')
      }
    }
  })

const beziers = (tag, fill, symbol) => Array.from(symbol.getElementsByTagName(tag))
  .map(b => {
    const points = Array.from(b.getElementsByTagName('point'))
    const bs = []
    for (let i = 1; i <= points.length; i += 3) {
      bs.push(points.slice(i, i + 3))
    }

    return {
      type: 'path',
      attrs: {
        stroke: 'black',
        fill: fill ? 'black' : 'none',
        'stroke-width': b.getAttribute('thickness'),
        d: [`M ${svgCoord(points[0])}`]
          .concat(bs.map(b => b.map((p, i) => `${i === 0 ? 'C ' : ', '} ${svgCoord(p)}`).join('')))
          .join(' ')
      }
    }
  })

const circles = (tag, fill, symbol) => Array.from(symbol.getElementsByTagName(tag))
  .map(c => ({
    type: 'circle',
    attrs: {
      cx: 100 + Number(c.getElementsByTagName('point')[0].getAttribute('x')),
      cy: 100 - Number(c.getElementsByTagName('point')[0].getAttribute('y')),
      r: Number(c.getAttribute('radius')),
      stroke: 'black',
      fill: fill ? 'black' : 'none',
      'stroke-width': c.getAttribute('thickness')
    }
  }))

const svgCoord = p => `${Number(p.getAttribute('x')) + 100} ${100 - Number(p.getAttribute('y'))}`

const symbolXml = fs.readFileSync(process.argv[2], 'utf8')
const doc = new DOMParser().parseFromString(symbolXml)
const domImpl = new DOMImplementation()

Array.from(doc.getElementsByTagName('symbol')).forEach(s => {
  const doc = domImpl.createDocument()
  doc.appendChild(doc.createProcessingInstruction('xml', 'version="1.0"', 'charset="utf-8"'));
  const svg = getSvg(s)

  if (svg.children.length > 0) {
    doc.appendChild(createSvgNode(doc, svg))
    fs.writeFileSync(`../public/iof-2004/${s.getAttribute('id')}.svg`, new XMLSerializer().serializeToString(doc), 'utf8')
  }
})
