export default function createSvgNode (document, n) {
  const node = document.createElementNS('http://www.w3.org/2000/svg', n.type)
  n.id && (node.id = n.id)
  n.attrs && Object.keys(n.attrs).forEach(attrName => node.setAttribute(attrName, n.attrs[attrName]))
  n.text && node.appendChild(document.createTextNode(n.text))
  n.children && n.children.forEach(child => node.appendChild(createSvgNode(document, child)))

  return node
}
