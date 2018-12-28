import { featureCollection } from '@turf/helpers'
import Coordinate from './coordinate'

export default class Course {
  constructor (id, name, controls = []) {
    this.id = id
    this.name = name
    this.controls = controls
  }

  addControl (c) {
    this.controls.push({
      type: 'Feature',
      id: this.controls.length + 1, // TODO
      properties: {
        kind: 'control', // TODO
        code: this.controls.length + 1, // TODO
        sequence: this.controls.length + 1
      },
      geometry: {
        type: 'Point',
        coordinates: c.coordinates
      }
    })

    return this
  }

  controlsToGeoJson () {
    return featureCollection(clone(this.controls))
  }

  controlLabelsToGeoJson () {
    return featureCollection(createControlTextLocations(clone(this.controls)))
  }

  controlConnectionsToGeoJson () {
    return featureCollection(createControlConnections(clone(this.controls)))
  }
}

const clone = fs => fs.map(f => ({
  type: f.type,
  properties: f.properties,
  geometry: {
    type: f.geometry.type,
    coordinates: coordClone(f.geometry.coordinates)
  }
}))

const coordClone = c => Array.isArray(c[0]) ? c.map(coordClone) : new Coordinate(c[0], c[1])

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
