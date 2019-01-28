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
  const courses = ocadFile.parameterStrings["2"].map(toCourse.bind(null, event, controls))

  courses.forEach(c => event.addCourse(c))

  return event
}

const toControl = f => {
  if (f.properties.objectStringType !== 1 || !f.properties.objectString) {
    return null
  }

  const type = Number(f.properties.objectString.substring(0, 2))
  let kind
  switch (type) {
    case 0: 
      kind = 'start'
      break
    case 10:
      kind = 'normal'
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

  const coord = f.geometry.coordinates
  const mmCoord = [coord[0] / 100, coord[1] / 100]

  return new Control(defs[0], kind, defs[0], mmCoord, description)
}

const toCourse = (event, allControls, s) => {
  const controls = s._pairs.map(({ value }) => allControls.find(c => c.id === value))
  return new Course(event, event.idGenerator.next(), s._first, controls, 10000) //TODO: scale
}
