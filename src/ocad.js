import { ocadToGeoJson } from 'ocad2geojson'
import Control from './models/control'
import Course from './models/course'
import Event from './models/event'

export function parseOcadEvent (ocadFile) {
  const geoJson = ocadToGeoJson(ocadFile, { applyCrs: false })
  const controls = geoJson.features
    .map(toControl)
    .filter(c => c)
    
  const event = new Event("Test", [])
  const mapAbsPath = ocadFile.parameterStrings["8"][0]._first
  event.map = {
    name: mapAbsPath.substring(Math.max(mapAbsPath.lastIndexOf('/'), mapAbsPath.lastIndexOf('\\') + 1)),
    scale: ocadFile.getCrs().scale
  }

  const courses = ocadFile.parameterStrings["2"].map(toCourse.bind(null, event, controls))
  courses.forEach(c => event.addCourse(c))

  return event
}

let controlId = 1
const toControl = f => {
  if (f.properties.objectStringType !== 1 || !f.properties.objectString) {
    return null
  }

  const type = Number(f.properties.objectString.substring(0, 2))
  let kind
  let codeOffset
  switch (type) {
    case 0: 
      kind = 'start'
      break
    case 10:
    case 11:
      kind = 'normal'
      codeOffset = (type - 10) * 100
      break
    case 30:
      kind = 'finish'
      break
    default:
      return null
  }

  const defs = f.properties.objectString.substring(2).split('\t')
  const description = defs.slice(2).reduce((desc, def) => {
    const col = def[0]
    const symParts = def.substring(1).split('.').map(Number)
    desc[col.toUpperCase()] = `${symParts[0]}.${symParts[1]}`

    return desc
  }, {})

  let code = defs[0]
  if (!isNaN(code)) {
    code = Number(code) + codeOffset
  }

  const coord = f.geometry.coordinates
  const mmCoord = [coord[0] / 100, coord[1] / 100]

  return new Control(controlId++, kind, code, mmCoord, description)
}

const toCourse = (event, allControls, s) => {
  const controls = s._pairs.map(({ value }) => {
    const c = allControls
      .find(c => c.code == value)
    if (!c) {
      console.warn(`Could not find control ${value} for course ${s._first}.`)
    }

    return c
  })
  .filter(c => c)
  return new Course(event, event.idGenerator.next(), s._first, controls, 10000) //TODO: scale
}
