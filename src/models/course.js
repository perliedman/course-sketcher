import { featureCollection } from '@turf/helpers'
import Coordinate from './coordinate'
import createSvgNode from '../create-svg';
import flatten from 'arr-flatten'

const distance = (c1, c2) => {
  const crd1 = c1.coordinates
  const crd2 = c2.coordinates
  const dx = crd2[0] - crd1[0]
  const dy = crd2[1] - crd1[1]
  return Math.sqrt(dx * dx + dy * dy)
}

const courseOverPrintRgb = 'rgb(182, 44, 152)'

export default class Course {
  constructor (event, id, name, controls = [], printScale) {
    this.event = event
    this.id = id
    this.name = name
    this.controls = controls
    this.printScale = printScale
  }

  distance () {
    const controls = this.controls
    return controls.slice(1).reduce((a, c, i) => a + distance(controls[i], c), 0) / 1000 / 1000 * this.event.map.scale
  }

  bounds () {
    return this.controls.reduce((a, c) => [
      Math.min(a[0], c.coordinates[0]),
      Math.min(a[1], c.coordinates[1]),
      Math.max(a[2], c.coordinates[0]),
      Math.max(a[3], c.coordinates[1])
    ], [Number.MAX_VALUE, Number.MAX_VALUE, -Number.MAX_VALUE, -Number.MAX_VALUE])
  }

  addControl (id) {
    this.controls.push(this.event.controls[id])
  }

  removeControl (controlId) {
    const index = this.controls.findIndex(c => c.id === controlId)
    this.controls.splice(index, 1)
  }

  controlsToGeoJson () {
    const scaleFactor = (this.printScale / this.event.map.scale) * 1.5

    return featureCollection(this.controls.map((c, i) => {
      return {
        type: 'Feature',
        id: c.id,
        properties: {
          sequence: c.kind !== 'start' && c.kind !== 'finish' ? i : undefined,
          ...c
        },
        geometry: c.kind !== 'start'
          ? {
            type: 'Point',
            coordinates: c.coordinates.toArray()
          }
          : {
            type: 'Polygon',
            coordinates: [startTriangle.map(p => p
              .mul(scaleFactor)
              .rotate(this.controls.length > i + 1 
                ? Math.atan2.apply(Math, this.controls[i + 1].coordinates.sub(c.coordinates).toArray().reverse()) - Math.PI / 2
                : 0)
              .add(c.coordinates).toArray())]
          }
        }
      }))
  }

  controlLabelsToGeoJson () {
    return featureCollection(createControlTextLocations(this.controls))
  }

  controlConnectionsToGeoJson () {
    return featureCollection(createControlConnections(this.controls))
  }

  toSvg () {
    const circle = (c, r) => ({
      type: 'circle',
      attrs: {
        cx: c.coordinates[0] * 100,
        cy: -c.coordinates[1] * 100,
        r,
        stroke: courseOverPrintRgb,
        'stroke-width': 50
      }
    })

    const lines = (cs, close) => ({
      type: 'path',
      attrs: {
        d: cs.map((c, i) => `${i ? 'L' : 'M'} ${c[0] * 100} ${-c[1] * 100}`)
          .concat(close ? ['Z'] : [])
          .join(' '),
        stroke: courseOverPrintRgb,
        'stroke-width': 50
      }
    })

    const controls = this.controls

    return createSvgNode(document, {
      type: 'g',
      children: controls.filter(c => c.kind === 'normal').map(c => circle(c, 300))
        .concat(controls
          .map((c, i) => [c, i])
          .filter(([c]) => c.kind === 'start')
          .map(([c, i]) => lines(
            startTriangle.map(p => p
              .rotate(controls.length > i + 1 
                ? Math.atan2.apply(Math, controls[i + 1].coordinates.sub(c.coordinates).toArray().reverse()) - Math.PI / 2
                : 0)
              .add(c.coordinates).toArray()), true)))
        .concat(flatten(controls.filter(c => c.kind === 'finish').map(c => [circle(c, 250), circle(c, 350)])))
        .concat(createControlConnections(controls).map(({ geometry: { coordinates } }) => lines(coordinates, false)))
        .concat(createControlTextLocations(controls).map(({ properties, geometry: { coordinates } }) => ({
          type: 'text',
          attrs: {
            x: coordinates[0] * 100,
            y: -coordinates[1] * 100,
            dx: '-50%',
            dy: '50%',
            fill: courseOverPrintRgb,
            style: 'font: normal 600px sans-serif;'
          },
          text: properties.sequence
        })))
    })
  }
}

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
  controls
    .filter(c => c.kind !== 'start' && c.kind !== 'finish')
    .forEach((c, i) => {
      const textLocation = createTextPlacement(objects, c, (i + 1).toString())
      objects.push({coordinates: new Coordinate(textLocation.geometry.coordinates)})
      result.push(textLocation)        
    })

  return result
}

// This is more or less a re-implementation of Purple Pen's CourseFormatter's
// text placement logic, found in
// https://github.com/petergolde/PurplePen/blob/master/src/PurplePen/CourseFormatter.cs
const createTextPlacement = (controls, control, label) => {
  let textCoord
  if (control.numberLocation) {
    textCoord = control.coordinates.add(control.numberLocation)
  } else {
    const textDistance = (controlCircleOutsideDiameter / 2 + controlNumberCircleDistance * controlCircleSize) * courseObjRatio;
    textCoord = getTextLocation(control.coordinates, textDistance, control.code, controls)
  }

  return {
    type: 'Feature',
    properties: { ...control, label },
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
