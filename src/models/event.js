import Coordinate from "./coordinate";
import Control from "./control";

export default class Event {
  constructor (name, courses) {
    this.name = name
    this.courses = courses || []
    this.controlCodeGenerator = sequence(30)
    this.idGenerator = sequence(1)
    this.map = {
      scale: 15000
    }
    this.controls = {}
  }

  addCourse (course) {
    this.courses.push(course)
  }

  addControl ({ kind, coordinates, description }) {
    const id = this.idGenerator.next()
    this.controls[id] = new Control(
      id,
      kind,
      kind !== 'start' && kind !== 'finish' ? this.controlCodeGenerator.next() : null,
      coordinates,
      description)
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
  let s = start - 1
  return {
    next: () => ++s,
    current: () => s
  }
})()
