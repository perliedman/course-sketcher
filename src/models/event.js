import Coordinate from "./coordinate";

export default class Event {
  constructor (name, courses) {
    this.name = name
    this.courses = courses || []
    this.controlCodeGenerator = {
      next: sequence(30)
    }
    this.idGenerator = {
      next: sequence(1)
    }
    this.map = {
      scale: 15000
    }
    this.controls = {}
  }

  addCourse (course) {
    this.courses.push(course)
  }

  addControl ({ id, kind, coordinates, description }) {
    this.controls[id] = {
      id,
      kind: kind || 'normal',
      code: kind !== 'start' && kind !== 'finish' ? this.controlCodeGenerator.next() : null,
      coordinates: new Coordinate(coordinates[0], coordinates[1]),
      description: description || {}
    }
  }

  moveControl ({ id, coordinates }) {
    const control = this.controls[id]
    control.coordinates = new Coordinate(coordinates)
  }

  setControlDescription (controlId, kind, descriptionId) {
    const control = this.controls[controlId]
    control.description[kind] = descriptionId
  }
}

const sequence = start => (() => {
  let next = start
  return () => next++
})()