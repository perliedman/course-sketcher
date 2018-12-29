import { featureCollection } from '@turf/helpers'
import Coordinate from './coordinate'

export default class Course {
  constructor (id, name, controls = []) {
    this.id = id
    this.name = name
    this.controls = controls
  }

  addControl (c) {
    const nControls = this.controls.length
    const properties = {
      kind: nControls === 0 ? 'start' : 'control', // TODO
      code: nControls + 1, // TODO
      sequence: nControls === 0 ? undefined : nControls,
      coordinates: new Coordinate(c.coordinates[0], c.coordinates[1])
    }

    this.controls.push(properties)

    return this
  }

  controlsToGeoJson () {
    return featureCollection(this.controls.map((c, i) => ({
      type: 'Feature',
      id: i + 1, // TODO
      properties: c,
      geometry: i > 0
        ? {
          type: 'Point',
          coordinates: c.coordinates.toArray()
        }
        : {
          type: 'LineString',
          coordinates: startTriangle.map(p => p
            .rotate(this.controls.length > i + 1 
              ? Math.atan2.apply(Math, this.controls[i + 1].coordinates.sub(c.coordinates).toArray().reverse()) - Math.PI / 2
              : 0)
            .add(c.coordinates).toArray())
        }
      })))
  }

  controlLabelsToGeoJson () {
    return featureCollection(createControlTextLocations(this.controls))
  }

  controlConnectionsToGeoJson () {
    return featureCollection(createControlConnections(this.controls))
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

const startTriangle = [new Coordinate(0, 3.464), new Coordinate(3, -1.732), new Coordinate(-3, -1.732), new Coordinate(0, 3.464)]
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
    objects.push({coordinates: new Coordinate(textLocation.geometry.coordinates)})
    result.push(textLocation)        
  })

  return result
}

// This is more or less a re-implementation of Purple Pen's CourseFormatter's
// text placement logic, found in
// https://github.com/petergolde/PurplePen/blob/master/src/PurplePen/CourseFormatter.cs
const createTextPlacement = (controls, control) => {
  let textCoord
  if (control.numberLocation) {
    textCoord = control.coordinates.add(control.numberLocation)
  } else {
    const textDistance = (controlCircleOutsideDiameter / 2 + controlNumberCircleDistance * controlCircleSize) * courseObjRatio;
    textCoord = getTextLocation(control.coordinates, textDistance, control.code, controls)
  }

  return {
    type: 'Feature',
    properties: control,
    geometry: {
      type: 'Point',
      coordinates: textCoord.toArray()
    }
  }
}

const getTextLocation = (controlLocation, distanceFromCenter, text, controls) => {
  const deltaAngle = Math.PI / 16
  const d = distanceFromCenter + 1.2

  const nearbyObjects = controls.filter(c => {
    const d = c.coordinates.sub(controlLocation).vLength()
    return d > 0 && d <= distanceFromCenter * 4
  })

  let bestPoint
  let bestDistance = -1

  for (let angle = defaultControlNumberAngle;
    angle < defaultControlNumberAngle + 2 * Math.PI;
    angle += deltaAngle) {
    const pt = controlLocation.add(new Coordinate(d * Math.cos(angle), d * Math.sin(angle)))
    const distanceFromNearby = nearbyObjects.reduce((a, o) => Math.min(a, o.coordinates.sub(pt).vLength()), Number.MAX_VALUE)
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
    const c0 = controls[i].coordinates
    const c1 = controls[i + 1].coordinates
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
        coordinates: [p0.toArray(), p1.toArray()]
      }
    }
  })
