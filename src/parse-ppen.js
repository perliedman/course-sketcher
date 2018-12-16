import { toWgs84 } from 'reproject'

export default function parsePPen (crs, doc) {
  const controls = Array.prototype.slice.call(doc.getElementsByTagName('control'))
    .map(parseControl.bind(null, crs))
  const controlTextLocations = createControlTextLocations(controls)

  return {
    controls: toWgs84({
      type: 'FeatureCollection',
      features: applyCrs(crs, controls)
    }, crs.proj),
    controlTexts: toWgs84({
      type: 'FeatureCollection',
      features: applyCrs(crs, controlTextLocations)
    }, crs.proj)
  }
}

const mmToMeter = 0.001

const parseLocation = loc => new Coordinate(
  Number(loc.getAttribute('x')),
  Number(loc.getAttribute('y'))
)

const parseControl = (crs, tag) => {
  const codeTag = tag.getElementsByTagName('code')[0]
  return {
    type: 'Feature',
    id: tag.id,
    properties: {
      kind: tag.getAttribute('kind'),
      code: codeTag ? codeTag.textContent : undefined
    },
    geometry: {
      type: 'Point',
      coordinates: parseLocation(tag.getElementsByTagName('location')[0])
    }
  }
}

const applyCrs = (crs, features) => {
  features.forEach(f => f.geometry.coordinates = new Coordinate(
    f.geometry.coordinates[0] * mmToMeter * crs.scale + crs.easting,
    f.geometry.coordinates[1] * mmToMeter * crs.scale + crs.northing
  ))
  return features
}

const defaultControlNumberAngle = Math.PI / 6
const controlCircleOutsideDiameter = 5.35
const controlNumberCircleDistance = 1.825
const controlCircleSize = 1
const courseObjRatio = 1

const createControlTextLocations = controls => {
  const objects = controls.slice()
  const result = []
  controls.forEach(c => {
    const textLocation = createTextPlacement(objects, c)
    objects.push(textLocation)
    result.push(textLocation)        
  })

  return result
}

// This is more or less a re-implementation of Purple Pen's CourseFormatter's
// text placement logic, found in
// https://github.com/petergolde/PurplePen/blob/master/src/PurplePen/CourseFormatter.cs
const createTextPlacement = (controls, control) => {
  let textCoord
  if (control.properties.numberLocation) {
    textCoord = control.geometry.coordinates.add(control.properties.numberLocation)
  } else {
    const textDistance = (controlCircleOutsideDiameter / 2 + controlNumberCircleDistance * controlCircleSize) * courseObjRatio;
    textCoord = getTextLocation(control.geometry.coordinates, textDistance, control.properties.code, controls)
  }

  return {
    type: 'Feature',
    properties: control.properties,
    geometry: {
      type: 'Point',
      coordinates: textCoord
    }
  }
}

const getTextLocation = (controlLocation, distanceFromCenter, text, controls) => {
  const deltaAngle = Math.PI / 16
  const d = distanceFromCenter + 1.2

  const nearbyObjects = controls.filter(c => {
    const d = c.geometry.coordinates.sub(controlLocation).vLength()
    return d > 0 && d <= distanceFromCenter * 4
  })

  let bestPoint
  let bestDistance = -1

  for (let angle = defaultControlNumberAngle;
    angle < defaultControlNumberAngle + 2 * Math.PI;
    angle += deltaAngle) {
    const pt = controlLocation.add(new Coordinate(d * Math.cos(angle), d * Math.sin(angle)))
    const distanceFromNearby = nearbyObjects.reduce((a, o) => Math.min(a, o.geometry.coordinates.sub(pt).vLength()), Number.MAX_VALUE)
    if (distanceFromNearby > bestDistance) {
      bestPoint = pt
      bestDistance = distanceFromNearby
    }
  }

  return bestPoint
}

class Coordinate extends Array {
  vLength () {
    return Math.sqrt(this[0] * this[0] + this[1] * this[1])
  }

  add (c1) {
    return new Coordinate(this[0] + c1[0], this[1] + c1[1])
  }

  sub (c1) {
    return new Coordinate(this[0] - c1[0], this[1] - c1[1], this.xFlags, this.yFlags)
  }
}
