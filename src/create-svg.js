export function createSvgNode (document, n) {
  if (n instanceof SVGElement) {
    return n
  }

  const node = document.createElementNS('http://www.w3.org/2000/svg', n.type)
  n.id && (node.id = n.id)
  n.attrs && Object.keys(n.attrs).forEach(attrName => node.setAttribute(attrName, n.attrs[attrName]))
  n.text && node.appendChild(document.createTextNode(n.text))
  n.children && n.children.forEach(child => node.appendChild(createSvgNode(document, child)))

  return node
}

// TODO: these are not general enought to put here, but also need to be reusable...
export const circle = (control, r, stroke, scale) => ({
  type: 'circle',
  attrs: {
    cx: control.coordinates[0] * 100,
    cy: -control.coordinates[1] * 100,
    r: r * (scale || 1),
    stroke,
    'stroke-width': 50 * (scale || 1)
  }
})

export const lines = (coordinates, close, stroke, scale) => ({
  type: 'path',
  attrs: {
    d: coordinates.map((c, i) => `${i ? 'L' : 'M'} ${c[0] * 100} ${-c[1] * 100}`)
      .concat(close ? ['Z'] : [])
      .join(' '),
    stroke,
    'stroke-width': 50 * (scale || 1)
  }
})
