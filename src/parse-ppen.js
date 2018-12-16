const { coordEach } = require('@turf/meta')
import { toWgs84 } from 'reproject'

export default function parsePPen (crs, doc) {
  const controls = Array.prototype.slice.call(doc.getElementsByTagName('control'))
    .map(parseControl.bind(null, crs))
  const controlTextLocations = createControlTextLocations(controls)
  const courseControls = Array.prototype.slice.call(doc.getElementsByTagName('course-control'))
    .reduce((a, cc) => {
      const id = cc.getAttribute('id')
      const control = cc.getAttribute('control')
      const nextTag = cc.getElementsByTagName('next')
      let next = undefined
      if (nextTag && nextTag[0]) {
        next = nextTag[0].getAttribute('course-control')
      }

      a[id] = {
        control,
        next
      }

      return a
    }, {})
  const getCourseControls = (id, sequence) => {
    const control = controls.find(c => c.id === courseControls[id].control)
    const next = courseControls[id].next
    // Clone the feature root and its properties
    const courseControl = {...control, properties: {...control.properties}}

    courseControl.properties.sequence = sequence > 0 && next ? sequence : undefined

    return [courseControl]
      .concat(next ? getCourseControls(next, sequence + 1) : [])
  }
  const courses = Array.prototype.slice.call(doc.getElementsByTagName('course'))
    .filter(c => c.getElementsByTagName('first').length > 0)
    .map(c => {
      const courseControls = getCourseControls(c.getElementsByTagName('first')[0].getAttribute('course-control'), 0)
      return {
        id: c.getAttribute('id'),
        name: c.getElementsByTagName('name')[0].textContent,
        order: Number(c.getAttribute('order')),
        controls: {
          type: 'FeatureCollection',
          features: courseControls
        },
        controlTexts: applyCrs(crs, {
          type: 'FeatureCollection',
          features: createControlTextLocations(courseControls)
        }),
        connections: applyCrs(crs, {
          type: 'FeatureCollection',
          features: createControlConnections(courseControls)
        })
      }
    })
    .sort((a, b) => a.order - b.order)

  return {
    controls: toWgs84(applyCrs(crs, {
      type: 'FeatureCollection',
      features: controls
    }), crs.proj),
    controlTexts: toWgs84(applyCrs(crs, {
      type: 'FeatureCollection',
      features: controlTextLocations
    }), crs.proj),
    courses: courses.map(c => {
      c.controls = toWgs84(c.controls, crs.proj)
      c.controlTexts = toWgs84(c.controlTexts, crs.proj)
      c.connections = toWgs84(c.connections, crs.proj)
      return c
    })
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
  coordEach(features, c => {
    c[0] = c[0] * mmToMeter * crs.scale + crs.easting
    c[1] = c[1] * mmToMeter * crs.scale + crs.northing
  })
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

const createControlConnections = controls =>
  controls.slice(1).map((_, i) => {
    const r = controlCircleOutsideDiameter / 2
    const c0 = controls[i].geometry.coordinates
    const c1 = controls[i + 1].geometry.coordinates
    const v = c1.sub(c0)
    const l = v.vLength()

    const dx = v[0] / l
    const dy = v[1] / l

    const p0 = c0.add(new Coordinate(dx * r, dy * r))
    const p1 = c1.sub(new Coordinate(dx * r, dy * r))

    return {
      type: 'Feature',
      properties: {},
      geometry: {
        type: 'LineString',
        coordinates: [p0, p1]
      }
    }
  })

class Coordinate extends Array {
  vLength () {
    return Math.sqrt(this[0] * this[0] + this[1] * this[1])
  }

  add (c1) {
    return new Coordinate(this[0] + c1[0], this[1] + c1[1])
  }

  sub (c1) {
    return new Coordinate(this[0] - c1[0], this[1] - c1[1])
  }
}
