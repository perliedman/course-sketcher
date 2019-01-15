import PDFDocument from 'pdfkit'
import SVGtoPDF from 'svg-to-pdfkit'
import blobStream from 'blob-stream'

const mmToPt = 2.83465

export function courseMapToSvg (mapSvg, course, crs) {
  const scaleFactor = crs.scale / course.printScale // 10000 should be the course's print scale setting
  const svg = mapSvg.cloneNode(true)

  const mapGroup = svg.querySelector('g')
  const courseSvg = course.toSvg()
  mapGroup.appendChild(courseSvg)
  const bounds = course.bounds()
  // Padding (could be a setting)
  ;[-20, -20, 20, 20].forEach((x, i) => bounds[i] += x / scaleFactor)
  // TODO: A4 page in millimeters, this should be configurable
  const mapWidthPt = Math.min(595, Math.ceil((bounds[2] - bounds[0]) * mmToPt * scaleFactor))
  const mapHeightPt = Math.min(842, Math.ceil((bounds[3] - bounds[1]) * mmToPt * scaleFactor))
  svg.setAttribute('width', mapWidthPt)
  svg.setAttribute('height', mapHeightPt)
  // svg.setAttribute('viewBox', `0 0 ${bounds[2] - bounds[0]} ${bounds[3] - bounds[1]}`)
  const transform = `scale(${mmToPt / 100 * scaleFactor}) translate(${-bounds[0] * 100}, ${bounds[3] * 100})`
  mapGroup.setAttribute('transform', transform)

  return svg
}

export function courseMapToPdf (ocadFile, mapSvg, course, crs) {
  return new Promise((resolve) => {
    const svg = courseMapToSvg(mapSvg, course, crs)
    const mapWidthPt = svg.getAttribute('width')
    const mapHeightPt = svg.getAttribute('height')
    const doc = new PDFDocument()
    const stream = doc.pipe(blobStream())

    doc
      .fontSize(12)
      .font('Helvetica')

    SVGtoPDF(doc, svg, 595 / 2 - mapWidthPt / 2, 842 / 2 - mapHeightPt / 2, {
      assumePt: true,
      colorCallback: x => {
        const color = x && ocadFile.colors.find(c => c && c.rgbArray[0] === x[0][0] && c.rgbArray[1] === x[0][1] && c.rgbArray[2] === x[0][2])
        return color && color.cmyk && [color.cmyk, x[1]] || x
      }
    })

    doc.end()
    stream.on('finish', () => {
      const blob = stream.toBlob('application/pdf')
      resolve(blob)
    })
  })
}
