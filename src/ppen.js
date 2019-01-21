import Coordinate from './models/coordinate'
import Course from './models/course';
import Event from './models/event';
import Control from './models/control';

export function parsePPen (doc) {
  const eventTag = doc.getElementsByTagName('event')[0]
  const mapTag = eventTag.getElementsByTagName('map')[0]
  const scale = Number(mapTag.getAttribute('scale'))
  const mapAbsPath = mapTag.getAttribute('absolute-path')

  const controls = Array.from(doc.getElementsByTagName('control'))
    .map(parseControl)

  const courseControls = Array.from(doc.getElementsByTagName('course-control'))
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

    return [control]
      .concat(next ? getCourseControls(next, sequence + 1) : [])
  }

  const event = new Event(eventTag.getElementsByTagName('title')[0].textContent, [])
  event.map = {
    name: mapAbsPath.substring(Math.max(mapAbsPath.lastIndexOf('/'), mapAbsPath.lastIndexOf('\\') + 1)),
    scale
  }

  const courses = Array.from(doc.getElementsByTagName('course'))
    .filter(c => c.getElementsByTagName('first').length > 0)
    .map(c => {
      const courseControls = getCourseControls(c.getElementsByTagName('first')[0].getAttribute('course-control'), 0)
      const optionsTag = c.getElementsByTagName('options')[0]
      const printScale = optionsTag && Number(optionsTag.getAttribute('print-scale')) || scale
      const course = new Course(event, c.getAttribute('id'), c.getElementsByTagName('name')[0].textContent, courseControls, printScale)
      course.order = Number(c.getAttribute('order'))

      return course
    })
    .sort((a, b) => a.order - b.order)

  courses.forEach(c => event.addCourse(c))

  return event
}


const parseLocation = loc => new Coordinate(
  Number(loc.getAttribute('x')),
  Number(loc.getAttribute('y'))
)

const parseControl = (tag) => {
  const codeTag = tag.getElementsByTagName('code')[0]
  return new Control(
    tag.id,
    tag.getAttribute('kind'),
    codeTag ? codeTag.textContent : undefined,
    parseLocation(tag.getElementsByTagName('location')[0]),
    Array.from(tag.getElementsByTagName('description')).reduce((a, dtag) => {
      a[dtag.getAttribute('box')] = dtag.getAttribute('iof-2004-ref')
      return a
    }, {}))
}
